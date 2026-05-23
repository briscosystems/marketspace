import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManufacturerLogo } from "@/components/ManufacturerLogo";
import { RefractometerCalculator } from "@/components/RefractometerCalculator";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { recommendMaterialsForProduct } from "@/lib/seal-recommendations";
import { Droplets, Beaker, FileText, ExternalLink, AlertTriangle, Shield, AlertOctagon, CheckCircle2, FileSearch } from "lucide-react";

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

const COMPAT_STYLE: Record<string, string> = {
  RECOMMENDED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  COMPATIBLE: "border-slate-300 bg-slate-50 text-slate-700",
  CAUTION: "border-amber-300 bg-amber-50 text-amber-800",
  UNSUITABLE: "border-rose-300 bg-rose-50 text-rose-800",
};

const COMPAT_LABEL: Record<string, string> = {
  RECOMMENDED: "Empfohlen",
  COMPATIBLE: "Geeignet",
  CAUTION: "Vorsicht",
  UNSUITABLE: "Nicht geeignet",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ manufacturerSlug: string; productSlug: string }>;
}) {
  const { manufacturerSlug, productSlug } = await params;
  const m = await prisma.manufacturer.findUnique({ where: { slug: manufacturerSlug } });
  if (!m) notFound();

  const product = await prisma.product.findUnique({
    where: { manufacturerId_slug: { manufacturerId: m.id, slug: productSlug } },
    include: {
      compatibilityNotes: true,
      safetyDataSheet: {
        select: {
          id: true,
          language: true,
          pageCount: true,
          signalWord: true,
          hStatements: true,
          reachCompliant: true,
          svhcSubstances: true,
          containsBoron: true,
          containsFormaldehydeReleaser: true,
          containsSecondaryAmines: true,
          containsChlorinatedParaffins: true,
          phValue: true,
          flashpointC: true,
          densityGcm3: true,
        },
      },
    },
  });
  if (!product) notFound();

  // Allgemeines Material-Wissen (scope = "general") für die Werkstoffe in suitable + unsuitable
  const materials = [...product.suitableMaterials, ...product.unsuitableMaterials];
  const generalNotes = await prisma.materialCompatibilityNote.findMany({
    where: {
      scope: "general",
      productId: null,
      OR: [
        { material: { in: materials } },
        { material: "Ansetzwasser (Allgemein)" },
      ],
    },
    orderBy: [{ material: "asc" }, { compatibility: "asc" }],
  });

  // Berechnete Dichtungs-/Kunststoff-Empfehlung basierend auf Produkt-Chemie
  const sealRec = await recommendMaterialsForProduct({
    category: product.category,
    chemistry: product.chemistry,
    containsBor: product.containsBor,
    containsFormaldehydeDepot: product.containsFormaldehydeDepot,
    containsMineralOil: product.containsMineralOil,
    containsChlorine: product.containsChlorine,
  });

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link href="/manufacturers" className="text-brand-600 hover:underline">
          Hersteller
        </Link>{" "}
        →{" "}
        <Link
          href={`/manufacturers/${m.slug}`}
          className="text-brand-600 hover:underline"
        >
          {m.name}
        </Link>
      </nav>

      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <ManufacturerLogo name={m.name} logoPath={m.logoPath} height={64} />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">{m.name}</div>
          <h1 className="mt-0.5 text-2xl font-bold text-slate-900">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {CATEGORY_LABEL[product.category] ?? product.category}
            </span>
            {product.chemistry ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                {CHEMISTRY_LABEL[product.chemistry] ?? product.chemistry}
              </span>
            ) : null}
            {product.productFamily ? (
              <span className="text-xs text-slate-500">Familie: {product.productFamily}</span>
            ) : null}
            <span className="text-xs text-slate-400">·</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                product.sourceConfidence === "verifiziert"
                  ? "bg-emerald-100 text-emerald-700"
                  : product.sourceConfidence === "hersteller-doku"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
              }`}
              title="Daten-Vertrauenslevel"
            >
              {product.sourceConfidence}
            </span>
          </div>
          {product.description ? (
            <p className="mt-3 text-sm text-slate-700">{product.description}</p>
          ) : null}
          <div className="mt-3">
            <CompareToggle id={product.id} kind="products" />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LINKE SPALTE: Technische Daten + Werkstoffe */}
        <div className="space-y-5 lg:col-span-2">
          {/* Anwendung & Werkstoffe */}
          {(product.applicationAreas.length > 0 ||
            product.suitableMaterials.length > 0 ||
            product.unsuitableMaterials.length > 0) && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Anwendung & Werkstoffe</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {product.applicationAreas.length > 0 ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bearbeitungsverfahren
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.applicationAreas.map((a) => (
                        <span
                          key={a}
                          className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {product.suitableMaterials.length > 0 ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                      Geeignet für
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.suitableMaterials.map((m) => (
                        <span
                          key={m}
                          className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        >
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {product.unsuitableMaterials.length > 0 ? (
                  <div className="sm:col-span-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-rose-600">
                      Nicht geeignet für
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.unsuitableMaterials.map((m) => (
                        <span
                          key={m}
                          className="rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
                        >
                          ✗ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {/* Empfohlene Dichtungs- und Kunststoffwerkstoffe (berechnet) */}
          {sealRec.recommendations.length > 0 && (
            <SealCompatibilitySection
              recommendations={sealRec.recommendations}
              inferredIngredients={sealRec.inferredIngredients}
            />
          )}

          {/* Verlinktes SDS aus eigener Bibliothek */}
          {product.safetyDataSheet && <LinkedSdsCard sds={product.safetyDataSheet} />}

          {/* Technische Daten */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Beaker size={16} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">Technische Daten</h2>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <DataRow
                label="Refraktometer-Faktor"
                value={
                  product.refractometerFactor != null
                    ? `${product.refractometerFactor} (Brix × Faktor = % Konz.)`
                    : null
                }
                highlight
              />
              <DataRow
                label="Empfohlene Konzentration"
                value={
                  product.recommendedConcentrationMin != null && product.recommendedConcentrationMax != null
                    ? `${product.recommendedConcentrationMin}–${product.recommendedConcentrationMax} %`
                    : null
                }
              />
              <DataRow label="pH (Konzentrat)" value={product.phConcentrate?.toString() ?? null} />
              <DataRow
                label="pH (Emulsion)"
                value={
                  product.phEmulsionMin != null
                    ? product.phEmulsionMax != null && product.phEmulsionMin !== product.phEmulsionMax
                      ? `${product.phEmulsionMin}–${product.phEmulsionMax}`
                      : `${product.phEmulsionMin}`
                    : null
                }
              />
              <DataRow label="ISO VG" value={product.viscosityIso} />
              <DataRow
                label="Viskosität @40°C"
                value={product.viscosityKv40 != null ? `${product.viscosityKv40} mm²/s` : null}
              />
              <DataRow
                label="Dichte @20°C"
                value={product.densityGcm3 != null ? `${product.densityGcm3} g/cm³` : null}
              />
              <DataRow
                label="Flammpunkt"
                value={product.flashpointC != null ? `${product.flashpointC} °C` : null}
              />
              <DataRow label="Bor-frei" value={booleanLabel(product.containsBor, true)} />
              <DataRow
                label="Formaldehyd-Depot"
                value={booleanLabel(product.containsFormaldehydeDepot)}
              />
              <DataRow label="Chlor-frei" value={booleanLabel(product.containsChlorine, true)} />
              <DataRow
                label="Mineralöl"
                value={
                  product.mineralOilContentPct != null
                    ? `${product.mineralOilContentPct} %`
                    : booleanLabel(product.containsMineralOil)
                }
              />
            </dl>
            {product.certifications.length > 0 ? (
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Zertifikate / Freigaben
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.certifications.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Ansetzwasser */}
          {(product.waterHardnessMinDh != null ||
            product.waterHardnessMaxDh != null ||
            product.waterHardnessNotes) && (
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-blue-600" />
                <h2 className="font-semibold text-slate-900">Ansetzwasser-Anforderung</h2>
              </div>
              {product.waterHardnessMinDh != null || product.waterHardnessMaxDh != null ? (
                <div className="mt-2 font-mono text-lg font-bold text-blue-900">
                  {product.waterHardnessMinDh ?? 0}–{product.waterHardnessMaxDh ?? "?"} °dH
                </div>
              ) : null}
              {product.waterHardnessNotes ? (
                <p className="mt-2 text-sm text-slate-700">{product.waterHardnessNotes}</p>
              ) : null}
            </section>
          )}

          {/* Werkstoff-Wissen */}
          {generalNotes.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h2 className="font-semibold text-slate-900">
                  Allgemeine Werkstoff-Hinweise
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Branchen-Wissen zu den für dieses Produkt relevanten Werkstoffen und zum Ansetzwasser.
              </p>
              <div className="mt-3 space-y-2">
                {generalNotes.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 text-sm ${COMPAT_STYLE[n.compatibility]}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {n.material}
                        {n.condition ? <span className="font-normal"> · {n.condition}</span> : null}
                      </span>
                      <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        {COMPAT_LABEL[n.compatibility]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">{n.note}</p>
                    {n.sourceLabel ? (
                      <div className="mt-1 text-[10px] opacity-70">
                        Quelle: {n.sourceLabel}
                        {n.sourceUrl ? (
                          <a
                            href={n.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 underline"
                          >
                            ↗
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Notes */}
          {product.notes ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <strong>Hinweis:</strong> {product.notes}
            </section>
          ) : null}
        </div>

        {/* RECHTE SPALTE: Refraktometer-Rechner + Quellen */}
        <aside className="space-y-5">
          <RefractometerCalculator
            productName={product.name}
            factor={product.refractometerFactor}
            recommendedMin={product.recommendedConcentrationMin}
            recommendedMax={product.recommendedConcentrationMax}
          />

          {(product.sourceUrl || product.dataSheetUrl || product.sdsUrl) && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-600" />
                <h3 className="font-semibold text-slate-900">Quellen & Doku</h3>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {product.sourceUrl ? (
                  <li>
                    <a
                      href={product.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      Hersteller-Seite <ExternalLink size={11} />
                    </a>
                  </li>
                ) : null}
                {product.dataSheetUrl ? (
                  <li>
                    <a
                      href={product.dataSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      Tech. Datenblatt (PDS) <ExternalLink size={11} />
                    </a>
                  </li>
                ) : null}
                {product.sdsUrl ? (
                  <li>
                    <a
                      href={product.sdsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      Sicherheitsdatenblatt (SDS) <ExternalLink size={11} />
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 py-1 last:border-none">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={`text-right text-sm ${
          value == null
            ? "text-slate-300"
            : highlight
              ? "font-mono font-semibold text-brand-700"
              : "font-medium text-slate-800"
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function booleanLabel(v: boolean | null | undefined, invertForFreiPrefix?: boolean): string | null {
  if (v == null) return null;
  if (invertForFreiPrefix) return v ? "nein (enthält)" : "ja";
  return v ? "ja" : "nein";
}

const SEAL_RATING_STYLE: Record<
  "RECOMMENDED" | "COMPATIBLE" | "CAUTION" | "UNSUITABLE",
  { bg: string; border: string; text: string; iconColor: string; label: string }
> = {
  RECOMMENDED: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-800",
    iconColor: "text-emerald-600",
    label: "empfohlen",
  },
  COMPATIBLE: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    iconColor: "text-green-600",
    label: "geeignet",
  },
  CAUTION: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-900",
    iconColor: "text-amber-600",
    label: "Vorsicht",
  },
  UNSUITABLE: {
    bg: "bg-rose-50",
    border: "border-rose-300",
    text: "text-rose-900",
    iconColor: "text-rose-600",
    label: "nicht geeignet",
  },
};

function LinkedSdsCard({
  sds,
}: {
  sds: {
    id: string;
    language: string;
    pageCount: number | null;
    signalWord: string | null;
    hStatements: string[];
    reachCompliant: boolean | null;
    svhcSubstances: string[];
    containsBoron: boolean | null;
    containsFormaldehydeReleaser: boolean | null;
    containsSecondaryAmines: boolean | null;
    containsChlorinatedParaffins: boolean | null;
    phValue: number | null;
    flashpointC: number | null;
    densityGcm3: number | null;
  };
}) {
  const flags: { label: string; v: boolean | null; tone: "neg" | "neutral" }[] = [
    { label: "Bor/Borate", v: sds.containsBoron, tone: "neg" },
    { label: "Formaldehyd-Donor", v: sds.containsFormaldehydeReleaser, tone: "neg" },
    { label: "sek. Amine", v: sds.containsSecondaryAmines, tone: "neg" },
    { label: "Chlorparaffine", v: sds.containsChlorinatedParaffins, tone: "neg" },
  ];
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSearch size={16} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">Sicherheitsdatenblatt</h2>
        </div>
        <Link
          href={`/sds/${sds.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          SDS öffnen <ExternalLink size={12} />
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {sds.signalWord && (
          <span
            className={`rounded px-2 py-0.5 font-bold uppercase ${
              /gefahr|danger/i.test(sds.signalWord)
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {sds.signalWord}
          </span>
        )}
        <span className="text-slate-500">
          {sds.language} · {sds.pageCount ?? "?"} Seiten
        </span>
        {sds.reachCompliant === true && (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
            REACH ✓
          </span>
        )}
        {sds.reachCompliant === false && (
          <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700 ring-1 ring-rose-200">
            nicht REACH-konform
          </span>
        )}
        {sds.svhcSubstances.length > 0 && (
          <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-800 ring-1 ring-rose-300">
            SVHC ({sds.svhcSubstances.length})
          </span>
        )}
      </div>

      {/* Physiko-Werte aus SDS, falls vorhanden */}
      {(sds.phValue !== null || sds.flashpointC !== null || sds.densityGcm3 !== null) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-700">
          {sds.phValue !== null && <span>pH: <strong>{sds.phValue.toFixed(1)}</strong></span>}
          {sds.flashpointC !== null && (
            <span>
              Flammpunkt: <strong>{sds.flashpointC} °C</strong>
            </span>
          )}
          {sds.densityGcm3 !== null && (
            <span>
              Dichte: <strong>{sds.densityGcm3.toFixed(3)} g/cm³</strong>
            </span>
          )}
        </div>
      )}

      {/* H-Sätze */}
      {sds.hStatements.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            H-Sätze
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {sds.hStatements.slice(0, 12).map((h) => (
              <span key={h} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200">
                {h}
              </span>
            ))}
            {sds.hStatements.length > 12 && (
              <span className="text-[10px] text-slate-400">+{sds.hStatements.length - 12}</span>
            )}
          </div>
        </div>
      )}

      {/* Inhaltsstoff-Flags */}
      {flags.some((f) => f.v !== null) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {flags.map((f) => {
            if (f.v === null) return null;
            if (f.v === true)
              return (
                <span key={f.label} className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200">
                  ⚠ {f.label}: enthält
                </span>
              );
            return (
              <span key={f.label} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 ring-1 ring-emerald-200">
                ✓ {f.label}: frei
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SealCompatibilitySection({
  recommendations,
  inferredIngredients,
}: {
  recommendations: import("@/lib/seal-recommendations").MaterialRec[];
  inferredIngredients: { slug: string; name: string; why: string }[];
}) {
  const groups: Record<"UNSUITABLE" | "CAUTION" | "COMPATIBLE" | "RECOMMENDED", typeof recommendations> = {
    UNSUITABLE: [],
    CAUTION: [],
    COMPATIBLE: [],
    RECOMMENDED: [],
  };
  for (const r of recommendations) groups[r.worstRating].push(r);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900">Empfohlene Dichtungs- &amp; Kunststoff-Werkstoffe</h2>
        </div>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          modelliert
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Basierend auf Chemie und Markierungen dieses Produkts. Werkstoffe sind nach{" "}
        <Link href="/materials" className="text-brand-600 hover:underline">
          Verträglichkeitsmatrix
        </Link>{" "}
        ISM/Trelleborg/Parker bewertet. Vor Anwendung Praxisversuche bei Einsatztemperatur empfohlen.
      </p>

      {/* Empfehlungs-Chips, nach Severität gruppiert */}
      <div className="mt-4 space-y-3">
        {(["UNSUITABLE", "CAUTION", "COMPATIBLE", "RECOMMENDED"] as const).map((bucket) => {
          const items = groups[bucket];
          if (items.length === 0) return null;
          const s = SEAL_RATING_STYLE[bucket];
          const Icon =
            bucket === "UNSUITABLE"
              ? AlertOctagon
              : bucket === "CAUTION"
                ? AlertTriangle
                : CheckCircle2;
          return (
            <div key={bucket}>
              <div className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${s.text}`}>
                <Icon size={12} className={s.iconColor} />
                {s.label} ({items.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((r) => (
                  <Link
                    key={r.materialId}
                    href={`/materials/${r.materialSlug}`}
                    className={`group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:shadow-sm ${s.bg} ${s.border} ${s.text}`}
                    title={
                      r.drivers.length > 0
                        ? r.drivers.map((d) => `${d.ingredientName}: ${d.rating} — ${d.note}`).join(" | ")
                        : `Verträglich gegen alle abgeleiteten Inhaltsstoffe`
                    }
                  >
                    {r.materialShortName}
                    {r.materialCategory === "THERMOPLASTIC" && (
                      <span className="text-[9px] opacity-60">(Kunststoff)</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver-Details für die kritischen Materialien */}
      {groups.UNSUITABLE.length + groups.CAUTION.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Begründung
          </div>
          <div className="mt-2 space-y-2 text-xs">
            {[...groups.UNSUITABLE, ...groups.CAUTION].slice(0, 6).map((r) => (
              <div key={r.materialId} className="rounded bg-slate-50 p-2">
                <div className="font-medium text-slate-800">
                  {r.materialShortName} — {SEAL_RATING_STYLE[r.worstRating].label}
                </div>
                <ul className="mt-1 list-disc pl-4 text-slate-600">
                  {r.drivers.slice(0, 3).map((d, i) => (
                    <li key={i}>
                      <span className="font-medium">{d.ingredientName}:</span> {d.note}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inferenz-Transparenz: welche Inhaltsstoffe wurden angenommen */}
      <details className="mt-4 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
          Angenommene Inhaltsstoffe ({inferredIngredients.length}) anzeigen
        </summary>
        <ul className="mt-2 space-y-1 text-xs">
          {inferredIngredients.map((i) => (
            <li key={i.slug} className="rounded bg-slate-50 px-2 py-1">
              <span className="font-medium text-slate-800">{i.name}</span>
              <span className="text-slate-600"> — {i.why}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
