"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { CertInput } from "@/components/CertInput";
import { SuggestInput, type Suggestion } from "@/components/SuggestInput";
import { MachiningSelect } from "@/components/MachiningSelect";
import { MeasurementMethodSelect } from "@/components/MeasurementMethodSelect";
import { AutomationBadge } from "@/components/AutomationBadge";
import {
  KNOWN_MANUFACTURERS,
  PRODUCT_TYPES,
  APPLICATION_AREAS,
  detectFamily,
  suggestFamilies,
  suggestFrom,
} from "@/lib/products-knowledge";
import {
  estimateAutomation,
  type MachiningOperationId,
} from "@/lib/kss-automation";
import { Autocomplete } from "@/components/Autocomplete";
import { Droplet, Gauge } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

const chemistries = ["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"] as const;
const packagings = ["DRUM", "IBC", "TANK", "CANISTER", "BULK", "OTHER"] as const;

// Vorschlags-Vokabulare für die Echtzeit-Felder
const ISO_VG_PRESETS = ["5", "7", "10", "15", "22", "32", "46", "68", "100", "150", "220", "320", "460", "680"];
const REGION_PRESETS = [
  "DE-BW", "DE-BY", "DE-NW", "DE-HE", "DE-NI", "DE-RP", "DE-SN", "DE-BE", "DE-HH",
  "DE (ganz)", "AT", "CH", "FR", "IT", "NL", "BE", "PL", "CZ", "EU",
];
const UNIT_PRESETS = ["L", "kg", "IBC (1000 L)", "Fass (200 L)", "Kanister (20 L)", "Stück", "t"];

export default function NewListingPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<string[]>([]);

  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [productType, setProductType] = useState("");
  const [chemistry, setChemistry] = useState<(typeof chemistries)[number]>("MINERAL");
  const [applicationArea, setApplicationArea] = useState("");
  const [autoDetected, setAutoDetected] = useState<{
    manufacturer?: string;
    productType?: string;
  }>({});

  // Neu: Fertigungs-, Rezeptur- und Automatisierungs-Felder
  const [machiningOperations, setMachiningOperations] = useState<MachiningOperationId[]>([]);
  const [mineralOilContent, setMineralOilContent] = useState<string>("");
  const [containsGlycol, setContainsGlycol] = useState<boolean | null>(null);
  const [measurementMethods, setMeasurementMethods] = useState<string[]>([]);
  const [dbManufacturers, setDbManufacturers] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/listings/new");
  }, [status, router]);

  // Echte Hersteller aus der Datenbank laden und mit den bekannten Familien-
  // Marken zusammenführen — so deckt die Vorschlagsliste alle möglichen ab.
  useEffect(() => {
    fetch(withBasePath("/api/manufacturers/names"))
      .then((r) => (r.ok ? r.json() : []))
      .then((names: string[]) => setDbManufacturers(names))
      .catch(() => setDbManufacturers([]));
  }, []);

  const allManufacturers = useMemo(
    () => Array.from(new Set([...dbManufacturers, ...KNOWN_MANUFACTURERS])).sort(),
    [dbManufacturers],
  );

  useEffect(() => {
    const fam = detectFamily(productName);
    if (!fam) {
      setAutoDetected({});
      return;
    }
    setAutoDetected({ manufacturer: fam.manufacturer, productType: fam.productType });
    if (!manufacturer || manufacturer === autoDetected.manufacturer) {
      setManufacturer(fam.manufacturer);
    }
    if (!productType || productType === autoDetected.productType) {
      setProductType(fam.productType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName]);

  const isCoolant =
    productType.toLowerCase().includes("kühlschmier") ||
    productType.toLowerCase().includes("kuehlschmier") ||
    productType.toLowerCase().includes("emulsion") ||
    productType.toLowerCase().includes("kss");

  const productNameSuggestions = useMemo<(q: string) => Suggestion[]>(
    () => (q: string) =>
      suggestFamilies(q, 8).map((f) => ({
        value: f.family,
        label: f.family,
        hint: `${f.manufacturer} · ${f.productType}`,
      })),
    [],
  );

  if (status !== "authenticated") return <div className="text-slate-500">{t("lnew.loading")}</div>;

  const manufacturerSuggestions = (q: string): Suggestion[] =>
    suggestFrom(allManufacturers, q, 8).map((m) => ({ value: m, label: m }));
  const productTypeSuggestions = (q: string): Suggestion[] =>
    suggestFrom(PRODUCT_TYPES, q, 8).map((p) => ({ value: p, label: p }));
  const applicationSuggestions = (q: string): Suggestion[] =>
    suggestFrom(APPLICATION_AREAS, q, 10).map((a) => ({ value: a, label: a }));

  const knownCheck = (list: string[]) => (v: string): "known" | "free" | "warning" => {
    if (!v) return "free";
    if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return "known";
    if (list.some((x) => x.toLowerCase().startsWith(v.toLowerCase()) || v.toLowerCase().includes(x.toLowerCase()))) return "free";
    return "warning";
  };

  // Live-Vorschau Automatisierungs-Eignung
  const automation = estimateAutomation({
    productType,
    chemistry,
    containsGlycol,
    mineralOilContent: mineralOilContent ? Number(mineralOilContent) : null,
    manufacturerRecommendedMethods: measurementMethods,
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      productType,
      manufacturer,
      productName,
      isoViscosity: (fd.get("isoViscosity") as string) || undefined,
      chemistry,
      applicationArea,
      quantity: Number(fd.get("quantity")),
      quantityUnit: fd.get("quantityUnit") || "L",
      minOrderQty: fd.get("minOrderQty") ? Number(fd.get("minOrderQty")) : undefined,
      locationRegion: fd.get("locationRegion"),
      packaging: fd.get("packaging"),
      certificates,
      priceEur: fd.get("priceEur") ? Number(fd.get("priceEur")) : undefined,
      shippingTerms: (fd.get("shippingTerms") as string) || undefined,
      description: (fd.get("description") as string) || undefined,
      machiningOperations,
      mineralOilContent: mineralOilContent ? Number(mineralOilContent) : undefined,
      containsGlycol,
      automationSuitability: automation.score,
      measurementMethods,
    };
    const res = await fetch(withBasePath("/api/listings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("lnew.errCreate"));
      return;
    }
    const created = await res.json();
    router.push(`/listings/${created.id}`);
    router.refresh();
  }

  const fam = detectFamily(productName);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          {t("lnew.badge")}
        </div>
        <h1 className="page-title">{t("lnew.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("lnew.intro")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* 1. PRODUKT */}
        <section className="card space-y-4">
          <h2 className="eyebrow">
            {t("lnew.sec1")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">{t("lnew.productName")}</label>
              <SuggestInput
                value={productName}
                onChange={setProductName}
                suggest={productNameSuggestions}
                placeholder={t("lnew.phProductName")}
                required
                footer={
                  fam ? (
                    <span>
                      {t("lnew.detectedPrefix")} <strong>{fam.family}</strong> · {fam.manufacturer} · {fam.productType}
                      {" — "}
                      {t("lnew.detectedSuffix")}
                    </span>
                  ) : (
                    <span>
                      {t("lnew.tipFamily")}
                    </span>
                  )
                }
              />
            </div>

            <div>
              <label className="label">
                {t("lnew.manufacturer")}
                {autoDetected.manufacturer && manufacturer === autoDetected.manufacturer && (
                  <span className="ml-2 text-xs font-normal text-violet-600">
                    {t("lnew.autoDetected")}
                  </span>
                )}
              </label>
              <SuggestInput
                value={manufacturer}
                onChange={setManufacturer}
                suggest={manufacturerSuggestions}
                validate={knownCheck(allManufacturers)}
                placeholder={t("lnew.phManufacturer")}
                required
              />
            </div>
            <div>
              <label className="label">
                {t("lnew.productType")}
                {autoDetected.productType && productType === autoDetected.productType && (
                  <span className="ml-2 text-xs font-normal text-violet-600">
                    {t("lnew.autoDetected")}
                  </span>
                )}
              </label>
              <SuggestInput
                value={productType}
                onChange={setProductType}
                suggest={productTypeSuggestions}
                validate={knownCheck(PRODUCT_TYPES)}
                placeholder={t("lnew.phProductType")}
                required
              />
            </div>
            <div>
              <label className="label">{t("lnew.isoViscosity")}</label>
              <Autocomplete name="isoViscosity" options={ISO_VG_PRESETS} placeholder="46" />
            </div>
            <div>
              <label className="label">{t("lnew.chemistryBase")}</label>
              <select
                name="chemistry"
                required
                value={chemistry}
                onChange={(e) => setChemistry(e.target.value as (typeof chemistries)[number])}
                className="input"
              >
                {chemistries.map((c) => (
                  <option key={c} value={c}>
                    {t(`chem.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">{t("lnew.applicationArea")}</label>
              <SuggestInput
                value={applicationArea}
                onChange={setApplicationArea}
                suggest={applicationSuggestions}
                validate={knownCheck(APPLICATION_AREAS)}
                placeholder={t("lnew.phApplicationArea")}
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("lnew.applicationHint")}
              </p>
            </div>
          </div>
        </section>

        {/* 2. FERTIGUNG / EINSATZBEREICHE */}
        <section className="card space-y-4">
          <div>
            <h2 className="eyebrow">
              {t("lnew.sec2")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("lnew.sec2Hint")}
            </p>
          </div>
          <MachiningSelect value={machiningOperations} onChange={setMachiningOperations} />
        </section>

        {/* 3. REZEPTUR */}
        <section className="card space-y-4">
          <div>
            <h2 className="eyebrow">
              {t("lnew.sec3")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("lnew.sec3Hint")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1">
                <Droplet size={13} className="text-slate-400" />
                {t("lnew.mineralOil")}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={mineralOilContent}
                onChange={(e) => setMineralOilContent(e.target.value)}
                className="input"
                placeholder={t("lnew.phMineralOil")}
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("lnew.mineralOilHint")}
              </p>
            </div>
            <div>
              <label className="label">{t("lnew.glycol")}</label>
              <div className="flex gap-2">
                {[
                  { v: true, label: t("lnew.yes") },
                  { v: false, label: t("lnew.no") },
                  { v: null, label: t("lnew.unknown") },
                ].map((opt) => {
                  const selected = containsGlycol === opt.v;
                  return (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setContainsGlycol(opt.v)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        selected
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {t("lnew.glycolHint")}
              </p>
            </div>
          </div>
        </section>

        {/* 4. AUTOMATION */}
        {isCoolant && (
          <section className="card space-y-4">
            <div>
              <h2 className="flex items-center gap-2 eyebrow">
                <Gauge size={14} />
                {t("lnew.sec4")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t("lnew.sec4Hint")}
              </p>
            </div>
            <MeasurementMethodSelect
              value={measurementMethods}
              onChange={setMeasurementMethods}
              containsGlycol={containsGlycol ?? false}
            />
            {/* Live-Vorschau */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("lnew.estimated")}
                </div>
                <AutomationBadge
                  input={{
                    productType,
                    chemistry,
                    containsGlycol,
                    mineralOilContent: mineralOilContent ? Number(mineralOilContent) : null,
                    manufacturerRecommendedMethods: measurementMethods,
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {t(`lnew.autofit.${automation.fit}`)} · {fill(t("lnew.scoreLabel"), { score: automation.score })}
              </div>
              {automation.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
                  {automation.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
              {automation.warnings.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-amber-700">
                  {automation.warnings.map((w, i) => (
                    <li key={i}>⚠ {w}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* 5. VERFÜGBARKEIT */}
        <section className="card space-y-4">
          <h2 className="eyebrow">
            {isCoolant ? "5" : "4"}. {t("lnew.secAvailability")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t("lnew.quantity")}</label>
              <input name="quantity" type="number" step="any" required className="input" />
            </div>
            <div>
              <label className="label">{t("lnew.unit")}</label>
              <Autocomplete name="quantityUnit" options={UNIT_PRESETS} defaultValue="L" placeholder="L" />
            </div>
            <div>
              <label className="label">{t("lnew.minOrder")}</label>
              <input name="minOrderQty" type="number" step="any" className="input" />
            </div>
            <div>
              <label className="label">{t("lnew.packaging")}</label>
              <select name="packaging" required defaultValue="DRUM" className="input">
                {packagings.map((p) => (
                  <option key={p} value={p}>
                    {t(`lnew.pkg.${p}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("lnew.storageRegion")}</label>
              <Autocomplete name="locationRegion" options={REGION_PRESETS} required placeholder="DE-BW" />
            </div>
            <div>
              <label className="label">{t("lnew.price")}</label>
              <input name="priceEur" type="number" step="0.01" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t("lnew.shipping")}</label>
              <input
                name="shippingTerms"
                className="input"
                placeholder={t("lnew.phShipping")}
              />
            </div>
          </div>
        </section>

        {/* 6. ZERTIFIKATE */}
        <section className="card space-y-3">
          <h2 className="eyebrow">
            {isCoolant ? "6" : "5"}. {t("lnew.secCerts")}
          </h2>
          <CertInput
            value={certificates}
            onChange={setCertificates}
            placeholder={t("lnew.phCerts")}
          />
        </section>

        {/* 7. BESCHREIBUNG */}
        <section className="card space-y-3">
          <h2 className="eyebrow">
            {isCoolant ? "7" : "6"}. {t("lnew.secDescription")}
          </h2>
          <textarea
            name="description"
            rows={4}
            className="input"
            placeholder={t("lnew.phDescription")}
          />
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t("lnew.saving") : t("lnew.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
