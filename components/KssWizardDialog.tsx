"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Mic, MicOff, Sparkles, ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  APPLICATION_AREAS,
  MATERIALS,
  CRITICAL_ISSUES,
  CERTIFICATIONS,
  PRODUCTION_TYPES,
  COOLANT_FORMS,
} from "@/lib/kss-knowledge";

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
};

const TOTAL_STEPS = 6;

export function KssWizardDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    recommendations: Recommendation[];
    summary: string;
    source: string;
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
      const resp = await fetch("/api/kss-wizard", {
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
            <h2 className="text-lg font-semibold">KSS-Berater (KI-Wizard)</h2>
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
              Schritt {step} von {TOTAL_STEPS}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">
          {result ? (
            <ResultView result={result} onClose={onClose} />
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
                  title="Bearbeitungsverfahren"
                  hint="Was wird auf der Maschine gemacht? (Mehrfachauswahl)"
                  options={[...APPLICATION_AREAS]}
                  selected={state.applicationAreas}
                  onToggle={(v) => toggleArr("applicationAreas", v)}
                />
              )}
              {step === 4 && (
                <Step3MultiChoice
                  title="Werkstoffe"
                  hint="Welche Materialien werden bearbeitet?"
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
              <ChevronLeft size={14} /> Zurück
            </button>
            {error && <div className="text-xs text-rose-600">{error}</div>}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Weiter <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitWizard}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Suche läuft..." : "KI-Empfehlung holen"}
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
        const resp = await fetch(`/api/kss-wizard/search?q=${encodeURIComponent(searchQ)}`, { signal: ctrl.signal });
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
        <h3 className="text-base font-semibold">Bist du mit deinem aktuellen KSS zufrieden?</h3>
        <p className="text-sm text-slate-500">Hilft mir die Empfehlung zu schärfen.</p>
        <div className="mt-3 flex gap-2">
          <SatBtn label="Ja, voll" selected={state.satisfied === true} onClick={() => update("satisfied", true)} />
          <SatBtn label="Eher nein" selected={state.satisfied === false} onClick={() => update("satisfied", false)} />
          <SatBtn label="Suche neu" selected={state.satisfied === null} onClick={() => update("satisfied", null)} />
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold">Aktuell verwendeter KSS (optional)</h3>
        <p className="text-sm text-slate-500">
          So kann ich Alternative vorschlagen statt dasselbe Produkt.
        </p>
        <input
          type="text"
          value={selectedName ?? searchQ}
          onChange={(e) => {
            setSelectedName(null);
            setSearchQ(e.target.value);
            onCurrentProductSelect(null);
          }}
          placeholder="z.B. Hocut, Cimstar, Blasocut, …"
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
  const [listening, setListening] = useState(false);
  // SpeechRecognition ist Browser-API ohne Standard-TS-Typ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function toggleMic() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert("Sprach-Erkennung im Browser nicht verfügbar (am besten Chrome/Edge).");
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
        <h3 className="text-base font-semibold">Was ist das Problem? Oder: was suchst du?</h3>
        <p className="text-sm text-slate-500">
          Beschreibe in eigenen Worten oder per Mikrofon (Chrome/Edge). Beispiele: „Riecht nach
          2 Wochen schon faulig", „Brauche etwas für Inconel-Bearbeitung", „Bediener bekommen
          Hautausschlag".
        </p>
      </div>
      <div className="relative">
        <textarea
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Frei sprechen oder tippen…"
          className="input pr-12 font-normal leading-relaxed"
        />
        <button
          type="button"
          onClick={toggleMic}
          className={`absolute right-2 top-2 inline-flex items-center justify-center rounded-full p-2 ${
            listening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          title={listening ? "Aufnahme stoppen" : "Sprach-Eingabe starten"}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Tipp: Je konkreter du beschreibst, desto besser kann die KI Alternativen vorschlagen.
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
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Produktionsart</h3>
        <p className="text-sm text-slate-500">Lohnfertigung braucht universellere Produkte.</p>
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
        <h3 className="text-base font-semibold">Bevorzugte KSS-Form</h3>
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
        <label className="text-sm font-medium text-slate-700">Wasserhärte am Standort (°dH, optional)</label>
        <input
          type="number"
          value={state.waterHardness ?? ""}
          onChange={(e) => update("waterHardness", e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder="z.B. 14"
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
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Kritische Punkte / Anforderungen</h3>
        <p className="text-sm text-slate-500">Was muss der neue KSS besser machen?</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CRITICAL_ISSUES.map((c) => {
            const sel = state.criticalIssues.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleArr("criticalIssues", c)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  sel ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
        <h3 className="text-base font-semibold">Erforderliche Zertifizierungen</h3>
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
}: {
  result: { recommendations: Recommendation[]; summary: string; source: string };
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold">Empfehlungen ({result.recommendations.length})</h3>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {result.source === "anthropic-claude" ? "KI-Begründung (Claude)" : "Heuristik"}
        </span>
      </div>
      <p className="rounded bg-slate-50 p-3 text-sm text-slate-700">{result.summary}</p>

      {result.recommendations.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Keine passenden KSS gefunden. Filter weiter aufmachen oder Wizard nochmal mit weniger
          Einschränkungen starten.
        </div>
      ) : (
        <div className="space-y-3">
          {result.recommendations.map((r, i) => (
            <div key={r.productId} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    #{i + 1} · {r.manufacturer}
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
              {r.sealWarning && (
                <p className="mt-2 flex items-start gap-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    <span className="font-semibold">Dichtungs-Hinweis:</span> {r.sealWarning}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 pt-3">
        <button
          onClick={onClose}
          className="w-full rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}

// SpeechRecognition wird zur Laufzeit via window.SpeechRecognition / webkitSpeechRecognition
// erkannt — kein Typ-Import nötig (siehe toggleMic mit `any`-Cast).
