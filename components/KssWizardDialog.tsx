"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Mic, MicOff, Sparkles, ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertTriangle, Globe } from "lucide-react";
import {
  APPLICATION_AREAS,
  MATERIALS,
  CRITICAL_ISSUES,
  CERTIFICATIONS,
  PRODUCTION_TYPES,
  COOLANT_FORMS,
} from "@/lib/kss-knowledge";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

type ProductLite = { id: string; name: string; manufacturer: string };

type WizardState = {
  satisfied: boolean | null;
  currentProductId: string | null;
  problemDescription: string;
  applicationAreas: string[];
  materials: string[];
  productionType: string | null;
  concentrateForm: string | null;
  criticalIssues: string[];
  certifications: string[];
  waterHardness: number | null;
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
  sponsored?: boolean;
};

type WizardWebSource = {
  title: string;
  url: string;
  credibility?: "hoch" | "mittel" | "niedrig";
  credibilityNote?: string;
};

const WIZARD_CRED_BADGE: Record<string, { labelKey: string; cls: string }> = {
  hoch: { labelKey: "kwiz.credHoch", cls: "bg-emerald-100 text-emerald-800" },
  mittel: { labelKey: "kwiz.credMittel", cls: "bg-amber-100 text-amber-800" },
  niedrig: { labelKey: "kwiz.credNiedrig", cls: "bg-slate-200 text-slate-600" },
};

const TOTAL_STEPS = 6;

export function KssWizardDialog({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    recommendations: Recommendation[];
    summary: string;
    source: string;
    creditNotice?: string | null;
    webSummary?: string | null;
    webSources?: WizardWebSource[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    satisfied: null,
    currentProductId: null,
    problemDescription: "",
    applicationAreas: [],
    materials: [],
    productionType: null,
    concentrateForm: null,
    criticalIssues: [],
    certifications: [],
    waterHardness: null,
  });

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleArr(key: "applicationAreas" | "materials" | "criticalIssues" | "certifications", v: string) {
    setState((s) => {
      const set = new Set(s[key]);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      return { ...s, [key]: [...set] };
    });
  }

  async function submitWizard() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(withBasePath("/api/kss-wizard"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);

  /** Web-Prüfung auf Knopfdruck (Sonnet + Websuche, kostet Credits). */
  async function runWebCheck() {
    if (!result || result.recommendations.length === 0) return;
    setWebLoading(true);
    setWebError(null);
    try {
      const resp = await fetch(withBasePath("/api/kss-wizard/web-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: state.problemDescription || undefined,
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

  // ESC-Taste schliesst Dialog
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h2 className="section-title">{t("kwiz.titel")}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        {!result && (
          <div className="px-5 pt-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-purple-600" : "bg-slate-200"}`}
                />
              ))}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {fill(t("kwiz.schritt"), { s: step, n: TOTAL_STEPS })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">
          {result ? (
            <ResultView
              result={result}
              onClose={onClose}
              onWebCheck={runWebCheck}
              webLoading={webLoading}
              webError={webError}
            />
          ) : (
            <>
              {step === 1 && (
                <Step1Satisfaction
                  state={state}
                  update={update}
                  onCurrentProductSelect={(id) => update("currentProductId", id)}
                />
              )}
              {step === 2 && (
                <Step2Problem
                  value={state.problemDescription}
                  onChange={(v) => update("problemDescription", v)}
                />
              )}
              {step === 3 && (
                <Step3MultiChoice
                  title={t("kwiz.s3Titel")}
                  hint={t("kwiz.s3Hint")}
                  options={[...APPLICATION_AREAS]}
                  selected={state.applicationAreas}
                  onToggle={(v) => toggleArr("applicationAreas", v)}
                />
              )}
              {step === 4 && (
                <Step3MultiChoice
                  title={t("kwiz.s4Titel")}
                  hint={t("kwiz.s4Hint")}
                  options={[...MATERIALS]}
                  selected={state.materials}
                  onToggle={(v) => toggleArr("materials", v)}
                />
              )}
              {step === 5 && (
                <Step5Form state={state} update={update} />
              )}
              {step === 6 && (
                <Step6Issues
                  state={state}
                  update={update}
                  toggleArr={toggleArr}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || loading}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> {t("kwiz.zurueck")}
            </button>
            {error && <div className="text-xs text-red-600">{error}</div>}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                {t("kwiz.weiter")} <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitWizard}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? t("kwiz.sucheLaeuft") : t("kwiz.holen")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function Step1Satisfaction({
  state,
  update,
  onCurrentProductSelect,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onCurrentProductSelect: (id: string | null) => void;
}) {
  const { t } = useLocale();
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<ProductLite[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    if (searchQ.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const resp = await fetch(withBasePath(`/api/kss-wizard/search?q=${encodeURIComponent(searchQ)}`), { signal: ctrl.signal });
        if (!resp.ok) return;
        const data = await resp.json();
        setResults(data.products ?? []);
      } catch {
        // ignore
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [searchQ]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s1Frage")}</h3>
        <p className="text-sm text-slate-500">{t("kwiz.s1Hint")}</p>
        <div className="mt-3 flex gap-2">
          <SatBtn label={t("kwiz.s1Ja")} selected={state.satisfied === true} onClick={() => update("satisfied", true)} />
          <SatBtn label={t("kwiz.s1Nein")} selected={state.satisfied === false} onClick={() => update("satisfied", false)} />
          <SatBtn label={t("kwiz.s1Neu")} selected={state.satisfied === null} onClick={() => update("satisfied", null)} />
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s1Aktuell")}</h3>
        <p className="text-sm text-slate-500">
          {t("kwiz.s1AktuellHint")}
        </p>
        <input
          type="text"
          value={selectedName ?? searchQ}
          onChange={(e) => {
            setSelectedName(null);
            setSearchQ(e.target.value);
            onCurrentProductSelect(null);
          }}
          placeholder={t("kwiz.s1Platzhalter")}
          className="input mt-2"
        />
        {!selectedName && results.length > 0 && (
          <div className="mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white shadow-sm">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedName(`${p.manufacturer} · ${p.name}`);
                  setSearchQ("");
                  setResults([]);
                  onCurrentProductSelect(p.id);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{p.name}</span>{" "}
                <span className="text-slate-500">— {p.manufacturer}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SatBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
        selected ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function Step2Problem({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLocale();
  const [listening, setListening] = useState(false);
  // SpeechRecognition ist Browser-API ohne Standard-TS-Typ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function toggleMic() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert(t("kwiz.s2KeinMikro"));
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "de-DE";
    r.continuous = true;
    r.interimResults = true;
    let finalText = value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalText += " " + res[0].transcript;
        else interim += res[0].transcript;
      }
      onChange((finalText + " " + interim).trim());
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s2Frage")}</h3>
        <p className="text-sm text-slate-500">
          {t("kwiz.s2Hint")}
        </p>
      </div>
      <div className="relative">
        <textarea
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("kwiz.s2Platzhalter")}
          className="input pr-12 font-normal leading-relaxed"
        />
        <button
          type="button"
          onClick={toggleMic}
          className={`absolute right-2 top-2 inline-flex items-center justify-center rounded-full p-2 ${
            listening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          title={listening ? t("kwiz.s2MikroStop") : t("kwiz.s2MikroStart")}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        {t("kwiz.s2Tipp")}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function Step3MultiChoice({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-slate-500">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isSelected = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                isSelected
                  ? "border-purple-500 bg-purple-500 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isSelected && "✓ "}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function Step5Form({ state, update }: { state: WizardState; update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void }) {
  const { t } = useLocale();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s5Prod")}</h3>
        <p className="text-sm text-slate-500">{t("kwiz.s5ProdHint")}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PRODUCTION_TYPES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update("productionType", state.productionType === p.value ? null : p.value)}
              className={`rounded-lg border p-2 text-left ${
                state.productionType === p.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-medium text-slate-900">{p.label}</div>
              <div className="text-xs text-slate-500">{p.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s5Form")}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {COOLANT_FORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update("concentrateForm", state.concentrateForm === p.value ? null : p.value)}
              className={`rounded-lg border p-2 text-left ${
                state.concentrateForm === p.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-medium text-slate-900">{p.label}</div>
              <div className="text-xs text-slate-500">{p.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">{t("kwiz.s5Wasser")}</label>
        <input
          type="number"
          value={state.waterHardness ?? ""}
          onChange={(e) => update("waterHardness", e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder={t("kwiz.s5WasserPlatzhalter")}
          className="input mt-1"
          min={0}
          max={50}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function Step6Issues({
  state,
  toggleArr,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  toggleArr: (k: "applicationAreas" | "materials" | "criticalIssues" | "certifications", v: string) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s6Titel")}</h3>
        <p className="text-sm text-slate-500">{t("kwiz.s6Hint")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CRITICAL_ISSUES.map((c) => {
            const sel = state.criticalIssues.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleArr("criticalIssues", c)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  sel ? "border-red-500 bg-red-50 text-red-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {sel && "✓ "}
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold">{t("kwiz.s6Zert")}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CERTIFICATIONS.map((c) => {
            const sel = state.certifications.includes(c.label);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleArr("certifications", c.label)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  sel ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {sel && "✓ "}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function ResultView({
  result,
  onClose,
  onWebCheck,
  webLoading,
  webError,
}: {
  result: {
    recommendations: Recommendation[];
    summary: string;
    source: string;
    creditNotice?: string | null;
    webSummary?: string | null;
    webSources?: WizardWebSource[];
  };
  onClose: () => void;
  onWebCheck: () => void;
  webLoading: boolean;
  webError: string | null;
}) {
  const { t } = useLocale();
  // Sekundenzähler während der Web-Recherche — zeigt sichtbar, dass sie läuft.
  const [webSeconds, setWebSeconds] = useState(0);
  useEffect(() => {
    if (!webLoading) return;
    setWebSeconds(0);
    const id = setInterval(() => setWebSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [webLoading]);
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold">{fill(t("kwiz.resTitel"), { n: result.recommendations.length })}</h3>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {result.source === "anthropic-claude" ? t("kwiz.resKi") : t("kwiz.resHeuristik")}
        </span>
      </div>
      <p className="rounded bg-slate-50 p-3 text-sm text-slate-700">{result.summary}</p>

      {result.creditNotice && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {result.creditNotice}
        </div>
      )}

      {result.recommendations.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t("kwiz.resLeer")}
        </div>
      ) : (
        <div className="space-y-3">
          {result.recommendations.map((r, i) => (
            <div key={r.productId} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
                    #{i + 1} · {r.manufacturer}
                    {r.sponsored && (
                      <span
                        className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-brand-700"
                        title={t("kwiz.gesponsertTitle")}
                      >
                        {t("kwiz.gesponsert")}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/products/${r.manufacturerSlug}/${r.productSlug}`}
                    className="text-base font-semibold text-slate-900 hover:text-brand-600"
                    onClick={onClose}
                  >
                    {r.productName}
                  </Link>
                </div>
                <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  {r.matchScore}/100
                </span>
              </div>
              <p className="mt-2 flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                {r.reason}
              </p>
              {r.webNote && (
                <p className="mt-2 flex items-start gap-2 rounded bg-purple-50 px-2 py-1 text-xs text-purple-900">
                  <Globe size={12} className="mt-0.5 shrink-0 text-purple-600" />
                  <span>
                    <span className="font-semibold">{t("kwiz.webLabel")}</span> {r.webNote}
                  </span>
                </p>
              )}
              {r.sealWarning && (
                <p className="mt-2 flex items-start gap-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-600" />
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
              onClick={onWebCheck}
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
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:underline">
                  {s.title}
                </a>
                {s.credibility && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${WIZARD_CRED_BADGE[s.credibility].cls}`}
                    title={s.credibilityNote}
                  >
                    {t(WIZARD_CRED_BADGE[s.credibility].labelKey)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-slate-200 pt-3">
        <button
          onClick={onClose}
          className="w-full rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          {t("kwiz.schliessen")}
        </button>
      </div>
    </div>
  );
}

// SpeechRecognition wird zur Laufzeit via window.SpeechRecognition / webkitSpeechRecognition
// erkannt — kein Typ-Import nötig (siehe toggleMic mit `any`-Cast).
