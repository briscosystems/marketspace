import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { TransactionActions } from "@/components/TransactionActions";
import { ProtectionPanel } from "@/components/ProtectionPanel";
import { ReviewForm } from "@/components/ReviewForm";
import { protectionFeeEur } from "@/lib/protection";
import { stripe } from "@/lib/stripe";
import { confirmProtectionPayment } from "@/lib/protection-flow";

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-slate-200 text-slate-700",
  DISPUTED: "bg-red-100 text-red-800",
};

const tagLabels: Record<string, string> = {
  FAST_RESPONSE: "Schnelle Antwort",
  QUALITY_AS_DESCRIBED: "Qualität wie beschrieben",
  ON_TIME_DELIVERY: "Pünktliche Lieferung",
  FAIR_NEGOTIATION: "Faire Verhandlung",
};

export default async function TransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ protection?: string; session_id?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/transactions/${id}`);

  // Rückkehr vom Käuferschutz-Checkout (Dev-Fallback ohne Webhook):
  // Session direkt bei Stripe verifizieren und Zahlung als geparkt markieren.
  if (sp.protection === "success" && sp.session_id && stripe) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(sp.session_id);
      if (checkout.metadata?.transactionId === id) {
        await confirmProtectionPayment(checkout);
      }
    } catch {
      // Webhook übernimmt es sonst — Seite trotzdem anzeigen
    }
  }

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, pseudonym: true, trustTier: true } },
      seller: {
        select: { id: true, pseudonym: true, trustTier: true, stripeConnectOnboarded: true },
      },
      rfq: { select: { id: true, productType: true, isoViscosity: true } },
      listing: { select: { id: true, manufacturer: true, productName: true } },
      reviews: {
        include: { reviewer: { select: { id: true, pseudonym: true } } },
      },
    },
  });
  if (!tx) notFound();

  const me = session.user.id;
  const isBuyer = tx.buyerId === me;
  const isSeller = tx.sellerId === me;
  if (!isBuyer && !isSeller) redirect("/dashboard");

  // Erstes Geschäft zwischen diesen beiden Parteien? → Käuferschutz empfohlen
  const priorDeals = await prisma.transaction.count({
    where: {
      id: { not: tx.id },
      status: "COMPLETED",
      OR: [
        { buyerId: tx.buyerId, sellerId: tx.sellerId },
        { buyerId: tx.sellerId, sellerId: tx.buyerId },
      ],
    },
  });

  const counterpart = isBuyer ? tx.seller : tx.buyer;
  const myReview = tx.reviews.find((r) => r.reviewerId === me);
  const otherReview = tx.reviews.find((r) => r.reviewerId !== me);
  const canReview = tx.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-brand-500 hover:underline">
        ← Dashboard
      </Link>

      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Transaktion #{tx.id.slice(-6)}
            </div>
            <h1 className="page-title">
              {tx.totalEur.toFixed(2)} €
            </h1>
            <div className="mt-1 text-sm text-slate-600">
              {tx.quantity.toLocaleString("de-DE")} {tx.quantityUnit}
              {tx.rfq && (
                <>
                  {" · "}
                  <Link href={`/rfqs/${tx.rfq.id}`} className="text-brand-500 hover:underline">
                    RFQ {tx.rfq.productType}
                    {tx.rfq.isoViscosity ? ` ISO VG ${tx.rfq.isoViscosity}` : ""}
                  </Link>
                </>
              )}
              {tx.listing && (
                <>
                  {" · "}
                  <Link href={`/listings/${tx.listing.id}`} className="text-brand-500 hover:underline">
                    {tx.listing.manufacturer} {tx.listing.productName}
                  </Link>
                </>
              )}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[tx.status]}`}>
            {tx.status}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Käufer</div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${tx.buyer.pseudonym}`}
                className="font-medium hover:text-brand-500"
              >
                {tx.buyer.pseudonym}
              </Link>
              <TrustBadge tier={tx.buyer.trustTier} size="xs" />
              {isBuyer && <span className="text-xs text-slate-400">(du)</span>}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Verkäufer</div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${tx.seller.pseudonym}`}
                className="font-medium hover:text-brand-500"
              >
                {tx.seller.pseudonym}
              </Link>
              <TrustBadge tier={tx.seller.trustTier} size="xs" />
              {isSeller && <span className="text-xs text-slate-400">(du)</span>}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Angelegt</div>
            <div className="text-sm">{tx.createdAt.toLocaleString("de-DE")}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Versendet</div>
            <div className="text-sm">
              {tx.shippedAt ? tx.shippedAt.toLocaleString("de-DE") : "–"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Abgeschlossen</div>
            <div className="text-sm">
              {tx.completedAt ? tx.completedAt.toLocaleString("de-DE") : "–"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Storniert</div>
            <div className="text-sm">
              {tx.canceledAt ? tx.canceledAt.toLocaleString("de-DE") : "–"}
            </div>
          </div>
        </div>

        <TransactionActions
          transactionId={tx.id}
          status={tx.status}
          role={isBuyer ? "BUYER" : "SELLER"}
        />
      </div>

      {/* Käuferschutz — Zahlung über die Plattform, Freigabe nach Lieferbestätigung */}
      <ProtectionPanel
        transactionId={tx.id}
        role={isBuyer ? "BUYER" : "SELLER"}
        protectionStatus={tx.protectionStatus}
        totalEur={tx.totalEur}
        feeEur={tx.protectionFeeEur ?? protectionFeeEur(tx.totalEur)}
        sellerOffersProtection={tx.seller.stripeConnectOnboarded}
        isFirstDeal={priorDeals === 0}
        txOpen={tx.status === "PENDING" || tx.status === "SHIPPED"}
      />

      <section className="space-y-3">
        <h2 className="section-title">Bewertungen</h2>
        {otherReview && (
          <div className="card">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-medium">{otherReview.reviewer.pseudonym}</span>
              <span className="text-slate-400">bewertet</span>
              <span className="text-amber-500">{"★".repeat(otherReview.rating)}</span>
            </div>
            {otherReview.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {otherReview.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                  >
                    {tagLabels[t] ?? t}
                  </span>
                ))}
              </div>
            )}
            {otherReview.comment && (
              <p className="text-sm text-slate-700">{otherReview.comment}</p>
            )}
          </div>
        )}

        {canReview ? (
          <ReviewForm
            transactionId={tx.id}
            initial={
              myReview
                ? {
                    rating: myReview.rating,
                    comment: myReview.comment,
                    tags: myReview.tags as ("FAST_RESPONSE" | "QUALITY_AS_DESCRIBED" | "ON_TIME_DELIVERY" | "FAIR_NEGOTIATION")[],
                  }
                : null
            }
            revieweeLabel={counterpart.pseudonym}
          />
        ) : (
          <div className="card text-sm text-slate-500">
            Bewertung möglich nach Abschluss der Transaktion (Status COMPLETED).
          </div>
        )}
      </section>
    </div>
  );
}
