import type { MonthlyPriceDataPoint } from "@/lib/price-aggregation";

/**
 * Mehr-Produkt-Preisverlauf in EINEM SVG-Chart — je Produkt eine farbige Linie
 * plus Legende. Server-rendered, keine Chart-Library nötig.
 *
 * Anders als PriceHistoryChart (eine Linie) legt diese Komponente mehrere
 * Zeitreihen übereinander. Die X-Achse ist die Vereinigung aller Monate; jede
 * Linie verbindet nur ihre eigenen vorhandenen Datenpunkte.
 */

export type PriceSeries = {
  productId: string;
  name: string;
  manufacturer: string;
  data: MonthlyPriceDataPoint[];
};

// Gut unterscheidbare Kategorie-Farben (max 6 — passt zum Vergleichs-Limit).
// Erste Farbe = Brand-Oliv, damit ein einzelnes Produkt vertraut aussieht.
const SERIES_COLORS = [
  "#74980f", // Brand-Oliv
  "#2563eb", // Blau
  "#dc2626", // Rot
  "#d97706", // Amber
  "#7c3aed", // Violett
  "#0891b2", // Cyan
];

export function MultiPriceHistoryChart({
  series,
  width = 760,
  height = 300,
}: {
  series: PriceSeries[];
  width?: number;
  height?: number;
}) {
  const withData = series.filter((s) => s.data.length > 0);

  if (withData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/40 p-6 text-center text-sm text-slate-500">
        Für die ausgewählten Produkte liegen noch keine verifizierten Preisdaten vor.
      </div>
    );
  }

  // Vereinigung aller Monate über alle Serien, chronologisch sortiert.
  const monthSet = new Map<string, string>(); // month → monthLabel
  for (const s of withData) {
    for (const d of s.data) monthSet.set(d.month, d.monthLabel);
  }
  const months = [...monthSet.keys()].sort((a, b) => a.localeCompare(b));
  const monthIndex = new Map(months.map((m, i) => [m, i]));
  const monthLabels = months.map((m) => monthSet.get(m)!);

  // Y-Bereich über ALLE Serien.
  const allValues = withData.flatMap((s) => s.data.map((d) => d.medianEur));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const yMin = Math.floor(minVal * 0.95 * 100) / 100;
  const yMax = Math.ceil(maxVal * 1.05 * 100) / 100;
  const yRange = yMax - yMin || 1;

  const padding = { top: 14, right: 16, bottom: 26, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  function xPos(idx: number) {
    if (months.length === 1) return padding.left + innerW / 2;
    return padding.left + (idx / (months.length - 1)) * innerW;
  }
  function yPos(val: number) {
    return padding.top + innerH - ((val - yMin) / yRange) * innerH;
  }

  // Einheiten-Hinweis, falls Serien unterschiedliche Basen mischen (z.B. EUR/L vs EUR/kg).
  const units = [...new Set(withData.map((s) => s.data[s.data.length - 1].unitLabel))];
  const mixedUnits = units.length > 1;

  const yTicks = [yMin, yMin + yRange * 0.33, yMin + yRange * 0.66, yMax].map((v) => ({
    value: v,
    y: yPos(v),
  }));

  const xTickIndices =
    months.length <= 6
      ? months.map((_, i) => i)
      : [
          0,
          Math.floor(months.length / 4),
          Math.floor(months.length / 2),
          Math.floor((3 * months.length) / 4),
          months.length - 1,
        ];

  return (
    <div className="w-full">
      {/* Legende */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {withData.map((s, i) => {
          const color = SERIES_COLORS[i % SERIES_COLORS.length];
          const last = s.data[s.data.length - 1];
          const first = s.data[0];
          const trendPct =
            first.medianEur !== 0
              ? ((last.medianEur - first.medianEur) / first.medianEur) * 100
              : 0;
          return (
            <div key={s.productId} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-slate-700">
                {s.manufacturer} · {s.name}
              </span>
              <span className="font-mono text-slate-500">
                {last.medianEur.toFixed(2)} {last.unitLabel}
              </span>
              {s.data.length >= 2 ? (
                <span className={trendPct >= 0 ? "text-red-600" : "text-emerald-600"}>
                  {trendPct >= 0 ? "↗" : "↘"} {Math.abs(trendPct).toFixed(1)}%
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Y-Grid + Labels */}
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
            y={padding.top + innerH + 16}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize="10"
          >
            {monthLabels[idx]}
          </text>
        ))}

        {/* Eine Linie + Punkte pro Serie */}
        {withData.map((s, si) => {
          const color = SERIES_COLORS[si % SERIES_COLORS.length];
          const pts = s.data.map((d) => ({
            x: xPos(monthIndex.get(d.month)!),
            y: yPos(d.medianEur),
            d,
          }));
          const path = pts
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(" ");
          return (
            <g key={s.productId}>
              <path d={path} fill="none" stroke={color} strokeWidth="2" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color}>
                  <title>
                    {s.manufacturer} · {s.name} — {p.d.monthLabel}: {p.d.medianEur.toFixed(2)}{" "}
                    {p.d.unitLabel} ({p.d.count} Beob.)
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>
          {months.length} {months.length === 1 ? "Monat" : "Monate"} · {withData.length}{" "}
          {withData.length === 1 ? "Produkt" : "Produkte"}
        </span>
        <span>Achse: EUR ({units.join(", ")})</span>
      </div>

      {mixedUnits ? (
        <p className="mt-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
          Hinweis: Die Produkte haben unterschiedliche Mengen-Einheiten ({units.join(", ")}).
          Die Kurven liegen zwar in einem Chart, sind aber nur eingeschränkt direkt
          vergleichbar.
        </p>
      ) : null}
    </div>
  );
}
