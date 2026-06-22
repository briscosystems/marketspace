import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LiveFilterForm } from "@/components/LiveFilterForm";
import { Shield, Beaker, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";

type SearchParams = Promise<{
  view?: "material" | "ingredient";
  filterMaterial?: string;
  filterIngredient?: string;
  filterCategory?: string;
  filterRating?: string;
}>;

export const metadata = {
  title: "Materialien & Inhaltsstoff-Verträglichkeit — Brisco Marketplace",
};

const CATEGORY_LABEL: Record<string, string> = {
  ELASTOMER: "Elastomer (Dichtung)",
  THERMOPLASTIC: "Thermoplast (Kunststoff)",
  THERMOSET: "Duroplast",
  METAL: "Metall",
  COATING: "Beschichtung",
};

const INGREDIENT_CATEGORY_LABEL: Record<string, string> = {
  AMINE: "Amin",
  BIOCIDE: "Biozid",
  FORMALDEHYDE_RELEASER: "Formaldehyd-Donor",
  BASE_OIL_MINERAL: "Basisöl (mineralisch)",
  BASE_OIL_ESTER: "Basisöl (Ester)",
  BASE_OIL_PAO: "Basisöl (PAO)",
  BASE_OIL_PAG: "Basisöl (PAG)",
  EMULSIFIER: "Emulgator/Tensid",
  EP_ADDITIVE_S: "EP-Additiv (S)",
  EP_ADDITIVE_P: "EP-Additiv (P)",
  EP_ADDITIVE_CL: "EP-Additiv (Cl-Paraffin)",
  CORROSION_INHIBITOR: "Korrosionsinhibitor",
  BORATE: "Borat/Borsäure",
  CHELATE: "Chelat",
  GLYCOL_ETHER: "Glykolether",
  SOLVENT_AROMATIC: "Lösemittel (aromat.)",
  SOLVENT_POLAR: "Lösemittel (polar)",
  WATER: "Wasser",
  ACID: "Säure",
  ALKALI: "Lauge",
  OTHER: "Andere",
};

const RATING_STYLE: Record<string, { icon: typeof CheckCircle2; bg: string; text: string; label: string }> = {
  RECOMMENDED: {
    icon: CheckCircle2,
    bg: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    text: "text-emerald-700",
    label: "empfohlen",
  },
  COMPATIBLE: {
    icon: CheckCircle2,
    bg: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    text: "text-emerald-700",
    label: "verträglich",
  },
  CAUTION: {
    icon: AlertTriangle,
    bg: "bg-amber-100 text-amber-800 ring-amber-200",
    text: "text-amber-800",
    label: "Vorsicht",
  },
  UNSUITABLE: {
    icon: AlertOctagon,
    bg: "bg-red-100 text-red-800 ring-red-200",
    text: "text-red-800",
    label: "ungeeignet",
  },
};

export default async function MaterialsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const view = sp.view ?? "material";

  const [materials, ingredients] = await Promise.all([
    prisma.material.findMany({
      orderBy: [{ category: "asc" }, { shortName: "asc" }],
    }),
    prisma.ingredient.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 page-title">
          <Shield size={24} className="text-brand-600" />
          Materialien & Inhaltsstoff-Verträglichkeit
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Welche Inhaltsstoffe (Amine, Biozide, Basisöle, …) greifen welche Dichtungs- und
          Kunststoffwerkstoffe an? {materials.length} Materialien, {ingredients.length} Inhaltsstoffe,
          Verträglichkeitsmatrix auf Basis von ISM Compatibility Chart, Trelleborg und O-Ring Prüflabor Richter.
        </p>
      </div>

      {/* Tabs: Material-View vs. Inhaltsstoff-View */}
      <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-200">
        <Link
          href="/materials?view=material"
          className={`px-4 py-2 text-sm font-medium transition ${
            view === "material" ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Shield size={14} className="mr-1 inline" /> Nach Material
        </Link>
        <Link
          href="/materials?view=ingredient"
          className={`px-4 py-2 text-sm font-medium transition ${
            view === "ingredient" ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Beaker size={14} className="mr-1 inline" /> Nach Inhaltsstoff
        </Link>
      </div>

      {view === "material" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((m) => (
            <Link
              key={m.id}
              href={`/materials/${m.slug}`}
              className="card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold">{m.shortName}</div>
                  <div className="text-sm text-slate-600">{m.name}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {CATEGORY_LABEL[m.category] ?? m.category}
                </span>
              </div>
              {m.description && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{m.description}</p>
              )}
              {m.temperatureMinC !== null && m.temperatureMaxC !== null && (
                <div className="mt-2 text-xs text-slate-500">
                  Einsatztemperatur: {m.temperatureMinC} °C bis {m.temperatureMaxC} °C
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((i) => (
            <Link
              key={i.id}
              href={`/materials?view=ingredient&filterIngredient=${i.slug}`}
              className="card flex items-baseline justify-between transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold">{i.name}</span>
                  {i.shortName && i.shortName !== i.name && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {i.shortName}
                    </span>
                  )}
                  {i.isSvhc && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      SVHC
                    </span>
                  )}
                </div>
                {i.functionInFluid && (
                  <p className="mt-1 text-sm text-slate-600">{i.functionInFluid}</p>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  {INGREDIENT_CATEGORY_LABEL[i.category]} · CAS{" "}
                  {i.casNumbers.length > 0 ? i.casNumbers.join(", ") : "—"}
                  {i.typicalConcentrationPct ? ` · typ. ${i.typicalConcentrationPct}%` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Volle Matrix */}
      <CompatibilityMatrix />
    </div>
  );
}

async function CompatibilityMatrix() {
  const [materials, ingredients, compat] = await Promise.all([
    prisma.material.findMany({
      orderBy: [{ category: "asc" }, { shortName: "asc" }],
    }),
    prisma.ingredient.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.ingredientMaterialCompatibility.findMany(),
  ]);

  const matrix = new Map<string, Map<string, (typeof compat)[0]>>();
  for (const c of compat) {
    if (!matrix.has(c.ingredientId)) matrix.set(c.ingredientId, new Map());
    matrix.get(c.ingredientId)!.set(c.materialId, c);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-title">Vollständige Verträglichkeitsmatrix</h2>
        <div className="flex gap-2 text-xs">
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">empfohlen</span>
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">verträglich</span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">Vorsicht</span>
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">ungeeignet</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-slate-200 bg-white px-2 py-2 text-left">
                Inhaltsstoff ↓ Material →
              </th>
              {materials.map((m) => (
                <th
                  key={m.id}
                  className="border-b border-l border-slate-200 px-2 py-2 text-center font-semibold whitespace-nowrap"
                  title={m.name}
                >
                  <Link href={`/materials/${m.slug}`} className="hover:underline">
                    {m.shortName}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-2 py-1.5 text-left">
                  <div className="font-medium">{i.shortName ?? i.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {INGREDIENT_CATEGORY_LABEL[i.category]}
                  </div>
                </td>
                {materials.map((m) => {
                  const c = matrix.get(i.id)?.get(m.id);
                  if (!c)
                    return (
                      <td key={m.id} className="border-b border-l border-slate-100 px-2 py-1 text-center text-slate-300">
                        —
                      </td>
                    );
                  const s = RATING_STYLE[c.rating];
                  const Icon = s.icon;
                  return (
                    <td
                      key={m.id}
                      className={`border-b border-l border-slate-100 px-1 py-1 text-center ${s.bg.split(" ")[0]}`}
                      title={c.note}
                    >
                      <Icon size={14} className={`mx-auto ${s.text}`} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Quellen: ISM Compatibility Chart (Dec 2018), Trelleborg Chemical Compatibility DB,
        Parker Praedifa O-Ring Handbook, O-Ring Prüflabor Richter Schadensanalyse.
        Bewertungen indikativ — vor Auswahl Versuche bei Anwendungstemperatur durchführen.
      </p>
    </div>
  );
}
