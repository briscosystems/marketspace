import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { QuickStatusToggle } from "@/components/QuickStatusToggle";
import { ListingCard } from "@/components/ListingCard";
import { ProductImage } from "@/components/ProductImage";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";

export default async function DashboardPage() {
  const t = await getT();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const me = session.user.id;
  const [listings, user, myRfqs, myOffers, myTxns, unreadCount] = await Promise.all([
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
  ]);

  const myOpenRfqs = myRfqs.filter((r) => r.status === "OPEN");
  const myCategories = [
    ...new Set([
      ...listings.map((l) => l.productType),
      ...myOpenRfqs.map((r) => r.productType),
    ]),
  ];
  const myManufacturers = [...new Set(listings.map((l) => l.manufacturer))];

  const matchingListings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      NOT: { sellerId: me },
      ...(myCategories.length > 0 && { productType: { in: myCategories } }),
    },
    include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const matchingRfqs = await prisma.rfq.findMany({
    where: {
      status: "OPEN",
      NOT: { buyerId: me },
      ...(myManufacturers.length > 0 && { OR: myManufacturers.map((m) => ({ manufacturer: m })) }),
    },
    include: { _count: { select: { offers: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const txStatusStyle: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    SHIPPED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELED: "bg-slate-200 text-slate-700",
    DISPUTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">{t("dash.title")}</h1>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          {t("dash.loggedInAs")}{" "}
          <Link href={`/profile/${user?.pseudonym}`} className="font-medium hover:text-brand-700">
            {user?.pseudonym}
          </Link>
          ({user?.role})
          {user?.trustTier && <TrustBadge tier={user.trustTier} size="xs" />}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
      </div>

      {(matchingListings.length > 0 || matchingRfqs.length > 0) && (
        <section className="space-y-4">
          <h2 className="section-title">{t("dash.forYou")}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {matchingListings.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">
                    {t("dash.newListingsInCategories")}
                  </h3>
                  <Link
                    href="/listings"
                    className="text-xs text-brand-700 hover:underline"
                  >
                    {t("dash.all")}
                  </Link>
                </div>
                <div className="space-y-3">
                  {matchingListings.map((l) => (
                    <ListingCard key={l.id} listing={l} hideStatus />
                  ))}
                </div>
              </div>
            )}
            {matchingRfqs.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">
                    {t("dash.openRequestsForMfrs")}
                  </h3>
                  <Link href="/rfqs" className="text-xs text-brand-700 hover:underline">
                    {t("dash.all")}
                  </Link>
                </div>
                <div className="card divide-y divide-slate-200">
                  {matchingRfqs.map((r) => (
                    <Link
                      key={r.id}
                      href={`/rfqs/${r.id}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-700"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {r.productType}
                          {r.manufacturer ? ` · ${r.manufacturer}` : ""} ·{" "}
                          {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.locationRegion} · {t("dash.deadline")}{" "}
                          {r.deadline.toLocaleDateString("de-DE")} · {r._count.offers}{" "}
                          {t("dash.offersCount")}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-brand-700">{t("dash.makeOffer")}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
              Bedarf einstellen →
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
              Angebote durchsuchen →
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
              Offene Anfragen ansehen →
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
