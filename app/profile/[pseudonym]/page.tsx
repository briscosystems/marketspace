import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { RatingDisplay } from "@/components/RatingDisplay";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { AboutEditor } from "@/components/AboutEditor";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { Store, Package, Search, Handshake } from "lucide-react";

const tagLabels: Record<string, string> = {
  FAST_RESPONSE: "Schnelle Antwort",
  QUALITY_AS_DESCRIBED: "Qualität wie beschrieben",
  ON_TIME_DELIVERY: "Pünktliche Lieferung",
  FAIR_NEGOTIATION: "Faire Verhandlung",
};

const roleLabels: Record<string, string> = {
  RESELLER: "Reseller",
  OEM: "OEM-Hersteller",
  ADMIN: "Team Brisco",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ pseudonym: string }>;
}) {
  const { pseudonym } = await params;
  const [user, session] = await Promise.all([
    prisma.user.findUnique({
      where: { pseudonym },
      select: {
        id: true,
        pseudonym: true,
        trustTier: true,
        role: true,
        country: true,
        about: true,
        createdAt: true,
      },
    }),
    getServerSession(authOptions),
  ]);
  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  const [completedCount, ratingAgg, reviews, tagCounts, activeListings, openRfqs] =
    await Promise.all([
      prisma.transaction.count({
        where: {
          status: "COMPLETED",
          OR: [{ buyerId: user.id }, { sellerId: user.id }],
        },
      }),
      prisma.review.aggregate({
        where: { revieweeId: user.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { revieweeId: user.id },
        include: { reviewer: { select: { pseudonym: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.review.findMany({
        where: { revieweeId: user.id },
        select: { tags: true },
      }),
      prisma.listing.findMany({
        where: { sellerId: user.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: { seller: { select: { pseudonym: true, trustTier: true } } },
      }),
      prisma.rfq.findMany({
        where: { buyerId: user.id, status: "OPEN", visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          productType: true,
          manufacturer: true,
          quantity: true,
          quantityUnit: true,
          locationRegion: true,
          deadline: true,
        },
      }),
    ]);

  const tagHistogram = new Map<string, number>();
  for (const r of tagCounts) {
    for (const t of r.tags) tagHistogram.set(t, (tagHistogram.get(t) ?? 0) + 1);
  }
  const topTags = [...tagHistogram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const cardListings: ListingCardData[] = activeListings.map((l) => ({
    id: l.id,
    productType: l.productType,
    manufacturer: l.manufacturer,
    productName: l.productName,
    isoViscosity: l.isoViscosity,
    chemistry: l.chemistry as string,
    applicationArea: l.applicationArea,
    quantity: l.quantity,
    quantityUnit: l.quantityUnit,
    minOrderQty: l.minOrderQty,
    locationRegion: l.locationRegion,
    packaging: l.packaging,
    priceEur: l.priceEur,
    shippingTerms: l.shippingTerms,
    seller: { pseudonym: l.seller.pseudonym, trustTier: l.seller.trustTier },
  }));

  return (
    <div className="space-y-6">
      {/* Schaufenster-Kopf */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
              {user.pseudonym.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="page-title flex items-center gap-2">
                {user.pseudonym}
                <Store size={20} className="text-slate-400" />
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>{roleLabels[user.role] ?? user.role}</span>
                <TrustBadge tier={user.trustTier} />
                {user.country && <span className="text-slate-400">· {user.country}</span>}
                <span className="text-slate-400">
                  · Mitglied seit {user.createdAt.toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RatingDisplay avg={ratingAgg._avg.rating} count={ratingAgg._count._all} />
            {!isOwnProfile && session?.user?.id && (
              <ContactSellerButton sellerId={user.id} label="Anbieter kontaktieren" />
            )}
          </div>
        </div>

        {/* Kennzahlen-Leiste */}
        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
          <StorefrontStat
            icon={<Package size={16} />}
            value={activeListings.length}
            label="Bietet an"
            tone="text-brand-700 bg-brand-50"
          />
          <StorefrontStat
            icon={<Search size={16} />}
            value={openRfqs.length}
            label="Sucht"
            tone="text-amber-700 bg-amber-50"
          />
          <StorefrontStat
            icon={<Handshake size={16} />}
            value={completedCount}
            label={completedCount === 1 ? "Transaktion" : "Transaktionen"}
            tone="text-emerald-700 bg-emerald-50"
          />
        </div>

        {/* Über uns */}
        {(user.about || isOwnProfile) && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-900">Über uns</h2>
            {user.about && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {user.about}
              </p>
            )}
            {isOwnProfile && <AboutEditor initial={user.about} />}
          </div>
        )}

        {topTags.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {topTags.map(([tag, n]) => (
              <span
                key={tag}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700"
              >
                {tagLabels[tag] ?? tag} · {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bietet an — alle aktiven Angebote als kompakte Karten */}
      {cardListings.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">Bietet an</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cardListings.map((l) => (
              <ListingCard key={l.id} listing={l} variant="compact" hideStatus />
            ))}
          </div>
        </section>
      )}

      {/* Sucht — offene öffentliche Anfragen */}
      {openRfqs.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">Sucht</h2>
          <div className="card divide-y divide-slate-200">
            {openRfqs.map((r) => (
              <Link
                key={r.id}
                href={`/rfqs/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-amber-700"
              >
                <div>
                  <div className="font-medium">
                    {r.productType}
                    {r.manufacturer ? ` · ${r.manufacturer}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.quantity.toLocaleString("de-DE")} {r.quantityUnit} · {r.locationRegion}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-slate-500">
                  bis {r.deadline.toLocaleDateString("de-DE")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 section-title">Letzte Bewertungen</h2>
        {reviews.length === 0 ? (
          <div className="card text-sm text-slate-500">
            Noch keine Bewertungen.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{r.reviewer.pseudonym}</span>
                  <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200"
                    title="Bewertung nur nach einer über Brisco abgeschlossenen Transaktion möglich"
                  >
                    ✓ Verifizierter Kauf
                  </span>
                  <span className="text-slate-400 text-xs">
                    {r.createdAt.toLocaleDateString("de-DE")}
                  </span>
                </div>
                {r.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {tagLabels[t] ?? t}
                      </span>
                    ))}
                  </div>
                )}
                {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StorefrontStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <div>
        <div className="text-lg font-bold leading-tight text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
