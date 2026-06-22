"use client";

import { useState, useTransition } from "react";
import { runComparisonAnalysis } from "@/app/compare/actions";
import type { AnalysisResult } from "@/lib/comparison-analysis";
import { Sparkles, Loader2, AlertTriangle, Award, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";

type Props = {
  listingIds: string[];
  listingMap: Record<string, { productName: string; manufacturer: string }>;
  // Wenn true: Vergleich ist nicht möglich (z.B. mixed productTypes) → Button gesperrt
  disabled?: boolean;
  disabledReason?: string;
  // Optionales vorab geladenes Ergebnis (aus dem Cache, server-seitig vorgeladen)
  initialResult?: AnalysisResult | null;
};

export function AiAnalysisPanel({
  listingIds,
  listingMap,
  disabled,
  disabledReason,
  initialResult,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AnalysisResult | null>(initialResult ?? null);
  const [error, setError] = useState<string | null>(null);

  const trigger = () => {
    setError(null);
    startTransition(async () => {
      const r = await runComparisonAnalysis(listingIds);
      if (r.ok) setResult(r.result);
      else setError(r.error);
    });
  };

  return (
    <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-600" />
            <h2 className="section-title">KI-Bewertung</h2>
            {result?.source === "anthropic-claude" ? (
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                Claude · {result.model ?? ""}
              </span>
            ) : result?.source === "heuristic-fallback" ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                heuristisch (kein API-Key)
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Stärken/Schwächen, Wirtschaftlichkeits-Score und Use-Case-Empfehlung für die {listingIds.length} ausgewählten Listings.
          </p>
        </div>
        {!result || pending ? (
          <button
            type="button"
            onClick={trigger}
            disabled={disabled || pending}
            title={disabled ? disabledReason : undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analysiere …
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Bewerten lassen
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={trigger}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Neu bewerten
          </button>
        )}
      </div>

      {disabled ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{disabledReason ?? "Bewertung in dieser Konstellation nicht möglich."}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 space-y-5">
          {/* Summary */}
          <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-700">{result.summary}</p>
            <div className="mt-2 text-[10px] text-slate-400">
              Erstellt: {new Date(result.generatedAt).toLocaleString("de-DE")}
              {result.source === "heuristic-fallback"
                ? " · regelbasierte Heuristik, keine KI-Inferenz"
                : ""}
            </div>
          </div>

          {/* Per-Item-Score */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Pro Listing</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.perItem.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-500">{item.manufacturer}</div>
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {item.productName}
                      </div>
                    </div>
                    <ValueScore score={item.valueScore} />
                  </div>
                  {item.strengths.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {item.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700">
                          <ThumbsUp size={12} className="mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.weaknesses.length > 0 ? (
                    <ul className="mt-1.5 space-y-1">
                      {item.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                          <ThumbsDown size={12} className="mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    <TrendingUp size={10} className="mr-1 inline-block" />
                    {item.valueReason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best-For-Empfehlungen */}
          {result.bestFor.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Beste Wahl für …</h3>
              <div className="space-y-2">
                {result.bestFor.map((rec, i) => {
                  const product = listingMap[rec.recommendedListingId];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"
                    >
                      <Award size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {rec.useCase}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">
                          →{" "}
                          {product ? (
                            <strong>
                              {product.manufacturer} {product.productName}
                            </strong>
                          ) : (
                            <span className="italic">Listing nicht gefunden</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{rec.reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ValueScore({ score }: { score: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(score)));
  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      title={`Wirtschaftlichkeit ${score}/5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < filled ? "bg-emerald-500" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
