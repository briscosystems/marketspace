"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Brain, Upload, FileText, X, Globe } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { sdsFlagChips } from "@/lib/sds-summary";

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
  webSummary?: string | null;
  webSources?: WebSource[];
};

const CRED_BADGE: Record<string, { label: string; cls: string }> = {
  hoch: { label: "Glaubwürdigkeit: hoch", cls: "bg-emerald-100 text-emerald-800" },
  mittel: { label: "Glaubwürdigkeit: mittel", cls: "bg-amber-100 text-amber-800" },
  niedrig: { label: "Glaubwürdigkeit: niedrig", cls: "bg-slate-200 text-slate-600" },
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
        setSdsError(data?.error ?? "SDB konnte nicht gelesen werden.");
        return;
      }
      setSds({
        summary: data.summary as string,
        name: file.name,
        chips: sdsFlagChips({ hStatements: data.hStatements, ...data.flags }),
      });
    } catch {
      setSdsError("Upload fehlgeschlagen.");
    } finally {
      setSdsLoading(false);
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

      {/* Optional: SDB des aktuell eingesetzten Produkts hochladen — die KI bezieht es ein */}
      <div className="mt-3">
        {!sds ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-purple-300 bg-white px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50">
            {sdsLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {sdsLoading
              ? "SDB wird gelesen…"
              : "Sicherheitsdatenblatt des aktuellen Produkts (PDF) hochladen — optional"}
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
                aria-label="SDB entfernen"
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
              Die KI berücksichtigt dieses SDB bei der Auswahl der Alternativen.
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
                  {r.webNote && (
                    <p className="mt-2 flex items-start gap-1.5 rounded bg-purple-50 px-2 py-1 text-[11px] text-purple-900">
                      <Globe size={11} className="mt-0.5 shrink-0 text-purple-600" />
                      <span>
                        <span className="font-semibold">Web-Recherche:</span> {r.webNote}
                      </span>
                    </p>
                  )}
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

          {result.webSummary && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 text-sm text-slate-700">
              <Globe size={14} className="mr-1 inline text-purple-600" />
              <span className="font-semibold">Web-Recherche:</span> {result.webSummary}
            </div>
          )}

          {result.webSources && result.webSources.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1.5 text-xs font-semibold text-slate-600">Quellen aus dem Web</div>
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
                        {CRED_BADGE[s.credibility].label}
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
