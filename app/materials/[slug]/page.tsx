import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Shield, AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";

type Params = Promise<{ slug: string }>;

const CATEGORY_LABEL: Record<string, string> = {
  ELASTOMER: "Elastomer (Dichtung)",
  THERMOPLASTIC: "Thermoplast",
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

const EFFECT_LABEL: Record<string, string> = {
  SWELLING: "Quellung",
  SHRINKAGE: "Schwund",
  HARDENING: "Verhärtung",
  EMBRITTLEMENT: "Versprödung",
  EXTRACTION: "Extraktion von Additiven",
  ATTACK_NETWORK: "Angriff Vernetzungsnetz",
  NONE: "keine Wirkung",
};

const RATING_ORDER = ["UNSUITABLE", "CAUTION", "COMPATIBLE", "RECOMMENDED"];

export default async function MaterialDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const material = await prisma.material.findUnique({
    where: { slug },
    include: {
      compatibilities: {
        include: { ingredient: true },
        orderBy: { rating: "asc" },
      },
    },
  });
  if (!material) notFound();

  // Bewertungen gruppieren
  const grouped: Record<string, typeof material.compatibilities> = {
    UNSUITABLE: [],
    CAUTION: [],
    COMPATIBLE: [],
    RECOMMENDED: [],
  };
  for (const c of material.compatibilities) grouped[c.rating]?.push(c);

  return (
    <div className="space-y-6">
      <Link
        href="/materials"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600"
      >
        <ArrowLeft size={14} /> Alle Materialien
      </Link>

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="page-title">{material.shortName}</h1>
              <span className="text-sm text-slate-500">— {material.name}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                {CATEGORY_LABEL[material.category] ?? material.category}
              </span>
              {material.temperatureMinC !== null && material.temperatureMaxC !== null && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700">
                  {material.temperatureMinC} °C bis {material.temperatureMaxC} °C
                </span>
              )}
              {material.isPolar !== null && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                  {material.isPolar ? "polar" : "unpolar"}
                </span>
              )}
              {material.parentSlug && (
                <Link
                  href={`/materials/${material.parentSlug}`}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 hover:bg-slate-200"
                >
                  Subtyp von {material.parentSlug}
                </Link>
              )}
            </div>
          </div>
          <Shield size={28} className="text-brand-600" />
        </div>
        {material.description && (
          <p className="mt-3 text-sm text-slate-700">{material.description}</p>
        )}
        {material.typicalUseCases.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Typischer Einsatz:</span>
            {material.typicalUseCases.map((u) => (
              <span key={u} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Inhaltsstoffe nach Verträglichkeit sortiert */}
      <div className="space-y-4">
        {grouped.UNSUITABLE.length > 0 && (
          <CompatGroup
            title="Ungeeignete Inhaltsstoffe"
            subtitle="Diese Stoffe greifen das Material an oder zerstören es"
            icon={AlertOctagon}
            iconColor="text-red-600"
            items={grouped.UNSUITABLE}
          />
        )}
        {grouped.CAUTION.length > 0 && (
          <CompatGroup
            title="Mit Vorsicht / bedingt geeignet"
            subtitle="Einsatz möglich, aber Temperatur, Dauer oder Konzentration kritisch prüfen"
            icon={AlertTriangle}
            iconColor="text-amber-600"
            items={grouped.CAUTION}
          />
        )}
        {grouped.COMPATIBLE.length > 0 && (
          <CompatGroup
            title="Verträglich"
            subtitle="Materialwirkung im normalen Einsatzbereich unkritisch"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            items={grouped.COMPATIBLE}
          />
        )}
        {grouped.RECOMMENDED.length > 0 && (
          <CompatGroup
            title="Empfohlene Anwendung"
            subtitle="Material wurde explizit für diese Inhaltsstoff-Klasse entwickelt"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            items={grouped.RECOMMENDED}
          />
        )}
      </div>

      {material.compatibilities.length === 0 && (
        <div className="card text-center text-slate-500">
          Noch keine Verträglichkeitsdaten für dieses Material erfasst.
        </div>
      )}
    </div>
  );
}

function CompatGroup({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  items,
}: {
  title: string;
  subtitle: string;
  icon: typeof AlertOctagon;
  iconColor: string;
  items: {
    id: string;
    note: string;
    conditionNote: string | null;
    effectType: string | null;
    swellPctMin: number | null;
    swellPctMax: number | null;
    sourceUrl: string | null;
    sourceLabel: string | null;
    ingredient: {
      slug: string;
      name: string;
      shortName: string | null;
      category: string;
      casNumbers: string[];
      typicalConcentrationPct: number | null;
    };
  }[];
}) {
  return (
    <div className="card space-y-3">
      <div>
        <h2 className="flex items-center gap-2 section-title">
          <Icon size={18} className={iconColor} />
          {title} <span className="text-slate-400">({items.length})</span>
        </h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((c) => (
          <div key={c.id} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <span className="font-semibold">{c.ingredient.name}</span>
                {c.ingredient.shortName && c.ingredient.shortName !== c.ingredient.name && (
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {c.ingredient.shortName}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {INGREDIENT_CATEGORY_LABEL[c.ingredient.category]}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{c.note}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
              {c.effectType && c.effectType !== "NONE" && (
                <span className="rounded bg-slate-50 px-1.5 py-0.5">
                  {EFFECT_LABEL[c.effectType] ?? c.effectType}
                </span>
              )}
              {(c.swellPctMin || c.swellPctMax) && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                  Volumenquellung {c.swellPctMin ?? "?"}-{c.swellPctMax ?? "?"} %
                </span>
              )}
              {c.conditionNote && (
                <span className="rounded bg-slate-50 px-1.5 py-0.5 italic">{c.conditionNote}</span>
              )}
              {c.ingredient.casNumbers.length > 0 && (
                <span className="text-slate-400">CAS {c.ingredient.casNumbers.join(", ")}</span>
              )}
              {c.sourceLabel && (
                <span className="text-slate-400">
                  Quelle:{" "}
                  {c.sourceUrl ? (
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {c.sourceLabel}
                    </a>
                  ) : (
                    c.sourceLabel
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
