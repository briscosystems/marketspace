/**
 * „Problem klären" — der Anwender schildert sein Problem und legt bei, was er
 * hat: Fotos, Datenblatt, Sicherheitsdatenblatt, Laborbericht, Links zu
 * Forenbeiträgen. Die Plattform speichert alles und die KI hilft beim
 * Eingrenzen.
 *
 * Regeln (Betreiber 2026-08-12):
 *  - **Die KI rät nicht.** Sie nennt nur Ursachen, die durch die vorliegenden
 *    Angaben gestützt sind, jeweils mit Sicherheit und Prüfschritt. Reicht es
 *    nicht, sagt sie das und der Fall geht an die manuelle Prüfung.
 *  - **Alles wird gespeichert** — Text, Dateien, Links, KI-Antwort. Der Fall
 *    steht im Admin-Bereich und lässt sich beantworten.
 *  - **Keine Fremdwerbung**: keine Marken, Geräte oder Systeme anderer Anbieter.
 *
 * Kosten: 2 Credits — mehr Arbeit als eine Bildauswertung, weil Dokumente
 * mitgelesen werden. Bei Fehlschlag wird zurückgebucht.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";

const DATEI = z.object({
  name: z.string().trim().min(1).max(200),
  data: z
    .string()
    .regex(/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/, "Nur PDF, JPEG, PNG oder WebP")
    .max(7_000_000, "Datei zu groß (max. ca. 5 MB)"),
});

const Eingabe = z.object({
  text: z.string().trim().min(30, "Bitte beschreibe das Problem in mindestens 30 Zeichen.").max(5000),
  productId: z.string().optional(),
  productFreetext: z.string().trim().max(200).optional(),
  machine: z.string().trim().max(200).optional(),
  links: z.array(z.string().trim().url("Bitte vollständige Links angeben (mit https://)")).max(10).default([]),
  dateien: z.array(DATEI).max(8, "Höchstens acht Belege je Fall").default([]),
});

const SCHEMA = {
  type: "object",
  properties: {
    moeglicheUrsachen: {
      type: "array",
      description:
        "Nur Ursachen, die durch die vorliegenden Angaben gestützt sind. Nichts erraten. Leer lassen, wenn die Angaben nicht reichen.",
      items: {
        type: "object",
        properties: {
          ursache: { type: "string" },
          sicherheit: { type: "string", enum: ["hoch", "mittel", "gering"] },
          begruendung: { type: "string", description: "Worauf in den Angaben sie sich stützt" },
          pruefschritt: { type: "string", description: "Wie der Betrieb das nachprüft" },
        },
        required: ["ursache", "sicherheit", "begruendung", "pruefschritt"],
        additionalProperties: false,
      },
    },
    fehlendeAngaben: {
      type: "array",
      description: "Was fehlt, um sicher zu werden (Messwerte, Fotos, Unterlagen)",
      items: { type: "string" },
    },
    sofortmassnahmen: {
      type: "array",
      description: "Was sofort getan werden sollte, auch ohne endgültige Ursache",
      items: { type: "string" },
    },
    zusammenfassung: { type: "string", description: "Ein bis zwei Sätze für die Übersicht" },
    anAdmin: {
      type: "boolean",
      description: "true, wenn die Angaben für eine belastbare Aussage nicht reichen",
    },
    hinweis: { type: ["string", "null"] },
  },
  required: ["moeglicheUrsachen", "fehlendeAngaben", "sofortmassnahmen", "zusammenfassung", "anAdmin", "hinweis"],
  additionalProperties: false,
} as const;

type Antwort = {
  moeglicheUrsachen: {
    ursache: string;
    sicherheit: "hoch" | "mittel" | "gering";
    begruendung: string;
    pruefschritt: string;
  }[];
  fehlendeAngaben: string[];
  sofortmassnahmen: string[];
  zusammenfassung: string;
  anAdmin: boolean;
  hinweis: string | null;
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Bitte das Problem beschreiben." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Was die Plattform über das Produkt schon weiß, kommt mit in die Bewertung:
  // gemeldete Praxis-Probleme und freigegebene Erfahrungen anderer Betriebe.
  let wissen = "";
  if (d.productId) {
    const p = await prisma.product.findUnique({
      where: { id: d.productId },
      select: {
        name: true,
        category: true,
        chemistry: true,
        recommendedConcentrationMin: true,
        recommendedConcentrationMax: true,
        phEmulsionMin: true,
        phEmulsionMax: true,
        manufacturer: { select: { name: true } },
        issues: {
          select: { title: true, description: true, severity: true },
          orderBy: { reportCount: "desc" },
          take: 8,
        },
        experienceReports: {
          where: { status: "APPROVED" },
          select: { text: true, problems: true, outcome: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    });
    if (p) {
      const teile = [
        `Produkt laut Anwender: ${p.manufacturer.name} ${p.name}${p.chemistry ? ` (${p.chemistry})` : ""}.`,
      ];
      if (p.recommendedConcentrationMin != null) {
        teile.push(
          `Empfohlene Konzentration ${p.recommendedConcentrationMin}–${p.recommendedConcentrationMax ?? "?"} %.`,
        );
      }
      if (p.phEmulsionMin != null) {
        teile.push(`pH-Fenster ${p.phEmulsionMin}–${p.phEmulsionMax ?? "?"}.`);
      }
      if (p.issues.length) {
        teile.push(
          "Zu diesem Produkt gemeldete Praxis-Probleme:\n" +
            p.issues.map((i) => `- [${i.severity}] ${i.title}: ${i.description.slice(0, 300)}`).join("\n"),
        );
      }
      if (p.experienceReports.length) {
        teile.push(
          "Erfahrungen anderer Betriebe (freigegeben):\n" +
            p.experienceReports
              .map((r) => `- ${r.problems.join(", ") || "ohne Schlagwort"}: ${r.text.slice(0, 300)}`)
              .join("\n"),
        );
      }
      wissen = teile.join("\n");
    }
  }

  // Erst speichern, dann bewerten: Der Fall darf nicht verloren gehen, nur
  // weil die KI gerade nicht antwortet.
  const fall = await prisma.problemCase.create({
    data: {
      userId: session.user.id,
      productId: d.productId || null,
      productFreetext: d.productFreetext || null,
      machine: d.machine || null,
      text: d.text,
      links: d.links,
      files: {
        create: d.dateien.map((f) => ({
          kind: f.data.startsWith("data:application/pdf") ? ("DOKUMENT" as const) : ("FOTO" as const),
          name: f.name,
          data: f.data,
        })),
      },
    },
    select: { id: true },
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      ok: true,
      id: fall.id,
      gespeichert: true,
      keineKi: true,
      hinweis:
        "Der Fall ist gespeichert. Die KI-Prüfung ist gerade nicht verfügbar — wir sehen ihn uns von Hand an.",
    });
  }

  const abbuchung = await chargeForAiAction(session.user.id, "problemCase");
  if (!abbuchung.ok) {
    return NextResponse.json({
      ok: true,
      id: fall.id,
      gespeichert: true,
      keineKi: true,
      hinweis:
        abbuchung.reason === "no_access"
          ? "Der Fall ist gespeichert. Für die KI-Prüfung braucht es ein aktives Konto."
          : "Der Fall ist gespeichert. Für die KI-Prüfung fehlen Credits — wir sehen ihn uns von Hand an.",
    });
  }

  let ergebnis: Antwort;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const inhalt: Anthropic.Messages.ContentBlockParam[] = [];
    for (const f of d.dateien) {
      const m = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,(.+)$/.exec(f.data);
      if (!m) continue;
      const [, typ, base64] = m;
      if (typ === "application/pdf") {
        inhalt.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
          title: f.name,
        });
      } else {
        inhalt.push({
          type: "image",
          source: { type: "base64", media_type: typ as "image/jpeg", data: base64 },
        });
      }
    }
    inhalt.push({
      type: "text",
      text:
        `Problem des Anwenders:\n${d.text}\n\n` +
        (d.machine ? `Maschine/Anlage: ${d.machine}\n` : "") +
        (d.productFreetext && !d.productId ? `Produkt (Freitext): ${d.productFreetext}\n` : "") +
        (d.links.length ? `Vom Anwender genannte Quellen:\n${d.links.join("\n")}\n` : "") +
        (wissen ? `\nWas die Plattform über das Produkt weiß:\n${wissen}\n` : "") +
        "\nGrenze das Problem ein.",
    });

    const antwort = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system:
        "Du bist ein erfahrener Fluid-Fachmann und hilfst Instandhaltern, Problemen mit " +
        "Kühlschmierstoffen, Ölen und Schmierstoffen auf den Grund zu gehen.\n\n" +
        "So arbeitest du:\n" +
        "- Du stützt jede genannte Ursache auf etwas, das TATSÄCHLICH in den Angaben steht: " +
        "Beschreibung, Foto, Datenblatt, Sicherheitsdatenblatt, Laborbericht, Quelle oder das " +
        "mitgelieferte Plattform-Wissen. In der Begründung sagst du, worauf du dich stützt.\n" +
        "- **Raten ist verboten.** Reichen die Angaben nicht für eine belastbare Aussage, gibst " +
        "du KEINE Ursache aus, setzt anAdmin auf true und schreibst unter fehlendeAngaben, was " +
        "gebraucht wird. Ein falscher Verdacht kostet einen Betrieb Tage und Geld.\n" +
        "- Sofortmaßnahmen dürfen auch ohne endgültige Ursache genannt werden, solange sie " +
        "niemanden gefährden und nichts zerstören.\n" +
        "- Sicherheitsrelevantes (pH unter 8,5 nach DGUV 109-003, Nitrit über 20 mg/l nach " +
        "TRGS 611, Hautkontakt, Aerosole) nennst du immer, wenn die Angaben darauf deuten.\n" +
        "- Du nennst KEINE Marken-, Geräte- oder Systemnamen fremder Anbieter.\n" +
        "- Du schreibst deutsch, kurz und in der Sprache der Werkstatt.",
      messages: [{ role: "user", content: inhalt }],
    });

    if (antwort.stop_reason === "refusal") throw new Error("refusal");
    const text = antwort.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("keine Antwort");
    ergebnis = JSON.parse(text.text);
  } catch {
    await refundAiAction(session.user.id, "problemCase");
    await prisma.problemCase.update({
      where: { id: fall.id },
      data: { aiVerdict: "UNKLAR", aiSummary: "KI-Prüfung fehlgeschlagen — manuell ansehen." },
    });
    return NextResponse.json({
      ok: true,
      id: fall.id,
      gespeichert: true,
      keineKi: true,
      hinweis:
        "Der Fall ist gespeichert, die KI-Prüfung hat aber nicht geklappt. Wir sehen ihn uns von Hand an.",
    });
  }

  const verdict = ergebnis.anAdmin || ergebnis.moeglicheUrsachen.length === 0 ? "UNKLAR" : "EINGEGRENZT";
  await prisma.problemCase.update({
    where: { id: fall.id },
    data: { aiVerdict: verdict, aiSummary: ergebnis.zusammenfassung, aiJson: JSON.stringify(ergebnis) },
  });

  return NextResponse.json({
    ok: true,
    id: fall.id,
    gespeichert: true,
    verdict,
    ...ergebnis,
    saldo: abbuchung.balance,
  });
}
