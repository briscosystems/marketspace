"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Globe, CheckCircle2, BookOpen, Loader2, ArrowLeftRight, RotateCcw } from "lucide-react";

type Availability = {
  available: boolean;
  listingId?: string;
  priceEur?: number | null;
  quantity?: number;
  quantityUnit?: string;
};
type AltMatch = {
  productId: string;
  name: string;
  manufacturer: string;
  category: string | null;
  chemistry: string | null;
  viscosityIso: string | null;
  slug: string;
  manufacturerSlug: string;
  score: number;
  fit: "excellent" | "good" | "fair" | "weak";
  pros: string[];
  cons: string[];
  warnings: string[];
  availability: Availability;
};
type AltResult = {
  source: { name: string; manufacturer: string | null } | null;
  alternatives: AltMatch[];
  candidatesConsidered: number;
  modelUsed: "rule-based" | "claude-web";
  reasoning?: string;
  webSources?: { title: string; url: string }[];
  webSummary?: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  COOLANT_WATER_MIX: "KSS wassermischbar",
  COOLANT_NEAT: "Schneidöl (nicht wassermischbar)",
  GRINDING_OIL: "Schleiföl",
  EDM_FLUID: "Erodieröl",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  COMPRESSOR_OIL: "Kompressorenöl",
  SLIDEWAY_OIL: "Bettbahnöl",
  FORMING_OIL: "Umformöl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  SPECIALTY: "Spezialschmierstoff",
  ADDITIVE: "Additiv",
  OTHER: "Andere",
};
const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralöl",
  SYNTHETIC: "Vollsynthetisch",
  SEMI_SYNTHETIC: "Semi-synthetisch",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Andere",
};
const FIT_BADGE: Record<AltMatch["fit"], { label: string; cls: string }> = {
  excellent: { label: "Sehr gut", cls: "bg-emerald-100 text-emerald-800" },
  good: { label: "Gut", cls: "bg-emerald-100 text-emerald-800" },
  fair: { label: "Bedingt", cls: "bg-amber-100 text-amber-800" },
  weak: { label: "Schwach", cls: "bg-slate-100 text-slate-600" },
};

export function AlternativeSearchPanel() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"product" | "requirements">("product");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [chemistry, setChemistry] = useState("");
  const [isoViscosity, setIsoViscosity] = useState("");
  const [applicationArea, setApplicationArea] = useState("");

  const [result, setResult] = useState<AltResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [webLoading, setWebLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildBody = useCallback(
    (useWeb: boolean) => ({
      mode,
      query: query.trim() || undefined,
      category: mode === "requirements" ? category || undefined : undefined,
      chemistry: mode === "requirements" ? chemistry || undefined : undefined,
      isoViscosity: mode === "requirements" ? isoViscosity.trim() || undefined : undefined,
      applicationArea: mode === "requirements" ? applicationArea.trim() || undefined : undefined,
      useWeb,
    }),
    [mode, query, category, chemistry, isoViscosity, applicationArea],
  );

  const hasInput =
    !!query.trim() ||
    (mode === "requirements" &&
      (!!category || !!chemistry || !!isoViscosity.trim() || !!applicationArea.trim()));

  // Echtzeit: regelbasierte Sofortsuche, sobald sich Eingaben ändern (entprellt).
  useEffect(() => {
    if (!enabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!hasInput) {
      setResult(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/listings/alternatives-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(false)),
        });
        setResult(await res.json());
      } catch {
        /* still gives previous result */
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, hasInput, buildBody]);

  function resetAll() {
    setQuery("");
    setCategory("");
    setChemistry("");
    setIsoViscosity("");
    setApplicationArea("");
    setResult(null);
  }

  async function runWebSearch() {
    if (!hasInput) return;
    setWebLoading(true);
    try {
      const res = await fetch("/api/listings/alternatives-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(true)),
      });
      setResult(await res.json());
    } catch {
      /* keep previous */
    } finally {
      setWebLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
      <button
        type="button"
        onClick={() => setEnabled((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-purple-600" />
          <span className="font-semibold text-slate-900">Ich suche ein Alternativprodukt</span>
        </span>
        <span
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-purple-600" : "bg-slate-300"
          }`}
          aria-hidden
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      {enabled && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600">
            Gib ein vorhandenes Produkt ein <strong>oder</strong> beschreibe deine technischen
            Anforderungen — die Treffer erscheinen sofort. Für reale Erfahrungen aus dem Internet
            den Web-Knopf nutzen.
          </p>

          {/* Modus-Umschalter */}
          <div className="inline-flex overflow-hidden rounded-md ring-1 ring-purple-200">
            <button
              type="button"
              onClick={() => setMode("product")}
              className={`px-3 py-1.5 text-sm font-medium ${
                mode === "product" ? "bg-purple-600 text-white" : "bg-white text-slate-600"
              }`}
            >
              Vorhandenes Produkt
            </button>
            <button
              type="button"
              onClick={() => setMode("requirements")}
              className={`px-3 py-1.5 text-sm font-medium ${
                mode === "requirements" ? "bg-purple-600 text-white" : "bg-white text-slate-600"
              }`}
            >
              Nach Anforderungen
            </button>
          </div>

          {mode === "product" ? (
            <div>
              <label className="label">Produktname</label>
              <input
                className="input"
                placeholder="z.B. Blasocut 2000, Hysol MB 50, Tellus S2 M 46"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Produktart</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">— beliebig —</option>
                  {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Chemie-Basis</label>
                <select className="input" value={chemistry} onChange={(e) => setChemistry(e.target.value)}>
                  <option value="">— beliebig —</option>
                  {Object.entries(CHEMISTRY_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">ISO VG (Viskosität)</label>
                <input className="input" placeholder="46" value={isoViscosity} onChange={(e) => setIsoViscosity(e.target.value)} />
              </div>
              <div>
                <label className="label">Anwendung</label>
                <input className="input" placeholder="Fräsen, Hydraulik, Schleifen …" value={applicationArea} onChange={(e) => setApplicationArea(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Freitext (optional)</label>
                <input className="input" placeholder="z.B. borfrei, für Buntmetall, geringe Schaumbildung" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
          )}

          {hasInput && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runWebSearch}
                disabled={webLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {webLoading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                Im Web nach Erfahrungen suchen
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw size={14} /> Felder zurücksetzen
              </button>
              {loading && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin" /> sucht …
                </span>
              )}
              {result && result.modelUsed === "claude-web" && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700">
                  <Sparkles size={13} /> mit Web-Recherche
                </span>
              )}
            </div>
          )}

          {/* Ergebnisse */}
          {result && (
            <div className="space-y-3">
              {result.source && (
                <p className="text-xs text-slate-600">
                  Alternativen zu <strong>{result.source.manufacturer} {result.source.name}</strong>:
                </p>
              )}
              {result.webSummary && (
                <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 text-sm text-slate-700">
                  <Sparkles size={14} className="mr-1 inline text-purple-600" />
                  {result.webSummary}
                </div>
              )}

              {hasInput && result.alternatives.length === 0 && !loading && !result.webSummary && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">
                  {mode === "product" ? (
                    <>
                      <p className="text-slate-700">„{query}" ist nicht im Katalog.</p>
                      <p className="mt-1">
                        Tipp: <strong>„Im Web nach Erfahrungen suchen"</strong> lässt die KI das
                        Produkt einordnen und Alternativen finden, oder wechsle auf{" "}
                        <button
                          type="button"
                          onClick={() => setMode("requirements")}
                          className="font-medium text-purple-700 hover:underline"
                        >
                          „Nach Anforderungen"
                        </button>
                        .
                      </p>
                    </>
                  ) : (
                    result.reasoning ?? "Keine passenden Alternativen gefunden — Anforderungen anpassen."
                  )}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {result.alternatives.map((a) => (
                  <div key={a.productId} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${a.manufacturerSlug}/${a.slug}`}
                          className="font-semibold text-slate-900 hover:text-purple-700"
                        >
                          {a.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {a.manufacturer}
                          {a.chemistry ? ` · ${CHEMISTRY_LABEL[a.chemistry] ?? a.chemistry}` : ""}
                          {a.viscosityIso ? ` · ISO VG ${a.viscosityIso}` : ""}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${FIT_BADGE[a.fit].cls}`}>
                        {FIT_BADGE[a.fit].label}
                      </span>
                    </div>

                    <div className="mt-2">
                      {a.availability.available ? (
                        <Link
                          href={`/listings/${a.availability.listingId}`}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 hover:bg-blue-200"
                        >
                          <CheckCircle2 size={12} /> Jetzt als Angebot verfügbar
                          {typeof a.availability.priceEur === "number" ? ` · ${a.availability.priceEur.toFixed(0)} €` : ""}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          <BookOpen size={12} /> nur im Katalog (aktuell kein Angebot)
                        </span>
                      )}
                    </div>

                    {(a.pros.length > 0 || a.cons.length > 0 || a.warnings.length > 0) && (
                      <ul className="mt-2 space-y-0.5 text-xs">
                        {a.pros.slice(0, 4).map((p, i) => (
                          <li key={`p${i}`} className="text-emerald-700">+ {p}</li>
                        ))}
                        {a.cons.slice(0, 3).map((c, i) => (
                          <li key={`c${i}`} className="text-slate-500">– {c}</li>
                        ))}
                        {a.warnings.slice(0, 2).map((w, i) => (
                          <li key={`w${i}`} className="text-amber-700">⚠ {w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {result.webSources && result.webSources.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-1 text-xs font-semibold text-slate-600">Quellen aus dem Web</div>
                  <ul className="space-y-0.5 text-xs">
                    {result.webSources.slice(0, 8).map((s, i) => (
                      <li key={i}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:underline">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
