"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency";

export type UmsatzPoint = {
  /** ISO-Datum der Transaktion */
  date: string;
  /** "sale" = Verkauf, "purchase" = Kauf */
  kind: "sale" | "purchase";
  /** Betrag in der Anzeige-Währung */
  amount: number;
  /** Einsparung durch Produktwechsel (nur bei Käufen mit erfasstem Altpreis) */
  saving?: number;
};

const RANGES = [
  { key: "3m", label: "3 Monate", months: 3 },
  { key: "6m", label: "6 Monate", months: 6 },
  { key: "12m", label: "12 Monate", months: 12 },
  { key: "all", label: "Alles", months: null as number | null },
];

/** Monats-Schlüssel "2026-07" aus ISO-Datum. */
function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const names = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

/**
 * Balkendiagramm Umsätze pro Monat (Verkäufe vs. Käufe), Zeitachse über
 * Bereichs-Knöpfe umschaltbar. Bewusst ohne Chart-Bibliothek — schlanke
 * div-Balken reichen für den Zweck.
 */
export function UmsatzChart({ points, currency }: { points: UmsatzPoint[]; currency: string }) {
  const [range, setRange] = useState("12m");

  const { months, maxValue, savingsLine, maxSaving } = useMemo(() => {
    const sel = RANGES.find((r) => r.key === range)!;
    const now = new Date();

    // Monatsliste des gewählten Bereichs aufbauen (auch leere Monate zeigen)
    let startKey: string;
    if (sel.months !== null) {
      const start = new Date(now.getFullYear(), now.getMonth() - (sel.months - 1), 1);
      startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    } else {
      startKey = points.length
        ? points.map((p) => monthKey(p.date)).sort()[0]
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const keys: string[] = [];
    const cursor = new Date(parseInt(startKey.slice(0, 4)), parseInt(startKey.slice(5, 7)) - 1, 1);
    while (
      cursor.getFullYear() < now.getFullYear() ||
      (cursor.getFullYear() === now.getFullYear() && cursor.getMonth() <= now.getMonth())
    ) {
      keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const byMonth = new Map(keys.map((k) => [k, { sale: 0, purchase: 0, saving: 0 }]));
    for (const p of points) {
      const k = monthKey(p.date);
      const bucket = byMonth.get(k);
      if (bucket) {
        bucket[p.kind] += p.amount;
        if (p.saving) bucket.saving += p.saving;
      }
    }

    const months = keys.map((k) => ({ key: k, ...byMonth.get(k)! }));
    const maxValue = Math.max(1, ...months.map((m) => Math.max(m.sale, m.purchase)));

    // Kennlinie: kumulierte Einsparung über die Zeit (eigene Skala)
    let acc = 0;
    const savingsLine = months.map((m) => (acc += m.saving));
    const maxSaving = Math.max(...savingsLine, 0);
    return { months, maxValue, savingsLine, maxSaving };
  }, [points, range]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Verkäufe
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Käufe
          </span>
          {maxSaving > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-amber-500" /> Einsparung (kumuliert):{" "}
              <strong className="text-amber-700">{formatCurrency(savingsLine[savingsLine.length - 1] ?? 0, currency)}</strong>
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                range === r.key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="flex h-48 items-end gap-1 overflow-x-auto pb-1">
          {months.map((m, i) => (
            <div key={m.key} className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end justify-center gap-0.5">
                <div
                  className="w-2/5 rounded-t bg-emerald-500"
                  style={{ height: `${(m.sale / maxValue) * 100}%` }}
                  title={`Verkäufe ${monthLabel(m.key)}: ${formatCurrency(m.sale, currency)}`}
                />
                <div
                  className="w-2/5 rounded-t bg-blue-500"
                  style={{ height: `${(m.purchase / maxValue) * 100}%` }}
                  title={`Käufe ${monthLabel(m.key)}: ${formatCurrency(m.purchase, currency)} · Einsparung bis hier: ${formatCurrency(savingsLine[i] ?? 0, currency)}`}
                />
              </div>
              <div className="whitespace-nowrap text-[10px] text-slate-500">{monthLabel(m.key)}</div>
            </div>
          ))}
        </div>

        {/* Kennlinie: kumulierte Einsparung durch Produktwechsel (eigene Skala,
            oben = maxSaving). Liegt als Overlay über den Balken. */}
        {maxSaving > 0 && (
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              points={savingsLine
                .map((v, i) => {
                  const x = ((i + 0.5) / months.length) * 100;
                  const y = 100 - (v / maxSaving) * 90; // 10% Luft nach oben
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
