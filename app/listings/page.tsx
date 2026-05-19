import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";
import { Filter } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  manufacturer?: string;
  productType?: string;
  chemistry?: string;
  isoViscosity?: string;
  region?: string;
  certs?: string;
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
  const { q, manufacturer, productType, chemistry, isoViscosity, region, certs, view } = params;
  const showCertificates = certs !== "0";
  const variant: "compact" | "extended" = view === "compact" ? "compact" : "extended";

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

  // Helper: URL für einen einzelnen Param-Switch (z.B. productType-Chip)
  function urlWithParam(name: string, value: string | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (manufacturer) p.set("manufacturer", manufacturer);
    if (productType) p.set("productType", productType);
    if (chemistry) p.set("chemistry", chemistry);
    if (isoViscosity) p.set("isoViscosity", isoViscosity);
    if (region) p.set("region", region);
    if (!showCertificates) p.set("certs", "0");
    if (variant === "compact") p.set("view", "compact");
    if (value == null) p.delete(name);
    else p.set(name, value);
    return `/listings?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Listings</h1>
          <p className="text-sm text-slate-500">{listings.length} Treffer</p>
        </div>
        <Link href="/listings/new" className="btn-primary">
          Neues Listing
        </Link>
      </div>

      {/* Schnellfilter — Produkttyp-Chips */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Filter size={12} /> Produkttyp
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={urlWithParam("productType", null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              !productType
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Alle
          </Link>
          {productTypeOptions.map((opt) => (
            <Link
              key={opt.productType}
              href={urlWithParam("productType", opt.productType)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                productType === opt.productType
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.productType} <span className="opacity-60">({opt._count._all})</span>
            </Link>
          ))}
        </div>

        {chemistryOptions.length > 1 ? (
          <>
            <div className="mb-2 mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Filter size={12} /> Chemie
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={urlWithParam("chemistry", null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  !chemistry
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Alle
              </Link>
              {chemistryOptions.map((opt) => (
                <Link
                  key={opt.chemistry}
                  href={urlWithParam("chemistry", opt.chemistry)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    chemistry === opt.chemistry
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {CHEMISTRY_LABEL[opt.chemistry] ?? opt.chemistry}{" "}
                  <span className="opacity-60">({opt._count._all})</span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
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
        {/* Schnellfilter-Werte als hidden inputs ans Form weitergeben */}
        {productType && <input type="hidden" name="productType" value={productType} />}
        {chemistry && <input type="hidden" name="chemistry" value={chemistry} />}
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
            <div className="inline-flex overflow-hidden rounded-md ring-1 ring-slate-200">
              <Link
                href={urlWithParam("view", "compact")}
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
                href={urlWithParam("view", null)}
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
              href={urlWithParam("certs", showCertificates ? "0" : null)}
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

      {/* Aktive Filter als Chips zum Abwählen */}
      {(productType || chemistry || manufacturer || isoViscosity || region || q) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-medium">Aktive Filter:</span>
          {productType && (
            <Link
              href={urlWithParam("productType", null)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-brand-700 hover:bg-brand-200"
            >
              Typ: {productType} <span className="text-brand-500">×</span>
            </Link>
          )}
          {chemistry && (
            <Link
              href={urlWithParam("chemistry", null)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-brand-700 hover:bg-brand-200"
            >
              Chemie: {CHEMISTRY_LABEL[chemistry] ?? chemistry} <span className="text-brand-500">×</span>
            </Link>
          )}
          {manufacturer && (
            <Link
              href={urlWithParam("manufacturer", null)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
            >
              Hersteller: {manufacturer} <span className="text-slate-500">×</span>
            </Link>
          )}
          {isoViscosity && (
            <Link
              href={urlWithParam("isoViscosity", null)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
            >
              ISO VG: {isoViscosity} <span className="text-slate-500">×</span>
            </Link>
          )}
          {region && (
            <Link
              href={urlWithParam("region", null)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
            >
              Region: {region} <span className="text-slate-500">×</span>
            </Link>
          )}
          {q && (
            <Link
              href={urlWithParam("q", null)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
            >
              „{q}" <span className="text-slate-500">×</span>
            </Link>
          )}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="card text-center text-slate-500">
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
