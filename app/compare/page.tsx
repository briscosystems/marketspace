import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/ProductImage";
import { packagingForProduct } from "@/lib/product-packaging";
import { CompareRemoveButton } from "@/components/compare/CompareToggle";
import { AiAnalysisPanel } from "@/components/compare/AiAnalysisPanel";
import { BrandLogo } from "@/components/BrandLogo";
import { getCachedAnalysis } from "@/lib/comparison-analysis";
import { getMonthlyMedianHistory, getCurrentPricesBatch } from "@/lib/price-aggregation";
import { MultiPriceHistoryChart, type PriceSeries } from "@/components/MultiPriceHistoryChart";
import { TcoComparePanel } from "@/components/TcoCalculator";
import { GitCompare, AlertCircle, AlertTriangle, ListChecks, Boxes, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Vergleich — Brisco Marketplace",
};

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

type ListingRow = {
  label: string;
  render: (
    l: NonNullable<Awaited<ReturnType<typeof loadListings>>>[number],
    t: (k: string) => string,
  ) => React.ReactNode;
  highlight?: boolean;
};

const LISTING_ROWS: ListingRow[] = [
  { label: "cmp.rowManufacturer", render: (l) => l.manufacturer },
  { label: "cmp.rowProduct", render: (l) => l.productName },
  { label: "cmp.rowType", render: (l) => l.productType },
  { label: "cmp.rowIsoVg", render: (l) => l.isoViscosity },
  {
    label: "cmp.rowChemistry",
    render: (l, t) => t(`chem.${l.chemistry}`),
  },
  { label: "cmp.rowApplication", render: (l) => l.applicationArea },
  {
    label: "cmp.rowQuantity",
    render: (l) => `${l.quantity.toLocaleString("de-DE")} ${l.quantityUnit}`,
    highlight: true,
  },
  {
    label: "cmp.rowMinOrder",
    render: (l) =>
      l.minOrderQty ? `${l.minOrderQty.toLocaleString("de-DE")} ${l.quantityUnit}` : null,
  },
  { label: "cmp.rowPackaging", render: (l, t) => t(`pkg.${l.packaging}`) },
  {
    label: "cmp.rowPrice",
    highlight: true,
    render: (l, t) =>
      l.priceEur != null ? (
        <span className="font-mono font-bold text-emerald-700">{l.priceEur.toFixed(2)} €</span>
      ) : (
        <span className="text-slate-500">{t("cmp.onRequest")}</span>
      ),
  },
  { label: "cmp.rowShipping", render: (l) => l.shippingTerms },
  { label: "cmp.rowLocation", render: (l) => l.locationRegion },
  {
    label: "cmp.rowCertificates",
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
    label: "cmp.rowMachining",
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
    label: "cmp.rowMineralOilContent",
    render: (l) => (l.mineralOilContent != null ? `${l.mineralOilContent} %` : null),
  },
  {
    label: "cmp.rowSeller",
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

type ProductRow = {
  label: string;
  hint?: string;
  render: (
    p: NonNullable<Awaited<ReturnType<typeof loadProducts>>>[number],
    t: (k: string) => string,
  ) => React.ReactNode;
  highlight?: boolean;
};

const PRODUCT_ROWS: ProductRow[] = [
  { label: "cmp.rowCategory", render: (p, t) => t(`cat.${p.category}`) },
  {
    label: "cmp.rowChemistry",
    render: (p, t) => (p.chemistry ? t(`chem.${p.chemistry}`) : null),
  },
  { label: "cmp.rowProductFamily", render: (p) => p.productFamily },
  {
    label: "cmp.rowRefractometerFactor",
    hint: "cmp.hintRefractometer",
    highlight: true,
    render: (p) =>
      p.refractometerFactor != null ? (
        <span className="font-mono font-bold text-emerald-700">{p.refractometerFactor}</span>
      ) : null,
  },
  {
    label: "cmp.rowRecommendedConcentration",
    render: (p) =>
      p.recommendedConcentrationMin != null && p.recommendedConcentrationMax != null
        ? `${p.recommendedConcentrationMin}–${p.recommendedConcentrationMax} %`
        : null,
  },
  {
    label: "cmp.rowPhEmulsion",
    render: (p) =>
      p.phEmulsionMin != null
        ? p.phEmulsionMax != null && p.phEmulsionMin !== p.phEmulsionMax
          ? `${p.phEmulsionMin}–${p.phEmulsionMax}`
          : `${p.phEmulsionMin}`
        : null,
  },
  {
    label: "cmp.rowWaterHardness",
    render: (p) =>
      p.waterHardnessMinDh != null || p.waterHardnessMaxDh != null
        ? `${p.waterHardnessMinDh ?? 0}–${p.waterHardnessMaxDh ?? "?"} °dH`
        : null,
  },
  { label: "cmp.rowIsoVg", render: (p) => p.viscosityIso },
  {
    label: "cmp.rowBor",
    render: (p, t) =>
      p.containsBor == null
        ? null
        : p.containsBor
          ? <span className="text-amber-700">{t("cmp.contained")}</span>
          : <span className="text-emerald-700">{t("cmp.borFree")}</span>,
  },
  {
    label: "cmp.rowFormaldehyde",
    render: (p, t) =>
      p.containsFormaldehydeDepot == null
        ? null
        : p.containsFormaldehydeDepot
          ? <span className="text-amber-700">{t("cmp.contained")}</span>
          : <span className="text-emerald-700">{t("cmp.free")}</span>,
  },
  {
    label: "cmp.rowChlorine",
    render: (p, t) =>
      p.containsChlorine == null
        ? null
        : p.containsChlorine
          ? <span className="text-amber-700">{t("cmp.contained")}</span>
          : <span className="text-emerald-700">{t("cmp.chlorineFree")}</span>,
  },
  {
    label: "cmp.rowSuitableFor",
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
    label: "cmp.rowUnsuitableFor",
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
    label: "cmp.rowDataSource",
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
  const t = await getT();
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

  // Preisverlauf je Produkt (für den gemeinsamen Mehr-Produkt-Chart) laden.
  const priceSeries: PriceSeries[] = (
    await Promise.all(
      sortedProducts.map(async (p) => ({
        productId: p.id,
        name: p.name,
        manufacturer: p.manufacturer.name,
        data: await getMonthlyMedianHistory(p.id),
      })),
    )
  );
  const hasAnyPriceData = priceSeries.some((s) => s.data.length > 0);

  // Gesamtkosten-Vergleich: nur für wassermischbare KSS im Vergleich sinnvoll
  const tcoProducts = sortedProducts.filter((p) => p.category === "COOLANT_WATER_MIX");
  const tcoPrices = await getCurrentPricesBatch(tcoProducts.map((p) => p.id));
  const tcoInputs = tcoProducts.map((p) => {
    const price = tcoPrices.get(p.id);
    return {
      id: p.id,
      name: p.name,
      manufacturer: p.manufacturer.name,
      priceEurPerL: price && price.unitLabel === "EUR/L" ? price.median : null,
      concentrationPct:
        p.recommendedConcentrationMin != null && p.recommendedConcentrationMax != null
          ? (p.recommendedConcentrationMin + p.recommendedConcentrationMax) / 2
          : null,
      sumpLifeWeeks: p.typicalSumpLifeWeeks,
    };
  });

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
          <h1 className="page-title">{t("cmp.title")}</h1>
        </div>
      </header>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-slate-400" />
          <p className="mt-2 text-sm text-slate-600">{t("cmp.empty")}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t("cmp.emptyHintBefore")}
            <Link href="/listings" className="text-brand-600 hover:underline">
              {t("cmp.emptyHintLink")}
            </Link>
            {t("cmp.emptyHintAfter")}
          </p>
        </div>
      ) : null}

      {sortedListings.length > 0 ? (
        <section className="space-y-4">
          <div className="mb-1 flex items-center gap-2">
            <ListChecks size={18} className="text-slate-600" />
            <h2 className="section-title">
              {t("cmp.sectionListings")} <span className="text-sm font-normal text-slate-500">({sortedListings.length})</span>
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
                    <strong>{t("cmp.mixed")}</strong>{" "}
                    {Array.from(types).join(", ")}.{t("cmp.mixedBanner1")}
                    <Link href="/listings" className="underline">
                      /listings
                    </Link>
                    {t("cmp.mixedBanner2")}
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
                    {t("cmp.property")}
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
                  const cells = sortedListings.map((l) => row.render(l, t));
                  const hasAny = cells.some((c) => c != null && c !== "" && c !== false);
                  if (!hasAny) return null;
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${row.highlight ? "bg-emerald-50/40" : ""}`}
                    >
                      <th className="sticky left-0 z-10 min-w-[170px] bg-inherit px-3 py-3 text-left align-top text-xs font-medium text-slate-600">
                        {t(row.label)}
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
                  ? fill(t("cmp.aiDisabledReason"), {
                      types: Array.from(listingTypes).join(", "),
                    })
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
              {t("cmp.sectionProducts")}{" "}
              <span className="text-sm font-normal text-slate-500">({sortedProducts.length})</span>
            </h2>
          </div>

          {/* Preisverlauf-Vergleich — mehrere Produkte in einem Chart */}
          {sortedProducts.length >= 1 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-700">
                  {t("cmp.priceHistoryComparison")}
                </h3>
              </div>
              {hasAnyPriceData ? (
                <MultiPriceHistoryChart series={priceSeries} />
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/40 p-6 text-center text-sm text-slate-500">
                  {t("cmp.noPriceData")}
                </p>
              )}
            </div>
          ) : null}

          {/* Gesamtkosten-Vergleich (€/Jahr) — der Einkäufer-Blick */}
          {tcoInputs.length >= 2 ? <TcoComparePanel products={tcoInputs} /> : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-[170px] bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("cmp.property")}
                  </th>
                  {sortedProducts.map((p) => (
                    <th
                      key={p.id}
                      className="min-w-[220px] border-l border-slate-200 px-3 py-3 text-left align-top"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-2">
                          <ProductImage
                            manufacturer={p.manufacturer.name}
                            productName={p.name}
                            packaging={packagingForProduct(p.category, p.id)}
                            size="sm"
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
                  const cells = sortedProducts.map((p) => row.render(p, t));
                  const hasAny = cells.some((c) => c != null && c !== "" && c !== false);
                  if (!hasAny) return null;
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${row.highlight ? "bg-emerald-50/40" : ""}`}
                    >
                      <th className="sticky left-0 z-10 min-w-[170px] bg-inherit px-3 py-3 text-left align-top text-xs font-medium text-slate-600">
                        {t(row.label)}
                        {row.hint ? (
                          <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                            {t(row.hint)}
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
