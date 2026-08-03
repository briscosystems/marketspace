import Link from "next/link";
import { LeerHinweis } from "@/components/LeerHinweis";
import { prisma } from "@/lib/prisma";
import { getCurrentPricesBatch } from "@/lib/price-aggregation";
import { FilterBar } from "@/components/FilterBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SearchInput } from "@/components/SearchInput";
import { buildSearchWhere } from "@/lib/normalize-search";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { ProductImage } from "@/components/ProductImage";
import { packagingForProduct } from "@/lib/product-packaging";
import { SimilarToggle } from "@/components/SimilarToggle";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { TrendingUp, Sparkles } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: "price-asc" | "price-desc" | "name" | "manufacturer";
  price?: string;
  similar?: string; // Komma-getrennte Produkt-IDs (Vergleichsauswahl) als Referenz
}>;

// Genormte ISO-VG-Klassen — nur diese Zahlen zählen als Viskositätsangabe.
const ISO_VG_CLASSES = new Set([2, 3, 5, 7, 10, 15, 22, 32, 46, 68, 100, 150, 220, 320, 460, 680, 1000, 1500]);

/**
 * Extrahiert ISO-VG-Klassen NUR aus dem Produkteigenschafts-Feld viscosityIso
 * (z. B. "ISO VG 46" oder "22/32/46"). Der Produktname wird bewusst NICHT
 * herangezogen — Ähnlichkeit basiert auf Eigenschaften, nicht auf Namen.
 */
function extractVgClasses(viscosityIso: string | null): number[] {
  const found = new Set<number>();
  for (const m of (viscosityIso ?? "").matchAll(/\d{1,4}/g)) {
    const n = parseInt(m[0], 10);
    if (ISO_VG_CLASSES.has(n)) found.add(n);
  }
  return [...found];
}

export const metadata = { title: "Indikative Richtwerte — Brisco Marketplace" };

export default async function PricesOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
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
      viscosityIso: true,
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

  // "Nur ähnliche Produkte": angehakte Vergleichsprodukte als Referenz.
  // Ähnlichkeit GANZ GROB über Kategorie + Produkteigenschaften (KEIN Namens-
  // Vergleich): gleiche Kategorie ist Pflicht; bei den Eigenschaften ISO VG und
  // Chemie-Basis wird nur ausgeschlossen, was NACHWEISLICH abweicht — Produkte
  // ohne gepflegte Angabe bleiben sichtbar (Datenlage ist lückenhaft).
  const similarIds = (sp.similar ?? "").split(",").filter(Boolean);
  const similarRefs =
    similarIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: similarIds } },
          select: { id: true, name: true, category: true, viscosityIso: true, chemistry: true, manufacturer: { select: { name: true } } },
        })
      : [];
  if (similarRefs.length > 0) {
    const refCategories = new Set(similarRefs.map((r) => r.category));
    const refVgs = new Set(similarRefs.flatMap((r) => extractVgClasses(r.viscosityIso)));
    const refChemistries = new Set(similarRefs.map((r) => r.chemistry).filter(Boolean));
    rows = rows.filter((r) => {
      if (similarIds.includes(r.id)) return true; // Referenzen selbst immer zeigen
      // Eigenschaft 1 (Pflicht): gleiche Kategorie
      if (!refCategories.has(r.category)) return false;
      // Eigenschaft 2: ISO-VG-Klasse — nur bekannte Abweichung schließt aus
      if (refVgs.size > 0) {
        const rowVgs = extractVgClasses(r.viscosityIso);
        if (rowVgs.length > 0 && !rowVgs.some((v) => refVgs.has(v))) return false;
      }
      // Eigenschaft 3: Chemie-Basis (mineralisch/synthetisch/…) — dito
      if (refChemistries.size > 0 && r.chemistry && !refChemistries.has(r.chemistry)) return false;
      return true;
    });
  }

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
    { value: "", label: t("prc.allCategories") },
    ...categoriesAvailable
      .slice()
      .sort((a, b) => b._count._all - a._count._all)
      .map((c) => ({
        value: c.category,
        label: t(`prc.cat.${c.category}`),
        count: c._count._all,
      })),
  ];
  const priceOptions = [
    { value: "", label: t("prc.allPrices") },
    { value: "0-5", label: t("prc.priceUnder5") },
    { value: "5-10", label: t("prc.price5to10") },
    { value: "10-20", label: t("prc.price10to20") },
    { value: "20-50", label: t("prc.price20to50") },
    { value: "50-", label: t("prc.priceOver50") },
  ];
  const sortOptions = [
    { value: "price-asc", label: t("prc.sortPriceAsc") },
    { value: "price-desc", label: t("prc.sortPriceDesc") },
    { value: "name", label: t("prc.sortName") },
    { value: "manufacturer", label: t("prc.sortManufacturer") },
  ];
  const filterCount =
    (sp.q ? 1 : 0) + (sp.category ? 1 : 0) + (sp.price ? 1 : 0) + (similarRefs.length > 0 ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <TrendingUp size={20} />
        </span>
        <div>
          <h1 className="page-title">{t("prc.title")}</h1>
          <p className="text-sm text-slate-500">
            {fill(t("prc.productsWithGuide"), { n: productIdsWithPrices.length.toLocaleString("de-CH") })}
          </p>
          <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            {t("prc.explainA")}<strong>{t("prc.explainStrong")}</strong>{t("prc.explainB")}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {t("prc.tipPrefix")}<span className="font-medium text-slate-500">{t("prc.tipColumn")}</span>{t("prc.tipSuffix")}
          </p>
        </div>
      </div>

      <FilterBar
        count={total}
        noun={total === 1 ? t("prc.nounSingular") : t("prc.nounPlural")}
        resetHref="/prices"
        filterCount={filterCount}
        search={<SearchInput placeholder={t("prc.searchPlaceholder")} />}
        toolbar={
          <>
            <FilterDropdown
              label={t("prc.sortLabel")}
              paramKey="sort"
              options={sortOptions}
              widthClass="w-56"
            />
            <SimilarToggle />
            <span className="text-xs text-slate-500">
              {total} {total === 1 ? t("prc.nounSingular") : t("prc.nounPlural")} {t("prc.withGuideSuffix")}
            </span>
          </>
        }
      >
        <FilterDropdown label={t("prc.categoryLabel")} paramKey="category" options={categoryOptions} />
        <FilterDropdown label={t("prc.priceLabel")} paramKey="price" options={priceOptions} />
      </FilterBar>

      {/* Aktiver Ähnlichkeits-Filter: Referenzen anzeigen */}
      {similarRefs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2 text-xs text-slate-700">
          <Sparkles size={14} className="shrink-0 text-brand-600" />
          <span className="font-medium">{t("prc.similarTo")}</span>
          {similarRefs.map((r) => (
            <span key={r.id} className="rounded-full bg-white px-2 py-0.5 ring-1 ring-brand-200">
              {r.manufacturer.name} · {r.name}
            </span>
          ))}
          <span className="text-slate-500">
            {fill(t("prc.similarExplain"), { n: total })}
          </span>
          <Link
            href={(() => {
              const p = new URLSearchParams();
              if (sp.q) p.set("q", sp.q);
              if (sp.category) p.set("category", sp.category);
              if (sp.sort) p.set("sort", sp.sort);
              if (sp.price) p.set("price", sp.price);
              const qs = p.toString();
              return qs ? `/prices?${qs}` : "/prices";
            })()}
            className="ml-auto font-medium text-brand-700 hover:underline"
          >
            {t("prc.filterOff")}
          </Link>
        </div>
      ) : null}

      {/* ERGEBNISSE — Tabelle */}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <LeerHinweis
            titel="Für diese Auswahl liegt uns kein Richtwert vor."
            text="Richtwerte entstehen aus gemeldeten Preisen und abgeschlossenen Geschäften. Stell eine Anfrage — die Rückmeldungen fließen anonymisiert in die Richtwerte ein."
            aktionen={["anfrage", "suche"]}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t("prc.colProduct")}</th>
                  <th className="px-3 py-2 text-right">{t("prc.colGuide")}</th>
                  <th className="px-3 py-2 text-right">{t("prc.colRange")}</th>
                  <th className="px-3 py-2 text-center">{t("prc.colObs")}</th>
                  <th className="px-3 py-2 text-center">{t("prc.colConfidence")}</th>
                  <th className="px-3 py-2 text-center">{t("prc.colCompare")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 200).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <ProductImage
                          manufacturer={r.manufacturer.name}
                          productName={r.name}
                          packaging={packagingForProduct(r.category, r.id)}
                          size="xs"
                        />
                        <div>
                          <Link
                            href={`/products/${r.manufacturer.slug}/${r.slug}`}
                            className="font-medium hover:text-brand-600"
                          >
                            {r.manufacturer.name} · {r.name}
                          </Link>
                          <div className="text-[10px] text-slate-500">
                            {t(`prc.cat.${r.category}`)}
                            {r.chemistry ? ` · ${r.chemistry}` : ""}
                          </div>
                        </div>
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
                        {t(`prc.conf.${r.price!.confidence}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CompareToggle id={r.id} kind="products" variant="checkbox" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="border-t border-slate-200 px-3 py-2 text-center text-xs text-amber-700">
                {fill(t("prc.truncated"), { n: rows.length })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
