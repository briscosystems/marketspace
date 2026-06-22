import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { RatingDisplay } from "@/components/RatingDisplay";

const tagLabels: Record<string, string> = {
  FAST_RESPONSE: "Schnelle Antwort",
  QUALITY_AS_DESCRIBED: "Qualität wie beschrieben",
  ON_TIME_DELIVERY: "Pünktliche Lieferung",
  FAIR_NEGOTIATION: "Faire Verhandlung",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ pseudonym: string }>;
}) {
  const { pseudonym } = await params;
  const user = await prisma.user.findUnique({
    where: { pseudonym },
    select: {
      id: true,
      pseudonym: true,
      trustTier: true,
      role: true,
      country: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const [completedCount, ratingAgg, reviews, tagCounts, activeListings] = await Promise.all([
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
      take: 5,
      select: {
        id: true,
        manufacturer: true,
        productName: true,
        productType: true,
        quantity: true,
        quantityUnit: true,
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

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">{user.pseudonym}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <span>{user.role}</span>
              <TrustBadge tier={user.trustTier} />
              {user.country && <span className="text-slate-400">· {user.country}</span>}
              <span className="text-slate-400">
                · Mitglied seit {user.createdAt.toLocaleDateString("de-DE")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <RatingDisplay avg={ratingAgg._avg.rating} count={ratingAgg._count._all} />
            <div className="mt-1 text-xs text-slate-500">
              {completedCount} abgeschlossene {completedCount === 1 ? "Transaktion" : "Transaktionen"}
            </div>
          </div>
        </div>
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

      {activeListings.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">Aktive Listings</h2>
          <div className="card divide-y divide-slate-200">
            {activeListings.map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <div>
                  <div className="font-medium">
                    {l.manufacturer} {l.productName}
                  </div>
                  <div className="text-xs text-slate-500">{l.productType}</div>
                </div>
                <div className="text-sm text-slate-600">
                  {l.quantity.toLocaleString("de-DE")} {l.quantityUnit}
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
