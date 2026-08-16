"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Brain, Upload, FileText, X, Globe } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { sdsFlagChips } from "@/lib/sds-summary";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

const CHIP_TONE: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-800",
};

type Recommendation = {
  productId: string;
  productSlug: string;
  manufacturerSlug: string;
  productName: string;
  manufacturer: string;
  reason: string;
  matchScore: number;
  sealWarning?: string;
  webNote?: string;
};

type WebSource = {
  title: string;
  url: string;
  credibility?: "hoch" | "mittel" | "niedrig";
  credibilityNote?: string;
};

type ApiResult = {
  recommendations: Recommendation[];
  summary: string;
  source: string;
  creditNotice?: string | null;
  webSummary?: string | null;
  webSources?: WebSource[];
};

const CRED_BADGE: Record<string, { labelKey: string; cls: string }> = {
  hoch: { labelKey: "kwiz.credHoch", cls: "bg-emerald-100 text-emerald-800" },
  mittel: { labelKey: "kwiz.credMittel", cls: "bg-amber-100 text-amber-800" },
  niedrig: { labelKey: "kwiz.credNiedrig", cls: "bg-slate-200 text-slate-600" },
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
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>(problemText ?? "");

  // Hochgeladenes SDB des aktuell eingesetzten Produkts (optional).
  const [sds, setSds] = useState<{
    summary: string;
    name: string;
    chips: { label: string; tone: "red" | "amber" | "green" }[];
  } | null>(null);
  const [sdsLoading, setSdsLoading] = useState(false);
  const [sdsError, setSdsError] = useState<string | null>(null);

  async function onSdsFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // erlaubt erneutes Wählen derselben Datei
    if (!file) return;
    setSdsError(null);
    setSdsLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(withBasePath("/api/sds/parse"), { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        setSdsError(data?.error ?? t("kssai.sdsFehlerLesen"));
        return;
      }
      setSds({
        summary: data.summary as string,
        name: file.name,
        chips: sdsFlagChips({ hStatements: data.hStatements, ...data.flags }),
      });
    } catch {
      setSdsError(t("kssai.sdsFehlerUpload"));
    } finally {
      setSdsLoading(false);
    }
  }

  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [webSeconds, setWebSeconds] = useState(0);

  // Sekundenzähler während der Web-Recherche — zeigt sichtbar, dass sie läuft.
  useEffect(() => {
    if (!webLoading) return;
    setWebSeconds(0);
    const id = setInterval(() => setWebSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [webLoading]);

  /** Web-Prüfung auf Knopfdruck: Empfehlungen gegen Foren/Herstellerseiten prüfen. */
  async function runWebCheck() {
    if (!result || result.recommendations.length === 0) return;
    setWebLoading(true);
    setWebError(null);
    try {
      const resp = await fetch(withBasePath("/api/kss-wizard/web-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: text || undefined,
          items: result.recommendations.map((r) => ({
            manufacturer: r.manufacturer,
            name: r.productName,
          })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setWebError(data?.error ?? `HTTP ${resp.status}`);
        return;
      }
      setResult((prev) =>
        prev
          ? {
              ...prev,
              webSummary: data.summary || null,
              webSources: data.sources ?? [],
              recommendations: prev.recommendations.map((r, i) => ({
                ...r,
                webNote: data.notes?.[String(i + 1)] ?? r.webNote,
              })),
            }
          : prev,
      );
    } catch (e) {
      setWebError(e instanceof Error ? e.message : String(e));
    } finally {
      setWebLoading(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(withBasePath("/api/kss-wizard"), {
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
          uploadedSds: sds?.summary ?? undefined,
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
        <h3 className="text-base font-semibold text-slate-900">{t("kssai.titel")}</h3>
      </div>

      <p className="mt-1 text-xs text-slate-600">
        {t("kssai.intro")}
      </p>

      <label className="label mt-3">{t("kssai.problemLabel")}</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t("kssai.problemPlatzhalter")}
        className="input mt-1 font-normal leading-relaxed"
      />

      {/* Optional: SDB des aktuell eingesetzten Produkts hochladen — die KI bezieht es ein */}
      <div className="mt-3">
        {!sds ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-purple-300 bg-white px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50">
            {sdsLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {sdsLoading
              ? t("kssai.sdsLaedt")
              : t("kssai.sdsUpload")}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={onSdsFile}
              disabled={sdsLoading}
            />
          </label>
        ) : (
          <div className="rounded-lg border border-purple-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={15} className="shrink-0 text-purple-600" />
                <span className="truncate text-xs font-medium text-slate-700">{sds.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSds(null)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={t("kssai.sdsEntfernen")}
              >
                <X size={14} />
              </button>
            </div>
            {sds.chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {sds.chips.map((c, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CHIP_TONE[c.tone]}`}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-500">
              {t("kssai.sdsHinweis")}
            </p>
          </div>
        )}
        {sdsError && <p className="mt-1 text-xs text-red-600">{sdsError}</p>}
      </div>

      <button
        type="button"
        onClick={analyze}
        disabled={loading}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? t("kssai.analysiere") : t("kssai.analysieren")}
      </button>

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {t("kssai.fehler")} {error}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              {t("kssai.einschaetzung")}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              {result.source === "anthropic-claude" ? t("kssai.kiClaude") : t("kwiz.resHeuristik")}
            </span>
          </div>
          <p className="rounded bg-white/80 p-3 text-sm text-slate-700 ring-1 ring-purple-100">
            {result.summary}
          </p>

          {result.creditNotice && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {result.creditNotice}
            </div>
          )}

          {result.recommendations.length === 0 ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t("kssai.leer")}
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
                  {r.webNote && (
                    <p className="mt-2 flex items-start gap-1.5 rounded bg-purple-50 px-2 py-1 text-[11px] text-purple-900">
                      <Globe size={11} className="mt-0.5 shrink-0 text-purple-600" />
                      <span>
                        <span className="font-semibold">{t("kwiz.webLabel")}</span> {r.webNote}
                      </span>
                    </p>
                  )}
                  {r.sealWarning && (
                    <p className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                      <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>
                        <span className="font-semibold">{t("kwiz.dichtung")}</span> {r.sealWarning}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.recommendations.length > 0 && !result.webSummary && (
            <div>
              {webLoading ? (
                <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-800">
                    <Loader2 size={16} className="animate-spin text-purple-600" />
                    {fill(t("kwiz.webLaeuft"), { s: webSeconds })}
                  </div>
                  <p className="mt-1 text-xs text-purple-700">
                    {fill(t("kwiz.webHint"), { n: result.recommendations.length })}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-purple-100">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-1000"
                      style={{ width: `${Math.min(95, (webSeconds / 40) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={runWebCheck}
                  className="inline-flex items-center gap-1.5 rounded-md border border-purple-300 bg-white px-3 py-1.5 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                >
                  <Globe size={14} />
                  {t("kwiz.webButton")}
                </button>
              )}
              {webError && <p className="mt-1 text-xs text-red-600">{webError}</p>}
            </div>
          )}

          {result.webSummary && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 text-sm text-slate-700">
              <Globe size={14} className="mr-1 inline text-purple-600" />
              <span className="font-semibold">{t("kwiz.webLabel")}</span> {result.webSummary}
            </div>
          )}

          {result.webSources && result.webSources.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1.5 text-xs font-semibold text-slate-600">{t("kwiz.quellen")}</div>
              <ul className="space-y-1.5 text-xs">
                {result.webSources.slice(0, 8).map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 hover:underline"
                    >
                      {s.title}
                    </a>
                    {s.credibility && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${CRED_BADGE[s.credibility].cls}`}
                        title={s.credibilityNote}
                      >
                        {t(CRED_BADGE[s.credibility].labelKey)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
