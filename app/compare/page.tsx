import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ManufacturerLogo } from "@/components/ManufacturerLogo";
import { CompareRemoveButton } from "@/components/compare/CompareToggle";
import { AiAnalysisPanel } from "@/components/compare/AiAnalysisPanel";
import { BrandLogo } from "@/components/BrandLogo";
import { PACKAGING_LABEL } from "@/lib/branding";
import { getCachedAnalysis } from "@/lib/comparison-analysis";
import { GitCompare, AlertCircle, AlertTriangle, ListChecks, Boxes } from "lucide-react";

export const metadata = {
  title: "Vergleich — Brisco Marketplace",
};

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralöl",
  SEMI_SYNTHETIC: "Semi-synth.",
  SYNTHETIC: "Vollsynth.",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Andere",
};

type ListingRow = {
  label: string;
  render: (l: NonNullable<Awaited<ReturnType<typeof loadListings>>>[number]) => React.ReactNode;
  highlight?: boolean;
};

const LISTING_ROWS: ListingRow[] = [
  { label: "Hersteller", render: (l) => l.manufacturer },
  { label: "Produkt", render: (l) => l.productName },
  { label: "Typ", render: (l) => l.productType },
  { label: "ISO VG", render: (l) => l.isoViscosity },
  {
    label: "Chemie",
    render: (l) => CHEMISTRY_LABEL[l.chemistry] ?? l.chemistry,
  },
  { label: "Anwendung", render: (l) => l.applicationArea },
  {
    label: "Menge",
    render: (l) => `${l.quantity.toLocaleString("de-DE")} ${l.quantityUnit}`,
    highlight: true,
  },
  {
    label: "Min. Abnahme",
    render: (l) =>
      l.minOrderQty ? `${l.minOrderQty.toLocaleString("de-DE")} ${l.quantityUnit}` : null,
  },
  { label: "Gebinde", render: (l) => PACKAGING_LABEL[l.packaging] ?? l.packaging },
  {
    label: "Preis",
    highlight: true,
    render: (l) =>
      l.priceEur != null ? (
        <span className="font-mono font-bold text-emerald-700">{l.priceEur.toFixed(2)} €</span>
      ) : (
        <span className="text-slate-500">auf Anfrage</span>
      ),
  },
  { label: "Versand", render: (l) => l.shippingTerms },
  { label: "Standort", render: (l) => l.locationRegion },
  {
    label: "Zertifikate",
    render: (l) =>
      l.certificates.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {l.certificates.slice(0, 6).map((c) => (
            <span
              key={c}
              className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null,
  },
  {
    label: "Bearbeitungsverfahren",
    render: (l) =>
      l.machiningOperations.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {l.machiningOperations.slice(0, 8).map((op) => (
            <span
              key={op}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700"
            >
              {op}
            </span>
          ))}
        </div>
      ) : null,
  },
  {
    label: "Mineralöl-Anteil",
    render: (l) => (l.mineralOilContent != null ? `${l.mineralOilContent} %` : null),
  },
  {
    label: "Verkäufer",
    render: (l) => (
      <div>
        <div className="text-sm font-medium text-slate-900">{l.seller.pseudonym}</div>
        <div className="text-[10px] text-slate-500">
          {l.seller.trustTier}
          {l.seller.ratingCount > 0
            ? ` · ${l.seller.avgRating?.toFixed(1)} ★ (${l.seller.ratingCount})`
            : ""}
        </div>
      </div>
    ),
  },
];

async function loadListings(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await prisma.listing.findMany({
    where: { id: { in: ids } },
    include: {
      seller: { select: { pseudonym: true, trustTier: true } },
    },
  });
  // Avg-Rating + count pro Seller, einmal vorladen
  const sellerIds = Array.from(new Set(rows.map((r) => r.sellerId)));
  const ratings = await prisma.review.groupBy({
    by: ["revieweeId"],
    where: { revieweeId: { in: sellerIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingMap = new Map(ratings.map((r) => [r.revieweeId, r]));
  return rows.map((r) => {
    const rating = ratingMap.get(r.sellerId);
    return {
      ...r,
      seller: {
        pseudonym: r.seller.pseudonym,
        trustTier: r.seller.trustTier,
        avgRating: rating?._avg.rating ?? null,
        ratingCount: rating?._count._all ?? 0,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

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

type ProductRow = {
  label: string;
  hint?: string;
  render: (p: NonNullable<Awaited<ReturnType<typeof loadProducts>>>[number]) => React.ReactNode;
  highlight?: boolean;
};

const PRODUCT_ROWS: ProductRow[] = [
  { label: "Kategorie", render: (p) => CATEGORY_LABEL[p.category] ?? p.category },
  {
    label: "Chemie",
    render: (p) => (p.chemistry ? (CHEMISTRY_LABEL[p.chemistry] ?? p.chemistry) : null),
  },
  { label: "Produktfamilie", render: (p) => p.productFamily },
  {
    label: "Refraktometer-Faktor",
    hint: "Brix × Faktor = % Konz.",
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
    render: (p) =>
      p.waterHardnessMinDh != null || p.waterHardnessMaxDh != null
        ? `${p.waterHardnessMinDh ?? 0}–${p.waterHardnessMaxDh ?? "?"} °dH`
        : null,
  },
  { label: "ISO VG", render: (p) => p.viscosityIso },
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
            <span key={m} className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
              ✗ {m}
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ listings?: string; products?: string; ids?: string }>;
}) {
  const sp = await searchParams;
  const listingIds = (sp.listings ?? "").split(",").filter((s) => s.length > 0);
  // ?ids=… (alte URL-Form) wird als Produkt-IDs interpretiert
  const productIds = ((sp.products ?? sp.ids) ?? "").split(",").filter((s) => s.length > 0);

  const [listings, products] = await Promise.all([
    loadListings(listingIds),
    loadProducts(productIds),
  ]);
  const sortedListings = listingIds
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => l != null);
  const sortedProducts = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  const total = sortedListings.length + sortedProducts.length;

  // KI-Bewertung: Cache vor-laden (synchron mit Page-Render), Mixed-Type-Check
  const listingTypes = new Set(sortedListings.map((l) => l.productType));
  const aiEligible = sortedListings.length >= 2 && listingTypes.size === 1;
  const cachedAnalysis =
    aiEligible ? await getCachedAnalysis(sortedListings.map((l) => l.id)) : null;
  const listingMap: Record<string, { productName: string; manufacturer: string }> = {};
  for (const l of sortedListings) {
    listingMap[l.id] = { productName: l.productName, manufacturer: l.manufacturer };
  }

  return (
    <div className="space-y-8 pb-24">
      <header>
        <div className="flex items-center gap-2">
          <GitCompare size={20} className="text-brand-600" />
          <h1 className="page-title">Vergleich</h1>
        </div>
      </header>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-slate-400" />
          <p className="mt-2 text-sm text-slate-600">Keine Einträge zum Vergleichen ausgewählt.</p>
          <p className="mt-1 text-xs text-slate-500">
            Setze die Häkchen auf der{" "}
            <Link href="/listings" className="text-brand-600 hover:underline">
              Listings-Seite
            </Link>
            , dann oben rechts „Vergleich ansehen".
          </p>
        </div>
      ) : null}

      {sortedListings.length > 0 ? (
        <section className="space-y-4">
          <div className="mb-1 flex items-center gap-2">
            <ListChecks size={18} className="text-slate-600" />
            <h2 className="section-title">
              Listings <span className="text-sm font-normal text-slate-500">({sortedListings.length})</span>
            </h2>
          </div>

          {/* Mixed-Type Warnbanner */}
          {(() => {
            const types = new Set(sortedListings.map((l) => l.productType));
            if (types.size > 1) {
              return (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <strong>Unterschiedliche Produkttypen ausgewählt:</strong>{" "}
                    {Array.from(types).join(", ")}. Diese sind technisch nicht direkt vergleichbar
                    (z.B. ein Hydrauliköl gegen einen KSS). Der Vergleich ist trotzdem sichtbar,
                    die KI-Bewertung ist aber deaktiviert. Filtere die Listings vorher per
                    Produkttyp-Chip auf{" "}
                    <Link href="/listings" className="underline">
                      /listings
                    </Link>{" "}
                    auf eine Kategorie ein.
                  </div>
                </div>
              );
            }
            return null;
          })()}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-[170px] bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Eigenschaft
                  </th>
                  {sortedListings.map((l) => (
                    <th
                      key={l.id}
                      className="min-w-[220px] border-l border-slate-200 px-3 py-3 text-left align-top"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-2">
                          <BrandLogo manufacturer={l.manufacturer} size="sm" />
                          <Link
                            href={`/listings/${l.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                          >
                            {l.productName}
                          </Link>
                        </div>
                        <CompareRemoveButton id={l.id} kind="listings" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LISTING_ROWS.map((row, i) => {
                  const cells = sortedListings.map((l) => row.render(l));
                  const hasAny = cells.some((c) => c != null && c !== "" && c !== false);
                  if (!hasAny) return null;
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${row.highlight ? "bg-emerald-50/40" : ""}`}
                    >
                      <th className="sticky left-0 z-10 min-w-[170px] bg-inherit px-3 py-3 text-left align-top text-xs font-medium text-slate-600">
                        {row.label}
                      </th>
                      {cells.map((cell, idx) => (
                        <td key={idx} className="border-l border-slate-200 px-3 py-3 align-top text-sm">
                          {cell != null && cell !== "" ? cell : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* KI-Bewertung — nur für Listings, mind. 2 mit gleichem Typ */}
          {sortedListings.length >= 2 ? (
            <AiAnalysisPanel
              listingIds={sortedListings.map((l) => l.id)}
              listingMap={listingMap}
              disabled={!aiEligible}
              disabledReason={
                !aiEligible
                  ? `KI-Bewertung deaktiviert: Listings haben unterschiedliche Produkttypen (${Array.from(listingTypes).join(", ")}).`
                  : undefined
              }
              initialResult={cachedAnalysis}
            />
          ) : null}
        </section>
      ) : null}

      {sortedProducts.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Boxes size={18} className="text-slate-600" />
            <h2 className="section-title">
              Produkte (Hersteller-Katalog){" "}
              <span className="text-sm font-normal text-slate-500">({sortedProducts.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-[170px] bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Eigenschaft
                  </th>
                  {sortedProducts.map((p) => (
                    <th
                      key={p.id}
                      className="min-w-[220px] border-l border-slate-200 px-3 py-3 text-left align-top"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-2">
                          <ManufacturerLogo
                            name={p.manufacturer.name}
                            logoPath={p.manufacturer.logoPath}
                            height={36}
                          />
                          <Link
                            href={`/products/${p.manufacturer.slug}/${p.slug}`}
                            className="text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                          >
                            {p.name}
                          </Link>
                          <div className="text-[11px] text-slate-500">{p.manufacturer.name}</div>
                        </div>
                        <CompareRemoveButton id={p.id} kind="products" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRODUCT_ROWS.map((row, i) => {
                  const cells = sortedProducts.map((p) => row.render(p));
                  const hasAny = cells.some((c) => c != null && c !== "" && c !== false);
                  if (!hasAny) return null;
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${row.highlight ? "bg-emerald-50/40" : ""}`}
                    >
                      <th className="sticky left-0 z-10 min-w-[170px] bg-inherit px-3 py-3 text-left align-top text-xs font-medium text-slate-600">
                        {row.label}
                        {row.hint ? (
                          <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                            {row.hint}
                          </div>
                        ) : null}
                      </th>
                      {cells.map((cell, idx) => (
                        <td key={idx} className="border-l border-slate-200 px-3 py-3 align-top text-sm">
                          {cell != null && cell !== "" ? cell : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
