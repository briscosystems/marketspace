/**
 * Web-Recherche-Helfer für KI-Lösungssuchen: lässt Claude (Sonnet, web-fähig)
 * Foren, Herstellerseiten und Fachartikel prüfen und liefert
 *   - eine kurze Einschätzung (summary),
 *   - Quellen MIT Glaubwürdigkeits-Einstufung (hoch/mittel/niedrig + Begründung),
 *   - optionale Anmerkungen je geprüftem Produkt.
 *
 * Fehler sind IMMER nicht-fatal: Aufrufer behandeln `null` als "keine Web-Daten".
 * Kosten-Schutz: max_uses fürs Suchwerkzeug, max_tokens, Timeout, Circuit-Breaker.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { createAnthropic, clampText, aiTemporarilyDisabled, noteAiSuccess, noteAiFailure } from "@/lib/ai-client";
import { recordAiUsage } from "@/lib/ai-usage";

export type WebCredibility = "hoch" | "mittel" | "niedrig";

export type WebSource = {
  title: string;
  url: string;
  /** Einstufung durch die KI: Hersteller/Fachpresse = hoch, Foren = mittel, Shops/Blogs = niedrig. */
  credibility?: WebCredibility;
  credibilityNote?: string;
};

export type WebResearchResult = {
  summary: string;
  sources: WebSource[];
  /** 1-basierter Index → Anmerkung aus der Web-Recherche zum jeweiligen Produkt. */
  notesByIndex: Map<number, string>;
};

/** Extrahiert alle vom Suchwerkzeug gelieferten Quellen (Titel + URL). */
export function extractToolSources(content: Anthropic.Messages.ContentBlock[]): WebSource[] {
  const out: WebSource[] = [];
  const seen = new Set<string>();
  for (const block of content) {
    const anyBlock = block as unknown as { type: string; content?: { url?: string; title?: string }[] };
    if (anyBlock.type === "web_search_tool_result" && Array.isArray(anyBlock.content)) {
      for (const r of anyBlock.content) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          out.push({ title: r.title ?? r.url, url: r.url });
        }
      }
    }
  }
  return out;
}

const CRED_VALUES = new Set<WebCredibility>(["hoch", "mittel", "niedrig"]);

/**
 * Reichert Werkzeug-Quellen mit den Glaubwürdigkeits-Einstufungen aus der
 * Modell-Antwort an (Match über URL; Modell-Quellen ohne Werkzeug-Treffer werden ergänzt).
 */
export function mergeSourceCredibility(
  toolSources: WebSource[],
  rated: { url?: string; titel?: string; glaubwuerdigkeit?: string; warum?: string }[] | undefined,
): WebSource[] {
  if (!rated?.length) return toolSources;
  const byUrl = new Map(toolSources.map((s) => [s.url, s]));
  for (const r of rated) {
    if (!r.url) continue;
    const cred = CRED_VALUES.has(r.glaubwuerdigkeit as WebCredibility)
      ? (r.glaubwuerdigkeit as WebCredibility)
      : undefined;
    const existing = byUrl.get(r.url);
    if (existing) {
      existing.credibility = cred;
      existing.credibilityNote = r.warum;
    } else {
      byUrl.set(r.url, { title: r.titel ?? r.url, url: r.url, credibility: cred, credibilityNote: r.warum });
    }
  }
  // Eingestufte Quellen zuerst, hoch → niedrig; nicht eingestufte hinten.
  const order: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
  return [...byUrl.values()].sort(
    (a, b) => (order[a.credibility ?? ""] ?? 3) - (order[b.credibility ?? ""] ?? 3),
  );
}

/** Anweisungs-Baustein, der die Quellen-Bewertung im JSON anfordert (für Prompts). */
export const SOURCES_JSON_INSTRUCTION =
  '"quellen":[{"url":"…","titel":"…","glaubwuerdigkeit":"hoch|mittel|niedrig","warum":"1 kurzer Grund"}] — ' +
  "liste NUR Quellen, die du wirklich gelesen hast. Einstufung: Hersteller-/Fachquellen = hoch, " +
  "Praxis-/Forenberichte = mittel, Shops/Werbung/unklare Herkunft = niedrig.";

/**
 * Prüft empfohlene Produkte per Web-Suche gegen reale Erfahrungen
 * (Foren, Herstellerseiten, Fachartikel). Liefert null bei fehlendem Key,
 * aktivem Circuit-Breaker oder Fehler — niemals eine Exception.
 */
export async function webVerifyRecommendations(args: {
  /** Kurzbeschreibung des Problems/Kontexts des Anwenders. */
  context: string;
  /** Die zu prüfenden Produkte (Reihenfolge = Index in notesByIndex, 1-basiert). */
  items: { manufacturer: string; name: string }[];
  /** Feature-Schlüssel für die Token-Verbuchung (AI_FEATURE_LABEL). */
  usageFeature: string;
}): Promise<WebResearchResult | null> {
  if (!process.env.ANTHROPIC_API_KEY || aiTemporarilyDisabled() || args.items.length === 0) return null;

  try {
    const anthropic = createAnthropic();
    const itemList = args.items.map((it, i) => `${i + 1}. ${it.manufacturer} ${it.name}`).join("\n");

    const resp = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system:
          "Du prüfst KSS-/Schmierstoff-Empfehlungen anhand realer Web-Quellen (Foren, Herstellerseiten, Fachpresse). " +
          "Sei ehrlich und knapp, erfinde nichts. Wenn du zu einem Produkt nichts findest, sag das.",
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 4 } as unknown as Anthropic.Messages.ToolUnion,
        ],
        messages: [
          {
            role: "user",
            content: [
              `Anwender-Kontext: ${clampText(args.context, 1500) || "(keine Problembeschreibung)"}`,
              "",
              "Empfohlene Produkte (per Nummer referenzieren):",
              itemList,
              "",
              "Aufgabe: Suche im Web nach realen Erfahrungen zu diesen Produkten im Kontext des Problems.",
              "Antworte am Ende NUR mit JSON:",
              `{"summary":"2-3 Sätze Gesamteinschätzung","anmerkungen":[{"n":1,"note":"1 Satz aus den Funden"}],${SOURCES_JSON_INSTRUCTION}}`,
            ].join("\n"),
          },
        ],
      },
      { timeout: 55_000 },
    );

    recordAiUsage(args.usageFeature, resp.model, resp.usage);

    const toolSources = extractToolSources(resp.content);
    const texts = resp.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === "text");
    const raw = texts.map((t) => t.text).join("\n").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);

    let summary = "";
    let rated: Parameters<typeof mergeSourceCredibility>[1];
    const notesByIndex = new Map<number, string>();
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          summary?: string;
          anmerkungen?: { n: number; note: string }[];
          quellen?: { url?: string; titel?: string; glaubwuerdigkeit?: string; warum?: string }[];
        };
        summary = parsed.summary ?? "";
        rated = parsed.quellen;
        for (const a of parsed.anmerkungen ?? []) {
          if (typeof a.n === "number" && a.note) notesByIndex.set(a.n, a.note);
        }
      } catch {
        // JSON kaputt → nur Quellen zurückgeben
      }
    }

    noteAiSuccess();
    return { summary, sources: mergeSourceCredibility(toolSources, rated), notesByIndex };
  } catch (e) {
    noteAiFailure();
    console.warn("Web-Recherche fehlgeschlagen (nicht fatal):", e);
    return null;
  }
}
