import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPricesBatch } from "@/lib/price-aggregation";
import { FilterBar } from "@/components/FilterBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SearchInput } from "@/components/SearchInput";
import { buildSearchWhere } from "@/lib/normalize-search";
import { TrendingUp } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: "price-asc" | "price-desc" | "name" | "manufacturer";
  price?: string;
}>;

export const metadata = { title: "Marktpreise — Brisco Marketplace" };

const CATEGORY_LABEL: Record<string, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl",
  GRINDING_OIL: "Schleiföl",
  EDM_FLUID: "EDM",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  COMPRESSOR_OIL: "Kompressoröl",
  SLIDEWAY_OIL: "Bettbahnöl",
  FORMING_OIL: "Umform",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  SPECIALTY: "Spezial",
  ADDITIVE: "Additiv",
  OTHER: "Andere",
};

export default async function PricesOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "price-asc";
  // Preis-Spanne aus Preset-Param "price" (z.B. "5-10", "50-" = ab 50).
  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  if (sp.price) {
    const [lo, hi] = sp.price.split("-");
    minPrice = lo ? parseFloat(lo) : undefined;
    maxPrice = hi ? parseFloat(hi) : undefined;
  }

  const searchWhere = buildSearchWhere("searchTokens", sp.q);

  // Erst alle Produkte mit verifizierten Preisen finden (productIds aus PriceObservation)
  const productsWithPrices = await prisma.priceObservation.findMany({
    where: { status: "VERIFIED" },
    select: { productId: true },
    distinct: ["productId"],
  });
  const productIdsWithPrices = productsWithPrices.map((p) => p.productId);

  // Produkte laden (mit Filter)
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIdsWithPrices },
      ...(sp.category && { category: sp.category as never }),
      ...(searchWhere && { AND: searchWhere.AND }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      chemistry: true,
      manufacturer: { select: { name: true, slug: true } },
    },
  });

  // Preise batch laden
  const pricesMap = await getCurrentPricesBatch(products.map((p) => p.id));

  // In Liste mit Preisen, Filter min/max
  let rows = products
    .map((p) => ({
      ...p,
      price: pricesMap.get(p.id) ?? null,
    }))
    .filter((r) => r.price !== null)
    .filter((r) => (minPrice === undefined || r.price!.median >= minPrice))
    .filter((r) => (maxPrice === undefined || r.price!.median <= maxPrice));

  // Sortieren
  rows.sort((a, b) => {
    if (sort === "price-asc") return a.price!.median - b.price!.median;
    if (sort === "price-desc") return b.price!.median - a.price!.median;
    if (sort === "manufacturer") return a.manufacturer.name.localeCompare(b.manufacturer.name);
    return a.name.localeCompare(b.name);
  });

  // Kategorien für Filter-Optionen (vorhanden in unserer Preisliste)
  const categoriesAvailable = await prisma.product.groupBy({
    by: ["category"],
    where: { id: { in: productIdsWithPrices } },
    _count: { _all: true },
  });

  const total = rows.length;

  const categoryOptions = [
    { value: "", label: "Alle Kategorien" },
    ...categoriesAvailable
      .slice()
      .sort((a, b) => b._count._all - a._count._all)
      .map((c) => ({
        value: c.category,
        label: CATEGORY_LABEL[c.category] ?? c.category,
        count: c._count._all,
      })),
  ];
  const priceOptions = [
    { value: "", label: "Alle Preise" },
    { value: "0-5", label: "unter 5 €" },
    { value: "5-10", label: "5 – 10 €" },
    { value: "10-20", label: "10 – 20 €" },
    { value: "20-50", label: "20 – 50 €" },
    { value: "50-", label: "über 50 €" },
  ];
  const sortOptions = [
    { value: "price-asc", label: "Preis aufsteigend" },
    { value: "price-desc", label: "Preis absteigend" },
    { value: "name", label: "Produktname A–Z" },
    { value: "manufacturer", label: "Hersteller A–Z" },
  ];
  const filterCount = (sp.q ? 1 : 0) + (sp.category ? 1 : 0) + (sp.price ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <TrendingUp size={20} />
        </span>
        <div>
          <h1 className="page-title">Marktpreise</h1>
          <p className="text-sm text-slate-500">
            {productIdsWithPrices.length.toLocaleString("de-CH")} Produkte mit verifizierten Preisen
          </p>
        </div>
      </div>

      <FilterBar
        count={total}
        noun={total === 1 ? "Produkt" : "Produkte"}
        resetHref="/prices"
        filterCount={filterCount}
        search={<SearchInput placeholder="z.B. bcool, tellus, mobilgear…" />}
        toolbar={
          <>
            <FilterDropdown
              label="Sortieren"
              paramKey="sort"
              options={sortOptions}
              widthClass="w-56"
            />
            <span className="text-xs text-slate-500">
              {total} {total === 1 ? "Produkt" : "Produkte"} mit Marktpreis
            </span>
          </>
        }
      >
        <FilterDropdown label="Kategorie" paramKey="category" options={categoryOptions} />
        <FilterDropdown label="Preis" paramKey="price" options={priceOptions} />
      </FilterBar>

      {/* ERGEBNISSE — Tabelle */}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
            Keine Produkte mit Preis gefunden — Filter aufweichen oder{" "}
            <Link href="/prices" className="text-brand-600 hover:underline">zurücksetzen</Link>.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Produkt</th>
                  <th className="px-3 py-2 text-right">Marktpreis</th>
                  <th className="px-3 py-2 text-right">Spanne</th>
                  <th className="px-3 py-2 text-center">Beob.</th>
                  <th className="px-3 py-2 text-center">Konfidenz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 200).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/products/${r.manufacturer.slug}/${r.slug}`}
                        className="font-medium hover:text-brand-600"
                      >
                        {r.manufacturer.name} · {r.name}
                      </Link>
                      <div className="text-[10px] text-slate-500">
                        {CATEGORY_LABEL[r.category] ?? r.category}
                        {r.chemistry ? ` · ${r.chemistry}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-bold">
                      {r.price!.median.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        {r.price!.unitLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-600">
                      {r.price!.min.toFixed(2)} – {r.price!.max.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-600">
                      {r.price!.observationCount}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          r.price!.confidence === "high"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.price!.confidence === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {r.price!.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="border-t border-slate-200 px-3 py-2 text-center text-xs text-amber-700">
                ⚠ Tabelle zeigt 200 von {rows.length} — Filter verfeinern
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
