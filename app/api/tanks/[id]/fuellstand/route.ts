/**
 * Füllstand aus einem Tankfoto schätzen (Betreiber 2026-08-19).
 *
 * Idee: Wer am Tank steht, hat gerade gemessen und gespeichert. Statt das
 * Fehlvolumen zu schätzen oder abzumessen, fotografiert er in den Tank — die
 * Seite rechnet daraus, wie viel fehlt, und der Mischungsrechner sagt sofort,
 * mit welcher Konzentration nachzufüllen ist.
 *
 * WAS DAS IST — UND WAS NICHT (geprüft am 2026-08-19 mit Testbildern
 * bekannter Füllstände):
 *  - Die Schätzung traf in den Versuchen auf 0–7 Prozentpunkte genau.
 *  - ABER: Das Fehlvolumen ist die DIFFERENZ zum vollen Tank. Bei fast vollem
 *    Tank wird aus 5 Prozentpunkten Schätzfehler schnell ein Drittel Abweichung
 *    beim Fehlvolumen. Deshalb wird immer eine Spanne mitgeliefert und der Wert
 *    ausdrücklich als Vorschlag gekennzeichnet — er landet in einem Feld, das
 *    der Anwender überschreiben kann.
 *  - Die KI rät nicht: Ist der Füllstand auf dem Bild nicht beurteilbar
 *    (Blick nur auf die Oberfläche, keine Wand, kein Bezug), sagt sie das.
 *
 * Kosten: 1 Credit, zurückgebucht, wenn nichts Verwertbares herauskommt.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";

const Eingabe = z.object({
  /** Ein oder mehrere Fotos als data:-URI — mehrere Blickwinkel helfen. */
  bilder: z.array(z.string().startsWith("data:image/").max(8_000_000)).min(1).max(3),
});

const SCHEMA = {
  type: "object",
  properties: {
    beurteilbar: {
      type: "boolean",
      description:
        "Nur true, wenn Flüssigkeitsspiegel UND ein Höhenbezug (Tankoberkante, Boden, Skala, Einbau) erkennbar sind.",
    },
    fuellstandProzent: {
      type: ["number", "null"],
      description: "Füllstand als Anteil der Innenhöhe in Prozent (0 = leer, 100 = randvoll).",
    },
    spanneVon: { type: ["number", "null"] },
    spanneBis: { type: ["number", "null"] },
    sicherheit: { type: "string", enum: ["hoch", "mittel", "gering"] },
    begruendung: { type: "string", description: "Ein bis zwei Sätze: woran festgemacht." },
    hinweis: { type: ["string", "null"], description: "Was ein besseres Foto zeigen müsste." },
  },
  required: ["beurteilbar", "fuellstandProzent", "spanneVon", "spanneBis", "sicherheit", "begruendung", "hinweis"],
  additionalProperties: false,
} as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  const { id } = await params;

  const parsed = Eingabe.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte ein Foto mitschicken." }, { status: 400 });
  }

  const tank = await prisma.coolantTank.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, volumeLiters: true, heightCm: true, name: true },
  });
  if (!tank) return NextResponse.json({ error: "Tank nicht gefunden" }, { status: 404 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Die Bildauswertung ist gerade nicht verfügbar." },
      { status: 503 },
    );
  }

  const abbuchung = await chargeForAiAction(session.user.id, "surfaceScan");
  if (!abbuchung.ok) {
    return NextResponse.json(
      {
        error:
          abbuchung.reason === "no_access" ? "Dafür braucht es ein aktives Konto." : "Zu wenig Credits.",
      },
      { status: 402 },
    );
  }

  type Antwort = {
    beurteilbar: boolean;
    fuellstandProzent: number | null;
    spanneVon: number | null;
    spanneBis: number | null;
    sicherheit: "hoch" | "mittel" | "gering";
    begruendung: string;
    hinweis: string | null;
  };
  let a: Antwort;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const inhalt: Anthropic.Messages.ContentBlockParam[] = [];
    for (const bild of parsed.data.bilder) {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(bild);
      if (!m) continue;
      inhalt.push({
        type: "image",
        source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] },
      });
    }
    if (inhalt.length === 0) {
      await refundAiAction(session.user.id, "surfaceScan");
      return NextResponse.json({ error: "Nur JPEG, PNG oder WebP." }, { status: 400 });
    }
    inhalt.push({
      type: "text",
      text:
        `Wie hoch steht die Flüssigkeit in diesem Kühlschmierstoff-Tank?` +
        (tank.heightCm ? ` Die Innenhöhe des Tanks beträgt ${tank.heightCm} cm.` : "") +
        (tank.volumeLiters ? ` Das Gesamtvolumen beträgt ${tank.volumeLiters} l.` : "") +
        (parsed.data.bilder.length > 1 ? " Es sind mehrere Aufnahmen desselben Tanks." : ""),
    });

    const antwort = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 3000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system:
        "Du schätzt aus Fotos den Füllstand eines Kühlschmierstoff-Tanks als Anteil der " +
        "INNENHÖHE (0 % = leer, 100 % = randvoll).\n\n" +
        "So arbeitest du:\n" +
        "- Beachte die Perspektive: Ein schräger Blick von oben lässt den unteren Teil größer " +
        "erscheinen, als er ist. Korrigiere das, statt die Bildhöhe naiv abzumessen.\n" +
        "- Nutze sichtbare Bezüge: Tankoberkante, Boden, Schweißnähte, Skalen, Einbauten, " +
        "Verschmutzungsränder an der Wand.\n" +
        "- **Raten ist verboten.** Sind Flüssigkeitsspiegel oder Höhenbezug nicht erkennbar " +
        "(z. B. reiner Blick auf die Oberfläche ohne Wand), setzt du beurteilbar auf false und " +
        "schreibst in den Hinweis, was ein besseres Foto zeigen müsste.\n" +
        "- Gib immer eine ehrliche Spanne an. Lieber weit als falsch schmal.",
      messages: [{ role: "user", content: inhalt }],
    });

    if (antwort.stop_reason === "refusal") throw new Error("refusal");
    const t = antwort.content.find((c) => c.type === "text");
    if (!t || t.type !== "text") throw new Error("keine Antwort");
    a = JSON.parse(t.text);
  } catch {
    await refundAiAction(session.user.id, "surfaceScan");
    return NextResponse.json(
      { error: "Das Bild konnte nicht ausgewertet werden. Bitte noch einmal versuchen." },
      { status: 503 },
    );
  }

  if (!a.beurteilbar || a.fuellstandProzent == null) {
    await refundAiAction(session.user.id, "surfaceScan");
    return NextResponse.json({
      ok: true,
      beurteilbar: false,
      hinweis:
        a.hinweis ??
        "Auf dem Foto ist der Füllstand nicht zu erkennen. Bitte so fotografieren, dass Tankwand, Oberkante und Flüssigkeitsspiegel im Bild sind.",
      saldo: abbuchung.balance + abbuchung.cost,
    });
  }

  // Vom Füllstand zum Fehlvolumen: Bei senkrechten Wänden ist das Volumen
  // proportional zur Höhe. Ohne Gesamtvolumen gibt es nur den Prozentwert.
  const anteilLeer = (100 - a.fuellstandProzent) / 100;
  const fehlLiter =
    tank.volumeLiters != null ? Math.round(tank.volumeLiters * anteilLeer) : null;
  const fehlVon =
    tank.volumeLiters != null && a.spanneBis != null
      ? Math.round(tank.volumeLiters * ((100 - a.spanneBis) / 100))
      : null;
  const fehlBis =
    tank.volumeLiters != null && a.spanneVon != null
      ? Math.round(tank.volumeLiters * ((100 - a.spanneVon) / 100))
      : null;

  return NextResponse.json({
    ok: true,
    beurteilbar: true,
    fuellstandProzent: a.fuellstandProzent,
    spanneVon: a.spanneVon,
    spanneBis: a.spanneBis,
    sicherheit: a.sicherheit,
    begruendung: a.begruendung,
    hinweis: a.hinweis,
    fehlLiter,
    fehlVon,
    fehlBis,
    saldo: abbuchung.balance,
  });
}
