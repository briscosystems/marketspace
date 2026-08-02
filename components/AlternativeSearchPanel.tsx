"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Globe,
  CheckCircle2,
  BookOpen,
  Loader2,
  ArrowLeftRight,
  RotateCcw,
  ChevronRight,
  X,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { PRODUCT_CATEGORY_LABEL, categoryLabel } from "@/lib/product-categories";

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
  creditNotice?: string | null;
  creditsCharged?: number;
  reasoning?: string;
  webSources?: { title: string; url: string; credibility?: "hoch" | "mittel" | "niedrig"; credibilityNote?: string }[];
  webSummary?: string;
};

const ALT_CRED_BADGE: Record<string, { label: string; cls: string }> = {
  hoch: { label: "Glaubwürdigkeit: hoch", cls: "bg-emerald-100 text-emerald-800" },
  mittel: { label: "Glaubwürdigkeit: mittel", cls: "bg-amber-100 text-amber-800" },
  niedrig: { label: "Glaubwürdigkeit: niedrig", cls: "bg-slate-200 text-slate-600" },
};

const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralöl",
  SYNTHETIC: "Vollsynthetisch",
  SEMI_SYNTHETIC: "Semi-synthetisch",
  ESTER: "Ester",
  PAG: "PAG",
  GTL: "GTL (Gas-to-Liquid)",
  OTHER: "Andere",
};
const FIT_BADGE: Record<AltMatch["fit"], { label: string; cls: string }> = {
  excellent: { label: "Sehr gut", cls: "bg-emerald-100 text-emerald-800" },
  good: { label: "Gut", cls: "bg-emerald-100 text-emerald-800" },
  fair: { label: "Bedingt", cls: "bg-amber-100 text-amber-800" },
  weak: { label: "Schwach", cls: "bg-slate-100 text-slate-600" },
};

export function AlternativeSearchPanel({ initialQuery }: { initialQuery?: string }) {
  // Mit vorbefülltem Produkt (z.B. Knopf "Alternative finden" auf der
  // Produktseite) startet das Panel sofort geöffnet und sucht los.
  const [enabled, setEnabled] = useState(!!initialQuery);
  const [mode, setMode] = useState<"product" | "requirements">("product");

  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState("");
  const [chemistry, setChemistry] = useState("");
  const [isoViscosity, setIsoViscosity] = useState("");
  const [applicationArea, setApplicationArea] = useState("");

  const [result, setResult] = useState<AltResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [webLoading, setWebLoading] = useState(false);
  const [selected, setSelected] = useState<AltMatch | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ESC schließt das Detail-Panel
  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

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
        const res = await fetch(withBasePath("/api/listings/alternatives-search"), {
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
      const res = await fetch(withBasePath("/api/listings/alternatives-search"), {
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
    <div id="alternativen" className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
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
                  {Object.entries(PRODUCT_CATEGORY_LABEL).map(([v, l]) => (
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
                Im Web nach Erfahrungen suchen · 2 Credits
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
              {result.creditNotice && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {result.creditNotice}
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

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {result.alternatives.map((a, i) => (
                  <AltRow key={a.productId} alt={a} rank={i + 1} onOpen={() => setSelected(a)} />
                ))}
              </div>
              {result.alternatives.length > 0 && (
                <p className="text-xs text-slate-500">
                  Zeile anklicken für Details — das Panel öffnet sich rechts.
                </p>
              )}

              {result.webSources && result.webSources.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-1 text-xs font-semibold text-slate-600">Quellen aus dem Web</div>
                  <ul className="space-y-1.5 text-xs">
                    {result.webSources.slice(0, 8).map((s, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-1.5">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:underline">
                          {s.title}
                        </a>
                        {s.credibility && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ALT_CRED_BADGE[s.credibility].cls}`}
                            title={s.credibilityNote}
                          >
                            {ALT_CRED_BADGE[s.credibility].label}
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
      )}

      {selected && <AltDetailSlideOver alt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/** Match-Index als Prozentzahl mit Farbbalken (Score ist additiv, für die Anzeige gedeckelt) */
function matchTone(score: number): { text: string; bar: string } {
  if (score >= 60) return { text: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 40) return { text: "text-lime-700", bar: "bg-lime-500" };
  if (score >= 20) return { text: "text-amber-700", bar: "bg-amber-500" };
  return { text: "text-red-700", bar: "bg-red-500" };
}
function MatchMeter({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const pct = Math.max(0, Math.min(100, score));
  const tone = matchTone(pct);
  return (
    <div className={size === "lg" ? "w-full" : "w-20 shrink-0"}>
      <div className={`font-bold ${tone.text} ${size === "lg" ? "text-3xl" : "text-sm"}`}>{pct}%</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Kompakte Ergebnis-Zeile — Klick öffnet das Detail-Panel rechts */
function AltRow({ alt, rank, onOpen }: { alt: AltMatch; rank: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 border-b border-slate-100 p-3 text-left transition last:border-0 hover:bg-slate-50"
    >
      <span className="hidden w-5 shrink-0 text-center text-xs font-bold text-slate-400 sm:block">{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{alt.manufacturer} {alt.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${FIT_BADGE[alt.fit].cls}`}>
            {FIT_BADGE[alt.fit].label}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            {alt.chemistry ? CHEMISTRY_LABEL[alt.chemistry] ?? alt.chemistry : ""}
            {alt.viscosityIso ? ` · ISO VG ${alt.viscosityIso}` : ""}
          </span>
          {alt.availability.available ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
              <CheckCircle2 size={10} /> Angebot verfügbar
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              <BookOpen size={10} /> nur im Katalog
            </span>
          )}
        </div>
      </div>
      <MatchMeter score={alt.score} />
      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  );
}

/** Detail-Panel — schiebt sich von rechts über die Seite */
function AltDetailSlideOver({ alt, onClose }: { alt: AltMatch; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-[altSlideIn_.25s_ease-out] flex-col overflow-y-auto bg-white shadow-lift">
        <style>{`@keyframes altSlideIn { from { transform: translateX(100%);} to { transform: translateX(0);} }`}</style>

        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-500">Alternative im Detail</div>
              <h3 className="mt-0.5 truncate text-lg font-bold text-slate-900">
                {alt.manufacturer} {alt.name}
              </h3>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${FIT_BADGE[alt.fit].cls}`}>
                {FIT_BADGE[alt.fit].label}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Schließen"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Match-Index</div>
            <MatchMeter score={alt.score} size="lg" />
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Produkt-Daten</div>
            <dl className="space-y-1.5 text-sm">
              <DetailRow label="Hersteller" value={alt.manufacturer} />
              {alt.category && <DetailRow label="Kategorie" value={categoryLabel(alt.category)} />}
              {alt.chemistry && <DetailRow label="Chemie" value={CHEMISTRY_LABEL[alt.chemistry] ?? alt.chemistry} />}
              {alt.viscosityIso && <DetailRow label="Viskosität" value={`ISO VG ${alt.viscosityIso}`} />}
              <DetailRow
                label="Verfügbarkeit"
                value={
                  alt.availability.available
                    ? `Angebot vorhanden${
                        typeof alt.availability.priceEur === "number" ? ` · ${alt.availability.priceEur.toFixed(2)} €` : ""
                      }${
                        alt.availability.quantity
                          ? ` · ${alt.availability.quantity.toLocaleString("de-CH")} ${alt.availability.quantityUnit ?? ""}`
                          : ""
                      }`
                    : "nur im Katalog, aktuell kein Angebot"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <ThumbsUp size={14} /> Spricht dafür
              </div>
              {alt.pros.length === 0 ? (
                <div className="text-sm italic text-slate-400">—</div>
              ) : (
                <ul className="space-y-1 text-sm text-slate-700">
                  {alt.pros.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
                <ThumbsDown size={14} /> Risiken / Abweichungen
              </div>
              {alt.cons.length === 0 ? (
                <div className="text-sm italic text-slate-400">—</div>
              ) : (
                <ul className="space-y-1 text-sm text-slate-700">
                  {alt.cons.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              )}
            </div>
            {alt.warnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <ul className="space-y-1">
                  {alt.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-slate-200 bg-white p-4">
          <Link href={`/products/${alt.manufacturerSlug}/${alt.slug}`} className="btn-primary flex-1 text-center">
            Zum Produkt
          </Link>
          {alt.availability.available && (
            <Link
              href={`/listings/${alt.availability.listingId}`}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Zum Angebot
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
