"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bot,
  X,
  ChevronRight,
  Coins,
} from "lucide-react";
import { brandColors, readableOnLight } from "@/lib/branding";
import { KssIssueSelect } from "@/components/KssIssueSelect";
import { CertInput } from "@/components/CertInput";
import type { KssIssueId } from "@/lib/kss-issues";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

type AlternativeRanking = {
  listingId: string;
  /** Match-Index 0–100 % */
  score: number;
  fit: "excellent" | "good" | "fair" | "weak";
  /** Ein-Satz-Begründung */
  summary: string;
  pros: string[];
  cons: string[];
  warnings: string[];
};

type CreditInfo = {
  charged: number;
  balance: number | null;
  notice: string | null;
};

type Alternative = AlternativeRanking & {
  listing?: {
    id: string;
    manufacturer: string;
    productName: string;
    productType: string;
    chemistry: string;
    isoViscosity: string | null;
    applicationArea: string;
    packaging: string;
    quantity: number;
    quantityUnit: string;
    priceEur: number | null;
    locationRegion: string;
    certificates: string[];
    seller: { pseudonym: string };
  };
};

type ApiResponse = {
  source: { id: string; manufacturer: string; productName: string };
  candidatesConsidered: number;
  alternatives: AlternativeRanking[];
  modelUsed: "claude" | "rule-based";
  reasoning?: string;
  credits?: CreditInfo;
};

const fitStyles: Record<
  AlternativeRanking["fit"],
  { label: string; classes: string }
> = {
  excellent: {
    label: "alt.fit.excellent",
    classes: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  },
  good: { label: "alt.fit.good", classes: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  fair: { label: "alt.fit.fair", classes: "bg-amber-100 text-amber-800 ring-amber-300" },
  weak: { label: "alt.fit.weak", classes: "bg-red-100 text-red-800 ring-red-300" },
};

export function AlternativesClient(props: {
  sourceId: string;
  sourceManufacturer: string;
  sourceProductName: string;
  sourceProductType: string;
  sourceChemistry: string;
  sourceIsoViscosity: string | null;
  sourceApplicationArea: string;
  sourcePackaging: string;
  sourceCertificates: string[];
}) {
  const { t } = useLocale();
  const [criteria, setCriteria] = useState({
    sameProductType: true,
    sameChemistry: true,
    sameViscosity: !!props.sourceIsoViscosity,
    sameApplicationArea: false,
    samePackaging: false,
  });
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [avoidIssues, setAvoidIssues] = useState<KssIssueId[]>([]);
  const [workpieceMaterial, setWorkpieceMaterial] = useState("");
  const [minAutomationScore, setMinAutomationScore] = useState<number>(0);
  const [requireGlycolFree, setRequireGlycolFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [enriched, setEnriched] = useState<Alternative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Alternative | null>(null);

  // ESC schließt das Detail-Panel
  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  async function search() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(withBasePath(`/api/listings/${props.sourceId}/alternatives`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...criteria,
          requiredCertifications: requiredCerts,
          avoidIssues,
          workpieceMaterial: workpieceMaterial || undefined,
          minAutomationScore: minAutomationScore > 0 ? minAutomationScore : undefined,
          requireGlycolFree,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ApiResponse;
      setResult(data);

      if (data.alternatives.length > 0) {
        const ids = data.alternatives.map((a) => a.listingId);
        const lookup = await fetch(
          withBasePath(`/api/listings/lookup?ids=${encodeURIComponent(ids.join(","))}`),
        );
        if (lookup.ok) {
          const { listings } = (await lookup.json()) as {
            listings: NonNullable<Alternative["listing"]>[];
          };
          const byId = new Map(listings.map((l) => [l.id, l]));
          setEnriched(
            data.alternatives.map((a) => ({ ...a, listing: byId.get(a.listingId) })),
          );
        } else {
          setEnriched(data.alternatives);
        }
      } else {
        setEnriched([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("alt.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const colors = brandColors(props.sourceManufacturer);

  return (
    <div className="space-y-6">
      <div
        className="overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-slate-200"
        style={{ borderTop: `6px solid ${colors.primary}` }}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <Sparkles size={14} className="text-violet-500" />
            <span>{t("alt.eyebrow")}</span>
          </div>
          <h1 className="mt-1 page-title">
            {t("alt.headingTo")}{" "}
            <span style={{ color: readableOnLight(colors) }}>
              {props.sourceManufacturer}
            </span>{" "}
            {props.sourceProductName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t("alt.intro")}
          </p>
        </div>

        <div className="grid gap-6 border-t border-slate-200 bg-slate-50/50 p-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">
              {t("alt.mustMatch")}
            </div>
            <div className="space-y-2">
              <Toggle
                checked={criteria.sameProductType}
                onChange={(v) => setCriteria({ ...criteria, sameProductType: v })}
                label={t("alt.sameProductType")}
                hint={props.sourceProductType}
              />
              <Toggle
                checked={criteria.sameChemistry}
                onChange={(v) => setCriteria({ ...criteria, sameChemistry: v })}
                label={t("alt.sameChemistry")}
                hint={props.sourceChemistry}
              />
              <Toggle
                checked={criteria.sameViscosity}
                onChange={(v) => setCriteria({ ...criteria, sameViscosity: v })}
                label={t("alt.sameViscosity")}
                hint={
                  props.sourceIsoViscosity
                    ? `ISO VG ${props.sourceIsoViscosity}`
                    : t("alt.noIsoVg")
                }
                disabled={!props.sourceIsoViscosity}
              />
              <Toggle
                checked={criteria.sameApplicationArea}
                onChange={(v) =>
                  setCriteria({ ...criteria, sameApplicationArea: v })
                }
                label={t("alt.sameApplication")}
                hint={props.sourceApplicationArea}
              />
              <Toggle
                checked={criteria.samePackaging}
                onChange={(v) => setCriteria({ ...criteria, samePackaging: v })}
                label={t("alt.samePackaging")}
                hint={props.sourcePackaging}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">
              {t("alt.certsTitle")}
            </div>
            <CertInput
              value={requiredCerts}
              onChange={setRequiredCerts}
              placeholder={t("alt.phCerts")}
            />
            {props.sourceCertificates.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 text-xs text-slate-500">
                  {t("alt.quickSelect")}
                </div>
                <div className="flex flex-wrap gap-1">
                  {props.sourceCertificates.map((c) => {
                    const checked = requiredCerts.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setRequiredCerts(
                            checked
                              ? requiredCerts.filter((x) => x !== c)
                              : [...requiredCerts, c],
                          )
                        }
                        className={`rounded-md border px-2 py-0.5 text-xs ${
                          checked
                            ? "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {checked ? "✓ " : "+ "}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {t("alt.tipPreference")}
            </p>
          </div>
        </div>

        {/* KSS-Pain Points + Werkstoff */}
        <div className="space-y-4 border-t border-slate-200 bg-amber-50/40 p-6">
          <div>
            <div className="text-sm font-semibold text-slate-700">
              {t("alt.materialPainTitle")}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("alt.materialPainHint")}
            </p>
          </div>
          <div>
            <label className="label">{t("alt.materialLabel")}</label>
            <input
              type="text"
              value={workpieceMaterial}
              onChange={(e) => setWorkpieceMaterial(e.target.value)}
              placeholder={t("alt.phMaterial")}
              className="input"
            />
          </div>
          <KssIssueSelect
            value={avoidIssues}
            onChange={setAvoidIssues}
            title={t("alt.issuesTitle")}
            hint={t("alt.issuesHint")}
          />

          {/* Automatisierungs-Anforderungen */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-700">
              {t("alt.autoReqTitle")}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">
                  {t("alt.minAutoScore")}
                </label>
                <div className="flex gap-1">
                  {[0, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMinAutomationScore(s)}
                      className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                        minAutomationScore === s
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {s === 0 ? t("alt.any") : `≥ ${s}`}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t("alt.autoScoreHint")}
                </p>
              </div>
              <div>
                <label className="label">{t("alt.glycolFree")}</label>
                <div className="flex gap-2">
                  {[
                    { v: false, label: t("alt.glycolAny") },
                    { v: true, label: t("alt.glycolYes") },
                  ].map((opt) => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setRequireGlycolFree(opt.v)}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        requireGlycolFree === opt.v
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t("alt.glycolHint")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 p-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Bot size={14} />
            <span>
              {t("alt.claudeNote")}
            </span>
          </div>
          <button onClick={search} disabled={loading} className="btn-primary">
            {loading ? t("alt.analyzing") : t("alt.findButton")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">
              {fill(t("alt.foundCount"), { n: enriched.length })}
            </h2>
            <div className="flex items-center gap-2">
              {result.credits && result.credits.charged > 0 && (
                <span className="chip bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                  <Coins size={12} className="mr-1 inline" />
                  {result.credits.charged} {t("alt.credit")}
                  {result.credits.balance !== null
                    ? ` · ${t("alt.rest")} ${result.credits.balance}`
                    : ""}
                </span>
              )}
              <span
                className={`chip ${
                  result.modelUsed === "claude"
                    ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {result.modelUsed === "claude" ? t("alt.aiRating") : t("alt.ruleBased")}
              </span>
            </div>
          </div>
          {result.credits?.notice && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              {result.credits.notice}{" "}
              <Link href="/mitgliedschaft" className="font-medium underline">
                {t("alt.toMembership")}
              </Link>
            </p>
          )}
          {result.reasoning && (
            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              {result.reasoning}
            </p>
          )}
          <div className="overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-slate-200">
            {enriched.map((alt, i) => (
              <AlternativeRow
                key={alt.listingId}
                alt={alt}
                rank={i + 1}
                onOpen={() => setSelected(alt)}
                t={t}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {t("alt.rowClickHint")}
          </p>
        </div>
      )}

      {selected && (
        <DetailSlideOver alt={selected} onClose={() => setSelected(null)} t={t} />
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-md px-2 py-1.5 ${
        disabled ? "opacity-50" : "cursor-pointer hover:bg-slate-100"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {hint && <div className="truncate text-xs text-slate-500">{hint}</div>}
      </div>
    </label>
  );
}

/** Farbklassen des Match-Index — grün ≥70, limette ≥50, amber ≥30, rot darunter */
function matchTone(score: number): { text: string; bar: string } {
  if (score >= 70) return { text: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 50) return { text: "text-lime-700", bar: "bg-lime-500" };
  if (score >= 30) return { text: "text-amber-700", bar: "bg-amber-500" };
  return { text: "text-red-700", bar: "bg-red-500" };
}

/** Match-Index als Prozentzahl mit Balken */
function MatchMeter({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const tone = matchTone(score);
  return (
    <div className={size === "lg" ? "w-full" : "w-24 shrink-0"}>
      <div className={`font-bold ${tone.text} ${size === "lg" ? "text-3xl" : "text-base"}`}>
        {score} %
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

/** Kompakte Ergebnis-Zeile — Klick öffnet das Detail-Panel rechts */
function AlternativeRow({
  alt,
  rank,
  onOpen,
  t,
}: {
  alt: Alternative;
  rank: number;
  onOpen: () => void;
  t: (k: string) => string;
}) {
  const fit = fitStyles[alt.fit];
  const l = alt.listing;
  const colors = l ? brandColors(l.manufacturer) : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-slate-50"
      style={colors ? { boxShadow: `inset 4px 0 0 ${colors.primary}` } : undefined}
    >
      <span className="hidden w-6 shrink-0 text-center text-sm font-bold text-slate-400 sm:block">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">
            {l ? `${l.manufacturer} ${l.productName}` : fill(t("alt.offerNr"), { id: alt.listingId.slice(-6) })}
          </span>
          <span className={`chip ring-1 ${fit.classes} text-[11px]`}>{t(fit.label)}</span>
        </div>
        {l && (
          <div className="mt-0.5 text-xs text-slate-500">
            {l.productType} · ISO VG {l.isoViscosity ?? "–"} · {l.locationRegion}
            {l.priceEur ? ` · ${l.priceEur.toFixed(2)} €` : ` · ${t("alt.priceOnRequest")}`}
          </div>
        )}
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{alt.summary}</p>
      </div>
      <MatchMeter score={alt.score} />
      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  );
}

/** Detail-Panel — schiebt sich von rechts über die Seite (wie im Browse-Konzept) */
function DetailSlideOver({
  alt,
  onClose,
  t,
}: {
  alt: Alternative;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const fit = fitStyles[alt.fit];
  const l = alt.listing;
  const colors = l ? brandColors(l.manufacturer) : null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Abdunkelung — Klick schließt */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {/* Panel rechts */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md translate-x-0 animate-[slideIn_.25s_ease-out] flex-col overflow-y-auto bg-white shadow-lift">
        <style>{`@keyframes slideIn { from { transform: translateX(100%);} to { transform: translateX(0);} }`}</style>

        {/* Kopf */}
        <div
          className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur"
          style={colors ? { borderTop: `5px solid ${colors.primary}` } : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {t("alt.detailEyebrow")}
              </div>
              <h3 className="mt-0.5 truncate text-lg font-bold text-slate-900">
                {l ? `${l.manufacturer} ${l.productName}` : fill(t("alt.offerNr"), { id: alt.listingId.slice(-6) })}
              </h3>
              <span className={`chip mt-1 ring-1 ${fit.classes} text-xs`}>{t(fit.label)}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={t("alt.close")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* Match-Index groß */}
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("alt.matchIndexTitle")}
            </div>
            <MatchMeter score={alt.score} size="lg" />
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{alt.summary}</p>
          </section>

          {/* Angebots-Eckdaten */}
          {l && (
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("alt.offerData")}
              </div>
              <dl className="space-y-1.5 text-sm">
                <DetailRow label={t("alt.rowProductType")} value={l.productType} />
                <DetailRow label={t("alt.rowChemistry")} value={l.chemistry} />
                <DetailRow label={t("alt.rowViscosity")} value={l.isoViscosity ? `ISO VG ${l.isoViscosity}` : "–"} />
                <DetailRow label={t("alt.rowApplication")} value={l.applicationArea} />
                <DetailRow label={t("alt.rowQuantity")} value={`${l.quantity.toLocaleString("de-CH")} ${l.quantityUnit}`} />
                <DetailRow label={t("alt.rowPackaging")} value={l.packaging} />
                <DetailRow label={t("alt.rowRegion")} value={l.locationRegion} />
                <DetailRow
                  label={t("alt.rowPrice")}
                  value={l.priceEur ? `${l.priceEur.toFixed(2)} € / ${l.quantityUnit}` : t("alt.onRequest")}
                />
                <DetailRow label={t("alt.rowSeller")} value={l.seller.pseudonym} />
              </dl>
              {l.certificates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {l.certificates.map((c) => (
                    <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Begründung im Detail */}
          <section className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 size={14} /> {t("alt.pros")}
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
                <XCircle size={14} /> {t("alt.cons")}
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

        {/* Aktionen */}
        {l && (
          <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-slate-200 bg-white p-4">
            <Link
              href={`/listings/${l.id}`}
              className="btn-primary flex-1 text-center"
              style={colors ? { color: undefined } : undefined}
            >
              {t("alt.toOffer")}
            </Link>
            <Link
              href={`/listings/${l.id}`}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("alt.requestSample")}
            </Link>
          </div>
        )}
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
