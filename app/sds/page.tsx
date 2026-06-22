import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SDS_CATEGORY_LABEL, SDS_LANGUAGE_LABEL } from "@/lib/sds";
import { LiveFilterForm } from "@/components/LiveFilterForm";
import { Collapsible } from "@/components/Collapsible";
import { SearchSection } from "@/components/SearchSection";
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

  return (
    <div className="space-y-3">
      {/* 🔵 BRANDING-HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          <h1 className="page-title">Sicherheitsdatenblätter</h1>
          <span className="text-xs text-slate-600">
            {totalCount} Dokumente · REACH/Inhaltsstoff-Filter
          </span>
        </div>
      </div>

      <LiveFilterForm pathname="/sds" className="space-y-3">
        {/* ① SUCHFELD — grün */}
        <SearchSection
          step="1"
          color="emerald"
          title="Suchfeld"
          subtitle="Volltextsuche im Produktname, Hersteller und PDF-Inhalt — live beim Tippen"
        >
          <input
            name="q"
            defaultValue={q}
            className="input border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-300"
            placeholder="z.B. bcool755, Hysol, ISO VG 46, Borsäure, Triazin…"
            autoComplete="off"
          />
        </SearchSection>

        {/* ② SUCHKRITERIEN — grau */}
        <SearchSection
          step="2"
          color="slate"
          title="Suchkriterien"
          subtitle="Hersteller · Kategorie · REACH/SVHC · Inhaltsstoff-Flags"
          rightSlot={
            <span className="flex items-center gap-2 text-[11px]">
              {filterCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-300">
                  {filterCount} aktiv
                </span>
              )}
              {filterCount > 0 && (
                <Link href="/sds" className="font-medium text-red-600 hover:underline">
                  zurücksetzen
                </Link>
              )}
            </span>
          }
        >
        <div className="space-y-2">
        <Collapsible
          title="Hersteller & Kategorie"
          subtitle="Eingrenzen auf bestimmte Anbieter oder Produktklasse"
          badgeCount={(manufacturer ? 1 : 0) + (category ? 1 : 0)}
          defaultOpen={!!manufacturer || !!category}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Hersteller</label>
              <select name="manufacturer" defaultValue={manufacturer ?? ""} className="input">
                <option value="">Alle</option>
                {manufacturers.map((m) => (
                  <option key={m.manufacturer} value={m.manufacturer}>
                    {m.manufacturer} ({m._count._all})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Kategorie</label>
              <select name="category" defaultValue={category ?? ""} className="input">
                <option value="">Alle</option>
                {categoryCounts.map((c) => (
                  <option key={c.category} value={c.category}>
                    {SDS_CATEGORY_LABEL[c.category] ?? c.category} ({c._count._all})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Collapsible>

        <Collapsible
          title="REACH & SVHC"
          subtitle="Konformität & SVHC-Kandidaten"
          badgeCount={(sp.reach ? 1 : 0) + (sp.svhc ? 1 : 0)}
          defaultOpen={!!sp.reach || !!sp.svhc}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <TriSelect name="reach" label="REACH-konform" value={sp.reach} />
            <TriSelect
              name="svhc"
              label="SVHC erkannt"
              value={sp.svhc}
              options={[
                { value: "", label: "egal" },
                { value: "yes", label: "ja, vorhanden" },
                { value: "no", label: "nein" },
              ]}
            />
          </div>
        </Collapsible>

        <Collapsible
          title="Inhaltsstoff-Flags"
          subtitle="Bor, Formaldehyd-Donor, Amine, Chlorparaffine, Mineralöl, Biozide"
          badgeCount={
            (sp.boron ? 1 : 0) +
            (sp.formaldehyde ? 1 : 0) +
            (sp.amines ? 1 : 0) +
            (sp.chlorParaffins ? 1 : 0) +
            (sp.mineralOil ? 1 : 0) +
            (sp.bactericide ? 1 : 0) +
            (sp.fungicide ? 1 : 0)
          }
          defaultOpen={
            !!(sp.boron || sp.formaldehyde || sp.amines || sp.chlorParaffins || sp.mineralOil || sp.bactericide || sp.fungicide)
          }
        >
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <TriSelect name="boron" label="Borhaltig" value={sp.boron} />
            <TriSelect name="formaldehyde" label="Formaldehyd-Donor" value={sp.formaldehyde} />
            <TriSelect name="amines" label="Sek. Amine (DEA/Morpholin)" value={sp.amines} />
            <TriSelect name="chlorParaffins" label="Chlorparaffine" value={sp.chlorParaffins} />
            <TriSelect name="mineralOil" label="Mineralöl" value={sp.mineralOil} />
            <TriSelect name="bactericide" label="Bakterizid" value={sp.bactericide} />
            <TriSelect name="fungicide" label="Fungizid" value={sp.fungicide} />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            <span className="font-medium">Hinweis:</span> Flags stammen aus heuristischer Erkennung
            der CAS-Nummern (~CLP/SDS-Standard) plus Klartext-Treffern.
          </p>
        </Collapsible>
        </div>
        </SearchSection>
      </LiveFilterForm>

      {/* ③ ERGEBNISSE — brand-violett */}
      <SearchSection
        step="3"
        color="brand"
        title="Ergebnisse"
        subtitle={`${sheets.length} ${sheets.length === 1 ? "Datenblatt" : "Datenblätter"} aus ${totalCount} gesamt`}
      >
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
      </SearchSection>
    </div>
  );
}

function TriSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options?: { value: string; label: string }[];
}) {
  const opts = options ?? [
    { value: "", label: "egal" },
    { value: "yes", label: "enthält" },
    { value: "no", label: "frei von" },
    { value: "null", label: "unbekannt" },
  ];
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select name={name} defaultValue={value ?? ""} className="input text-sm py-1.5">
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
