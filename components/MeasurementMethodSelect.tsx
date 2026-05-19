"use client";

import { useState } from "react";
import { Check, Info, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MEASUREMENT_METHODS, type MeasurementMethodId } from "@/lib/kss-automation";

export function MeasurementMethodSelect({
  value,
  onChange,
  containsGlycol,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  containsGlycol?: boolean;
}) {
  const [openInfo, setOpenInfo] = useState<MeasurementMethodId | null>(null);

  function toggle(id: MeasurementMethodId) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  const info = openInfo ? MEASUREMENT_METHODS.find((m) => m.id === openInfo) : null;

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {MEASUREMENT_METHODS.map((m) => {
          const selected = value.includes(m.id);
          const glycolConflict = containsGlycol && !m.glycolCompatible;
          const glycolRecommend = containsGlycol && m.glycolCompatible && m.automationLevel >= 4;
          return (
            <div
              key={m.id}
              className={`rounded-lg border p-3 transition-colors ${
                selected
                  ? "border-brand-300 bg-brand-50"
                  : glycolConflict
                    ? "border-red-200 bg-red-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="flex flex-1 items-start gap-2 text-left"
                >
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">
                      {m.label}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span title="Automatisierungsgrad">
                        {"●".repeat(m.automationLevel)}
                        <span className="text-slate-200">
                          {"●".repeat(5 - m.automationLevel)}
                        </span>
                      </span>
                      {glycolConflict && (
                        <span className="inline-flex items-center gap-0.5 text-red-700">
                          <AlertTriangle size={11} />
                          ungeeignet bei Glykol
                        </span>
                      )}
                      {glycolRecommend && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700">
                          <CheckCircle2 size={11} />
                          empfohlen bei Glykol
                        </span>
                      )}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenInfo(m.id)}
                  aria-label="Info"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {info && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpenInfo(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="font-semibold text-slate-900">{info.label}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Automatisierungsgrad{" "}
                  <span className="text-brand-600">{"●".repeat(info.automationLevel)}</span>
                  <span className="text-slate-300">{"●".repeat(5 - info.automationLevel)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenInfo(null)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm text-slate-700">
              <p>{info.details}</p>
              <div className="flex gap-4 text-xs">
                <span className={info.glycolCompatible ? "text-emerald-700" : "text-red-700"}>
                  {info.glycolCompatible ? "✓ glykol-tauglich" : "✗ nicht glykol-tauglich"}
                </span>
                <span className={info.trampOilTolerant ? "text-emerald-700" : "text-amber-700"}>
                  {info.trampOilTolerant ? "✓ fremdöl-tolerant" : "⚠ fremdöl-empfindlich"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
