import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { PrintButton } from "@/components/PrintButton";
import { ArrowLeft, ExternalLink } from "lucide-react";

// Technisches Datenblatt (TDS) — automatisch aus den strukturierten
// Produktfeldern der Wissensbasis erzeugt, druckfreundlich aufbereitet.
// Es beschreibt, was das Produkt KANN (Kennwerte, Anwendung) — das
// Gegenstück zum Sicherheitsdatenblatt.

function fmt(v: number, unit?: string): string {
  return `${v.toLocaleString("de-CH")}${unit ? ` ${unit}` : ""}`;
}

function flag(v: boolean | null, t: (k: string) => string): string | null {
  if (v === null) return null;
  return v ? t("tds.yes") : t("tds.no");
}

export default async function TdsPage({
  params,
}: {
  params: Promise<{ manufacturerSlug: string; productSlug: string }>;
}) {
  const t = await getT();
  const { manufacturerSlug, productSlug } = await params;
  const m = await prisma.manufacturer.findUnique({ where: { slug: manufacturerSlug } });
  if (!m) notFound();
  const product = await prisma.product.findUnique({
    where: { manufacturerId_slug: { manufacturerId: m.id, slug: productSlug } },
  });
  if (!product) notFound();

  // Kennwert-Zeilen — nur befüllte Felder erscheinen im Dokument
  const kennwerte: Array<[string, string]> = [];
  if (product.densityGcm3 != null) kennwerte.push([t("tds.density"), fmt(product.densityGcm3, "g/cm³")]);
  if (product.viscosityIso) kennwerte.push([t("tds.isoViscosityClass"), `ISO VG ${product.viscosityIso}`]);
  if (product.viscosityKv40 != null) kennwerte.push([t("tds.kinViscosity40"), fmt(product.viscosityKv40, "mm²/s")]);
  if (product.viscosityKv100 != null) kennwerte.push([t("tds.kinViscosity100"), fmt(product.viscosityKv100, "mm²/s")]);
  if (product.flashpointC != null) kennwerte.push([t("tds.flashpoint"), fmt(product.flashpointC, "°C")]);
  if (product.phConcentrate != null) kennwerte.push([t("tds.phConcentrate"), fmt(product.phConcentrate)]);
  if (product.phEmulsionMin != null || product.phEmulsionMax != null) {
    const min = product.phEmulsionMin != null ? fmt(product.phEmulsionMin) : "–";
    const max = product.phEmulsionMax != null ? fmt(product.phEmulsionMax) : "–";
    kennwerte.push([t("tds.phEmulsion"), `${min} – ${max}`]);
  }
  if (product.refractometerFactor != null)
    kennwerte.push([t("tds.refractometerFactor"), fmt(product.refractometerFactor)]);
  if (product.recommendedConcentrationMin != null || product.recommendedConcentrationMax != null) {
    const min = product.recommendedConcentrationMin != null ? fmt(product.recommendedConcentrationMin) : "–";
    const max = product.recommendedConcentrationMax != null ? fmt(product.recommendedConcentrationMax) : "–";
    kennwerte.push([t("tds.recommendedConcentration"), `${min} – ${max} % v/v`]);
  }
  if (product.typicalSumpLifeWeeks != null)
    kennwerte.push([t("tds.sumpLife"), `${product.typicalSumpLifeWeeks} ${t("tds.weeks")}`]);

  const kennzeichnungen: Array<[string, string]> = [];
  const bor = flag(product.containsBor, t);
  if (bor) kennzeichnungen.push([t("tds.containsBoron"), bor]);
  const fa = flag(product.containsFormaldehydeDepot, t);
  if (fa) kennzeichnungen.push([t("tds.formaldehydeDepot"), fa]);
  const cl = flag(product.containsChlorine, t);
  if (cl) kennzeichnungen.push([t("tds.containsChlorine"), cl]);
  const mo = flag(product.containsMineralOil, t);
  if (mo)
    kennzeichnungen.push([
      t("tds.mineralOil"),
      product.mineralOilContentPct != null ? `${mo} (${fmt(product.mineralOilContentPct)} %)` : mo,
    ]);

  const hasWater =
    product.waterHardnessMinDh != null ||
    product.waterHardnessMaxDh != null ||
    product.waterHardnessNotes;

  let abschnitt = 0;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Werkzeugleiste — erscheint nicht im Druck */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/products/${manufacturerSlug}/${productSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          <ArrowLeft size={14} /> {t("tds.backToProduct")}
        </Link>
        <PrintButton />
      </div>

      {/* Das Dokument */}
      <article className="rounded-2xl bg-white p-8 shadow-soft ring-1 ring-slate-200 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="border-b-2 border-slate-900 pb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t("tds.docType")}
          </div>
          <h1 className="page-title mt-1">
            {m.name} {product.name}
          </h1>
          <div className="mt-1 text-sm text-slate-600">
            {t(`cat.${product.category}`)}
            {product.chemistry ? ` · ${t(`chem.${product.chemistry}`)}` : ""}
            {product.productFamily ? ` · ${t("tds.productFamily")} ${product.productFamily}` : ""}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t("tds.asOf")} {product.updatedAt.toLocaleDateString("de-CH")}
            {product.sourceConfidence ? ` · ${t("tds.dataStatus")} ${product.sourceConfidence}` : ""}
          </div>
        </header>

        {/* Laufender Zähler statt fester Nummern: Abschnitte sind bedingt —
            feste Nummern hinterließen Lücken („2., 5., 7.") im Dokument. */}
        {product.description && (
          <TdsSection n={++abschnitt} title={t("tds.secDescription")}>
            <p className="text-sm leading-relaxed text-slate-700">{product.description}</p>
          </TdsSection>
        )}

        <TdsSection n={++abschnitt} title={t("tds.secApplication")}>
          <dl className="space-y-2 text-sm">
            {product.applicationAreas.length > 0 && (
              <TdsRow label={t("tds.rowProcesses")} value={product.applicationAreas.join(", ")} />
            )}
            {product.suitableMaterials.length > 0 && (
              <TdsRow label={t("tds.rowSuitableMaterials")} value={product.suitableMaterials.join(", ")} />
            )}
            {product.unsuitableMaterials.length > 0 && (
              <TdsRow
                label={t("tds.rowUnsuitable")}
                value={product.unsuitableMaterials.join(", ")}
              />
            )}
            {product.productionType && (
              <TdsRow
                label={t("tds.rowProductionEnv")}
                value={t(`tds.prod.${product.productionType}`)}
              />
            )}
            {product.concentrateForm && (
              <TdsRow
                label={t("tds.rowForm")}
                value={t(`tds.form.${product.concentrateForm}`)}
              />
            )}
          </dl>
        </TdsSection>

        {kennwerte.length > 0 && (
          <TdsSection n={++abschnitt} title={t("tds.secKeyValues")}>
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
              {t("tds.typicalValuesNote")}
            </p>
          </TdsSection>
        )}

        {hasWater && (
          <TdsSection n={++abschnitt} title={t("tds.secWater")}>
            <dl className="space-y-2 text-sm">
              {(product.waterHardnessMinDh != null || product.waterHardnessMaxDh != null) && (
                <TdsRow
                  label={t("tds.rowWaterHardness")}
                  value={`${product.waterHardnessMinDh ?? "–"} – ${product.waterHardnessMaxDh ?? "–"} °dH`}
                />
              )}
              {product.waterHardnessNotes && (
                <TdsRow label={t("tds.rowNote")} value={product.waterHardnessNotes} />
              )}
            </dl>
          </TdsSection>
        )}

        {kennzeichnungen.length > 0 && (
          <TdsSection n={++abschnitt} title={t("tds.secLabeling")}>
            <dl className="space-y-2 text-sm">
              {kennzeichnungen.map(([label, value]) => (
                <TdsRow key={label} label={label} value={value} />
              ))}
            </dl>
          </TdsSection>
        )}

        {product.certifications.length > 0 && (
          <TdsSection n={++abschnitt} title={t("tds.secCertifications")}>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {product.certifications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </TdsSection>
        )}

        {product.notes && (
          <TdsSection n={++abschnitt} title={t("tds.secNotes")}>
            <p className="text-sm leading-relaxed text-slate-700">{product.notes}</p>
          </TdsSection>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          {t("tds.footerNote")}
          {product.dataSheetUrl && (
            <>
              {" "}
              <a
                href={product.dataSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline print:hidden"
              >
                {t("tds.originalPds")} <ExternalLink size={10} />
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
