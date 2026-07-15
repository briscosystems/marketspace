import Link from "next/link";
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
          <h1 className="page-title">Indikative Richtwerte</h1>
          <p className="text-sm text-slate-500">
            {productIdsWithPrices.length.toLocaleString("de-CH")} Produkte mit Richtwert
          </p>
          <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            Die Werte sind <strong>modellierte Richtwerte</strong>, keine bestätigten
            Marktpreise — sie dienen der Orientierung und dem Vergleich. Sobald Nutzer eigene
            Preise melden oder Käufe über die Plattform laufen, fließen echte Werte ein.
            Verbindlich ist immer das individuelle Angebot des Anbieters.
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Tipp: In der Spalte <span className="font-medium text-slate-500">Vergleich</span>{" "}
            mehrere Produkte anhaken → unten erscheint „Vergleich ansehen" mit den
            Preisverläufen in einem Chart.
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
            <SimilarToggle />
            <span className="text-xs text-slate-500">
              {total} {total === 1 ? "Produkt" : "Produkte"} mit Richtwert
            </span>
          </>
        }
      >
        <FilterDropdown label="Kategorie" paramKey="category" options={categoryOptions} />
        <FilterDropdown label="Preis" paramKey="price" options={priceOptions} />
      </FilterBar>

      {/* Aktiver Ähnlichkeits-Filter: Referenzen anzeigen */}
      {similarRefs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2 text-xs text-slate-700">
          <Sparkles size={14} className="shrink-0 text-brand-600" />
          <span className="font-medium">Ähnlich zu:</span>
          {similarRefs.map((r) => (
            <span key={r.id} className="rounded-full bg-white px-2 py-0.5 ring-1 ring-brand-200">
              {r.manufacturer.name} · {r.name}
            </span>
          ))}
          <span className="text-slate-500">
            → gleiche Kategorie + grob passende Eigenschaften (ISO VG, Chemie), {total} Treffer
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
            Filter aus
          </Link>
        </div>
      ) : null}

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
                  <th className="px-3 py-2 text-right">Richtwert</th>
                  <th className="px-3 py-2 text-right">Spanne</th>
                  <th className="px-3 py-2 text-center">Beob.</th>
                  <th className="px-3 py-2 text-center">Konfidenz</th>
                  <th className="px-3 py-2 text-center">Vergleich</th>
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
                            {CATEGORY_LABEL[r.category] ?? r.category}
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
                        {r.price!.confidence}
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
                ⚠ Tabelle zeigt 200 von {rows.length} — Filter verfeinern
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
