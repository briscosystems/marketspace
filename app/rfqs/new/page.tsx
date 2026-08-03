"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CertInput } from "@/components/CertInput";
import { KssIssueSelect } from "@/components/KssIssueSelect";
import { Autocomplete } from "@/components/Autocomplete";
import { APPLICATION_AREAS, MATERIALS } from "@/lib/kss-knowledge";
import type { KssIssueId, IssueScope } from "@/lib/kss-issues";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";

const chemistries = ["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "GTL", "OTHER"] as const;

// Vorschlags-Vokabulare für die Echtzeit-Felder
const ISO_VG_PRESETS = ["5", "7", "10", "15", "22", "32", "46", "68", "100", "150", "220", "320", "460", "680"];
const REGION_PRESETS = [
  "DE-BW", "DE-BY", "DE-NW", "DE-HE", "DE-NI", "DE-RP", "DE-SN", "DE-BE", "DE-HH",
  "DE (ganz)", "AT", "CH", "FR", "IT", "NL", "BE", "PL", "CZ", "EU",
];
const UNIT_PRESETS = ["L", "kg", "IBC (1000 L)", "Fass (200 L)", "Kanister (20 L)", "Stück", "t"];

const PRODUCT_TYPE_PRESETS = [
  { value: "Hydrauliköl", scope: "neat" as const, labelKey: "rnew.pt.hydraulic" },
  { value: "Getriebeöl", scope: "neat" as const, labelKey: "rnew.pt.gear" },
  { value: "Motoröl", scope: "neat" as const, labelKey: "rnew.pt.motor" },
  { value: "Schmierfett", scope: "neat" as const, labelKey: "rnew.pt.grease" },
  { value: "Schneidöl (nicht-wassermischbar)", scope: "neat" as const, labelKey: "rnew.pt.cutting" },
  { value: "Kühlschmierstoff (Emulsion, wassermischbar)", scope: "water" as const, labelKey: "rnew.pt.coolantEmulsion" },
  { value: "Kühlschmierstoff (Lösung, wassermischbar)", scope: "water" as const, labelKey: "rnew.pt.coolantSolution" },
  { value: "Schleiföl", scope: "neat" as const, labelKey: "rnew.pt.grinding" },
  { value: "Honöl", scope: "neat" as const, labelKey: "rnew.pt.honing" },
  { value: "Umformöl", scope: "neat" as const, labelKey: "rnew.pt.forming" },
];

export default function NewRfqPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [issues, setIssues] = useState<KssIssueId[]>([]);
  const [productType, setProductType] = useState("Hydrauliköl");
  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>([]);

  // Anfragen sind ohne Konto möglich (Entscheidung 2026-08-03): Wer nicht
  // angemeldet ist, gibt am Ende nur seine E-Mail-Adresse an — das Konto legt
  // die Plattform selbst an und schickt den Link zum Passwortsetzen.

  // Hersteller-Liste einmal laden — Vorschläge bauen sich dann beim Tippen auf.
  useEffect(() => {
    fetch(withBasePath("/api/manufacturers/names"))
      .then((r) => (r.ok ? r.json() : []))
      .then((names: string[]) => setManufacturerOptions(names))
      .catch(() => setManufacturerOptions([]));
  }, []);

  if (status === "loading") {
    return <div className="text-slate-500">{t("rnew.loading")}</div>;
  }
  const angemeldet = status === "authenticated";

  // Produkttyp → relevanter Problem-Scope, damit pro Kategorie nur die
  // passenden Pain-Points (+ kategorieübergreifende) angezeigt werden.
  const lcType = productType.toLowerCase();
  const scope: IssueScope =
    lcType.includes("kühlschmierstoff") ||
    lcType.includes("emulsion") ||
    lcType.includes("wassermischbar")
      ? "water_miscible"
      : lcType.includes("fett")
        ? "grease"
        : lcType.includes("hydraulik") ||
            lcType.includes("getriebe") ||
            lcType.includes("motor") ||
            lcType.includes("kompressor") ||
            lcType.includes("umlauf")
          ? "circulating_oil"
          : lcType.includes("öl")
            ? "neat_oil"
            : "general";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const deadlineStr = fd.get("deadline") as string;
    const payload = {
      productType,
      manufacturer: (fd.get("manufacturer") as string) || undefined,
      isoViscosity: (fd.get("isoViscosity") as string) || undefined,
      chemistry: (fd.get("chemistry") as string) || undefined,
      applicationArea: (fd.get("applicationArea") as string) || undefined,
      quantity: Number(fd.get("quantity")),
      quantityUnit: fd.get("quantityUnit") || "L",
      locationRegion: fd.get("locationRegion"),
      deadline: new Date(deadlineStr + "T23:59:59Z").toISOString(),
      budgetMinEur: fd.get("budgetMinEur") ? Number(fd.get("budgetMinEur")) : undefined,
      budgetMaxEur: fd.get("budgetMaxEur") ? Number(fd.get("budgetMaxEur")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
      visibility: fd.get("visibility") || "PUBLIC",
      workpieceMaterial: (fd.get("workpieceMaterial") as string) || undefined,
      requiredCertifications: requiredCerts,
      avoidIssues: issues,
      ...(angemeldet ? {} : { email: (fd.get("email") as string) || undefined }),
    };
    const res = await fetch(withBasePath("/api/rfqs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("rnew.errCreate"));
      return;
    }
    const created = await res.json();
    if (created.kontoAngelegt) {
      // Ohne gesetztes Passwort kann die Detailseite noch nicht geöffnet werden.
      router.push("/rfqs/eingegangen");
      return;
    }
    router.push(`/rfqs/${created.id}`);
    router.refresh();
  }

  const tomorrow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          {t("rnew.badge")}
        </div>
        <h1 className="page-title">{t("rnew.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("rnew.intro")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* GRUNDDATEN */}
        <section className="card space-y-4">
          <h2 className="eyebrow">
            {t("rnew.sec1")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">{t("rnew.productType")}</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="input"
              >
                {PRODUCT_TYPE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {t(p.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("rnew.manufacturer")}</label>
              <Autocomplete
                name="manufacturer"
                options={manufacturerOptions}
                placeholder={t("rnew.phManufacturer")}
              />
            </div>
            <div>
              <label className="label">{t("rnew.isoViscosity")}</label>
              <Autocomplete name="isoViscosity" options={ISO_VG_PRESETS} placeholder="46" />
            </div>
            <div>
              <label className="label">{t("rnew.chemistry")}</label>
              <select name="chemistry" defaultValue="" className="input">
                <option value="">{t("rnew.any")}</option>
                {chemistries.map((c) => (
                  <option key={c} value={c}>{t(`chem.${c}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("rnew.applicationArea")}</label>
              <Autocomplete
                name="applicationArea"
                options={[...APPLICATION_AREAS]}
                placeholder={t("rnew.phApplicationArea")}
              />
            </div>
            <div>
              <label className="label">{t("rnew.material")}</label>
              <Autocomplete
                name="workpieceMaterial"
                options={[...MATERIALS]}
                placeholder={t("rnew.phMaterial")}
              />
            </div>
            <div>
              <label className="label">{t("rnew.deliveryRegion")}</label>
              <Autocomplete
                name="locationRegion"
                options={REGION_PRESETS}
                required
                placeholder="DE-BW"
              />
            </div>
            <div>
              <label className="label">{t("rnew.quantity")}</label>
              <input name="quantity" type="number" step="any" required className="input" />
            </div>
            <div>
              <label className="label">{t("rnew.unit")}</label>
              <Autocomplete name="quantityUnit" options={UNIT_PRESETS} defaultValue="L" placeholder="L" />
            </div>
            <div>
              <label className="label">{t("rnew.deadline")}</label>
              <input name="deadline" type="date" required defaultValue={tomorrow} className="input" />
            </div>
            <div>
              <label className="label">{t("rnew.visibility")}</label>
              <select name="visibility" defaultValue="PUBLIC" className="input">
                <option value="PUBLIC">{t("rnew.visPublic")}</option>
                <option value="VERIFIED_ONLY">{t("rnew.visVerified")}</option>
              </select>
            </div>
            <div>
              <label className="label">{t("rnew.budgetMin")}</label>
              <input name="budgetMinEur" type="number" step="0.01" className="input" />
            </div>
            <div>
              <label className="label">{t("rnew.budgetMax")}</label>
              <input name="budgetMaxEur" type="number" step="0.01" className="input" />
            </div>
          </div>
        </section>

        {/* ZERTIFIKATE */}
        <section className="card space-y-3">
          <div>
            <h2 className="eyebrow">
              {t("rnew.sec2")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("rnew.sec2Hint")}
            </p>
          </div>
          <CertInput
            value={requiredCerts}
            onChange={setRequiredCerts}
            placeholder={t("rnew.phCerts")}
          />
        </section>

        {/* KSS-PROBLEME */}
        <section className="card">
          <KssIssueSelect
            value={issues}
            onChange={setIssues}
            scope={scope}
            title={t("rnew.sec3Title")}
            hint={t("rnew.sec3Hint")}
          />
        </section>

        {/* NOTIZEN */}
        <section className="card space-y-3">
          <h2 className="eyebrow">
            {t("rnew.sec4")}
          </h2>
          <textarea
            name="notes"
            rows={3}
            className="input"
            placeholder={t("rnew.phNotes")}
          />
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        {!angemeldet && (
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <label className="label" htmlFor="rfq-email">
              Deine E-Mail-Adresse *
            </label>
            <input
              id="rfq-email"
              name="email"
              type="email"
              required
              placeholder="einkauf@firma.de"
              className="input bg-white"
            />
            <p className="mt-1.5 text-xs text-amber-900">
              Dorthin schicken wir die Antworten der Händler. Ein Konto legen wir dabei
              automatisch für dich an — du bekommst per Mail einen Link, um dein Passwort zu
              setzen. Kein Formular vorher, keine Kreditkarte.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t("rnew.saving") : t("rnew.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
