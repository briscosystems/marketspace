/**
 * „Mein Bereich" — die verwaltenden Abschnitte des früheren /dashboard:
 * Kennzahlen, „Ich biete an" (mit Status-Schalter), „Ich suche",
 * Transaktionen und abgegebene Angebote.
 *
 * Entstanden beim Verschmelzen der zwei Übersichten (Betreiber 2026-08-16):
 * Die Startseite im angemeldeten Zustand und /dashboard zeigten Ähnliches
 * doppelt — /dashboard leitet jetzt hierher weiter, und dieser Block steht am
 * Ende der Startseite. Die Abschnitte „Für dich" und die Einstiegskacheln
 * wohnen weiterhin in app/page.tsx.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { QuickStatusToggle } from "@/components/QuickStatusToggle";
import { ProductImage } from "@/components/ProductImage";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";

export async function MeinBereich({ userId }: { userId: string }) {
  const t = await getT();
  const me = userId;
  const [listings, user, myRfqs, myOffers, myTxns, unreadCount, offersToMe] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: me, NOT: { status: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: me },
      select: {
        pseudonym: true,
        role: true,
        trustTier: true,
        companyName: true,
        country: true,
        createdAt: true,
        brandManufacturer: { select: { slug: true } },
      },
    }),
    prisma.rfq.findMany({
      where: { buyerId: me },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.rfqOffer.findMany({
      where: { sellerId: me },
      include: { rfq: { select: { id: true, productType: true, quantity: true, quantityUnit: true, status: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { OR: [{ buyerId: me }, { sellerId: me }] },
      include: {
        buyer: { select: { id: true, pseudonym: true } },
        seller: { select: { id: true, pseudonym: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Es gibt (noch) keine Gelesen-Markierung — die Kachel zählt deshalb
    // ehrlich die Gespräche und heißt auch so, statt ein „Ungelesen"-Signal
    // vorzutäuschen, das nie sinkt.
    prisma.conversation.count({
      where: { OR: [{ buyerId: me }, { sellerId: me }] },
    }),
    prisma.rfqOffer.count({ where: { status: "PENDING", rfq: { buyerId: me } } }),
  ]);


  const txStatusStyle: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    SHIPPED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELED: "bg-slate-200 text-slate-700",
    DISPUTED: "bg-red-100 text-red-800",
  };

  return (
    <div id="mein-bereich" className="scroll-mt-24 space-y-8">
      <div className="flex items-center gap-2">
        <h2 className="section-title">{t("dash.title")}</h2>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Link href={`/profile/${user?.pseudonym}`} className="font-medium hover:text-brand-700">
            {user?.pseudonym}
          </Link>
          ({user?.role})
          {user?.trustTier && <TrustBadge tier={user.trustTier} size="xs" />}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <div className="card">
          <div className="eyebrow">{t("dash.tileListings")}</div>
          <div className="stat-value mt-1">{listings.length}</div>
        </div>
        <div className="card">
          <div className="eyebrow">{t("dash.tileRequests")}</div>
          <div className="stat-value mt-1">{myRfqs.length}</div>
        </div>
        <div className="card">
          <div className="eyebrow">{t("dash.tileOffers")}</div>
          <div className="stat-value mt-1">{myOffers.length}</div>
        </div>
        <div className="card">
          <div className="eyebrow">{t("dash.tileTransactions")}</div>
          <div className="stat-value mt-1">{myTxns.length}</div>
        </div>
        <Link
          href="/conversations"
          className="card hover:border-brand-500"
        >
          <div className="eyebrow">{t("dash.tileConversations")}</div>
          <div className="stat-value mt-1">{unreadCount}</div>
        </Link>
        <Link href="/rfqs" className="card hover:border-brand-500">
          <div className="eyebrow">{t("dash.tileOffersIn")}</div>
          <div className="stat-value mt-1">{offersToMe}</div>
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">{t("dash.iOffer")}</h2>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("dash.newOffer")}
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="card text-center text-slate-500">
            {t("dash.emptyOffersLead")}{" "}
            <Link href="/listings/new" className="text-blue-600 hover:underline">
              {t("dash.createFirstOffer")}
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {listings.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <ProductImage
                  manufacturer={l.manufacturer}
                  productName={l.productName}
                  packaging={l.packaging}
                  size="sm"
                />
                <Link href={`/listings/${l.id}`} className="min-w-0 flex-1 hover:text-brand-700">
                  <div className="font-medium truncate">{l.manufacturer} {l.productName}</div>
                  <div className="text-xs text-slate-500">
                    {l.productType} · {l.quantity.toLocaleString("de-DE")} {l.quantityUnit} · {l.locationRegion}
                  </div>
                </Link>
                <QuickStatusToggle listingId={l.id} status={l.status} />
                <Link
                  href={`/listings/${l.id}/edit`}
                  className="text-xs text-slate-500 hover:text-brand-700"
                >
                  {t("dash.edit")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">{t("dash.iSeek")}</h2>
          <Link
            href="/rfqs/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {t("dash.newRequest")}
          </Link>
        </div>
        {myRfqs.length === 0 ? (
          <div className="card text-sm text-slate-500">
            {t("dash.emptySeeking")}{" "}
            <Link href="/rfqs/new" className="font-medium text-amber-700 hover:underline">
              {t("dash.leerRfqLink")}
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {myRfqs.map((r) => (
              <Link
                key={r.id}
                href={`/rfqs/${r.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-700"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.productType} · {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t("dash.deadline")} {r.deadline.toLocaleDateString("de-DE")} · {r._count.offers} {t("dash.offersCount")}
                  </div>
                </div>
                <span className="text-xs text-slate-500">{t(`dash.rfqstatus.${r.status}`)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 section-title">{t("dash.tileTransactions")}</h2>
        {myTxns.length === 0 ? (
          <div className="card text-sm text-slate-500">
            {t("dash.emptyTransactions")}{" "}
            <Link href="/listings" className="font-medium text-brand-700 hover:underline">
              {t("dash.leerTxLink")}
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {myTxns.map((tx) => {
              const counterpart = tx.buyerId === me ? tx.seller : tx.buyer;
              const role = tx.buyerId === me ? t("dash.roleBuyer") : t("dash.roleSeller");
              return (
                <Link
                  key={tx.id}
                  href={`/transactions/${tx.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-700"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {tx.totalEur.toFixed(2)} € · {tx.quantity.toLocaleString("de-DE")} {tx.quantityUnit}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("dash.withPartner")} {counterpart.pseudonym} ({role}) · {tx.createdAt.toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${txStatusStyle[tx.status]}`}>
                    {t(`dash.txstatus.${tx.status}`)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 section-title">{t("dash.myOffersTitle")}</h2>
        {myOffers.length === 0 ? (
          <div className="card text-sm text-slate-500">
            {t("dash.emptyMyOffers")}{" "}
            <Link href="/rfqs" className="font-medium text-amber-700 hover:underline">
              {t("dash.leerOfferLink")}
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {myOffers.map((o) => (
              <Link
                key={o.id}
                href={`/rfqs/${o.rfq.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-700"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {o.rfq.productType} · {t("dash.offerLabel")} {o.priceEur.toFixed(2)} €
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.quantity.toLocaleString("de-DE")} {o.quantityUnit} · {fill(t("dash.deliveryDays"), { days: o.deliveryDays })}
                  </div>
                </div>
                <span className="text-xs text-slate-500">{t(`dash.offerstatus.${o.status}`)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
