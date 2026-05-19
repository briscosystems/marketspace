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
  AUTOMATION_FIT_LABEL,
  type MachiningOperationId,
} from "@/lib/kss-automation";
import { Droplet, Gauge } from "lucide-react";

const chemistries = ["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"] as const;
const packagings = ["DRUM", "IBC", "TANK", "CANISTER", "BULK", "OTHER"] as const;

export default function NewListingPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/listings/new");
  }, [status, router]);

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

  if (status !== "authenticated") return <div className="text-slate-500">Lade …</div>;

  const productNameSuggestions = useMemo<(q: string) => Suggestion[]>(
    () => (q: string) =>
      suggestFamilies(q, 8).map((f) => ({
        value: f.family,
        label: f.family,
        hint: `${f.manufacturer} · ${f.productType}`,
      })),
    [],
  );

  const manufacturerSuggestions = (q: string): Suggestion[] =>
    suggestFrom(KNOWN_MANUFACTURERS, q, 8).map((m) => ({ value: m, label: m }));
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
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Listing konnte nicht angelegt werden.");
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
          ANBIETEN
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Neues Angebot einstellen</h1>
        <p className="mt-1 text-sm text-slate-600">
          Du hast einen Restbestand oder Überlager, den du verkaufen möchtest? Stell die
          wesentlichen Daten ein — andere Reseller können dann kontaktieren oder direkt kaufen.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* 1. PRODUKT */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            1. Produkt
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Produktname *</label>
              <SuggestInput
                value={productName}
                onChange={setProductName}
                suggest={productNameSuggestions}
                placeholder="z.B. Tellus S2 M 46, Renolin MR 520, Hyspin AWS 46"
                required
                footer={
                  fam ? (
                    <span>
                      Erkannt: <strong>{fam.family}</strong> · {fam.manufacturer} · {fam.productType}
                      {" — "}
                      Hersteller und Produkttyp wurden automatisch ausgefüllt.
                    </span>
                  ) : (
                    <span>
                      Tipp: ein bekannter Familien-Name (Tellus, Renolin, Hyspin, Ecocool, …)
                      füllt Hersteller und Produkttyp automatisch aus.
                    </span>
                  )
                }
              />
            </div>

            <div>
              <label className="label">
                Hersteller *
                {autoDetected.manufacturer && manufacturer === autoDetected.manufacturer && (
                  <span className="ml-2 text-xs font-normal text-violet-600">
                    ✨ automatisch erkannt
                  </span>
                )}
              </label>
              <SuggestInput
                value={manufacturer}
                onChange={setManufacturer}
                suggest={manufacturerSuggestions}
                validate={knownCheck(KNOWN_MANUFACTURERS)}
                placeholder="Shell, Castrol, Fuchs, Mobil …"
                required
              />
            </div>
            <div>
              <label className="label">
                Produkttyp *
                {autoDetected.productType && productType === autoDetected.productType && (
                  <span className="ml-2 text-xs font-normal text-violet-600">
                    ✨ automatisch erkannt
                  </span>
                )}
              </label>
              <SuggestInput
                value={productType}
                onChange={setProductType}
                suggest={productTypeSuggestions}
                validate={knownCheck(PRODUCT_TYPES)}
                placeholder="Hydrauliköl, Kühlschmierstoff, Getriebeöl …"
                required
              />
            </div>
            <div>
              <label className="label">ISO Viskosität</label>
              <input name="isoViscosity" className="input" placeholder="46" />
            </div>
            <div>
              <label className="label">Chemie-Basis *</label>
              <select
                name="chemistry"
                required
                value={chemistry}
                onChange={(e) => setChemistry(e.target.value as (typeof chemistries)[number])}
                className="input"
              >
                {chemistries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Anwendungsbereich *</label>
              <SuggestInput
                value={applicationArea}
                onChange={setApplicationArea}
                suggest={applicationSuggestions}
                validate={knownCheck(APPLICATION_AREAS)}
                placeholder="Hydraulik, Wälzlager, Industriegetriebe …"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Allgemeiner Bereich. Konkrete Bearbeitungsverfahren wählst du im nächsten Abschnitt.
              </p>
            </div>
          </div>
        </section>

        {/* 2. FERTIGUNG / EINSATZBEREICHE */}
        <section className="card space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              2. Bearbeitungsverfahren
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Wofür ist das Produkt geeignet? Käufer sehen das als Chips auf der Karte
              (Fräsen, Drehen, Schleifen …).
            </p>
          </div>
          <MachiningSelect value={machiningOperations} onChange={setMachiningOperations} />
        </section>

        {/* 3. REZEPTUR */}
        <section className="card space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              3. Rezeptur-Angaben
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Diese Werte beeinflussen die Automatisierungs-Bewertung unten.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1">
                <Droplet size={13} className="text-slate-400" />
                Mineralölgehalt (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={mineralOilContent}
                onChange={(e) => setMineralOilContent(e.target.value)}
                className="input"
                placeholder="z.B. 45"
              />
              <p className="mt-1 text-xs text-slate-500">
                Konzentrat-Anteil Mineralöl. Synthetisch ≈ 0 %, halbsynthetisch ≈ 5–30 %,
                klassische Emulsion ≈ 40–90 %.
              </p>
            </div>
            <div>
              <label className="label">Glykol-Anteil enthalten?</label>
              <div className="flex gap-2">
                {[
                  { v: true, label: "Ja" },
                  { v: false, label: "Nein" },
                  { v: null, label: "Unbekannt" },
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
                Glykolhaltige KSS bilden Filme auf Refraktometer-Sensoren — relevant für die Wahl
                des Messverfahrens.
              </p>
            </div>
          </div>
        </section>

        {/* 4. AUTOMATION */}
        {isCoolant && (
          <section className="card space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Gauge size={14} />
                4. Automatisierungs-Eignung
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Welche Messverfahren empfiehlt der Hersteller / die Fachfreigabe?
                Mehrfachauswahl. Glykol-Hinweise oben werden automatisch berücksichtigt.
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
                  Aus deinen Angaben geschätzt
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
                {AUTOMATION_FIT_LABEL[automation.fit]} · Score {automation.score}/5
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isCoolant ? "5" : "4"}. Verfügbarkeit
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Menge *</label>
              <input name="quantity" type="number" step="any" required className="input" />
            </div>
            <div>
              <label className="label">Einheit</label>
              <input name="quantityUnit" defaultValue="L" className="input" />
            </div>
            <div>
              <label className="label">Mindestabnahme</label>
              <input name="minOrderQty" type="number" step="any" className="input" />
            </div>
            <div>
              <label className="label">Verpackung *</label>
              <select name="packaging" required defaultValue="DRUM" className="input">
                {packagings.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Lagerregion *</label>
              <input name="locationRegion" required className="input" placeholder="DE-BW" />
            </div>
            <div>
              <label className="label">Preis (€, optional)</label>
              <input name="priceEur" type="number" step="0.01" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Versandkonditionen</label>
              <input
                name="shippingTerms"
                className="input"
                placeholder="Selbstabholung / Lieferung / verhandelbar"
              />
            </div>
          </div>
        </section>

        {/* 6. ZERTIFIKATE */}
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isCoolant ? "6" : "5"}. Zertifikate &amp; Freigaben
          </h2>
          <CertInput
            value={certificates}
            onChange={setCertificates}
            placeholder="z.B. DIN 51524-2, ISO VG 46, Bosch Rexroth"
          />
        </section>

        {/* 7. BESCHREIBUNG */}
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isCoolant ? "7" : "6"}. Beschreibung
          </h2>
          <textarea
            name="description"
            rows={4}
            className="input"
            placeholder="Zusätzlicher Kontext: Vorgeschichte, Standzeit, Besonderheiten …"
          />
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Speichern …" : "Listing veröffentlichen"}
          </button>
        </div>
      </form>
    </div>
  );
}
