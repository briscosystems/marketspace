"use client";

import { useState } from "react";

/**
 * Kompakter Doppel-Schieber für den Marktpreis-Filter. Ersetzt zwei
 * Zahlen-Eingabefelder → deutlich geringere Höhe.
 *
 * - Beide Regler liegen auf einer Schiene (zwei überlagerte range-Inputs).
 * - Die Inputs tragen die Namen minPrice/maxPrice und werden von der
 *   umgebenden LiveFilterForm gelesen — ABER nur, wenn sie nicht am Anschlag
 *   stehen. Voller Bereich (0 … MAX) = kein Preisfilter.
 */
export function PriceRangeSlider({
  max = 50,
  initialMin,
  initialMax,
}: {
  max?: number;
  initialMin?: number;
  initialMax?: number;
}) {
  const [min, setMin] = useState<number>(initialMin ?? 0);
  const [maxVal, setMaxVal] = useState<number>(initialMax ?? max);

  // Anschlag = kein Filter → dann keinen name vergeben (Param fällt aus der URL).
  const minActive = min > 0;
  const maxActive = maxVal < max;

  const minPct = (min / max) * 100;
  const maxPct = (maxVal / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
        <span>{minActive ? `ab ${min} €` : "ab 0 €"}</span>
        <span>{maxActive ? `bis ${maxVal} €` : `bis ${max}+ €`}</span>
      </div>

      <div className="relative h-5">
        {/* Schiene */}
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-slate-200" />
        {/* gewählter Bereich */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-brand-500"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          name={minActive ? "minPrice" : undefined}
          min={0}
          max={max}
          step={1}
          value={min}
          onChange={(e) => setMin(Math.min(Number(e.target.value), maxVal - 1))}
          className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          name={maxActive ? "maxPrice" : undefined}
          min={0}
          max={max}
          step={1}
          value={maxVal}
          onChange={(e) => setMaxVal(Math.max(Number(e.target.value), min + 1))}
          className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent"
        />
      </div>

      <p className="text-[10px] text-slate-500">
        Voller Bereich = kein Preisfilter. Aktiv gefiltert wird nur, wenn du einen Regler
        bewegst — Produkte ohne verifizierten Marktpreis fallen dann raus.
      </p>

      {/* Daumen klickbar machen (die Inputs selbst sind pointer-events-none) */}
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #93c113;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #93c113;
          cursor: pointer;
        }
        .range-thumb::-webkit-slider-runnable-track {
          background: transparent;
        }
        .range-thumb::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
