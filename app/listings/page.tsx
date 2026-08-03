import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConceptBrowseGrid, type BrowseListing } from "@/components/ConceptBrowseGrid";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { AdSlot } from "@/components/AdSlot";
import { FilterDropdown, type FilterOption } from "@/components/FilterDropdown";
import { PACKAGING_LABEL } from "@/lib/branding";
import {
  APPLICATION_FACETS,
  getApplicationFacet,
  listingMatchesApplication,
} from "@/lib/application-facets";
import { buildSearchWhere } from "@/lib/normalize-search";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { activeTier, hasPriorityPlacement } from "@/lib/membership-tiers";
import { LayoutGrid, BookOpen } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { BrandLogo } from "@/components/BrandLogo";
import { packagingForProduct } from "@/lib/product-packaging";

type SearchParams = Promise<{
  q?: string;
  productType?: string;
  manufacturer?: string;
  application?: string;
  chemistry?: string;
  packaging?: string;
  region?: string;
  cert?: string;
}>;

/** Pipe-separierte Mehrfachwerte aus der URL (Konvention von FilterDropdown). */
function multi(v?: string): string[] {
  return v ? v.split("|").filter(Boolean) : [];
}

const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralöl",
  SEMI_SYNTHETIC: "Teilsynthetisch",
  SYNTHETIC: "Synthetisch",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Andere",
};

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  const params = await searchParams;
  const { q, productType } = params;

  const facetSel = {
    manufacturer: multi(params.manufacturer),
    application: multi(params.application),
    chemistry: multi(params.chemistry),
    packaging: multi(params.packaging),
    region: multi(params.region),
    cert: multi(params.cert),
  };
  type FacetDim = keyof typeof facetSel;
  const facetDims = Object.keys(facetSel) as FacetDim[];
  const activeDims = facetDims.filter((d) => facetSel[d].length > 0);

  // Wort-für-Wort-Suche: jedes Wort darf in einem ANDEREN Feld stehen
  // („Avia 46" = Hersteller Avia UND ISO VG 46). Füllwörter wie „iso"/„vg"
  // werden ignoriert — „Avia ISO 46" fand sonst nichts, obwohl das Produkt
  // da ist. Umlaute bleiben erhalten (Feldinhalte sind nicht normalisiert).
  const qTokens = (q ?? "")
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((t) => t.replace(/[^a-z0-9äöüß.-]/gi, ""))
    .filter((t) => t.length >= 2 && !["iso", "vg"].includes(t));

  const where: import("@prisma/client").Prisma.ListingWhereInput = {
    status: "ACTIVE",
    ...(productType && { productType: { equals: productType } }),
    ...(qTokens.length > 0 && {
      AND: qTokens.map((tok) => ({
        OR: [
          { productName: { contains: tok, mode: "insensitive" as const } },
          { manufacturer: { contains: tok, mode: "insensitive" as const } },
          { description: { contains: tok, mode: "insensitive" as const } },
          { applicationArea: { contains: tok, mode: "insensitive" as const } },
          { productType: { contains: tok, mode: "insensitive" as const } },
          { isoViscosity: { contains: tok, mode: "insensitive" as const } },
        ],
      })),
    }),
  };

  const productTypeOptions = await prisma.listing.groupBy({
    by: ["productType"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Alle Treffer (vor Facetten) einmal schlank laden — daraus entstehen sowohl
  // die Facetten-Optionen mit Zählern als auch die ID-Liste für die Hauptabfrage.
  const facetRows = await prisma.listing.findMany({
    where,
    select: {
      id: true,
      manufacturer: true,
      chemistry: true,
      packaging: true,
      locationRegion: true,
      certificates: true,
      applicationArea: true,
      machiningOperations: true,
    },
  });
  type FacetRow = (typeof facetRows)[number];

  const rowMatches: Record<FacetDim, (r: FacetRow) => boolean> = {
    manufacturer: (r) => facetSel.manufacturer.includes(r.manufacturer),
    chemistry: (r) => facetSel.chemistry.includes(r.chemistry as string),
    packaging: (r) => facetSel.packaging.includes(r.packaging as string),
    region: (r) => facetSel.region.includes(r.locationRegion),
    cert: (r) => r.certificates.some((c) => facetSel.cert.includes(c)),
    application: (r) =>
      facetSel.application.some((id) => {
        const f = getApplicationFacet(id);
        return f ? listingMatchesApplication(f, r.applicationArea, r.machiningOperations) : false;
      }),
  };

  /** Zeilen, die alle aktiven Facetten außer `skip` erfüllen (für korrekte Zähler). */
  function rowsExcept(skip?: FacetDim): FacetRow[] {
    return facetRows.filter((r) =>
      activeDims.every((d) => (d === skip ? true : rowMatches[d](r))),
    );
  }

  const allowedIds = rowsExcept().map((r) => r.id);

  function tally(rows: FacetRow[], value: (r: FacetRow) => string[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const r of rows) {
      for (const v of value(r)) {
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
    }
    return m;
  }
  function toOptions(m: Map<string, number>, label?: (v: string) => string): FilterOption[] {
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de"))
      .map(([value, count]) => ({ value, label: label ? label(value) : value, count }));
  }

  const manufacturerOptions = toOptions(tally(rowsExcept("manufacturer"), (r) => [r.manufacturer]));
  const chemistryOptions = toOptions(
    tally(rowsExcept("chemistry"), (r) => [r.chemistry as string]),
    (v) => CHEMISTRY_LABEL[v] ?? v,
  );
  const packagingOptions = toOptions(
    tally(rowsExcept("packaging"), (r) => [r.packaging as string]),
    (v) => (PACKAGING_LABEL as Record<string, string>)[v] ?? v,
  );
  const regionOptions = toOptions(tally(rowsExcept("region"), (r) => [r.locationRegion]));
  const certOptions = toOptions(tally(rowsExcept("cert"), (r) => r.certificates));
  const applicationRows = rowsExcept("application");
  const applicationOptions: FilterOption[] = APPLICATION_FACETS.map((f) => ({
    value: f.id,
    label: t(f.labelKey),
    count: applicationRows.filter((r) =>
      listingMatchesApplication(f, r.applicationArea, r.machiningOperations),
    ).length,
  })).filter((o) => (o.count ?? 0) > 0);

  const listings = await prisma.listing.findMany({
    where: activeDims.length > 0 ? { id: { in: allowedIds } } : where,
    include: {
      seller: {
        select: {
          id: true,
          pseudonym: true,
          trustTier: true,
          searchBoost: true,
          membershipTier: true,
          membershipValidUntil: true,
        },
      },
      photos: { select: { id: true }, orderBy: { position: "asc" } },
    },
    orderBy: [{ seller: { searchBoost: "desc" } }, { createdAt: "desc" }],
    take: 60,
  });

  // Bevorzugte Platzierung für aktive Pro-/Marke-Mitglieder: innerhalb der
  // geladenen Seite nach oben sortieren (danach searchBoost, dann Datum).
  listings.sort((a, b) => {
    const pa = hasPriorityPlacement(activeTier(a.seller)) ? 1 : 0;
    const pb = hasPriorityPlacement(activeTier(b.seller)) ? 1 : 0;
    if (pa !== pb) return pb - pa;
    if (a.seller.searchBoost !== b.seller.searchBoost) return b.seller.searchBoost - a.seller.searchBoost;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const sellerIds = [...new Set(listings.map((l) => l.seller.id))];
  const ratingsBySeller = new Map<string, { avg: number | null; count: number }>();
  if (sellerIds.length > 0) {
    const aggs = await prisma.review.groupBy({
      by: ["revieweeId"],
      where: { revieweeId: { in: sellerIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const a of aggs) {
      ratingsBySeller.set(a.revieweeId, { avg: a._avg.rating, count: a._count._all });
    }
  }

  const browseListings: BrowseListing[] = listings.map((l) => ({
    id: l.id,
    productName: l.productName,
    productType: l.productType,
    manufacturer: l.manufacturer,
    iso: l.isoViscosity ? `ISO VG ${l.isoViscosity}` : null,
    chem: CHEMISTRY_LABEL[l.chemistry as string] ?? null,
    quantity: l.quantity,
    unit: l.quantityUnit,
    packaging: (PACKAGING_LABEL as Record<string, string>)[l.packaging] ?? l.packaging,
    packagingForm: l.packaging,
    minOrder: l.minOrderQty,
    region: l.locationRegion,
    price: l.priceEur,
    sponsored: l.seller.searchBoost > 0,
    photos: l.photos,
    seller: {
      name: l.seller.pseudonym,
      tier: l.seller.trustTier,
      ratingAvg: ratingsBySeller.get(l.seller.id)?.avg ?? null,
      ratingCount: ratingsBySeller.get(l.seller.id)?.count ?? 0,
    },
  }));

  // Zusätzlich zu den aktiven Angeboten (Anbieten) auch den Produktkatalog der
  // Wissensbasis durchsuchen — Angebote decken meist nur eine Handvoll Produkte
  // ab, während der Katalog (Hersteller × Produkte) deutlich umfangreicher ist.
  const catalogWhere = buildSearchWhere("searchTokens", q);
  const catalogProducts = catalogWhere
    ? await prisma.product.findMany({
        where: catalogWhere,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          viscosityIso: true,
          manufacturer: { select: { name: true, slug: true } },
        },
        orderBy: { name: "asc" },
        take: 24,
      })
    : [];

  const totalActive = productTypeOptions.reduce((s, o) => s + o._count._all, 0);
  const categoryChips = productTypeOptions
    .filter((o) => o.productType)
    .slice(0, 12)
    .map((o) => ({ label: o.productType, count: o._count._all }));

  function chipHref(pt: string | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (pt) p.set("productType", pt);
    // Aktive Facetten beim Kategorie-Wechsel beibehalten
    for (const d of activeDims) p.set(d, facetSel[d].join("|"));
    const s = p.toString();
    return s ? `/listings?${s}` : "/listings";
  }

  // "Filter zurücksetzen" behält Suche + Kategorie, leert nur die Facetten
  const resetParams = new URLSearchParams();
  if (q) resetParams.set("q", q);
  if (productType) resetParams.set("productType", productType);
  const resetHref = resetParams.toString() ? `/listings?${resetParams}` : "/listings";

  return (
    <div className="space-y-5">
      {/* Kategorie-Kacheln mit Symbolen (wie im Konzept) */}
      {categoryChips.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <CatChip
            href={chipHref(null)}
            active={!productType}
            label={t("filter.all")}
            count={totalActive}
            glyph={<LayoutGrid className="h-4 w-4" />}
          />
          {categoryChips.map((c) => (
            <CatChip
              key={c.label}
              href={chipHref(c.label)}
              active={productType === c.label}
              label={c.label}
              count={c.count}
              glyph={<CategoryGlyph productType={c.label} className="h-4 w-4" />}
            />
          ))}
        </div>
      )}

      {/* Facetten-Filter — nach Eigenschaften eingrenzen statt nur Volltext */}
      <div className="card space-y-2 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <FilterDropdown label={t("filter.manufacturer")} paramKey="manufacturer" options={manufacturerOptions} multiple />
          <FilterDropdown label={t("filter.application")} paramKey="application" options={applicationOptions} multiple />
          <FilterDropdown label={t("filter.chemistry")} paramKey="chemistry" options={chemistryOptions} multiple />
          <FilterDropdown label={t("filter.packaging")} paramKey="packaging" options={packagingOptions} multiple />
          <FilterDropdown label={t("filter.region")} paramKey="region" options={regionOptions} multiple />
          <FilterDropdown label={t("filter.approvals")} paramKey="cert" options={certOptions} multiple />
        </div>
        {activeDims.length > 0 && (
          <div className="flex justify-end">
            <Link
              href={resetHref}
              className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              {fill(t("filter.reset"), { n: activeDims.length })}
            </Link>
          </div>
        )}
      </div>

      <AdSlot placement="LISTINGS" />

      <ConceptBrowseGrid listings={browseListings} />

      {/* Treffer aus dem Produktkatalog (Wissensbasis) — auch wenn gerade kein
          Anbieten dafür aktiv ist, z.B. bei Herstellersuche wie "Blaser". */}
      {catalogProducts.length > 0 && (
        <section className="space-y-3">
          {/* Die Katalog-Treffer waren früher blasse Text-Kacheln und gingen
              neben den Angeboten unter. Jetzt mit Gebindebild, Herstellerlogo
              und Produktart — dieselbe Bildsprache wie die Angebotskarten. */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="section-title flex items-center gap-2">
              <BookOpen size={18} className="text-brand-600" />
              {fill(t("listings.catalogTitle"), { q: q ?? "" })}
            </h2>
            <span className="text-sm font-medium text-slate-500">
              {catalogProducts.length}{" "}
              {catalogProducts.length === 1 ? "Produkt" : "Produkte"}
            </span>
          </div>
          <p className="text-sm text-slate-600">{t("listings.catalogHint")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalogProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.manufacturer.slug}/${p.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lift"
              >
                <ProductImage
                  manufacturer={p.manufacturer.name}
                  productName={p.name}
                  packaging={packagingForProduct(p.category, p.id)}
                  size="sm"
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <div className="min-w-0 flex-1">
                  <BrandLogo manufacturer={p.manufacturer.name} size="xs" />
                  <div className="mt-1 truncate text-sm font-bold text-slate-900 group-hover:text-brand-700">
                    {p.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="chip bg-slate-100 text-slate-600">
                      {t(`cat.${p.category}`)}
                    </span>
                    {p.viscosityIso && (
                      <span className="chip bg-slate-100 text-slate-600">
                        ISO VG {p.viscosityIso.replace(/^ISO\s*VG\s*/i, "")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CatChip({
  href,
  active,
  label,
  count,
  glyph,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  glyph: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl border py-2 pl-2 pr-3.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg ${
          active ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-700"
        }`}
      >
        {glyph}
      </span>
      <span className="whitespace-nowrap">{label}</span>
      <span className={`text-xs ${active ? "text-brand-600" : "text-slate-400"}`}>{count}</span>
    </Link>
  );
}
