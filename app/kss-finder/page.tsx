import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Collapsible } from "@/components/Collapsible";
import { LiveFilterForm } from "@/components/LiveFilterForm";
import { KssWizardLauncher } from "@/components/KssWizardLauncher";
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
}>;

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

  // WHERE-Klausel zusammenbauen
  const where: import("@prisma/client").Prisma.ProductWhereInput = {
    category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] },
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { productFamily: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(sp.productionType && {
      productionType: sp.productionType as "CONTRACT_MANUFACTURING" | "SERIAL_PRODUCTION" | "MIXED",
    }),
    ...(sp.concentrateForm && {
      concentrateForm: sp.concentrateForm as
        | "CONVENTIONAL_EMULSION"
        | "SEMI_SYNTHETIC"
        | "FULL_SYNTHETIC"
        | "TWO_COMPONENT",
    }),
    ...(apps.length > 0 && { applicationAreas: { hasSome: apps } }),
    ...(mats.length > 0 && { suitableMaterials: { hasSome: mats } }),
    ...(issues.length > 0 && { criticalIssuesAddressed: { hasSome: issues } }),
    ...(certs.length > 0 && { certifications: { hasSome: certs } }),
    ...(sp.manufacturer && { manufacturer: { name: { contains: sp.manufacturer, mode: "insensitive" } } }),
  };

  const products = await prisma.product.findMany({
    where,
    include: {
      manufacturer: { select: { name: true, slug: true } },
    },
    orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
    take: 100,
  });

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
  };
  const activeTotal = Object.values(counts).reduce((a, b) => a + b, 0) + (q ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Droplets size={28} className="text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">KSS-Finder</h1>
              <p className="mt-1 text-sm text-slate-600">
                {totalCount} Kühlschmierstoffe von {manufacturersAll.length} Herstellern. Filtere nach
                Bearbeitungsverfahren, Werkstoff, Form, kritischen Punkten und Zertifizierungen — oder
                lass dir per KI einen Alternativ-KSS vorschlagen.
              </p>
            </div>
          </div>
          <KssWizardLauncher />
        </div>
      </div>

      {/* Filter — alle ausklappbar */}
      <LiveFilterForm pathname="/kss-finder" className="space-y-2">
        {/* Volltext immer sichtbar */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <label className="text-xs font-semibold text-slate-600">Volltextsuche</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="z.B. Hocut, ISO VG 46, Aluminium, borfrei…"
            className="input mt-1"
          />
        </div>

        <Collapsible
          title="Bearbeitungsverfahren"
          subtitle="Drehen, Fräsen, Schleifen, Tieflochbohren, MMS, …"
          badgeCount={counts.apps}
          defaultOpen={counts.apps > 0}
        >
          <input type="hidden" name="applicationAreas" value={apps.join("|")} />
          <ChipMultiSelect name="applicationAreas" options={[...APPLICATION_AREAS]} selected={apps} />
        </Collapsible>

        <Collapsible
          title="KSS-Form"
          subtitle="Konventionelle Emulsion (milchig), Teilsynthetisch, Vollsynthetisch (klar), Zweikomponenten"
          badgeCount={counts.concentrateForm}
          defaultOpen={counts.concentrateForm > 0}
        >
          <RadioCards name="concentrateForm" options={[...COOLANT_FORMS]} selected={sp.concentrateForm} />
        </Collapsible>

        <Collapsible
          title="Werkstoffe"
          subtitle="Stahl, Aluminium, Buntmetall, Titan, Inconel…"
          badgeCount={counts.mats}
          defaultOpen={counts.mats > 0}
        >
          <input type="hidden" name="materials" value={mats.join("|")} />
          <ChipMultiSelect name="materials" options={[...MATERIALS]} selected={mats} />
        </Collapsible>

        <Collapsible
          title="Produktionsart"
          subtitle="Lohnfertigung (Universal) vs. Serienproduktion (Spezial)"
          badgeCount={counts.productionType}
          defaultOpen={counts.productionType > 0}
        >
          <RadioCards name="productionType" options={[...PRODUCTION_TYPES]} selected={sp.productionType} />
        </Collapsible>

        <Collapsible
          title="Kritische Punkte"
          subtitle="Fleckenbildung, Geruch, Schaum, Hautirritation, Werkzeugstandzeit, …"
          badgeCount={counts.issues}
          defaultOpen={counts.issues > 0}
        >
          <input type="hidden" name="criticalIssues" value={issues.join("|")} />
          <ChipMultiSelect name="criticalIssues" options={[...CRITICAL_ISSUES]} selected={issues} />
        </Collapsible>

        <Collapsible
          title="Zertifizierungen"
          subtitle="TRGS 611, NSF H1, Blauer Engel, OEM-Freigaben, …"
          badgeCount={counts.certs}
          defaultOpen={counts.certs > 0}
        >
          <input type="hidden" name="certifications" value={certs.join("|")} />
          <ChipMultiSelect
            name="certifications"
            options={CERTIFICATIONS.map((c) => c.label)}
            selected={certs}
          />
        </Collapsible>

        <div className="flex items-center justify-between gap-2 px-1 pt-2">
          <span className="text-xs text-slate-500">
            {activeTotal > 0 ? `${activeTotal} Filter aktiv — ` : ""}
            <Link href="/kss-finder" className="text-brand-600 hover:underline">
              alle zurücksetzen
            </Link>
          </span>
          <span className="text-xs text-slate-400">Filter wirken live.</span>
        </div>
      </LiveFilterForm>

      {/* Ergebnisse */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">
          {products.length} {products.length === 1 ? "Treffer" : "Treffer"}
        </h2>
        {products.length === 100 && (
          <span className="text-xs text-amber-700">(begrenzt auf 100 — Filter verfeinern)</span>
        )}
      </div>

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
                {p.concentrateForm && (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    {COOLANT_FORMS.find((c) => c.value === p.concentrateForm)?.label}
                  </span>
                )}
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
    </div>
  );
}

// Chips für Multi-Select — speichert Auswahl in einem versteckten Input, der vom
// Form gelesen wird (Pipe-Separator). Klick toggelt Selection per JS-Free Link.
function ChipMultiSelect({
  name,
  options,
  selected,
}: {
  name: string;
  options: string[];
  selected: string[];
}) {
  const selectedSet = new Set(selected);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const isSelected = selectedSet.has(o);
        const next = isSelected ? selected.filter((s) => s !== o) : [...selected, o];
        const param = new URLSearchParams();
        param.set(name, next.join("|"));
        // ChipMultiSelect-Link toggelt per URL — die LiveFilterForm um uns triggert Re-Render
        // via FormData; aber Chips sind kein Form-Element, daher hier nur visuelles Feedback +
        // einen versteckten Input. Toggle muss aber funktionieren — daher: wir setzen einen
        // Link der direkt navigiert (mit Erhalt der anderen Filter via Window-URL).
        return (
          <ChipButton key={o} name={name} value={o} isSelected={isSelected} all={options}>
            {o}
          </ChipButton>
        );
      })}
    </div>
  );
}

// Client-Komponente, die per JS den Hidden-Input updated + Form-Change auslöst
function ChipButton({
  name,
  value,
  isSelected,
  children,
}: {
  name: string;
  value: string;
  isSelected: boolean;
  all: string[];
  children: React.ReactNode;
}) {
  return (
    <ChipButtonClient name={name} value={value} isSelected={isSelected}>
      {children}
    </ChipButtonClient>
  );
}

// Eigentliche Client-Komponente — siehe components/ChipButtonClient.tsx
import { ChipButtonClient } from "@/components/ChipButtonClient";

// RadioCards: ein Radio-Button-Set mit Karten-Look
function RadioCards({
  name,
  options,
  selected,
}: {
  name: string;
  options: { value: string; label: string; description?: string }[];
  selected: string | undefined;
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
    </div>
  );
}
