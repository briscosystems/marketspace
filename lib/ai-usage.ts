// ---------------------------------------------------------------------------
// KI-Token-Verbrauch erfassen + Kosten berechnen.
//
// Die echten Token-Zahlen kommen aus dem `usage`-Feld jeder Anthropic-Antwort
// (input_tokens / output_tokens / cache_creation_input_tokens /
// cache_read_input_tokens). Wir speichern sie roh je Aufruf; die Kosten werden
// erst bei der Auswertung aus der Preis-Tabelle berechnet — so bleibt eine
// einzige Preisquelle, auch wenn sich Preise später ändern.
//
// Preise laut Anthropic (Stand 2026, USD je 1 Mio. Token):
//   Haiku 4.5   — Input $1,  Output $5
//   Sonnet 4.6/5 — Input $3, Output $15
// Cache-Read ≈ 0,1× Input-Preis, Cache-Write (5-Min-TTL) ≈ 1,25× Input-Preis.
// ---------------------------------------------------------------------------
import { prisma } from "@/lib/prisma";

/** Fester USD→EUR-Kurs für die Kostenanzeige (grobe Näherung, reicht fürs Reporting). */
export const EUR_PER_USD = 0.92;

type ModelPrice = { inputPerM: number; outputPerM: number };

// Preis je Modell-Präfix (USD je 1 Mio. Token). Präfix-Match, damit datierte
// Varianten wie "claude-haiku-4-5-20251001" ebenfalls treffen.
const PRICES: { prefix: string; price: ModelPrice }[] = [
  { prefix: "claude-haiku-4-5", price: { inputPerM: 1, outputPerM: 5 } },
  { prefix: "claude-haiku", price: { inputPerM: 1, outputPerM: 5 } },
  { prefix: "claude-sonnet", price: { inputPerM: 3, outputPerM: 15 } },
  { prefix: "claude-opus", price: { inputPerM: 5, outputPerM: 25 } },
];

const DEFAULT_PRICE: ModelPrice = { inputPerM: 3, outputPerM: 15 };

function priceFor(model: string): ModelPrice {
  const hit = PRICES.find((p) => model.startsWith(p.prefix));
  return hit ? hit.price : DEFAULT_PRICE;
}

/** Menschlich lesbare Namen der KI-Funktionen (Admin-Anzeige). */
export const AI_FEATURE_LABEL: Record<string, string> = {
  kss_wizard: "KSS-Wizard",
  concierge: "Berater-Chat",
  comparison: "Angebots-Vergleich (KI)",
  contact_filter: "Kontakt-Filter",
  alternatives: "Alternativen (Katalog)",
  alt_search: "Alternativen (Web-Suche)",
  kss_wizard_web: "KSS-Wizard (Web-Recherche)",
};

export type TokenCounts = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
};

/** Kosten eines Datensatzes in USD aus Tokens + Modell. */
export function costUsd(model: string, t: TokenCounts): number {
  const p = priceFor(model);
  const input =
    (t.inputTokens * p.inputPerM +
      // Cache-Read günstig (~0,1×), Cache-Write teurer (~1,25×) — beide auf Basis Input-Preis.
      t.cacheReadTokens * p.inputPerM * 0.1 +
      t.cacheCreationTokens * p.inputPerM * 1.25) /
    1_000_000;
  const output = (t.outputTokens * p.outputPerM) / 1_000_000;
  return input + output;
}

/** Kosten in EUR. */
export function costEur(model: string, t: TokenCounts): number {
  return costUsd(model, t) * EUR_PER_USD;
}

// Anthropic-`usage` ist locker typisiert (SDK-Version-abhängige Felder) — defensiv lesen.
type AnthropicUsageLike = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
} | null | undefined;

/**
 * Einen KI-Aufruf protokollieren. Fire-and-forget: wirft nie und blockiert den
 * eigentlichen Aufruf nicht (kein await nötig).
 */
export function recordAiUsage(
  feature: string,
  model: string,
  usage: AnthropicUsageLike,
  userId?: string | null,
): void {
  if (!usage) return;
  const data = {
    feature,
    model: model || "unbekannt",
    inputTokens: Math.max(0, Math.round(usage.input_tokens ?? 0)),
    outputTokens: Math.max(0, Math.round(usage.output_tokens ?? 0)),
    cacheCreationTokens: Math.max(0, Math.round(usage.cache_creation_input_tokens ?? 0)),
    cacheReadTokens: Math.max(0, Math.round(usage.cache_read_input_tokens ?? 0)),
    userId: userId ?? null,
  };
  prisma.aiTokenUsage.create({ data }).catch(() => {
    // Messung darf die eigentliche Aktion nie stören.
  });
}
