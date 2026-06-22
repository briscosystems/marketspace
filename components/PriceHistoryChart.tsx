import type { MonthlyPriceDataPoint } from "@/lib/price-aggregation";

/**
 * Lightweight SVG-Line-Chart für Preis-Historie — keine Chart-Library nötig.
 * Server-rendered. X-Achse: Monate, Y-Achse: EUR.
 */
export function PriceHistoryChart({
  data,
  width = 720,
  height = 220,
}: {
  data: MonthlyPriceDataPoint[];
  width?: number;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/40 p-6 text-center text-sm text-slate-500">
        Noch keine verifizierten Preisdaten. Trage den ersten Preis bei!
      </div>
    );
  }

  const padding = { top: 12, right: 16, bottom: 24, left: 44 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.medianEur);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  // 10% padding oben/unten
  const yMin = Math.floor(minVal * 0.95 * 100) / 100;
  const yMax = Math.ceil(maxVal * 1.05 * 100) / 100;
  const yRange = yMax - yMin || 1;

  function xPos(idx: number) {
    if (data.length === 1) return padding.left + innerW / 2;
    return padding.left + (idx / (data.length - 1)) * innerW;
  }
  function yPos(val: number) {
    return padding.top + innerH - ((val - yMin) / yRange) * innerH;
  }

  // Linien-Path
  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i).toFixed(1)} ${yPos(d.medianEur).toFixed(1)}`)
    .join(" ");

  // Bereichs-Fläche unter der Linie (für visuelles Gewicht)
  const areaPath =
    path +
    ` L ${xPos(data.length - 1).toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${xPos(0).toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

  // Y-Achsen-Ticks: 4 Stück
  const yTicks = [yMin, yMin + yRange * 0.33, yMin + yRange * 0.66, yMax].map((v) => ({
    value: v,
    y: yPos(v),
  }));

  // X-Achsen-Ticks: erstes, mittleres, letztes Label
  const xTickIndices =
    data.length <= 6
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1];

  const unitLabel = data[data.length - 1].unitLabel;
  const lastValue = data[data.length - 1].medianEur;
  const firstValue = data[0].medianEur;
  const trendPct = ((lastValue - firstValue) / firstValue) * 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <div className="text-slate-500">
          {data.length} Monate · {data.reduce((s, d) => s + d.count, 0)} Beobachtungen
        </div>
        <div className={trendPct >= 0 ? "text-red-600" : "text-emerald-600"}>
          {trendPct >= 0 ? "↗" : "↘"} {Math.abs(trendPct).toFixed(1)}% über Zeitraum
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Y-Grid-Linien */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={padding.left + innerW}
              y1={t.y}
              y2={t.y}
              stroke="#e2e8f0"
              strokeDasharray="2 3"
            />
            <text
              x={padding.left - 6}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-500"
              fontSize="10"
            >
              {t.value.toFixed(2)}
            </text>
          </g>
        ))}
        {/* X-Achsen-Labels */}
        {xTickIndices.map((idx) => (
          <text
            key={idx}
            x={xPos(idx)}
            y={padding.top + innerH + 14}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize="10"
          >
            {data[idx].monthLabel}
          </text>
        ))}
        {/* Bereichs-Fläche */}
        <path d={areaPath} fill="url(#priceGradient)" opacity="0.4" />
        {/* Linie */}
        <path d={path} fill="none" stroke="#74980f" strokeWidth="2" />
        {/* Datenpunkte */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xPos(i)}
            cy={yPos(d.medianEur)}
            r="2.5"
            fill="#74980f"
          >
            <title>
              {d.monthLabel}: {d.medianEur.toFixed(2)} {unitLabel} ({d.count} Beobachtungen)
            </title>
          </circle>
        ))}
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#74980f" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#74980f" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-1 text-right text-[10px] text-slate-400">Achse: {unitLabel}</div>
    </div>
  );
}
