import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";
import { FilterBar } from "@/components/FilterBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SearchInput } from "@/components/SearchInput";
import { Tag, Plus } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  manufacturer?: string;
  productType?: string;
  chemistry?: string;
  isoViscosity?: string;
  region?: string;
  view?: string;
}>;

const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralöl",
  SEMI_SYNTHETIC: "Semi-synth.",
  SYNTHETIC: "Vollsynth.",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Andere",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { q, manufacturer, productType, chemistry, isoViscosity, region, view } = params;
  const variant: "compact" | "extended" = view === "extended" ? "extended" : "compact";

  const where: import("@prisma/client").Prisma.ListingWhereInput = {
    status: "ACTIVE",
    ...(manufacturer && { manufacturer: { contains: manufacturer, mode: "insensitive" } }),
    ...(productType && { productType: { equals: productType } }),
    ...(chemistry && { chemistry: chemistry as import("@prisma/client").ChemistryBase }),
    ...(isoViscosity && { isoViscosity: { equals: isoViscosity, mode: "insensitive" } }),
    ...(region && { locationRegion: { contains: region, mode: "insensitive" } }),
    ...(q && {
      OR: [
        { productName: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { applicationArea: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  // Filteroptionen aus der DB (alle aktiven Listings, unabhängig von aktuellem Filter)
  const productTypeOptions = await prisma.listing.groupBy({
    by: ["productType"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
  });
  const chemistryOptions = await prisma.listing.groupBy({
    by: ["chemistry"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  const [manufacturerGroups, isoGroups, regionGroups] = await Promise.all([
    prisma.listing.groupBy({ by: ["manufacturer"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.listing.groupBy({ by: ["isoViscosity"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.listing.groupBy({ by: ["locationRegion"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);

  const listings = await prisma.listing.findMany({
    where,
    // searchBoost wird BEWUSST nicht ins select aufgenommen — er steuert nur
    // die Reihenfolge und bleibt für normale Nutzer unsichtbar.
    include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
    // Versteckter Eigentümer-Boost zuerst, dann neueste Angebote.
    orderBy: [{ seller: { searchBoost: "desc" } }, { createdAt: "desc" }],
    take: 50,
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
  const listingsWithRating = listings.map((l) => ({
    ...l,
    seller: {
      ...l.seller,
      avgRating: ratingsBySeller.get(l.seller.id)?.avg ?? null,
      ratingCount: ratingsBySeller.get(l.seller.id)?.count ?? 0,
    },
  }));

  // Helper: URL für einen einzelnen Param-Switch (z.B. productType-Chip)
  function urlWithParam(name: string, value: string | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (manufacturer) p.set("manufacturer", manufacturer);
    if (productType) p.set("productType", productType);
    if (chemistry) p.set("chemistry", chemistry);
    if (isoViscosity) p.set("isoViscosity", isoViscosity);
    if (region) p.set("region", region);
    if (variant === "extended") p.set("view", "extended");
    if (value == null) p.delete(name);
    else p.set(name, value);
    return `/listings?${p.toString()}`;
  }

  const productTypeFilterOptions = [
    { value: "", label: "Alle Typen" },
    ...productTypeOptions
      .filter((o) => o.productType)
      .map((o) => ({ value: o.productType, label: o.productType, count: o._count._all })),
  ];
  const chemistryFilterOptions = [
    { value: "", label: "Alle Chemien" },
    ...chemistryOptions
      .filter((o) => o.chemistry)
      .map((o) => ({
        value: o.chemistry as string,
        label: CHEMISTRY_LABEL[o.chemistry as string] ?? (o.chemistry as string),
        count: o._count._all,
      })),
  ];
  const manufacturerFilterOptions = [
    { value: "", label: "Alle Hersteller" },
    ...manufacturerGroups
      .filter((o) => o.manufacturer)
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({ value: o.manufacturer, label: o.manufacturer, count: o._count._all })),
  ];
  const isoFilterOptions = [
    { value: "", label: "Alle ISO VG" },
    ...isoGroups
      .filter((o) => o.isoViscosity)
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({ value: o.isoViscosity as string, label: o.isoViscosity as string, count: o._count._all })),
  ];
  const regionFilterOptions = [
    { value: "", label: "Alle Regionen" },
    ...regionGroups
      .filter((o) => o.locationRegion)
      .sort((a, b) => b._count._all - a._count._all)
      .map((o) => ({ value: o.locationRegion as string, label: o.locationRegion as string, count: o._count._all })),
  ];
  const filterCount =
    (q ? 1 : 0) +
    (productType ? 1 : 0) +
    (chemistry ? 1 : 0) +
    (manufacturer ? 1 : 0) +
    (isoViscosity ? 1 : 0) +
    (region ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header: „Ich biete an" — klarer Startpunkt (Anbieten = blau) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Tag size={24} />
          </span>
          <div>
            <h1 className="page-title text-blue-900">Ich biete an</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Bestände übrig? Hier startest du — Angebot einstellen und für Käufer sichtbar werden.
            </p>
          </div>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-blue-700 hover:shadow-lift"
        >
          <Plus size={20} /> Eigenes Angebot einstellen
        </Link>
      </div>

      <FilterBar
        count={listings.length}
        title="Aktuelle Angebote"
        noun={listings.length === 1 ? "Angebot" : "Angebote"}
        resetHref="/listings"
        filterCount={filterCount}
        collapsible
        search={<SearchInput placeholder="z.B. Tellus, Hydraulik, ISO 46…" />}
        toolbar={
          <div className="inline-flex overflow-hidden rounded-full ring-1 ring-slate-200">
            <Link
              href={urlWithParam("view", null)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                variant === "compact" ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Kompakte Liste"
            >
              ≡ Kompakt
            </Link>
            <Link
              href={urlWithParam("view", "extended")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                variant === "extended" ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Detaillierte Karten"
            >
              ▦ Erweitert
            </Link>
          </div>
        }
      >
        <FilterDropdown label="Produkttyp" paramKey="productType" options={productTypeFilterOptions} />
        <FilterDropdown label="Chemie" paramKey="chemistry" options={chemistryFilterOptions} />
        <FilterDropdown label="Hersteller" paramKey="manufacturer" options={manufacturerFilterOptions} />
        <FilterDropdown label="ISO VG" paramKey="isoViscosity" options={isoFilterOptions} />
        <FilterDropdown label="Region" paramKey="region" options={regionFilterOptions} />
      </FilterBar>

      {/* ERGEBNISSE */}
      <div className="space-y-2">
      {listings.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-slate-500">
          Keine Listings gefunden.{" "}
          <Link href="/listings" className="text-brand-500 hover:underline">
            Filter zurücksetzen
          </Link>{" "}
          oder{" "}
          <Link href="/listings/new" className="text-brand-500 hover:underline">
            neues Listing anlegen
          </Link>
          .
        </div>
      ) : variant === "compact" ? (
        <div className="space-y-2">
          {listingsWithRating.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              hideStatus
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listingsWithRating.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              hideStatus
              variant="extended"
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
