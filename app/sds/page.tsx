import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SDS_CATEGORY_LABEL, SDS_LANGUAGE_LABEL } from "@/lib/sds";
import { FilterBar } from "@/components/FilterBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SearchInput } from "@/components/SearchInput";
import { buildSearchWhere } from "@/lib/normalize-search";
import { FileText } from "lucide-react";
import type { SdsCategory } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  manufacturer?: string;
  category?: string;
  reach?: string;
  boron?: string;
  formaldehyde?: string;
  amines?: string;
  chlorParaffins?: string;
  mineralOil?: string;
  bactericide?: string;
  fungicide?: string;
  svhc?: string;
}>;

export const metadata = {
  title: "Sicherheitsdatenblätter — Brisco Marketplace",
};

// Hilfsfunktion: 3-state Filter ("" = egal, "yes" = true, "no" = false, "null" = unbekannt)
function triFilter(v: string | undefined): boolean | null | undefined {
  if (!v || v === "") return undefined;
  if (v === "yes") return true;
  if (v === "no") return false;
  if (v === "null") return null;
  return undefined;
}

export default async function SdsLibraryPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { q, manufacturer, category } = sp;

  const reach = triFilter(sp.reach);
  const boron = triFilter(sp.boron);
  const formaldehyde = triFilter(sp.formaldehyde);
  const amines = triFilter(sp.amines);
  const chlorParaffins = triFilter(sp.chlorParaffins);
  const mineralOil = triFilter(sp.mineralOil);
  const bactericide = triFilter(sp.bactericide);
  const fungicide = triFilter(sp.fungicide);
  const svhc = sp.svhc; // "yes" = mit, "no" = ohne (basierend auf Array-Länge)

  const where: import("@prisma/client").Prisma.SafetyDataSheetWhereInput = {
    ...(manufacturer && { manufacturer: { contains: manufacturer, mode: "insensitive" } }),
    ...(category && { category: category as SdsCategory }),
    // Intelligente Multi-Token-Suche: jeder Token muss im normalisierten searchTokens
    // vorkommen (AND). "bcool 755" → ["bcool","755"], beide müssen matchen.
    // Plus Fallback: ein Token im PDF-Volltext (extractedText).
    ...(() => {
      const sw = buildSearchWhere("searchTokens", q);
      if (!sw) return {};
      return {
        OR: [{ AND: sw.AND }, ...(q && q.trim().length >= 3 ? [{ extractedText: { contains: q, mode: "insensitive" as const } }] : [])],
      };
    })(),
    ...(reach !== undefined && { reachCompliant: reach }),
    ...(boron !== undefined && { containsBoron: boron }),
    ...(formaldehyde !== undefined && { containsFormaldehydeReleaser: formaldehyde }),
    ...(amines !== undefined && { containsSecondaryAmines: amines }),
    ...(chlorParaffins !== undefined && { containsChlorinatedParaffins: chlorParaffins }),
    ...(mineralOil !== undefined && { containsMineralOil: mineralOil }),
    ...(bactericide !== undefined && { hasBactericide: bactericide }),
    ...(fungicide !== undefined && { hasFungicide: fungicide }),
    ...(svhc === "yes" && { svhcSubstances: { isEmpty: false } }),
    ...(svhc === "no" && { svhcSubstances: { isEmpty: true } }),
  };

  const [sheets, manufacturers, categoryCounts] = await Promise.all([
    prisma.safetyDataSheet.findMany({
      where,
      orderBy: [{ manufacturer: "asc" }, { productName: "asc" }],
      take: 200,
    }),
    prisma.safetyDataSheet.groupBy({ by: ["manufacturer"], _count: { _all: true } }),
    prisma.safetyDataSheet.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);

  const totalCount = manufacturers.reduce((sum, m) => sum + m._count._all, 0);

  const filterCount =
    (manufacturer ? 1 : 0) +
    (category ? 1 : 0) +
    (sp.reach ? 1 : 0) +
    (sp.svhc ? 1 : 0) +
    (sp.boron ? 1 : 0) +
    (sp.formaldehyde ? 1 : 0) +
    (sp.amines ? 1 : 0) +
    (sp.chlorParaffins ? 1 : 0) +
    (sp.mineralOil ? 1 : 0) +
    (sp.bactericide ? 1 : 0) +
    (sp.fungicide ? 1 : 0);

  const manufacturerOptions = [
    { value: "", label: "Alle Hersteller" },
    ...manufacturers
      .slice()
      .sort((a, b) => b._count._all - a._count._all)
      .map((m) => ({ value: m.manufacturer, label: m.manufacturer, count: m._count._all })),
  ];
  const categoryOptions = [
    { value: "", label: "Alle Kategorien" },
    ...categoryCounts.map((c) => ({
      value: c.category,
      label: SDS_CATEGORY_LABEL[c.category] ?? c.category,
      count: c._count._all,
    })),
  ];
  const triOptions = [
    { value: "", label: "egal" },
    { value: "yes", label: "enthält" },
    { value: "no", label: "frei von" },
    { value: "null", label: "unbekannt" },
  ];
  const reachOptions = [
    { value: "", label: "egal" },
    { value: "yes", label: "REACH-konform" },
    { value: "no", label: "nicht konform" },
    { value: "null", label: "unbekannt" },
  ];
  const svhcOptions = [
    { value: "", label: "egal" },
    { value: "yes", label: "SVHC vorhanden" },
    { value: "no", label: "ohne SVHC" },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileText size={20} />
        </span>
        <div>
          <h1 className="page-title">Sicherheitsdatenblätter</h1>
          <p className="text-sm text-slate-500">
            {totalCount.toLocaleString("de-CH")} Dokumente · REACH- & Inhaltsstoff-Filter
          </p>
        </div>
      </div>

      <FilterBar
        count={sheets.length}
        noun={sheets.length === 1 ? "Datenblatt" : "Datenblätter"}
        resetHref="/sds"
        filterCount={filterCount}
        search={
          <SearchInput placeholder="z.B. bcool755, Hysol, ISO VG 46, Borsäure, Triazin…" />
        }
      >
        <FilterDropdown label="Hersteller" paramKey="manufacturer" options={manufacturerOptions} />
        <FilterDropdown label="Kategorie" paramKey="category" options={categoryOptions} />
        <FilterDropdown label="REACH" paramKey="reach" options={reachOptions} />
        <FilterDropdown label="SVHC" paramKey="svhc" options={svhcOptions} />
        <FilterDropdown label="Borhaltig" paramKey="boron" options={triOptions} />
        <FilterDropdown label="Formaldehyd-Donor" paramKey="formaldehyde" options={triOptions} />
        <FilterDropdown label="Sek. Amine" paramKey="amines" options={triOptions} />
        <FilterDropdown label="Chlorparaffine" paramKey="chlorParaffins" options={triOptions} />
        <FilterDropdown label="Mineralöl" paramKey="mineralOil" options={triOptions} />
        <FilterDropdown label="Bakterizid" paramKey="bactericide" options={triOptions} />
        <FilterDropdown label="Fungizid" paramKey="fungicide" options={triOptions} />
      </FilterBar>

      {/* ERGEBNISSE */}
      <div className="space-y-2">
      {sheets.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-slate-500">
          Keine Datenblätter gefunden — Filter aufweichen oder{" "}
          <Link href="/sds" className="text-brand-600 hover:underline">zurücksetzen</Link>.
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-200 px-4">
          {sheets.map((s) => (
            <Link
              key={s.id}
              href={`/sds/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {s.manufacturer} · {s.productName}
                </div>
                <div className="text-xs text-slate-500">
                  {SDS_CATEGORY_LABEL[s.category] ?? s.category} ·{" "}
                  {SDS_LANGUAGE_LABEL[s.language] ?? s.language} · {s.pageCount ?? "?"} Seiten ·{" "}
                  {(s.fileSizeBytes / 1024).toFixed(0)} KB
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.reachCompliant === true && <Pill color="emerald">REACH ✓</Pill>}
                  {s.reachCompliant === false && <Pill color="rose">nicht REACH-konform</Pill>}
                  {s.svhcSubstances.length > 0 && <Pill color="rose">SVHC</Pill>}
                  {s.containsBoron === true && <Pill color="amber">Bor</Pill>}
                  {s.containsBoron === false && <Pill color="emerald">borfrei</Pill>}
                  {s.containsFormaldehydeReleaser === true && <Pill color="amber">Formaldehyd-Don.</Pill>}
                  {s.containsSecondaryAmines === true && <Pill color="amber">sek. Amine</Pill>}
                  {s.containsChlorinatedParaffins === true && <Pill color="rose">Chlorparaff.</Pill>}
                  {s.containsMineralOil === true && <Pill color="slate">Mineralöl</Pill>}
                  {s.containsPrimaryAromaticAmines === true && <Pill color="rose">PAA</Pill>}
                  {s.hasBactericide === true && <Pill color="indigo">Bakterizid</Pill>}
                  {s.hasFungicide === true && <Pill color="indigo">Fungizid</Pill>}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
                PDF ansehen
              </span>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const palette: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rose: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${palette[color] ?? palette.slate}`}
    >
      {children}
    </span>
  );
}
