import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Collapsible } from "@/components/Collapsible";
import { LiveFilterForm } from "@/components/LiveFilterForm";
import { KssWizardLauncher } from "@/components/KssWizardLauncher";
import { SearchSection } from "@/components/SearchSection";
import { PriceRangeSlider } from "@/components/PriceRangeSlider";
import { KssAiAnalysis } from "@/components/KssAiAnalysis";
import { buildSearchWhere } from "@/lib/normalize-search";
import { getCurrentPricesBatch } from "@/lib/price-aggregation";
import {
  APPLICATION_AREAS,
  MATERIALS,
  CRITICAL_ISSUES,
  CERTIFICATIONS,
  PRODUCTION_TYPES,
  COOLANT_FORMS,
} from "@/lib/kss-knowledge";
import { Droplets, Sparkles, Tag } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  applicationAreas?: string;
  materials?: string;
  productionType?: string;
  concentrateForm?: string;
  criticalIssues?: string;
  certifications?: string;
  manufacturer?: string;
  minPrice?: string;
  maxPrice?: string;
  problemText?: string;
}>;

// Sentinel für „Weiß nicht" — viele Endkunden kennen ihre Bearbeitung/Werkstoffe nicht.
// Wirkt NICHT als Filter (Dimension wird übersprungen), signalisiert der KI aber Unsicherheit.
const UNKNOWN = "Weiß nicht";

// Obergrenze des Preis-Schiebers (EUR pro L/kg). Voller Bereich = kein Filter.
const PRICE_MAX = 50;

export const metadata = {
  title: "KSS-Finder — Brisco Marketplace",
};

// Multi-Select hat URL-Format: "Wert1|Wert2|Wert3"
function parseMulti(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default async function KssFinderPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const apps = parseMulti(sp.applicationAreas);
  const mats = parseMulti(sp.materials);
  const issues = parseMulti(sp.criticalIssues);
  const certs = parseMulti(sp.certifications);
  const problemText = sp.problemText?.trim() ?? "";

  // „Weiß nicht" aus den echten Filterwerten herauslösen — diese Dimension wird
  // dann nicht gefiltert, aber als Unsicherheit an die KI weitergegeben.
  const appsReal = apps.filter((x) => x !== UNKNOWN);
  const matsReal = mats.filter((x) => x !== UNKNOWN);
  const issuesReal = issues.filter((x) => x !== UNKNOWN);
  const certsReal = certs.filter((x) => x !== UNKNOWN);
  // Radios: „Weiß nicht" als echter Wert → nicht als Enum filtern.
  const productionTypeReal = sp.productionType && sp.productionType !== UNKNOWN ? sp.productionType : undefined;
  const unsureDimensions = [
    apps.includes(UNKNOWN) ? "Bearbeitungsverfahren" : null,
    mats.includes(UNKNOWN) ? "Werkstoffe" : null,
    issues.includes(UNKNOWN) ? "Kritische Punkte" : null,
    certs.includes(UNKNOWN) ? "Zertifizierungen" : null,
    sp.productionType === UNKNOWN ? "Produktionsart" : null,
  ].filter(Boolean) as string[];

  // Intelligente Multi-Token-Suche gegen den normalisierten searchTokens-Index:
  // "bcool" matcht "B-Cool", "blaser 755" matcht beide Tokens UND-verknüpft.
  const searchWhere = buildSearchWhere("searchTokens", q);

  const where: import("@prisma/client").Prisma.ProductWhereInput = {
    category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] },
    ...(searchWhere && { AND: searchWhere.AND }),
    ...(productionTypeReal && {
      productionType: productionTypeReal as "CONTRACT_MANUFACTURING" | "SERIAL_PRODUCTION" | "MIXED",
    }),
    ...(sp.concentrateForm && {
      concentrateForm: sp.concentrateForm as
        | "CONVENTIONAL_EMULSION"
        | "SEMI_SYNTHETIC"
        | "FULL_SYNTHETIC"
        | "TWO_COMPONENT",
    }),
    ...(appsReal.length > 0 && { applicationAreas: { hasSome: appsReal } }),
    ...(matsReal.length > 0 && { suitableMaterials: { hasSome: matsReal } }),
    ...(issuesReal.length > 0 && { criticalIssuesAddressed: { hasSome: issuesReal } }),
    ...(certsReal.length > 0 && { certifications: { hasSome: certsReal } }),
    ...(sp.manufacturer && { manufacturer: { name: { contains: sp.manufacturer, mode: "insensitive" } } }),
  };

  const productsRaw = await prisma.product.findMany({
    where,
    include: {
      manufacturer: { select: { name: true, slug: true } },
    },
    orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
    take: 200,
  });

  // Aktuelle Marktpreise batch laden + min/max-Filter anwenden
  const pricesMap = await getCurrentPricesBatch(productsRaw.map((p) => p.id));
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;
  const products = productsRaw
    .map((p) => ({ ...p, price: pricesMap.get(p.id) ?? null }))
    .filter((p) => {
      if (minPrice === undefined && maxPrice === undefined) return true;
      if (!p.price) return false; // Preis-Filter aktiv → ohne Preis ausschließen
      if (minPrice !== undefined && p.price.median < minPrice) return false;
      if (maxPrice !== undefined && p.price.median > maxPrice) return false;
      return true;
    })
    .slice(0, 100);

  const totalCount = await prisma.product.count({
    where: { category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] } },
  });

  const manufacturersAll = await prisma.product.findMany({
    where: { category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] } },
    select: { manufacturer: { select: { name: true } } },
    distinct: ["manufacturerId"],
  });

  // Counters for active filters (für Badge)
  const counts = {
    apps: apps.length,
    mats: mats.length,
    productionType: sp.productionType ? 1 : 0,
    concentrateForm: sp.concentrateForm ? 1 : 0,
    issues: issues.length,
    certs: certs.length,
    price: (minPrice !== undefined ? 1 : 0) + (maxPrice !== undefined ? 1 : 0),
  };
  const activeTotal = Object.values(counts).reduce((a, b) => a + b, 0) + (q ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* 🔵 BRANDING-HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <Droplets size={20} className="text-blue-600" />
          <h1 className="page-title">KSS-Finder</h1>
          <span className="text-xs text-slate-600">
            {totalCount} KSS · {manufacturersAll.length} Hersteller
          </span>
        </div>
        <KssWizardLauncher />
      </div>

      <LiveFilterForm pathname="/kss-finder" className="space-y-3">
        {/* ① SUCHFELD — grün */}
        <SearchSection
          step="1"
          color="emerald"
          title="Suchfeld"
          subtitle="Volltextsuche, live beim Tippen"
        >
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="z.B. bcool, hocut 795, blaser, ISO VG 46, borfrei…"
            className="input border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-300"
            autoComplete="off"
          />
        </SearchSection>

        {/* ② SUCHKRITERIEN — grau */}
        <SearchSection
          step="2"
          color="slate"
          title="Suchkriterien"
          subtitle="Bearbeitungsverfahren · KSS-Form · Werkstoffe · Produktionsart · Kritische Punkte · Zertifizierungen"
          rightSlot={
            <span className="flex items-center gap-2 text-[11px]">
              {activeTotal > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-300">
                  {activeTotal} aktiv
                </span>
              )}
              {activeTotal > 0 && (
                <Link href="/kss-finder" className="font-medium text-red-600 hover:underline">
                  zurücksetzen
                </Link>
              )}
            </span>
          }
        >
          {/* Kompakte 2-Spalten-Grid für die Collapsibles */}
          <div className="grid gap-2 md:grid-cols-2">
            <Collapsible
              title="Bearbeitungsverfahren"
              subtitle="Drehen, Fräsen, Schleifen, MMS, …"
              badgeCount={counts.apps}
              defaultOpen={counts.apps > 0}
            >
              <input type="hidden" name="applicationAreas" value={apps.join("|")} />
              <ChipMultiSelect name="applicationAreas" options={[...APPLICATION_AREAS]} selected={apps} withUnknown />
            </Collapsible>

            <Collapsible
              title="KSS-Form"
              subtitle="Emulsion / Teilsynth / Vollsynth / 2K"
              badgeCount={counts.concentrateForm}
              defaultOpen={counts.concentrateForm > 0}
            >
              <RadioCards name="concentrateForm" options={[...COOLANT_FORMS]} selected={sp.concentrateForm} />
            </Collapsible>

            <Collapsible
              title="Werkstoffe"
              subtitle="Stahl, Aluminium, Buntmetall, …"
              badgeCount={counts.mats}
              defaultOpen={counts.mats > 0}
            >
              <input type="hidden" name="materials" value={mats.join("|")} />
              <ChipMultiSelect name="materials" options={[...MATERIALS]} selected={mats} withUnknown />
            </Collapsible>

            <Collapsible
              title="Produktionsart"
              subtitle="Lohnfertigung vs. Serie"
              badgeCount={counts.productionType}
              defaultOpen={counts.productionType > 0}
            >
              <RadioCards name="productionType" options={[...PRODUCTION_TYPES]} selected={sp.productionType} withUnknown />
            </Collapsible>

            <Collapsible
              title="Kritische Punkte"
              subtitle="Geruch, Schaum, Hautirritation, …"
              badgeCount={counts.issues}
              defaultOpen={counts.issues > 0}
            >
              <input type="hidden" name="criticalIssues" value={issues.join("|")} />
              <ChipMultiSelect name="criticalIssues" options={[...CRITICAL_ISSUES]} selected={issues} withUnknown />
              <p className="mt-2 text-[10px] text-slate-500">
                Eigenes/spezielles Problem? Beschreibe es unten im Feld „KI-Analyse &amp;
                Alternativen" — die KI wertet es kritisch aus.
              </p>
            </Collapsible>

            <Collapsible
              title="Zertifizierungen"
              subtitle="TRGS 611, NSF H1, OEM-Freigaben, …"
              badgeCount={counts.certs}
              defaultOpen={counts.certs > 0}
            >
              <input type="hidden" name="certifications" value={certs.join("|")} />
              <ChipMultiSelect
                name="certifications"
                options={CERTIFICATIONS.map((c) => c.label)}
                selected={certs}
                withUnknown
              />
            </Collapsible>

            <Collapsible
              title="Marktpreis"
              subtitle="Spanne in EUR pro L oder kg"
              badgeCount={counts.price}
              defaultOpen={counts.price > 0}
            >
              <PriceRangeSlider
                max={PRICE_MAX}
                initialMin={minPrice}
                initialMax={maxPrice}
              />
            </Collapsible>
          </div>
        </SearchSection>
      </LiveFilterForm>

      {/* KI-Analyse: wertet Freitext + Filter kritisch aus und schlägt Alternativen vor. */}
      <KssAiAnalysis
        problemText={problemText}
        applicationAreas={appsReal}
        materials={matsReal}
        criticalIssues={issuesReal}
        certifications={certsReal}
        productionType={productionTypeReal}
        concentrateForm={sp.concentrateForm}
        unsureDimensions={unsureDimensions}
      />

      {/* ③ ERGEBNISSE — brand-violett */}
      <SearchSection
        step="3"
        color="brand"
        title="Ergebnisse"
        subtitle={`${products.length} ${products.length === 1 ? "Treffer" : "Treffer"} aus ${totalCount} KSS`}
        rightSlot={
          products.length === 100 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800 ring-1 ring-amber-300">
              ⚠ begrenzt auf 100 — Filter verfeinern
            </span>
          ) : undefined
        }
      >
      {products.length === 0 ? (
        <div className="card text-center text-slate-500">
          Keine KSS gefunden. Filter aufweichen oder{" "}
          <Link href="/kss-finder" className="text-brand-600 hover:underline">
            zurücksetzen
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.manufacturer.slug}/${p.slug}`}
              className="card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {p.manufacturer.name}
                  </div>
                  <div className="text-base font-semibold">{p.name}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {p.price && (
                    <span
                      className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-amber-300"
                      title={`Spanne ${p.price.min.toFixed(2)}–${p.price.max.toFixed(2)} · ${p.price.observationCount} Beob. (${p.price.confidence})`}
                    >
                      💰 {p.price.median.toFixed(2)} {p.price.unitLabel}
                    </span>
                  )}
                  {p.concentrateForm && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {COOLANT_FORMS.find((c) => c.value === p.concentrateForm)?.label}
                    </span>
                  )}
                </div>
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{p.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                {p.applicationAreas.slice(0, 4).map((a) => (
                  <span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                    {a}
                  </span>
                ))}
                {p.criticalIssuesAddressed.slice(0, 3).map((c) => (
                  <span key={c} className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                    ↗ {c}
                  </span>
                ))}
                {p.certifications.slice(0, 2).map((c) => (
                  <span key={c} className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                    <Tag size={9} className="mr-0.5 inline" />
                    {c.length > 30 ? c.slice(0, 30) + "…" : c}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
      </SearchSection>
    </div>
  );
}

// Chips für Multi-Select — speichert Auswahl in einem versteckten Input, der vom
// Form gelesen wird (Pipe-Separator). Klick toggelt Selection per JS-Free Link.
function ChipMultiSelect({
  name,
  options,
  selected,
  withUnknown = false,
}: {
  name: string;
  options: string[];
  selected: string[];
  /** Zusätzlich einen exklusiven „Weiß nicht"-Chip anzeigen (für unsichere Endkunden). */
  withUnknown?: boolean;
}) {
  const selectedSet = new Set(selected);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <ChipButtonClient
          key={o}
          name={name}
          value={o}
          isSelected={selectedSet.has(o)}
          dropSibling={withUnknown ? UNKNOWN : undefined}
        >
          {o}
        </ChipButtonClient>
      ))}
      {withUnknown && (
        <ChipButtonClient name={name} value={UNKNOWN} isSelected={selectedSet.has(UNKNOWN)} exclusive>
          🤷 {UNKNOWN}
        </ChipButtonClient>
      )}
    </div>
  );
}

// Eigentliche Client-Komponente — siehe components/ChipButtonClient.tsx
import { ChipButtonClient } from "@/components/ChipButtonClient";

// RadioCards: ein Radio-Button-Set mit Karten-Look
function RadioCards({
  name,
  options,
  selected,
  withUnknown = false,
}: {
  name: string;
  options: { value: string; label: string; description?: string }[];
  selected: string | undefined;
  /** Zusätzliche „Weiß nicht"-Option für unsichere Endkunden. */
  withUnknown?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
        <input type="radio" name={name} value="" defaultChecked={!selected} className="mt-0.5" />
        <div>
          <div className="text-sm font-medium text-slate-700">Beliebig</div>
          <div className="text-xs text-slate-500">Kein Filter</div>
        </div>
      </label>
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={selected === o.value}
            className="mt-0.5"
          />
          <div>
            <div className="text-sm font-medium text-slate-900">{o.label}</div>
            {o.description && <div className="text-xs text-slate-500">{o.description}</div>}
          </div>
        </label>
      ))}
      {withUnknown && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
          <input type="radio" name={name} value={UNKNOWN} defaultChecked={selected === UNKNOWN} className="mt-0.5" />
          <div>
            <div className="text-sm font-medium text-slate-900">🤷 Weiß nicht</div>
            <div className="text-xs text-slate-500">Bin unsicher — KI berücksichtigt das</div>
          </div>
        </label>
      )}
    </div>
  );
}
