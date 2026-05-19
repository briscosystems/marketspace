"use client";

import { useState } from "react";
import { Calculator, FlaskConical, Info, AlertTriangle } from "lucide-react";

type Props = {
  productName: string;
  factor: number | null;
  recommendedMin?: number | null;
  recommendedMax?: number | null;
};

/**
 * Refraktometer-Rechner: Brix → Konzentration.
 * Bei verfügbarem Faktor: direkter Modus.
 * Ohne Faktor: 3-Punkt-Kalibrierungsmodus, in dem der User selbst den Faktor
 * aus Labor-Verdünnungen (5/10/15 %) ermittelt.
 */
export function RefractometerCalculator({
  productName,
  factor,
  recommendedMin,
  recommendedMax,
}: Props) {
  const [brix, setBrix] = useState<string>("");
  const brixNum = Number.parseFloat(brix);
  const hasFactor = factor != null && factor > 0;
  const concentration = hasFactor && !Number.isNaN(brixNum) ? brixNum * (factor as number) : null;

  const targetBrixMin = hasFactor && recommendedMin != null ? recommendedMin / (factor as number) : null;
  const targetBrixMax = hasFactor && recommendedMax != null ? recommendedMax / (factor as number) : null;

  const inRange =
    concentration != null && recommendedMin != null && recommendedMax != null
      ? concentration >= recommendedMin && concentration <= recommendedMax
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Calculator size={18} className="text-brand-600" />
        <h3 className="font-semibold text-slate-900">Refraktometer-Rechner</h3>
      </div>

      {!hasFactor ? (
        <FactorCalibrationPanel productName={productName} />
      ) : (
        <div className="space-y-4 p-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <FlaskConical size={14} className="text-brand-600" />
              <span>
                Faktor <strong>{factor}</strong> — Refraktometer-Ablesung × {factor} = % Konzentration
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Refraktometer-Ablesung</span>
              <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={brix}
                  onChange={(e) => setBrix(e.target.value)}
                  placeholder="z.B. 5.0"
                  className="w-full rounded-l-lg px-3 py-2 text-sm outline-none"
                />
                <span className="border-l border-slate-300 px-3 py-2 text-xs font-medium text-slate-500">
                  °Brix
                </span>
              </div>
            </label>
            <div>
              <span className="text-xs font-medium text-slate-600">Konzentration</span>
              <div
                className={`mt-1 rounded-lg border px-3 py-2 text-sm ${
                  inRange === true
                    ? "border-emerald-300 bg-emerald-50"
                    : inRange === false
                      ? "border-amber-300 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                {concentration != null ? (
                  <span className="font-mono text-base font-semibold text-slate-900">
                    {concentration.toFixed(2)} %
                  </span>
                ) : (
                  <span className="text-slate-400">— Wert eingeben —</span>
                )}
                {inRange === true ? (
                  <span className="ml-2 text-xs font-medium text-emerald-700">✓ im Sollbereich</span>
                ) : inRange === false ? (
                  <span className="ml-2 text-xs font-medium text-amber-700">
                    ⚠ außerhalb Empfehlung
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {recommendedMin != null && recommendedMax != null ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <strong>Empfehlung Hersteller:</strong> {recommendedMin}–{recommendedMax} %
                  Konzentration.
                  {targetBrixMin != null && targetBrixMax != null ? (
                    <>
                      {" "}
                      Entspricht Brix-Ablesung{" "}
                      <strong>
                        {targetBrixMin.toFixed(1)}–{targetBrixMax.toFixed(1)}
                      </strong>
                      .
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * 3-Punkt-Kalibrierung: User mischt 5 %, 10 %, 15 % Verdünnung im Labor und
 * gibt seine Refraktometer-Messwerte ein. Der Slope der Regressionsgeraden
 * ist der Refraktometer-Faktor.
 */
function FactorCalibrationPanel({ productName }: { productName: string }) {
  const [b5, setB5] = useState<string>("");
  const [b10, setB10] = useState<string>("");
  const [b15, setB15] = useState<string>("");

  const measurements: Array<{ conc: number; brix: number }> = [];
  const n5 = Number.parseFloat(b5);
  const n10 = Number.parseFloat(b10);
  const n15 = Number.parseFloat(b15);
  if (!Number.isNaN(n5) && n5 > 0) measurements.push({ conc: 5, brix: n5 });
  if (!Number.isNaN(n10) && n10 > 0) measurements.push({ conc: 10, brix: n10 });
  if (!Number.isNaN(n15) && n15 > 0) measurements.push({ conc: 15, brix: n15 });

  // Linear-Regression durch Ursprung: factor = Σ(conc · brix) / Σ(brix²)
  let calculated: number | null = null;
  if (measurements.length >= 2) {
    const numer = measurements.reduce((s, m) => s + m.conc * m.brix, 0);
    const denom = measurements.reduce((s, m) => s + m.brix * m.brix, 0);
    if (denom > 0) calculated = numer / denom;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <strong>Kein verifizierter Refraktometerfaktor für „{productName}" hinterlegt.</strong>{" "}
            Du kannst ihn mit einer 3-Punkt-Kalibrierung selbst ermitteln:
            <ol className="mt-1 list-decimal pl-4">
              <li>3 Verdünnungen ansetzen: 5 %, 10 %, 15 % (Konzentrat in Ansetzwasser).</li>
              <li>Refraktometer mit demselben Ansetzwasser nullen.</li>
              <li>Bei jeder Probe Brix ablesen und unten eintragen.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CalibInput label="5 %" value={b5} onChange={setB5} />
        <CalibInput label="10 %" value={b10} onChange={setB10} />
        <CalibInput label="15 %" value={b15} onChange={setB15} />
      </div>

      <div
        className={`rounded-lg border p-3 text-sm ${
          calculated != null ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="text-xs font-medium text-slate-600">Ermittelter Refraktometer-Faktor</div>
        {calculated != null ? (
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-700">
            {calculated.toFixed(2)}
          </div>
        ) : (
          <div className="mt-1 text-slate-400">— mindestens 2 Messwerte eingeben —</div>
        )}
        {calculated != null ? (
          <div className="mt-2 text-xs text-slate-600">
            Formel: Konzentration in % = Brix-Ablesung × {calculated.toFixed(2)}. <br />
            Notiere diesen Wert direkt am Refraktometer-Gehäuse oder am KSS-Tank.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CalibInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">Brix bei {label}</span>
      <input
        type="number"
        step="0.1"
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}
