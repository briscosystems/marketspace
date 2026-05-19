import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";

type SearchParams = Promise<{
  q?: string;
  manufacturer?: string;
  productType?: string;
  isoViscosity?: string;
  region?: string;
  certs?: string;
  view?: string;
}>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { q, manufacturer, productType, isoViscosity, region, certs, view } = params;
  const showCertificates = certs !== "0";
  const variant: "compact" | "extended" = view === "compact" ? "compact" : "extended";

  const where: import("@prisma/client").Prisma.ListingWhereInput = {
    status: "ACTIVE",
    ...(manufacturer && { manufacturer: { contains: manufacturer, mode: "insensitive" } }),
    ...(productType && { productType: { contains: productType, mode: "insensitive" } }),
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

  const listings = await prisma.listing.findMany({
    where,
    include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
    orderBy: { createdAt: "desc" },
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

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (manufacturer) baseParams.set("manufacturer", manufacturer);
  if (productType) baseParams.set("productType", productType);
  if (isoViscosity) baseParams.set("isoViscosity", isoViscosity);
  if (region) baseParams.set("region", region);
  if (!showCertificates) baseParams.set("certs", "0");

  const certToggleParams = new URLSearchParams(baseParams);
  if (showCertificates) certToggleParams.set("certs", "0");
  else certToggleParams.delete("certs");
  if (variant === "compact") certToggleParams.set("view", "compact");
  const certToggleHref = `/listings?${certToggleParams.toString()}`;

  const compactHref = `/listings?${(() => {
    const p = new URLSearchParams(baseParams);
    p.set("view", "compact");
    return p.toString();
  })()}`;
  const extendedHref = `/listings?${(() => {
    const p = new URLSearchParams(baseParams);
    p.delete("view");
    return p.toString();
  })()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Listings</h1>
          <p className="text-sm text-slate-500">
            {listings.length} Treffer
          </p>
        </div>
        <Link href="/listings/new" className="btn-primary">
          Neues Listing
        </Link>
      </div>

      <form className="card grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="label">Volltext</label>
          <input name="q" defaultValue={q} className="input" placeholder="z.B. Tellus, Hydraulik" />
        </div>
        <div>
          <label className="label">Hersteller</label>
          <input
            name="manufacturer"
            defaultValue={manufacturer}
            className="input"
            placeholder="Shell"
          />
        </div>
        <div>
          <label className="label">ISO VG</label>
          <input
            name="isoViscosity"
            defaultValue={isoViscosity}
            className="input"
            placeholder="46"
          />
        </div>
        <div>
          <label className="label">Region</label>
          <input name="region" defaultValue={region} className="input" placeholder="DE" />
        </div>
        {showCertificates && <input type="hidden" name="certs" value="1" />}
        {!showCertificates && <input type="hidden" name="certs" value="0" />}
        {variant === "compact" && <input type="hidden" name="view" value="compact" />}
        <div className="md:col-span-5 flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-primary">
            Suchen
          </button>
          <Link href="/listings" className="btn-secondary">
            Filter zurücksetzen
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {/* View-Toggle */}
            <div className="inline-flex overflow-hidden rounded-md ring-1 ring-slate-200">
              <Link
                href={compactHref}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  variant === "compact"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title="Kompakte Liste"
              >
                ≡ Kompakt
              </Link>
              <Link
                href={extendedHref}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  variant === "extended"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title="Detaillierte Karten"
              >
                ▦ Erweitert
              </Link>
            </div>
            <Link
              href={certToggleHref}
              className={`chip ${
                showCertificates
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              <span>Zertifikate {showCertificates ? "an" : "aus"}</span>
            </Link>
          </div>
        </div>
      </form>

      {listings.length === 0 ? (
        <div className="card text-center text-slate-500">
          Keine Listings gefunden.{" "}
          {q || manufacturer ? "Filter zurücksetzen oder " : ""}
          <Link href="/listings/new" className="text-brand-500 hover:underline">
            erstes Listing anlegen
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
              showCertificates={showCertificates}
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
              showCertificates={showCertificates}
              variant="extended"
            />
          ))}
        </div>
      )}
    </div>
  );
}
