import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { ArrowLeft, ExternalLink } from "lucide-react";

// Technisches Datenblatt (TDS) — automatisch aus den strukturierten
// Produktfeldern der Wissensbasis erzeugt, druckfreundlich aufbereitet.
// Es beschreibt, was das Produkt KANN (Kennwerte, Anwendung) — das
// Gegenstück zum Sicherheitsdatenblatt.

const CATEGORY_LABEL: Record<string, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl (nicht wassermischbar)",
  GRINDING_OIL: "Schleiföl",
  EDM_FLUID: "Erodier-Dielektrikum",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  COMPRESSOR_OIL: "Kompressoröl",
  SLIDEWAY_OIL: "Bettbahnöl",
  FORMING_OIL: "Umform-/Stanzöl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  SPECIALTY: "Spezial",
  ADDITIVE: "Additiv",
  OTHER: "Sonstiges",
};

const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralölbasiert (Soluble Oil)",
  SEMI_SYNTHETIC: "Semi-synthetisch",
  SYNTHETIC: "Vollsynthetisch",
  ESTER: "Ester-Basis",
  PAG: "PAG (Polyalkylenglykol)",
  OTHER: "Andere",
};

const FORM_LABEL: Record<string, string> = {
  EMULSION: "Emulsion (milchig)",
  MICROEMULSION: "Mikroemulsion (transluzent)",
  SOLUTION: "Lösung (klar)",
};

const PRODUCTION_LABEL: Record<string, string> = {
  JOB_SHOP: "Lohnfertigung / Werkstatt (Mischbetrieb)",
  SERIES: "Serienfertigung",
  UNIVERSAL: "Universell",
};

function fmt(v: number, unit?: string): string {
  return `${v.toLocaleString("de-CH")}${unit ? ` ${unit}` : ""}`;
}

function flag(v: boolean | null): string | null {
  if (v === null) return null;
  return v ? "ja" : "nein";
}

export default async function TdsPage({
  params,
}: {
  params: Promise<{ manufacturerSlug: string; productSlug: string }>;
}) {
  const { manufacturerSlug, productSlug } = await params;
  const m = await prisma.manufacturer.findUnique({ where: { slug: manufacturerSlug } });
  if (!m) notFound();
  const product = await prisma.product.findUnique({
    where: { manufacturerId_slug: { manufacturerId: m.id, slug: productSlug } },
  });
  if (!product) notFound();

  // Kennwert-Zeilen — nur befüllte Felder erscheinen im Dokument
  const kennwerte: Array<[string, string]> = [];
  if (product.densityGcm3 != null) kennwerte.push(["Dichte (20 °C)", fmt(product.densityGcm3, "g/cm³")]);
  if (product.viscosityIso) kennwerte.push(["ISO-Viskositätsklasse", `ISO VG ${product.viscosityIso}`]);
  if (product.viscosityKv40 != null) kennwerte.push(["Kin. Viskosität (40 °C)", fmt(product.viscosityKv40, "mm²/s")]);
  if (product.viscosityKv100 != null) kennwerte.push(["Kin. Viskosität (100 °C)", fmt(product.viscosityKv100, "mm²/s")]);
  if (product.flashpointC != null) kennwerte.push(["Flammpunkt", fmt(product.flashpointC, "°C")]);
  if (product.phConcentrate != null) kennwerte.push(["pH (Konzentrat)", fmt(product.phConcentrate)]);
  if (product.phEmulsionMin != null || product.phEmulsionMax != null) {
    const min = product.phEmulsionMin != null ? fmt(product.phEmulsionMin) : "–";
    const max = product.phEmulsionMax != null ? fmt(product.phEmulsionMax) : "–";
    kennwerte.push(["pH (Emulsion, Sollkonzentration)", `${min} – ${max}`]);
  }
  if (product.refractometerFactor != null)
    kennwerte.push(["Refraktometer-Faktor", fmt(product.refractometerFactor)]);
  if (product.recommendedConcentrationMin != null || product.recommendedConcentrationMax != null) {
    const min = product.recommendedConcentrationMin != null ? fmt(product.recommendedConcentrationMin) : "–";
    const max = product.recommendedConcentrationMax != null ? fmt(product.recommendedConcentrationMax) : "–";
    kennwerte.push(["Empf. Einsatzkonzentration", `${min} – ${max} % v/v`]);
  }
  if (product.typicalSumpLifeWeeks != null)
    kennwerte.push(["Typische Standzeit im Tank", `${product.typicalSumpLifeWeeks} Wochen`]);

  const kennzeichnungen: Array<[string, string]> = [];
  const bor = flag(product.containsBor);
  if (bor) kennzeichnungen.push(["Borhaltig", bor]);
  const fa = flag(product.containsFormaldehydeDepot);
  if (fa) kennzeichnungen.push(["Formaldehyd-Depotstoffe", fa]);
  const cl = flag(product.containsChlorine);
  if (cl) kennzeichnungen.push(["Chlorhaltig", cl]);
  const mo = flag(product.containsMineralOil);
  if (mo)
    kennzeichnungen.push([
      "Mineralöl",
      product.mineralOilContentPct != null ? `${mo} (${fmt(product.mineralOilContentPct)} %)` : mo,
    ]);

  const hasWater =
    product.waterHardnessMinDh != null ||
    product.waterHardnessMaxDh != null ||
    product.waterHardnessNotes;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Werkzeugleiste — erscheint nicht im Druck */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/products/${manufacturerSlug}/${productSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          <ArrowLeft size={14} /> Zurück zum Produkt
        </Link>
        <PrintButton />
      </div>

      {/* Das Dokument */}
      <article className="rounded-2xl bg-white p-8 shadow-soft ring-1 ring-slate-200 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="border-b-2 border-slate-900 pb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Technisches Datenblatt (TDS)
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {m.name} {product.name}
          </h1>
          <div className="mt-1 text-sm text-slate-600">
            {CATEGORY_LABEL[product.category] ?? product.category}
            {product.chemistry ? ` · ${CHEMISTRY_LABEL[product.chemistry] ?? product.chemistry}` : ""}
            {product.productFamily ? ` · Produktfamilie ${product.productFamily}` : ""}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Stand: {product.updatedAt.toLocaleDateString("de-CH")}
            {product.sourceConfidence ? ` · Datenlage: ${product.sourceConfidence}` : ""}
          </div>
        </header>

        {product.description && (
          <TdsSection n={1} title="Produktbeschreibung">
            <p className="text-sm leading-relaxed text-slate-700">{product.description}</p>
          </TdsSection>
        )}

        <TdsSection n={2} title="Anwendungsbereich">
          <dl className="space-y-2 text-sm">
            {product.applicationAreas.length > 0 && (
              <TdsRow label="Bearbeitungsverfahren" value={product.applicationAreas.join(", ")} />
            )}
            {product.suitableMaterials.length > 0 && (
              <TdsRow label="Geeignete Werkstoffe" value={product.suitableMaterials.join(", ")} />
            )}
            {product.unsuitableMaterials.length > 0 && (
              <TdsRow
                label="Nicht empfohlen für"
                value={product.unsuitableMaterials.join(", ")}
              />
            )}
            {product.productionType && (
              <TdsRow
                label="Produktionsumgebung"
                value={PRODUCTION_LABEL[product.productionType] ?? product.productionType}
              />
            )}
            {product.concentrateForm && (
              <TdsRow
                label="Erscheinungsform (angesetzt)"
                value={FORM_LABEL[product.concentrateForm] ?? product.concentrateForm}
              />
            )}
          </dl>
        </TdsSection>

        {kennwerte.length > 0 && (
          <TdsSection n={3} title="Typische Kennwerte">
            <table className="w-full text-sm">
              <tbody>
                {kennwerte.map(([label, value]) => (
                  <tr key={label} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-4 text-slate-600">{label}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              Typische Werte, keine Spezifikation.
            </p>
          </TdsSection>
        )}

        {hasWater && (
          <TdsSection n={4} title="Ansetzwasser">
            <dl className="space-y-2 text-sm">
              {(product.waterHardnessMinDh != null || product.waterHardnessMaxDh != null) && (
                <TdsRow
                  label="Empf. Wasserhärte"
                  value={`${product.waterHardnessMinDh ?? "–"} – ${product.waterHardnessMaxDh ?? "–"} °dH`}
                />
              )}
              {product.waterHardnessNotes && (
                <TdsRow label="Hinweis" value={product.waterHardnessNotes} />
              )}
            </dl>
          </TdsSection>
        )}

        {kennzeichnungen.length > 0 && (
          <TdsSection n={5} title="Inhaltsstoff-Kennzeichnung">
            <dl className="space-y-2 text-sm">
              {kennzeichnungen.map(([label, value]) => (
                <TdsRow key={label} label={label} value={value} />
              ))}
            </dl>
          </TdsSection>
        )}

        {product.certifications.length > 0 && (
          <TdsSection n={6} title="Freigaben, Normen & Zertifikate">
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {product.certifications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </TdsSection>
        )}

        {product.notes && (
          <TdsSection n={7} title="Hinweise aus der Praxis">
            <p className="text-sm leading-relaxed text-slate-700">{product.notes}</p>
          </TdsSection>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          Automatisch erzeugt aus der Brisco-Wissensbasis. Dieses Dokument ersetzt nicht das
          Original-Datenblatt des Herstellers.
          {product.dataSheetUrl && (
            <>
              {" "}
              <a
                href={product.dataSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline print:hidden"
              >
                Original-PDS des Herstellers <ExternalLink size={10} />
              </a>
            </>
          )}
        </footer>
      </article>
    </div>
  );
}

function TdsSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-800">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

function TdsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="shrink-0 text-slate-600">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
