import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ManufacturerLogo } from "@/components/ManufacturerLogo";
import { CompareRemoveButton } from "@/components/compare/CompareToggle";
import { GitCompare, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Produktvergleich — Brisco Marketplace",
};

const CATEGORY_LABEL: Record<string, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl",
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
  MINERAL: "Mineralöl",
  SEMI_SYNTHETIC: "Semi-synth.",
  SYNTHETIC: "Vollsynth.",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Andere",
};

type Row = {
  label: string;
  hint?: string;
  render: (p: NonNullable<Awaited<ReturnType<typeof loadProducts>>>[number]) => React.ReactNode;
  highlight?: boolean;
};

const ROWS: Row[] = [
  {
    label: "Kategorie",
    render: (p) => CATEGORY_LABEL[p.category] ?? p.category,
  },
  {
    label: "Chemie",
    render: (p) => (p.chemistry ? (CHEMISTRY_LABEL[p.chemistry] ?? p.chemistry) : null),
  },
  {
    label: "Produktfamilie",
    render: (p) => p.productFamily,
  },
  {
    label: "Refraktometer-Faktor",
    hint: "Brix-Ablesung × Faktor = Konzentration in %",
    highlight: true,
    render: (p) =>
      p.refractometerFactor != null ? (
        <span className="font-mono font-bold text-emerald-700">{p.refractometerFactor}</span>
      ) : null,
  },
  {
    label: "Empf. Konzentration",
    render: (p) =>
      p.recommendedConcentrationMin != null && p.recommendedConcentrationMax != null
        ? `${p.recommendedConcentrationMin}–${p.recommendedConcentrationMax} %`
        : null,
  },
  {
    label: "pH Emulsion",
    render: (p) =>
      p.phEmulsionMin != null
        ? p.phEmulsionMax != null && p.phEmulsionMin !== p.phEmulsionMax
          ? `${p.phEmulsionMin}–${p.phEmulsionMax}`
          : `${p.phEmulsionMin}`
        : null,
  },
  {
    label: "Wasserhärte (°dH)",
    hint: "Ansetzwasser-Härtebereich",
    render: (p) =>
      p.waterHardnessMinDh != null || p.waterHardnessMaxDh != null
        ? `${p.waterHardnessMinDh ?? 0}–${p.waterHardnessMaxDh ?? "?"} °dH`
        : null,
  },
  {
    label: "ISO VG",
    render: (p) => p.viscosityIso,
  },
  {
    label: "Viskosität 40 °C",
    render: (p) => (p.viscosityKv40 != null ? `${p.viscosityKv40} mm²/s` : null),
  },
  {
    label: "Dichte 20 °C",
    render: (p) => (p.densityGcm3 != null ? `${p.densityGcm3} g/cm³` : null),
  },
  {
    label: "Flammpunkt",
    render: (p) => (p.flashpointC != null ? `${p.flashpointC} °C` : null),
  },
  {
    label: "Bor",
    render: (p) =>
      p.containsBor == null
        ? null
        : p.containsBor
          ? <span className="text-amber-700">enthalten</span>
          : <span className="text-emerald-700">bor-frei</span>,
  },
  {
    label: "Formaldehyd-Depot",
    render: (p) =>
      p.containsFormaldehydeDepot == null
        ? null
        : p.containsFormaldehydeDepot
          ? <span className="text-amber-700">enthalten</span>
          : <span className="text-emerald-700">frei</span>,
  },
  {
    label: "Chlor",
    render: (p) =>
      p.containsChlorine == null
        ? null
        : p.containsChlorine
          ? <span className="text-amber-700">enthalten</span>
          : <span className="text-emerald-700">chlor-frei</span>,
  },
  {
    label: "Mineralöl",
    render: (p) =>
      p.mineralOilContentPct != null
        ? `${p.mineralOilContentPct} %`
        : p.containsMineralOil == null
          ? null
          : p.containsMineralOil
            ? "enthalten"
            : "frei",
  },
  {
    label: "Geeignet für",
    render: (p) =>
      p.suitableMaterials.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {p.suitableMaterials.map((m) => (
            <span key={m} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              ✓ {m}
            </span>
          ))}
        </div>
      ) : null,
  },
  {
    label: "Nicht geeignet für",
    render: (p) =>
      p.unsuitableMaterials.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {p.unsuitableMaterials.map((m) => (
            <span key={m} className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
              ✗ {m}
            </span>
          ))}
        </div>
      ) : null,
  },
  {
    label: "Anwendungen",
    render: (p) =>
      p.applicationAreas.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {p.applicationAreas.slice(0, 8).map((a) => (
            <span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
              {a}
            </span>
          ))}
        </div>
      ) : null,
  },
  {
    label: "Zertifikate / Freigaben",
    render: (p) =>
      p.certifications.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {p.certifications.map((c) => (
            <span key={c} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              {c}
            </span>
          ))}
        </div>
      ) : null,
  },
  {
    label: "Datenquelle",
    render: (p) => (
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
          p.sourceConfidence === "verifiziert"
            ? "bg-emerald-100 text-emerald-700"
            : p.sourceConfidence === "hersteller-doku"
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-600"
        }`}
      >
        {p.sourceConfidence}
      </span>
    ),
  },
];

async function loadProducts(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.product.findMany({
    where: { id: { in: ids } },
    include: { manufacturer: true },
  });
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? "").split(",").filter((s) => s.length > 0);
  const products = await loadProducts(ids);
  // Reihenfolge der URL-IDs beibehalten
  const sorted = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <GitCompare size={20} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">Produktvergleich</h1>
        </div>
        {sorted.length > 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            {sorted.length} Produkt{sorted.length === 1 ? "" : "e"} —
            Werte aus dem Brisco-Katalog. Felder ohne Eintrag sind nicht in der DB hinterlegt.
          </p>
        ) : null}
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-slate-400" />
          <p className="mt-2 text-sm text-slate-600">
            Keine Produkte zum Vergleichen ausgewählt.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Öffne einen Hersteller unter{" "}
            <Link href="/manufacturers" className="text-brand-600 hover:underline">
              /manufacturers
            </Link>{" "}
            und klicke das Vergleichs-Symbol bei den Produkten.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-10 min-w-[180px] bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Eigenschaft
                </th>
                {sorted.map((p) => (
                  <th
                    key={p.id}
                    className="min-w-[220px] border-l border-slate-200 px-3 py-3 text-left align-top"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-2">
                        <ManufacturerLogo
                          name={p.manufacturer.name}
                          logoPath={p.manufacturer.logoPath}
                          height={40}
                        />
                        <Link
                          href={`/products/${p.manufacturer.slug}/${p.slug}`}
                          className="text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[11px] text-slate-500">{p.manufacturer.name}</div>
                      </div>
                      <CompareRemoveButton productId={p.id} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                // Zeile nur zeigen wenn mindestens ein Produkt Daten liefert
                const cells = sorted.map((p) => row.render(p));
                const hasAny = cells.some((c) => c != null && c !== "" && c !== false);
                if (!hasAny) return null;
                return (
                  <tr
                    key={row.label}
                    className={`border-b border-slate-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    } ${row.highlight ? "bg-emerald-50/40" : ""}`}
                  >
                    <th className="sticky left-0 z-10 min-w-[180px] bg-inherit px-3 py-3 text-left align-top text-xs font-medium text-slate-600">
                      {row.label}
                      {row.hint ? (
                        <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                          {row.hint}
                        </div>
                      ) : null}
                    </th>
                    {cells.map((cell, idx) => (
                      <td
                        key={idx}
                        className="border-l border-slate-200 px-3 py-3 align-top text-sm"
                      >
                        {cell != null && cell !== "" ? (
                          cell
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <strong className="text-slate-700">Hinweis:</strong> Refraktometer-Faktor und
          Wasserhärte sind Hersteller-Angaben. Werte ohne „verifiziert"-Badge stammen
          aus Hersteller-Websites und sind nicht aus dem offiziellen Datenblatt extrahiert.
          Im Zweifel das aktuelle PDS/SDS des Herstellers konsultieren.
        </div>
      ) : null}
    </div>
  );
}
