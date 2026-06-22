import { prisma } from "@/lib/prisma";

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

/**
 * FDS-B.1.2 Trust-Tier:
 *   UNVERIFIED    Neu, keine abgeschlossene Transaktion
 *   VERIFIED      ≥ 1 abgeschlossene Transaktion (KYC wird hier vereinfacht
 *                 nicht separat geprüft, da das Prototyp-Onboarding USt-ID
 *                 nur intern sammelt)
 *   TRADE_ASSURED ≥ 10 abgeschlossene Transaktionen, Ø-Rating ≥ 4.2
 *   PREMIUM       ≥ 50 000 € kumulierter Umsatz als Verkäufer,
 *                 Ø-Rating ≥ 4.5, mind. 6 Monate aktiv
 *
 * "Disputes" werden hier noch nicht modelliert; sobald ein TransactionStatus
 * DISPUTED auftaucht, müsste die Berechnung das berücksichtigen.
 */
export async function recalcTrustTier(userId: string): Promise<void> {
  const [user, completedCount, sellerSum, ratingAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, trustTier: true },
    }),
    prisma.transaction.count({
      where: {
        status: "COMPLETED",
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED", sellerId: userId },
      _sum: { totalEur: true },
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);
  if (!user) return;

  const avgRating = ratingAgg._avg.rating ?? 0;
  const ratingCount = ratingAgg._count._all;
  const sellerRevenue = sellerSum._sum.totalEur ?? 0;
  const memberMonths = (Date.now() - user.createdAt.getTime()) / SIX_MONTHS_MS;

  let nextTier:
    | "UNVERIFIED"
    | "VERIFIED"
    | "TRADE_ASSURED"
    | "PREMIUM"
    | "DIAMOND" = "UNVERIFIED";
  if (completedCount >= 1) nextTier = "VERIFIED";
  if (completedCount >= 10 && ratingCount >= 3 && avgRating >= 4.2) {
    nextTier = "TRADE_ASSURED";
  }
  if (
    sellerRevenue >= 50_000 &&
    ratingCount >= 5 &&
    avgRating >= 4.5 &&
    memberMonths >= 1
  ) {
    nextTier = "PREMIUM";
  }
  if (
    sellerRevenue >= 200_000 &&
    ratingCount >= 50 &&
    avgRating >= 4.7 &&
    memberMonths >= 2
  ) {
    nextTier = "DIAMOND";
  }

  if (nextTier !== user.trustTier) {
    await prisma.user.update({ where: { id: userId }, data: { trustTier: nextTier } });
  }
}
