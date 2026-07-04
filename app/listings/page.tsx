import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConceptBrowseGrid, type BrowseListing } from "@/components/ConceptBrowseGrid";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { PACKAGING_LABEL } from "@/lib/branding";
import { LayoutGrid } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  productType?: string;
}>;

const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralöl",
  SEMI_SYNTHETIC: "Teilsynthetisch",
  SYNTHETIC: "Synthetisch",
  ESTER: "Ester",
  PAG: "PAG",
  OTHER: "Andere",
};

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, productType } = await searchParams;

  const where: import("@prisma/client").Prisma.ListingWhereInput = {
    status: "ACTIVE",
    ...(productType && { productType: { equals: productType } }),
    ...(q && {
      OR: [
        { productName: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { applicationArea: { contains: q, mode: "insensitive" } },
        { productType: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const productTypeOptions = await prisma.listing.groupBy({
    by: ["productType"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
  });

  const listings = await prisma.listing.findMany({
    where,
    include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
    orderBy: [{ seller: { searchBoost: "desc" } }, { createdAt: "desc" }],
    take: 60,
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
    seller: {
      name: l.seller.pseudonym,
      tier: l.seller.trustTier,
      ratingAvg: ratingsBySeller.get(l.seller.id)?.avg ?? null,
      ratingCount: ratingsBySeller.get(l.seller.id)?.count ?? 0,
    },
  }));

  const totalActive = productTypeOptions.reduce((s, o) => s + o._count._all, 0);
  const categoryChips = productTypeOptions
    .filter((o) => o.productType)
    .slice(0, 12)
    .map((o) => ({ label: o.productType, count: o._count._all }));

  function chipHref(pt: string | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (pt) p.set("productType", pt);
    const s = p.toString();
    return s ? `/listings?${s}` : "/listings";
  }

  return (
    <div className="space-y-5">
      {/* Kategorie-Kacheln mit Symbolen (wie im Konzept) */}
      {categoryChips.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <CatChip
            href={chipHref(null)}
            active={!productType}
            label="Alle"
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

      <ConceptBrowseGrid listings={browseListings} />
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
