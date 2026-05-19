import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <PublicLanding />;
  }
  return <PersonalDashboard userId={session.user.id} pseudonym={session.user.name ?? ""} />;
}

async function PublicLanding() {
  const [listingCount, userCount, sdsCount] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.safetyDataSheet.count(),
  ]);

  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-10 text-white shadow-lg">
        <h1 className="mb-3 text-3xl font-semibold">
          B2B-Marktplatz für Industrieöl &amp; Schmierstoffe
        </h1>
        <p className="max-w-2xl text-brand-50/90">
          Über- und Unterbestände zwischen Resellern direkt ausgleichen. Pseudonyme
          Identitäten, AI-gestütztes Matching, sichere Stripe-Abwicklung.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/listings" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Listings durchsuchen
          </Link>
          <Link
            href="/register"
            className="btn border border-white/40 text-white hover:bg-white/10"
          >
            Reseller-Konto anlegen
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        <div className="card">
          <div className="text-3xl font-semibold text-brand-500">{listingCount}</div>
          <div className="text-sm text-slate-600">aktive Listings</div>
        </div>
        <div className="card">
          <div className="text-3xl font-semibold text-brand-500">{userCount}</div>
          <div className="text-sm text-slate-600">registrierte Reseller</div>
        </div>
        <Link href="/sds" className="card hover:border-brand-500">
          <div className="text-3xl font-semibold text-brand-500">{sdsCount}</div>
          <div className="text-sm text-slate-600">Sicherheitsdatenblätter</div>
        </Link>
        <div className="card">
          <div className="text-3xl font-semibold text-brand-500">10 %</div>
          <div className="text-sm text-slate-600">Plattform-Provision</div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Aktueller Stand (Prototyp v0.2)</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          <li>Self-Service-Registrierung mit Pseudonym</li>
          <li>Produkt-Listings mit FDS-Datenmodell</li>
          <li>RFQ-Modul mit Trust-Tier-System</li>
          <li>Anonyme Bewertungen nach Transaktion</li>
          <li>SDS-Bibliothek mit Auto-Match auf Listings</li>
          <li className="text-slate-400">Stripe Split-Payment — folgt</li>
          <li className="text-slate-400">AI-Match &amp; Chat-Filter — folgt</li>
        </ul>
      </section>
    </div>
  );
}

async function PersonalDashboard({ userId, pseudonym }: { userId: string; pseudonym: string }) {
  const [unreadConversations, openRfqsForMe, freshListings, openOffersToMe] = await Promise.all([
    prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        buyer: { select: { pseudonym: true } },
        seller: { select: { pseudonym: true } },
        listing: { select: { manufacturer: true, productName: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { senderId: true, body: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.rfq.findMany({
      where: {
        status: "OPEN",
        NOT: { buyerId: userId },
        offers: { none: { sellerId: userId } },
      },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", NOT: { sellerId: userId } },
      include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.rfqOffer.count({
      where: { status: "PENDING", rfq: { buyerId: userId } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">
          Willkommen zurück, {pseudonym}
        </h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickStat
          href="/dashboard"
          label="Dein Dashboard"
          value="öffnen"
          hint="Listings, RFQs, Transaktionen"
        />
        <QuickStat
          href="/conversations"
          label="Konversationen"
          value={String(unreadConversations.length)}
          hint="aktive Threads"
        />
        <QuickStat
          href="/rfqs"
          label="Eingegangene Angebote"
          value={String(openOffersToMe)}
          hint="auf deine RFQs, offen"
        />
      </section>

      {openRfqsForMe.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Offene Anfragen — vielleicht hast du das auf Lager
            </h2>
            <Link href="/rfqs" className="text-xs text-brand-500 hover:underline">
              alle →
            </Link>
          </div>
          <div className="card divide-y divide-slate-200">
            {openRfqsForMe.map((r) => (
              <Link
                key={r.id}
                href={`/rfqs/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.productType}
                    {r.manufacturer ? ` · ${r.manufacturer}` : ""} ·{" "}
                    {r.quantity.toLocaleString("de-DE")} {r.quantityUnit}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.locationRegion} · Frist{" "}
                    {r.deadline.toLocaleDateString("de-DE")} · {r._count.offers} Angebot(e)
                  </div>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">
                  Angebot abgeben
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {unreadConversations.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Letzte Nachrichten</h2>
            <Link href="/conversations" className="text-xs text-brand-500 hover:underline">
              alle →
            </Link>
          </div>
          <div className="card divide-y divide-slate-200">
            {unreadConversations.map((c) => {
              const other = c.buyerId === userId ? c.seller : c.buyer;
              const last = c.messages[0];
              const isFromOther = last && last.senderId !== userId;
              return (
                <Link
                  key={c.id}
                  href={`/conversations/${c.id}`}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{other.pseudonym}</span>
                      {c.listing && (
                        <span className="text-xs text-slate-500">
                          · {c.listing.manufacturer} {c.listing.productName}
                        </span>
                      )}
                    </div>
                    {last && (
                      <div
                        className={`mt-0.5 truncate text-sm ${isFromOther ? "text-slate-900" : "text-slate-500"}`}
                      >
                        {!isFromOther && "Du: "}
                        {last.body}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {c.updatedAt.toLocaleDateString("de-DE")}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {freshListings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Neu im Markt</h2>
            <Link href="/listings" className="text-xs text-brand-500 hover:underline">
              alle →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {freshListings.map((l) => (
              <ListingCard key={l.id} listing={l} hideStatus />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickStat({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link href={href} className="card block hover:border-brand-500">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-brand-500">{value}</div>
      <div className="text-xs text-slate-500">{hint}</div>
    </Link>
  );
}
