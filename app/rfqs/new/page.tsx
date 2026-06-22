"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CertInput } from "@/components/CertInput";
import { KssIssueSelect } from "@/components/KssIssueSelect";
import { Autocomplete } from "@/components/Autocomplete";
import { APPLICATION_AREAS, MATERIALS } from "@/lib/kss-knowledge";
import type { KssIssueId } from "@/lib/kss-issues";

const chemistries = ["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"] as const;

// Vorschlags-Vokabulare für die Echtzeit-Felder
const ISO_VG_PRESETS = ["5", "7", "10", "15", "22", "32", "46", "68", "100", "150", "220", "320", "460", "680"];
const REGION_PRESETS = [
  "DE-BW", "DE-BY", "DE-NW", "DE-HE", "DE-NI", "DE-RP", "DE-SN", "DE-BE", "DE-HH",
  "DE (ganz)", "AT", "CH", "FR", "IT", "NL", "BE", "PL", "CZ", "EU",
];
const UNIT_PRESETS = ["L", "kg", "IBC (1000 L)", "Fass (200 L)", "Kanister (20 L)", "Stück", "t"];

const PRODUCT_TYPE_PRESETS = [
  { value: "Hydrauliköl", scope: "neat" as const },
  { value: "Getriebeöl", scope: "neat" as const },
  { value: "Motoröl", scope: "neat" as const },
  { value: "Schmierfett", scope: "neat" as const },
  { value: "Schneidöl (nicht-wassermischbar)", scope: "neat" as const },
  { value: "Kühlschmierstoff (Emulsion, wassermischbar)", scope: "water" as const },
  { value: "Kühlschmierstoff (Lösung, wassermischbar)", scope: "water" as const },
  { value: "Schleiföl", scope: "neat" as const },
  { value: "Honöl", scope: "neat" as const },
  { value: "Umformöl", scope: "neat" as const },
];

export default function NewRfqPage() {
  const router = useRouter();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [issues, setIssues] = useState<KssIssueId[]>([]);
  const [productType, setProductType] = useState("Hydrauliköl");
  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/rfqs/new");
  }, [status, router]);

  // Hersteller-Liste einmal laden — Vorschläge bauen sich dann beim Tippen auf.
  useEffect(() => {
    fetch("/api/manufacturers/names")
      .then((r) => (r.ok ? r.json() : []))
      .then((names: string[]) => setManufacturerOptions(names))
      .catch(() => setManufacturerOptions([]));
  }, []);

  if (status !== "authenticated") {
    return <div className="text-slate-500">Lade …</div>;
  }

  const scope: "water_miscible" | "neat_oil" | "both" =
    productType.toLowerCase().includes("kühlschmierstoff") ||
    productType.toLowerCase().includes("emulsion")
      ? "water_miscible"
      : productType.toLowerCase().includes("öl") ||
          productType.toLowerCase().includes("fett")
        ? "neat_oil"
        : "both";

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
    };
    const res = await fetch("/api/rfqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Anfrage konnte nicht angelegt werden.");
      return;
    }
    const created = await res.json();
    router.push(`/rfqs/${created.id}`);
    router.refresh();
  }

  const tomorrow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          SUCHEN
        </div>
        <h1 className="page-title">Bedarf einstellen — was suchst du?</h1>
        <p className="mt-1 text-sm text-slate-600">
          Beschreibe was du brauchst. Anbieter sehen deinen Bedarf und melden sich mit
          Preis und Lieferzeit. Pflicht-Zertifikate und Pain Points helfen ihnen,
          passende Angebote zu machen — auch Alternativ-Vorschläge sind erlaubt.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* GRUNDDATEN */}
        <section className="card space-y-4">
          <h2 className="eyebrow">
            1. Was suchst du?
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Produkttyp *</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="input"
              >
                {PRODUCT_TYPE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Hersteller (optional)</label>
              <Autocomplete
                name="manufacturer"
                options={manufacturerOptions}
                placeholder="Shell, Fuchs, OEM-Eigenmarke …"
              />
            </div>
            <div>
              <label className="label">ISO Viskosität</label>
              <Autocomplete name="isoViscosity" options={ISO_VG_PRESETS} placeholder="46" />
            </div>
            <div>
              <label className="label">Chemie</label>
              <select name="chemistry" defaultValue="" className="input">
                <option value="">egal</option>
                {chemistries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Anwendungsbereich</label>
              <Autocomplete
                name="applicationArea"
                options={[...APPLICATION_AREAS]}
                placeholder="Hydraulik / CNC-Drehen / Schleifen"
              />
            </div>
            <div>
              <label className="label">Werkstoff (für KSS wichtig)</label>
              <Autocomplete
                name="workpieceMaterial"
                options={[...MATERIALS]}
                placeholder="Stahl 1.2379 / Aluminium AlMg3 / Buntmetall …"
              />
            </div>
            <div>
              <label className="label">Lieferregion *</label>
              <Autocomplete
                name="locationRegion"
                options={REGION_PRESETS}
                required
                placeholder="DE-BW"
              />
            </div>
            <div>
              <label className="label">Benötigte Menge *</label>
              <input name="quantity" type="number" step="any" required className="input" />
            </div>
            <div>
              <label className="label">Einheit</label>
              <Autocomplete name="quantityUnit" options={UNIT_PRESETS} defaultValue="L" placeholder="L" />
            </div>
            <div>
              <label className="label">Frist *</label>
              <input name="deadline" type="date" required defaultValue={tomorrow} className="input" />
            </div>
            <div>
              <label className="label">Sichtbarkeit</label>
              <select name="visibility" defaultValue="PUBLIC" className="input">
                <option value="PUBLIC">Öffentlich</option>
                <option value="VERIFIED_ONLY">Nur Verified+</option>
              </select>
            </div>
            <div>
              <label className="label">Budget min (€)</label>
              <input name="budgetMinEur" type="number" step="0.01" className="input" />
            </div>
            <div>
              <label className="label">Budget max (€)</label>
              <input name="budgetMaxEur" type="number" step="0.01" className="input" />
            </div>
          </div>
        </section>

        {/* ZERTIFIKATE */}
        <section className="card space-y-3">
          <div>
            <h2 className="eyebrow">
              2. Pflicht-Zertifikate &amp; Freigaben
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Werden zur Vorfilterung der Angebote verwendet. Vorschläge erscheinen
              beim Tippen — unbekannte Einträge werden mit einem Warn-Symbol markiert.
            </p>
          </div>
          <CertInput
            value={requiredCerts}
            onChange={setRequiredCerts}
            placeholder="z.B. DIN 51524-2, Bosch Rexroth, TRGS 611"
          />
        </section>

        {/* KSS-PROBLEME */}
        <section className="card">
          <KssIssueSelect
            value={issues}
            onChange={setIssues}
            scope={scope === "both" ? "both" : scope}
            title="3. Welche Probleme MUSS das Produkt vermeiden?"
            hint="Anbieter sehen diese Anforderungen. Wenn du später die KI-Alternativ-Suche nutzt, vergleicht Claude die SDS-Inhalte gegen genau diese Pain Points."
          />
        </section>

        {/* NOTIZEN */}
        <section className="card space-y-3">
          <h2 className="eyebrow">
            4. Freitext (optional)
          </h2>
          <textarea
            name="notes"
            rows={3}
            className="input"
            placeholder="Spezifische Kontext-Infos: Maschine, Wasserhärte, Standzeit-Erwartung, vorheriges Produkt, Lieferkonditionen …"
          />
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Speichern …" : "Anfrage veröffentlichen"}
          </button>
        </div>
      </form>
    </div>
  );
}
