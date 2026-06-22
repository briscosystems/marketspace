"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Brain } from "lucide-react";

type Recommendation = {
  productId: string;
  productSlug: string;
  manufacturerSlug: string;
  productName: string;
  manufacturer: string;
  reason: string;
  matchScore: number;
  sealWarning?: string;
};

type ApiResult = {
  recommendations: Recommendation[];
  summary: string;
  source: string;
};

/**
 * KI-Analyse direkt auf der KSS-Finder-Seite. Nimmt die aktuell gewählten
 * Filter + den Freitext aus „Kritische Punkte" und lässt die KI das Problem
 * KRITISCH analysieren und passende Alternativen aus dem Katalog vorschlagen.
 * Nutzt dieselbe Route wie der Wizard (/api/kss-wizard) — inkl. Heuristik-Fallback.
 */
export function KssAiAnalysis({
  problemText,
  applicationAreas,
  materials,
  criticalIssues,
  certifications,
  productionType,
  concentrateForm,
  unsureDimensions,
}: {
  problemText: string;
  applicationAreas: string[];
  materials: string[];
  criticalIssues: string[];
  certifications: string[];
  productionType?: string;
  concentrateForm?: string;
  unsureDimensions: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>(problemText ?? "");

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/kss-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satisfied: null,
          problemDescription: text,
          applicationAreas,
          materials,
          criticalIssues,
          certifications,
          productionType: productionType || null,
          concentrateForm: concentrateForm || null,
          unsureDimensions,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setResult((await resp.json()) as ApiResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-purple-600" />
        <h3 className="text-base font-semibold text-slate-900">KI-Analyse & Alternativen</h3>
      </div>

      <p className="mt-1 text-xs text-slate-600">
        Beschreibe dein spezielles Problem in eigenen Worten — die KI prüft es kritisch und
        schlägt passende Alternativen aus dem Katalog vor. (Leer lassen geht auch: dann
        wertet die KI nur die oben gewählten Filter aus.)
      </p>

      <label className="label mt-3">Dein Problem (Freitext)</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="z.B. Emulsion kippt nach 3 Wochen trotz Pflege / Bediener klagen über Hautreizungen / Aluminium läuft an …"
        className="input mt-1 font-normal leading-relaxed"
      />

      <button
        type="button"
        onClick={analyze}
        disabled={loading}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? "Analysiere…" : "Kritisch analysieren & Alternativen finden"}
      </button>

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Analyse fehlgeschlagen: {error}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              Kritische Einschätzung
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              {result.source === "anthropic-claude" ? "KI (Claude)" : "Heuristik"}
            </span>
          </div>
          <p className="rounded bg-white/80 p-3 text-sm text-slate-700 ring-1 ring-purple-100">
            {result.summary}
          </p>

          {result.recommendations.length === 0 ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Keine klare Alternative gefunden. Beschreibe das Problem genauer oder weiche die
              Filter auf.
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {result.recommendations.map((r, i) => (
                <div key={r.productId} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">
                        #{i + 1} · {r.manufacturer}
                      </div>
                      <Link
                        href={`/products/${r.manufacturerSlug}/${r.productSlug}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {r.productName}
                      </Link>
                    </div>
                    <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                      {r.matchScore}/100
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-700">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                    {r.reason}
                  </p>
                  {r.sealWarning && (
                    <p className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                      <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>
                        <span className="font-semibold">Dichtungs-Hinweis:</span> {r.sealWarning}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
