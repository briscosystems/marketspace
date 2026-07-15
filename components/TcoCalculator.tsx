"use client";

import { useState } from "react";
import { Calculator, Info } from "lucide-react";

/**
 * Gesamtkostenrechner (TCO) für wassermischbare KSS.
 *
 * Übersetzt Konzentratpreis × Konzentration × Verbrauch × Standzeit in
 * €/Jahr pro Maschine — der Einkäufer-Schmerzpunkt: Hersteller nennen €/L
 * Konzentrat, bezahlt wird aber die fertige Emulsion inkl. Wechsel/Entsorgung.
 *
 * Zwei Varianten:
 *  - <TcoCalculator/>        einzelnes Produkt (Produkt-Detailseite)
 *  - <TcoComparePanel/>      mehrere Produkte mit gleichen Betriebsdaten (/compare)
 */

export type TcoProductInput = {
  id: string;
  name: string;
  manufacturer: string;
  /** Marktpreis Konzentrat in EUR pro Liter (null = unbekannt → Eingabefeld) */
  priceEurPerL: number | null;
  /** Empfohlene Konzentration %, Mittelwert (null → Standard 8 %) */
  concentrationPct: number | null;
  /** Typische Standzeit in Wochen (null → Standard 8) */
  sumpLifeWeeks: number | null;
};

/** Betriebsdaten der Maschine — für alle Produkte gleich. */
type Operating = {
  tankL: number; // Tankvolumen der Maschine
  topUpLPerWeek: number; // Nachdosierung Emulsion pro Woche (Verdunstung/Ausschleppung)
  weeksPerYear: number; // Betriebswochen
  disposalEurPerL: number; // Entsorgungskosten pro Liter Altemulsion
};

const DEFAULT_OP: Operating = {
  tankL: 500,
  topUpLPerWeek: 100,
  weeksPerYear: 48,
  disposalEurPerL: 0.15,
};

const DEFAULT_CONC = 8; // % — üblicher Mittelwert wassermischbarer KSS
const DEFAULT_SUMP_WEEKS = 8;

export type TcoResult = {
  refillsPerYear: number;
  emulsionLPerYear: number;
  concentrateLPerYear: number;
  concentrateEur: number;
  disposalEur: number;
  totalEur: number;
  eurPerEmulsionL: number;
};

/** Kernrechnung — bewusst einfach und nachvollziehbar gehalten. */
export function computeTco(
  priceEurPerL: number,
  concentrationPct: number,
  sumpLifeWeeks: number,
  op: Operating,
): TcoResult {
  const refillsPerYear = op.weeksPerYear / Math.max(1, sumpLifeWeeks);
  // Emulsionsbedarf: Neubefüllungen + laufende Nachdosierung
  const emulsionLPerYear = refillsPerYear * op.tankL + op.topUpLPerWeek * op.weeksPerYear;
  const concentrateLPerYear = (emulsionLPerYear * concentrationPct) / 100;
  const concentrateEur = concentrateLPerYear * priceEurPerL;
  // Entsorgt wird bei jedem Wechsel der Tankinhalt
  const disposalEur = refillsPerYear * op.tankL * op.disposalEurPerL;
  const totalEur = concentrateEur + disposalEur;
  return {
    refillsPerYear,
    emulsionLPerYear,
    concentrateLPerYear,
    concentrateEur,
    disposalEur,
    totalEur,
    eurPerEmulsionL: emulsionLPerYear > 0 ? totalEur / emulsionLPerYear : 0,
  };
}

function eur(n: number): string {
  return n.toLocaleString("de-CH", { maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Gemeinsame Eingabefelder für Betriebsdaten
// ---------------------------------------------------------------------------
function OperatingInputs({
  op,
  setOp,
}: {
  op: Operating;
  setOp: (op: Operating) => void;
}) {
  const fields: { key: keyof Operating; label: string; step?: number }[] = [
    { key: "tankL", label: "Tankvolumen (L)" },
    { key: "topUpLPerWeek", label: "Nachdosierung (L Emulsion/Woche)" },
    { key: "weeksPerYear", label: "Betriebswochen/Jahr" },
    { key: "disposalEurPerL", label: "Entsorgung (€/L Altemulsion)", step: 0.05 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {f.label}
          </span>
          <input
            type="number"
            min={0}
            step={f.step ?? 1}
            value={op[f.key]}
            onChange={(e) => setOp({ ...op, [f.key]: parseFloat(e.target.value) || 0 })}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
          />
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variante 1: einzelnes Produkt (Produkt-Detailseite)
// ---------------------------------------------------------------------------
export function TcoCalculator({ product }: { product: TcoProductInput }) {
  const [op, setOp] = useState<Operating>(DEFAULT_OP);
  const [price, setPrice] = useState<number>(product.priceEurPerL ?? 0);
  const [conc, setConc] = useState<number>(product.concentrationPct ?? DEFAULT_CONC);
  const [sump, setSump] = useState<number>(product.sumpLifeWeeks ?? DEFAULT_SUMP_WEEKS);

  const r = computeTco(price, conc, sump, op);
  const priceKnown = product.priceEurPerL != null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
      <div className="flex items-center gap-2">
        <Calculator size={16} className="text-amber-600" />
        <h2 className="section-title">Was kostet dieses Produkt pro Jahr?</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Bezahlt wird nicht der Liter Konzentrat, sondern die fertige Emulsion — inkl.
        Nachdosierung, Wechsel und Entsorgung. Werte anpassen, die Rechnung läuft live.
      </p>

      {/* Produkt-Parameter */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Konzentratpreis (€/L)
          </span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
          />
          <span className="text-[10px] text-slate-400">
            {priceKnown ? "aus Richtwert vorbefüllt (indikativ)" : "kein Richtwert — bitte eintragen"}
          </span>
        </label>
        <label className="block">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Konzentration (%)
          </span>
          <input
            type="number"
            min={0.5}
            max={25}
            step={0.5}
            value={conc}
            onChange={(e) => setConc(parseFloat(e.target.value) || 0)}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
          />
          <span className="text-[10px] text-slate-400">
            {product.concentrationPct != null ? "Herstellerempfehlung" : `Standardwert ${DEFAULT_CONC} %`}
          </span>
        </label>
        <label className="block">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Standzeit (Wochen)
          </span>
          <input
            type="number"
            min={1}
            max={104}
            value={sump}
            onChange={(e) => setSump(parseFloat(e.target.value) || 1)}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
          />
          <span className="text-[10px] text-slate-400">
            {product.sumpLifeWeeks != null ? "typischer Praxiswert" : `Standardwert ${DEFAULT_SUMP_WEEKS} Wo.`}
          </span>
        </label>
      </div>

      {/* Betriebsdaten */}
      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Deine Maschine
        </div>
        <OperatingInputs op={op} setOp={setOp} />
      </div>

      {/* Ergebnis */}
      <div className="mt-4 rounded-lg border border-amber-300 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-3xl font-bold text-slate-900">
              {eur(r.totalEur)} €<span className="text-base font-semibold text-slate-500">/Jahr</span>
            </div>
            <div className="text-xs text-slate-500">pro Maschine, bei diesen Annahmen</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-700">
              {r.eurPerEmulsionL.toFixed(3)} €/L
            </div>
            <div className="text-xs text-slate-500">fertige Emulsion</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
          <div>
            Konzentrat: <strong>{eur(r.concentrateEur)} €</strong>
            <div className="text-[10px] text-slate-400">{eur(r.concentrateLPerYear)} L/Jahr</div>
          </div>
          <div>
            Entsorgung: <strong>{eur(r.disposalEur)} €</strong>
          </div>
          <div>
            Emulsionsbedarf: <strong>{eur(r.emulsionLPerYear)} L</strong>
          </div>
          <div>
            Tankwechsel: <strong>{r.refillsPerYear.toFixed(1)}×/Jahr</strong>
          </div>
        </div>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
        <Info size={12} className="mt-0.5 shrink-0" />
        Vereinfachte Rechnung ohne Systemreiniger, Pflegeaufwand und Stillstandskosten —
        als Vergleichsbasis zwischen Produkten gedacht, nicht als Angebot.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Variante 2: Produkt-Vergleich mit gemeinsamen Betriebsdaten (/compare)
// ---------------------------------------------------------------------------
export function TcoComparePanel({ products }: { products: TcoProductInput[] }) {
  const [op, setOp] = useState<Operating>(DEFAULT_OP);

  const rows = products.map((p) => {
    const price = p.priceEurPerL;
    const conc = p.concentrationPct ?? DEFAULT_CONC;
    const sump = p.sumpLifeWeeks ?? DEFAULT_SUMP_WEEKS;
    return {
      p,
      conc,
      sump,
      result: price != null ? computeTco(price, conc, sump, op) : null,
    };
  });
  const withResult = rows.filter((r) => r.result != null);
  const cheapest =
    withResult.length >= 2
      ? withResult.reduce((a, b) => (a.result!.totalEur <= b.result!.totalEur ? a : b))
      : null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Calculator size={16} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-700">
          Gesamtkosten-Vergleich (€/Jahr pro Maschine)
        </h3>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Gleiche Maschine, gleiche Fahrweise — was kostet welches Produkt wirklich pro Jahr?
      </p>

      <OperatingInputs op={op} setOp={setOp} />

      <div className="mt-3 overflow-x-auto rounded-lg border border-amber-300 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-amber-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Produkt</th>
              <th className="px-3 py-2 text-right">Konz.-Preis</th>
              <th className="px-3 py-2 text-right">Konz. %</th>
              <th className="px-3 py-2 text-right">Standzeit</th>
              <th className="px-3 py-2 text-right">€/L Emulsion</th>
              <th className="px-3 py-2 text-right">€/Jahr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ p, conc, sump, result }) => {
              const isCheapest = cheapest != null && cheapest.p.id === p.id;
              return (
                <tr key={p.id} className={isCheapest ? "bg-emerald-50/60" : undefined}>
                  <td className="px-3 py-2">
                    <span className="font-medium">
                      {p.manufacturer} · {p.name}
                    </span>
                    {isCheapest ? (
                      <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        günstigste
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {p.priceEurPerL != null ? `${p.priceEurPerL.toFixed(2)} €/L` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {conc}%{p.concentrationPct == null ? "*" : ""}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {sump} Wo.{p.sumpLifeWeeks == null ? "*" : ""}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {result ? `${result.eurPerEmulsionL.toFixed(3)} €` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {result ? `${eur(result.totalEur)} €` : "kein Richtwert"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        * Standardwert, da keine Herstellerangabe hinterlegt. Rechnung vereinfacht (ohne
        Systemreiniger/Stillstand) — dient dem Produktvergleich.
      </p>
    </div>
  );
}
