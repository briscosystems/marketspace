import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrustBadge } from "@/components/TrustBadge";
import { QuickStatusToggle } from "@/components/QuickStatusToggle";
import { ListingCard } from "@/components/ListingCard";
import { ProductImage } from "@/components/ProductImage";

export default async function DashboardPage() {
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
    COMPLETED: "bg-green-100 text-green-800",
    CANCELED: "bg-slate-200 text-slate-700",
    DISPUTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          Eingeloggt als{" "}
          <Link href={`/profile/${user?.pseudonym}`} className="font-medium hover:text-brand-500">
            {user?.pseudonym}
          </Link>
          ({user?.role})
          {user?.trustTier && <TrustBadge tier={user.trustTier} size="xs" />}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-slate-500">Listings</div>
          <div className="text-2xl font-semibold text-brand-500">{listings.length}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-slate-500">Anfragen</div>
          <div className="text-2xl font-semibold text-brand-500">{myRfqs.length}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-slate-500">Angebote</div>
          <div className="text-2xl font-semibold text-brand-500">{myOffers.length}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-slate-500">Transaktionen</div>
          <div className="text-2xl font-semibold text-brand-500">{myTxns.length}</div>
        </div>
        <Link
          href="/conversations"
          className="card hover:border-brand-500"
        >
          <div className="text-xs uppercase tracking-wide text-slate-500">Konversationen</div>
          <div className="text-2xl font-semibold text-brand-500">{unreadCount}</div>
        </Link>
      </div>

      {(matchingListings.length > 0 || matchingRfqs.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Für dich</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {matchingListings.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">
                    Neue Listings in deinen Kategorien
                  </h3>
                  <Link
                    href="/listings"
                    className="text-xs text-brand-500 hover:underline"
                  >
                    alle →
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
                    Offene Anfragen zu deinen Herstellern
                  </h3>
                  <Link href="/rfqs" className="text-xs text-brand-500 hover:underline">
                    alle →
                  </Link>
                </div>
                <div className="card divide-y divide-slate-200">
                  {matchingRfqs.map((r) => (
                    <Link
                      key={r.id}
                      href={`/rfqs/${r.id}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-500"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {r.productType}
                          {r.manufacturer ? ` · ${r.manufacturer}` : ""} ·{" "}
                          {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.locationRegion} · Frist{" "}
                          {r.deadline.toLocaleDateString("de-DE")} · {r._count.offers}{" "}
                          Angebot(e)
                        </div>
                      </div>
                      <span className="text-xs text-brand-500">Angebot abgeben →</span>
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
          <h2 className="text-lg font-semibold">Ich biete an</h2>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Neues Angebot
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="card text-center text-slate-500">
            Du hast noch nichts angeboten.{" "}
            <Link href="/listings/new" className="text-blue-600 hover:underline">
              Erstes Angebot einstellen
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
                <Link href={`/listings/${l.id}`} className="min-w-0 flex-1 hover:text-brand-500">
                  <div className="font-medium truncate">{l.manufacturer} {l.productName}</div>
                  <div className="text-xs text-slate-500">
                    {l.productType} · {l.quantity.toLocaleString("de-DE")} {l.quantityUnit} · {l.locationRegion}
                  </div>
                </Link>
                <QuickStatusToggle listingId={l.id} status={l.status} />
                <Link
                  href={`/listings/${l.id}/edit`}
                  className="text-xs text-slate-500 hover:text-brand-500"
                >
                  Bearbeiten
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ich suche</h2>
          <Link
            href="/rfqs/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Neuer Bedarf
          </Link>
        </div>
        {myRfqs.length === 0 ? (
          <div className="card text-sm text-slate-500">Du suchst aktuell nichts.</div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {myRfqs.map((r) => (
              <Link
                key={r.id}
                href={`/rfqs/${r.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.productType} · {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
                  </div>
                  <div className="text-xs text-slate-500">
                    Frist {r.deadline.toLocaleDateString("de-DE")} · {r._count.offers} Angebot(e)
                  </div>
                </div>
                <span className="text-xs text-slate-500">{r.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Transaktionen</h2>
        {myTxns.length === 0 ? (
          <div className="card text-sm text-slate-500">Noch keine Transaktionen.</div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {myTxns.map((t) => {
              const counterpart = t.buyerId === me ? t.seller : t.buyer;
              const role = t.buyerId === me ? "Käufer" : "Verkäufer";
              return (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-500"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {t.totalEur.toFixed(2)} € · {t.quantity.toLocaleString("de-DE")} {t.quantityUnit}
                    </div>
                    <div className="text-xs text-slate-500">
                      mit {counterpart.pseudonym} ({role}) · {t.createdAt.toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${txStatusStyle[t.status]}`}>
                    {t.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Eigene Angebote</h2>
        {myOffers.length === 0 ? (
          <div className="card text-sm text-slate-500">Du hast noch keine Angebote abgegeben.</div>
        ) : (
          <div className="card divide-y divide-slate-200">
            {myOffers.map((o) => (
              <Link
                key={o.id}
                href={`/rfqs/${o.rfq.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {o.rfq.productType} · Angebot {o.priceEur.toFixed(2)} €
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.quantity.toLocaleString("de-DE")} {o.quantityUnit} · Lieferung {o.deliveryDays} Tage
                  </div>
                </div>
                <span className="text-xs text-slate-500">{o.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
