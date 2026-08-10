/**
 * Plausibilitätskontrolle für Erfahrungsberichte.
 *
 * Grundsatz (Betreiber 2026-08-10): **Die KI entscheidet nichts.** Sie sortiert
 * vor und begründet ihre Einschätzung in einem Satz. Im Zweifel darf sie NICHT
 * raten — dann lautet das Urteil `UNCLEAR` und der Bericht geht unverändert an
 * den Betreiber. Freigegeben wird ausschließlich von Hand.
 *
 * Warum überhaupt eine Vorprüfung: Bei wachsender Zahl der Berichte ist die
 * Handarbeit der Engpass. Die Vorprüfung sagt dem Betreiber, worauf er zuerst
 * schauen sollte — sie nimmt ihm die Entscheidung nicht ab.
 *
 * Ohne ANTHROPIC_API_KEY bleibt es bei `NOT_CHECKED`; der Bericht wandert
 * trotzdem in die Warteschlange. Ein Fehler der KI darf niemals dazu führen,
 * dass ein Bericht verloren geht.
 */
import Anthropic from "@anthropic-ai/sdk";

export type Pruefergebnis = {
  verdict: "NOT_CHECKED" | "PLAUSIBLE" | "UNCLEAR" | "IMPLAUSIBLE";
  note: string | null;
};

const SCHEMA = {
  type: "object",
  properties: {
    urteil: {
      type: "string",
      enum: ["plausibel", "unklar", "unplausibel"],
      description:
        "plausibel = fachlich stimmig; unklar = nicht entscheidbar (im Zweifel IMMER unklar); " +
        "unplausibel = widerspricht Fachwissen, ist Werbung, Beleidigung oder offensichtlich erfunden",
    },
    begruendung: {
      type: "string",
      description: "Ein Satz auf Deutsch, warum. Nennt bei Zweifeln, was fehlt.",
    },
  },
  required: ["urteil", "begruendung"],
  additionalProperties: false,
} as const;

export async function pruefeErfahrung(input: {
  text: string;
  produkt: string | null;
  problems: string[];
  machine: string | null;
}): Promise<Pruefergebnis> {
  if (!process.env.ANTHROPIC_API_KEY) return { verdict: "NOT_CHECKED", note: null };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const antwort = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system:
        "Du prüfst Praxisberichte über Kühlschmierstoffe und Schmierstoffe auf fachliche " +
        "Plausibilität — nicht auf Zustimmung. Negative Berichte sind ausdrücklich erwünscht " +
        "und dürfen niemals deshalb als unplausibel gelten.\n\n" +
        "Als 'unplausibel' gilt nur: ein klarer fachlicher Widerspruch (z. B. Konzentrationen " +
        "oder pH-Werte außerhalb jeder möglichen Spanne), erkennbare Werbung, Beleidigungen, " +
        "Unsinn oder ein Bericht ohne jeden Bezug zum Produkt.\n\n" +
        "WICHTIG: Wenn du dir nicht sicher bist, antworte 'unklar'. Rate niemals. " +
        "Ein Mensch prüft danach ohnehin jeden Bericht.",
      messages: [
        {
          role: "user",
          content:
            `Produkt: ${input.produkt ?? "nicht angegeben"}\n` +
            `Maschine: ${input.machine ?? "nicht angegeben"}\n` +
            `Genannte Probleme: ${input.problems.join(", ") || "keine"}\n\n` +
            `Bericht:\n${input.text}`,
        },
      ],
    });

    if (antwort.stop_reason === "refusal") return { verdict: "UNCLEAR", note: null };
    const block = antwort.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return { verdict: "UNCLEAR", note: null };
    const j = JSON.parse(block.text) as { urteil: string; begruendung: string };

    const verdict =
      j.urteil === "plausibel" ? "PLAUSIBLE" : j.urteil === "unplausibel" ? "IMPLAUSIBLE" : "UNCLEAR";
    return { verdict, note: j.begruendung?.slice(0, 500) ?? null };
  } catch {
    // Ein Fehlschlag der Prüfung darf den Bericht nicht kosten.
    return { verdict: "UNCLEAR", note: "Automatische Prüfung nicht möglich — bitte von Hand ansehen." };
  }
}
