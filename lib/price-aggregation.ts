// Aggregations-Funktionen für Preis-Beobachtungen.
//
// - getMonthlyMedianHistory(productId, months) → ein Datenpunkt pro Monat,
//   verwendet nur VERIFIED-Beobachtungen, normalisiert auf EUR/L wenn möglich.
// - getCurrentMarketPrice(productId) → Median der letzten 60 Tage.
// - getPriceStats(productId) → min/median/max/anzahl der letzten 365 Tage.

import { prisma } from "@/lib/prisma";

export type PriceUnit =
  | "EUR_PER_L"
  | "EUR_PER_KG"
  | "EUR_PER_PIECE"
  | "CHF_PER_L"
  | "CHF_PER_KG"
  | "USD_PER_L"
  | "USD_PER_KG";

// Vereinfachte FX-Raten für Demo (würden in Produktion täglich gezogen).
const FX_TO_EUR: Record<string, number> = {
  EUR: 1.0,
  CHF: 1.05, // 1 CHF ≈ 1.05 EUR (May 2026 Annahme)
  USD: 0.92,
};

/** Normalisiert pricePerUnit auf EUR/L (oder EUR/kg, je nach Original-Unit-Basis). */
export function normalizeToEurPerL(price: number, unit: PriceUnit): {
  value: number;
  unitLabel: "EUR/L" | "EUR/kg" | "EUR/Stk";
} {
  const [currency, , unitBase] = unit.split("_") as ["EUR" | "CHF" | "USD", "PER", "L" | "KG" | "PIECE"];
  const eurFactor = FX_TO_EUR[currency] ?? 1;
  const eurValue = price * eurFactor;
  if (unitBase === "L") return { value: eurValue, unitLabel: "EUR/L" };
  if (unitBase === "KG") return { value: eurValue, unitLabel: "EUR/kg" };
  return { value: eurValue, unitLabel: "EUR/Stk" };
}

function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export type MonthlyPriceDataPoint = {
  month: string; // "2025-03"
  monthLabel: string; // "Mär 25"
  medianEur: number; // EUR-equiv pro L/kg
  count: number;
  unitLabel: "EUR/L" | "EUR/kg" | "EUR/Stk";
};

/**
 * Liefert eine Zeitreihe: pro Monat ein Datenpunkt mit Median der EUR/L-äquivalenten Preise.
 * Defaults: 60 Monate = 5 Jahre.
 */
export async function getMonthlyMedianHistory(
  productId: string,
  months = 60,
): Promise<MonthlyPriceDataPoint[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const observations = await prisma.priceObservation.findMany({
    where: {
      productId,
      status: "VERIFIED",
      observedAt: { gte: cutoff },
    },
    select: { pricePerUnit: true, unit: true, observedAt: true },
    orderBy: { observedAt: "asc" },
  });

  if (observations.length === 0) return [];

  // Gruppieren nach Jahr-Monat
  const groups = new Map<string, { values: number[]; unitLabel: "EUR/L" | "EUR/kg" | "EUR/Stk" }>();
  for (const o of observations) {
    const ym = `${o.observedAt.getFullYear()}-${String(o.observedAt.getMonth() + 1).padStart(2, "0")}`;
    const norm = normalizeToEurPerL(o.pricePerUnit, o.unit);
    if (!groups.has(ym)) groups.set(ym, { values: [], unitLabel: norm.unitLabel });
    groups.get(ym)!.values.push(norm.value);
  }

  // Sortiert nach Monat
  const months_de = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, g]) => {
      const [y, m] = month.split("-");
      return {
        month,
        monthLabel: `${months_de[parseInt(m, 10) - 1]} ${y.slice(2)}`,
        medianEur: Math.round(median(g.values) * 100) / 100,
        count: g.values.length,
        unitLabel: g.unitLabel,
      };
    });
}

export type CurrentMarketPrice = {
  median: number;
  unitLabel: "EUR/L" | "EUR/kg" | "EUR/Stk";
  observationCount: number;
  windowDays: number;
  min: number;
  max: number;
  confidence: "high" | "medium" | "low";
};

/**
 * Aktueller Marktpreis = Median der letzten 60 Tage verifizierter Beobachtungen.
 * Wenn keine in 60 Tagen: erweitert auf 180 Tage. Sonst null.
 */
export async function getCurrentMarketPrice(productId: string): Promise<CurrentMarketPrice | null> {
  for (const windowDays of [60, 180, 365]) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const obs = await prisma.priceObservation.findMany({
      where: { productId, status: "VERIFIED", observedAt: { gte: cutoff } },
      select: { pricePerUnit: true, unit: true },
    });
    if (obs.length === 0) continue;
    const normalized = obs.map((o) => normalizeToEurPerL(o.pricePerUnit, o.unit));
    const values = normalized.map((n) => n.value);
    const med = median(values);
    return {
      median: Math.round(med * 100) / 100,
      unitLabel: normalized[0].unitLabel,
      observationCount: obs.length,
      windowDays,
      min: Math.round(Math.min(...values) * 100) / 100,
      max: Math.round(Math.max(...values) * 100) / 100,
      confidence: windowDays === 60 ? "high" : windowDays === 180 ? "medium" : "low",
    };
  }
  return null;
}
