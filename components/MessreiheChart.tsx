"use client";

import { useState } from "react";
import { LineChart, ChevronDown } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

/**
 * Verlaufs-Diagramm der Messwerte eines Tanks (Betreiber 2026-08-17:
 * „Wenn der User mehrere Werte eingegeben hat, soll er auf Knopfdruck einen
 * Chart mit seinen Daten sehen. Im Chart gleich hinterlegt die Sollwerte,
 * oberer und unterer Wert gem. SDS oder Datenblatt").
 *
 * Bewusst als eigenes SVG gezeichnet — kein Diagramm-Paket. Das hält die Seite
 * schlank und passt zur Hausgrafik. Das grüne Band ist der Sollbereich des
 * Herstellers; Punkte außerhalb sind sofort zu sehen.
 *
 * Der Chart erscheint erst auf Knopfdruck (ab zwei Messwerten) — wer nur schnell
 * einen Wert einträgt, wird nicht mit Grafik zugeschüttet.
 */

export type Messpunkt = {
  datum: string; // ISO
  konzentration: number | null;
  ph: number | null;
  nitrit: number | null;
};

type Reihe = {
  schluessel: "konzentration" | "ph" | "nitrit";
  titel: string;
  einheit: string;
  farbe: string;
  sollMin: number | null;
  sollMax: number | null;
  /** Harte Grenze (DGUV/TRGS) — als rote Linie. */
  grenze?: { wert: number; text: string; richtung: "min" | "max" } | null;
};

export function MessreiheChart({
  punkte,
  sollKonzMin,
  sollKonzMax,
  sollPhMin,
  sollPhMax,
}: {
  punkte: Messpunkt[];
  sollKonzMin?: number | null;
  sollKonzMax?: number | null;
  sollPhMin?: number | null;
  sollPhMax?: number | null;
}) {
  const { t } = useLocale();
  const [offen, setOffen] = useState(false);

  const reihen: Reihe[] = [
    {
      schluessel: "konzentration",
      titel: t("chart.konz"),
      einheit: "%",
      farbe: "#74980f",
      sollMin: sollKonzMin ?? null,
      sollMax: sollKonzMax ?? null,
    },
    {
      schluessel: "ph",
      titel: t("chart.ph"),
      einheit: "",
      farbe: "#2f6fed",
      sollMin: sollPhMin ?? null,
      sollMax: sollPhMax ?? null,
      // DGUV 109-003: unter pH 8,5 wird es kritisch.
      grenze: { wert: 8.5, text: t("chart.grenzePh"), richtung: "min" },
    },
    {
      schluessel: "nitrit",
      titel: t("chart.nitrit"),
      einheit: "mg/l",
      farbe: "#e11d48",
      sollMin: null,
      sollMax: null,
      // TRGS 611: höchstens 20 mg/l.
      grenze: { wert: 20, text: t("chart.grenzeNitrit"), richtung: "max" },
    },
  ];

  const mitWerten = reihen.filter((r) => punkte.some((p) => p[r.schluessel] != null));
  if (punkte.length < 2 || mitWerten.length === 0) return null;

  return (
    <section className="card space-y-4">
      <button
        type="button"
        onClick={() => setOffen(!offen)}
        className="flex w-full items-center gap-2 text-left"
      >
        <LineChart className="h-5 w-5 text-brand-600" />
        <span className="text-lg font-semibold text-slate-900">{t("chart.titel")}</span>
        <span className="text-sm text-slate-500">
          {fill(t("chart.anzahl"), { n: String(punkte.length) })}
        </span>
        <ChevronDown
          className={`ml-auto h-5 w-5 text-slate-400 transition-transform ${offen ? "rotate-180" : ""}`}
        />
      </button>

      {offen && (
        <div className="space-y-6">
          {mitWerten.map((r) => (
            <Diagramm key={r.schluessel} reihe={r} punkte={punkte} t={t} />
          ))}
          <p className="text-xs text-slate-500">{t("chart.legende")}</p>
        </div>
      )}
    </section>
  );
}

function Diagramm({
  reihe,
  punkte,
  t,
}: {
  reihe: Reihe;
  punkte: Messpunkt[];
  t: (k: string) => string;
}) {
  const daten = punkte
    .map((p) => ({ datum: new Date(p.datum), wert: p[reihe.schluessel] }))
    .filter((d): d is { datum: Date; wert: number } => d.wert != null)
    .sort((a, b) => a.datum.getTime() - b.datum.getTime());
  if (daten.length < 2) return null;

  // Zeichenfläche in Nutzer-Koordinaten; skaliert per viewBox mit.
  const B = 640, H = 200, L = 44, R = 12, O = 12, U = 26;
  const innenB = B - L - R, innenH = H - O - U;

  const werte = daten.map((d) => d.wert);
  const kandidaten = [
    ...werte,
    ...(reihe.sollMin != null ? [reihe.sollMin] : []),
    ...(reihe.sollMax != null ? [reihe.sollMax] : []),
    ...(reihe.grenze ? [reihe.grenze.wert] : []),
  ];
  let min = Math.min(...kandidaten);
  let max = Math.max(...kandidaten);
  if (max === min) { max = min + 1; min = Math.max(0, min - 1); }
  const luft = (max - min) * 0.12;
  min = Math.max(0, min - luft);
  max = max + luft;

  const x = (i: number) => L + (daten.length === 1 ? innenB / 2 : (i / (daten.length - 1)) * innenB);
  const y = (w: number) => O + innenH - ((w - min) / (max - min)) * innenH;

  const linie = daten.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.wert).toFixed(1)}`).join(" ");
  const datum = (d: Date) => d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });

  const bandOben = reihe.sollMax != null ? y(reihe.sollMax) : null;
  const bandUnten = reihe.sollMin != null ? y(reihe.sollMin) : null;

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{reihe.titel}</h3>
        {reihe.sollMin != null && reihe.sollMax != null && (
          <span className="text-xs text-slate-500">
            {t("chart.soll")} {String(reihe.sollMin).replace(".", ",")}–
            {String(reihe.sollMax).replace(".", ",")} {reihe.einheit}
          </span>
        )}
        <span className="ml-auto text-xs font-medium" style={{ color: reihe.farbe }}>
          {t("chart.zuletzt")} {String(daten[daten.length - 1].wert).replace(".", ",")} {reihe.einheit}
        </span>
      </div>

      <svg viewBox={`0 0 ${B} ${H}`} className="w-full" role="img" aria-label={reihe.titel}>
        {/* Sollbereich als grünes Band */}
        {bandOben != null && bandUnten != null && (
          <rect
            x={L}
            y={Math.min(bandOben, bandUnten)}
            width={innenB}
            height={Math.abs(bandUnten - bandOben)}
            fill="#abd91a"
            opacity="0.18"
          />
        )}
        {[bandOben, bandUnten].map((yy, i) =>
          yy == null ? null : (
            <line
              key={i}
              x1={L}
              x2={B - R}
              y1={yy}
              y2={yy}
              stroke="#74980f"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          ),
        )}

        {/* Harte Grenze (DGUV/TRGS) */}
        {reihe.grenze && reihe.grenze.wert >= min && reihe.grenze.wert <= max && (
          <>
            <line
              x1={L}
              x2={B - R}
              y1={y(reihe.grenze.wert)}
              y2={y(reihe.grenze.wert)}
              stroke="#e11d48"
              strokeWidth="1.2"
              strokeDasharray="6 3"
            />
            <text x={L + 3} y={y(reihe.grenze.wert) - 4} fontSize="10" fill="#9f1239">
              {reihe.grenze.text}
            </text>
          </>
        )}

        {/* Achsen */}
        <line x1={L} x2={B - R} y1={O + innenH} y2={O + innenH} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={L} x2={L} y1={O} y2={O + innenH} stroke="#cbd5e1" strokeWidth="1" />
        {[min, (min + max) / 2, max].map((w, i) => (
          <text key={i} x={L - 6} y={y(w) + 3} fontSize="10" fill="#64748b" textAnchor="end">
            {Math.round(w * 10) / 10}
          </text>
        ))}

        {/* Messlinie und Punkte */}
        <path d={linie} fill="none" stroke={reihe.farbe} strokeWidth="2" strokeLinejoin="round" />
        {daten.map((d, i) => {
          const drin =
            (reihe.sollMin == null || d.wert >= reihe.sollMin) &&
            (reihe.sollMax == null || d.wert <= reihe.sollMax) &&
            (!reihe.grenze ||
              (reihe.grenze.richtung === "max" ? d.wert <= reihe.grenze.wert : d.wert >= reihe.grenze.wert));
          return (
            <circle
              key={i}
              cx={x(i)}
              cy={y(d.wert)}
              r={drin ? 3.5 : 5}
              fill={drin ? reihe.farbe : "#e11d48"}
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Datum unten: erstes, mittleres, letztes — mehr wäre unlesbar */}
        {[0, Math.floor((daten.length - 1) / 2), daten.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              fontSize="10"
              fill="#64748b"
              textAnchor={i === 0 ? "start" : i === daten.length - 1 ? "end" : "middle"}
            >
              {datum(daten[i].datum)}
            </text>
          ))}
      </svg>
    </div>
  );
}
