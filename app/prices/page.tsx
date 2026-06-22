import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPricesBatch } from "@/lib/price-aggregation";
import { LiveFilterForm } from "@/components/LiveFilterForm";
import { SearchSection } from "@/components/SearchSection";
import { buildSearchWhere } from "@/lib/normalize-search";
import { TrendingUp } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: "price-asc" | "price-desc" | "name" | "manufacturer";
  minPrice?: string;
  maxPrice?: string;
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
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;

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

  return (
    <div className="space-y-3">
      {/* 🔵 BRANDING-HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          <h1 className="page-title">Marktpreise</h1>
          <span className="text-xs text-slate-600">
            {productIdsWithPrices.length} Produkte mit verifizierten Preisen
          </span>
        </div>
      </div>

      <LiveFilterForm pathname="/prices" className="space-y-3">
        {/* ① SUCHFELD */}
        <SearchSection
          step="1"
          color="emerald"
          title="Suchfeld"
          subtitle="Volltextsuche im Produktname & Hersteller — live beim Tippen"
        >
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="z.B. bcool, tellus, mobilgear…"
            className="input border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-300"
            autoComplete="off"
          />
        </SearchSection>

        {/* ② SUCHKRITERIEN */}
        <SearchSection
          step="2"
          color="slate"
          title="Filter & Sortierung"
          subtitle="Kategorie · Preis-Spanne · Sortier-Reihenfolge"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Kategorie</label>
              <select name="category" defaultValue={sp.category ?? ""} className="input">
                <option value="">Alle</option>
                {categoriesAvailable.map((c) => (
                  <option key={c.category} value={c.category}>
                    {CATEGORY_LABEL[c.category] ?? c.category} ({c._count._all})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Min-Preis (EUR/L oder kg)</label>
              <input
                name="minPrice"
                type="number"
                step="0.1"
                defaultValue={sp.minPrice ?? ""}
                placeholder="z.B. 4"
                className="input"
              />
            </div>
            <div>
              <label className="label">Max-Preis (EUR/L oder kg)</label>
              <input
                name="maxPrice"
                type="number"
                step="0.1"
                defaultValue={sp.maxPrice ?? ""}
                placeholder="z.B. 15"
                className="input"
              />
            </div>
            <div>
              <label className="label">Sortieren</label>
              <select name="sort" defaultValue={sort} className="input">
                <option value="price-asc">Preis aufsteigend</option>
                <option value="price-desc">Preis absteigend</option>
                <option value="name">Produktname A-Z</option>
                <option value="manufacturer">Hersteller A-Z</option>
              </select>
            </div>
          </div>
        </SearchSection>
      </LiveFilterForm>

      {/* ③ ERGEBNISSE — Tabelle */}
      <SearchSection
        step="3"
        color="brand"
        title="Ergebnisse"
        subtitle={`${total} ${total === 1 ? "Produkt" : "Produkte"} mit Marktpreis`}
        rightSlot={
          (sp.q || sp.category || sp.minPrice || sp.maxPrice) && (
            <Link href="/prices" className="text-xs font-medium text-red-600 hover:underline">
              Filter zurücksetzen
            </Link>
          )
        }
      >
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
      </SearchSection>
    </div>
  );
}
