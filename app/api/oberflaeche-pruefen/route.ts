/**
 * Foto der KSS-Oberfläche → sichtbare Probleme erkennen.
 *
 * Warum: Das Etikett sagt, WELCHES Produkt im Tank ist. Die Oberfläche sagt,
 * WIE ES IHM GEHT. Ein Instandhalter sieht dort in Sekunden, was kein Messwert
 * zeigt: aufschwimmendes Fremdöl, Schaumkronen, milchige Trübung, dunkle
 * Verfärbung, Beläge am Rand, Späne und Schmutz, eine gebrochene Emulsion.
 *
 * Regeln (Betreiber 2026-08-11):
 *  - **Die KI rät nicht.** Ein Foto zeigt eine Oberfläche, keine Analyse. Was
 *    unsicher ist, wird als „unklar" gemeldet mit dem Rat, nachzumessen —
 *    nicht als Befund verkauft.
 *  - **Keine Fremdwerbung.** Es werden keine Geräte, Systeme oder Marken
 *    genannt, die nicht von Brisco Systems oder Dosimetrix stammen.
 *  - Ist auf dem Bild gar keine KSS-Oberfläche zu sehen, sagt die Antwort das
 *    und der Credit wird zurückgebucht.
 *
 * Kosten: 1 Credit — abgebucht nach erfolgreicher Auswertung, bei Fehlschlag
 * zurückgebucht (wie bei den übrigen KI-Aktionen).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";

const Eingabe = z.object({
  /** Foto als data:-URI (image/jpeg, image/png oder image/webp). */
  bild: z.string().startsWith("data:image/").max(8_000_000),
  /** Optional: Produkt aus dem Katalog, damit die Antwort die Sollwerte kennt. */
  produktId: z.string().optional(),
  /** Optional: freier Hinweis des Anwenders („riecht seit Montag"). */
  bemerkung: z.string().trim().max(500).optional(),
});

/** Was die KI von der Oberfläche berichten soll. */
const SCHEMA = {
  type: "object",
  properties: {
    istKssOberflaeche: {
      type: "boolean",
      description: "Zeigt das Bild wirklich eine Kühlschmierstoff-Oberfläche, einen Tank oder einen Arbeitsraum?",
    },
    befunde: {
      type: "array",
      description: "Nur, was tatsächlich zu sehen ist. Nichts hinzuerfinden.",
      items: {
        type: "object",
        properties: {
          merkmal: {
            type: "string",
            enum: [
              "schwimmoel",
              "schaum",
              "truebung",
              "verfaerbung",
              "belag_biofilm",
              "spaene_schmutz",
              "emulsionsbruch",
              "oelabscheidung_rand",
              "sauber",
              "unklar",
            ],
          },
          sicherheit: { type: "string", enum: ["hoch", "mittel", "gering"] },
          beobachtung: { type: "string", description: "Was genau im Bild zu sehen ist, ein Satz" },
          bedeutung: { type: "string", description: "Was das im KSS-Kreislauf bedeutet, ein bis zwei Sätze" },
          massnahme: { type: "string", description: "Was der Instandhalter als Nächstes tun sollte" },
        },
        required: ["merkmal", "sicherheit", "beobachtung", "bedeutung", "massnahme"],
        additionalProperties: false,
      },
    },
    gesamturteil: {
      type: "string",
      enum: ["unauffaellig", "beobachten", "handeln", "unklar"],
    },
    nachmessen: {
      type: "array",
      description: "Welche Messwerte das Bild nicht ersetzt und jetzt geprüft werden sollten",
      items: { type: "string" },
    },
    hinweis: { type: ["string", "null"], description: "Kurzer deutscher Hinweis, falls etwas unklar blieb" },
  },
  required: ["istKssOberflaeche", "befunde", "gesamturteil", "nachmessen", "hinweis"],
  additionalProperties: false,
} as const;

type Befund = {
  merkmal: string;
  sicherheit: "hoch" | "mittel" | "gering";
  beobachtung: string;
  bedeutung: string;
  massnahme: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = Eingabe.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte ein Foto mitschicken" }, { status: 400 });
  }

  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(parsed.data.bild);
  if (!m) {
    return NextResponse.json(
      { error: "Nur JPEG, PNG oder WebP — bitte das Foto neu aufnehmen." },
      { status: 400 },
    );
  }
  const [, medienTyp, base64] = m;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Die Bildprüfung ist gerade nicht verfügbar. Bitte später noch einmal." },
      { status: 503 },
    );
  }

  // Kennt die Plattform das Produkt, geben wir die Sollwerte mit — die KI soll
  // die Oberfläche im Zusammenhang mit dem Produkt beurteilen, nicht allgemein.
  let produktKontext = "";
  if (parsed.data.produktId) {
    const p = await prisma.product.findUnique({
      where: { id: parsed.data.produktId },
      select: {
        name: true,
        category: true,
        chemistry: true,
        recommendedConcentrationMin: true,
        recommendedConcentrationMax: true,
        manufacturer: { select: { name: true } },
      },
    });
    if (p) {
      produktKontext =
        `Im Tank ist laut Anwender: ${p.manufacturer.name} ${p.name}` +
        (p.chemistry ? ` (${p.chemistry})` : "") +
        (p.recommendedConcentrationMin != null
          ? `, empfohlene Konzentration ${p.recommendedConcentrationMin}–${p.recommendedConcentrationMax ?? "?"} %`
          : "") +
        ".";
    }
  }

  const abbuchung = await chargeForAiAction(session.user.id, "surfaceScan");
  if (!abbuchung.ok) {
    return NextResponse.json(
      {
        error:
          abbuchung.reason === "no_access"
            ? "Dafür braucht es ein aktives Konto."
            : "Zu wenig Credits.",
        benoetigt: abbuchung.cost,
        saldo: abbuchung.balance,
      },
      { status: 402 },
    );
  }

  let ergebnis: {
    istKssOberflaeche: boolean;
    befunde: Befund[];
    gesamturteil: "unauffaellig" | "beobachten" | "handeln" | "unklar";
    nachmessen: string[];
    hinweis: string | null;
  };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const antwort = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 6000,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system:
        "Du bist ein erfahrener Instandhalter und beurteilst Fotos von Kühlschmierstoff-Oberflächen " +
        "in Werkzeugmaschinen, Tanks und Zentralanlagen.\n\n" +
        "So arbeitest du:\n" +
        "- Du berichtest AUSSCHLIESSLICH, was auf dem Bild sichtbar ist. Du erfindest nichts dazu.\n" +
        "- Ein Foto zeigt eine Oberfläche, keine Laboranalyse. Bist du unsicher, nimmst du das " +
        "Merkmal 'unklar' und schreibst, was nachgemessen werden muss. Raten ist verboten — " +
        "ein falscher Befund kostet einen Betrieb eine unnötige Tankreinigung.\n" +
        "- Bakterien, pH-Wert, Nitrit und Konzentration sind auf einem Foto NICHT erkennbar. " +
        "Du darfst höchstens auf Anzeichen hinweisen (Beläge, Verfärbung, Geruchsbeschreibung " +
        "des Anwenders) und aufs Messen verweisen.\n" +
        "- Zeigt das Bild gar keine KSS-Oberfläche, setzt du istKssOberflaeche auf false und " +
        "gibst keine Befunde aus.\n" +
        "- Du nennst KEINE Marken-, Geräte- oder Systemnamen fremder Anbieter.\n" +
        "- Du schreibst deutsch, kurz und in der Sprache der Werkstatt.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: medienTyp as "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text:
                "Beurteile die Oberfläche dieses Kühlschmierstoffs. Was ist sichtbar, was bedeutet es, " +
                "was ist zu tun?" +
                (produktKontext ? `\n\n${produktKontext}` : "") +
                (parsed.data.bemerkung ? `\n\nAnwender-Hinweis: ${parsed.data.bemerkung}` : ""),
            },
          ],
        },
      ],
    });

    if (antwort.stop_reason === "refusal") throw new Error("refusal");
    const text = antwort.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("keine Antwort");
    ergebnis = JSON.parse(text.text);
  } catch {
    await refundAiAction(session.user.id, "surfaceScan");
    return NextResponse.json(
      { error: "Das Bild konnte nicht ausgewertet werden. Bitte noch einmal versuchen." },
      { status: 503 },
    );
  }

  // Kein KSS auf dem Bild? Dann hat die Prüfung dem Anwender nichts gebracht —
  // dafür nehmen wir kein Guthaben.
  if (!ergebnis.istKssOberflaeche) {
    await refundAiAction(session.user.id, "surfaceScan");
    return NextResponse.json({
      ok: true,
      keinKss: true,
      hinweis:
        ergebnis.hinweis ??
        "Auf dem Bild ist keine Kühlschmierstoff-Oberfläche zu erkennen. Bitte den Tank oder den Arbeitsraum von oben fotografieren.",
      saldo: abbuchung.balance + abbuchung.cost,
    });
  }

  return NextResponse.json({ ok: true, ...ergebnis, saldo: abbuchung.balance });
}
