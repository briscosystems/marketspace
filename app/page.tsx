import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";
import { AdSlot } from "@/components/AdSlot";
import { OilBarrels } from "@/components/OilBarrels";
import { ApplicationEntry } from "@/components/ApplicationEntry";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { getSettingInt } from "@/lib/credits";
import {
  FlaskConical,
  Building2,
  TrendingUp,
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  Inbox,
  Plus,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <PublicLanding />;
  }
  return <PersonalDashboard userId={session.user.id} pseudonym={session.user.name ?? ""} />;
}

async function PublicLanding() {
  const t = await getT();
  // Trial-Zahlen aus den Superadmin-Einstellungen — nie fest im Text.
  const [trialDays, welcomeCredits] = await Promise.all([
    getSettingInt("trialDays"),
    getSettingInt("welcomeCredits"),
  ]);
  const [listingCount, userCount, sdsCount, manufacturerCount, freshListings] =
    await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.safetyDataSheet.count(),
      prisma.manufacturer.count(),
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include: { seller: { select: { id: true, pseudonym: true, trustTier: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  return (
    <div className="space-y-10">
      {/* Werbeplatzierung */}
      <AdSlot placement="HOME" />

      {/* Hero — ruhig, weiß, Lime nur als Akzent */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-soft md:p-10">
        <div className="eyebrow text-brand-700">{t("home.eyebrow")}</div>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {t("home.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">{t("home.lead")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/listings"
            className="btn bg-slate-900 font-semibold text-white shadow-soft hover:bg-slate-800"
          >
            {t("home.ctaBrowse")}
          </Link>
          <Link href="/register" className="btn-secondary">
            {fill(t("home.ctaRegister"), { n: trialDays })}
          </Link>
        </div>
        {/* Das Angebot stand bisher nirgends — der Knopf sagte nur „Konto anlegen“.
            Zahlen kommen aus den Einstellungen, nicht aus dem Text. */}
        <p className="mt-2 text-xs text-slate-500">
          {fill(t("home.ctaRegisterHint"), { c: welcomeCredits })}
        </p>
      </section>

      {/* Anbieten / Suchen — feste Konvention: Anbieten blau, Suchen amber */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/listings"
          className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-soft transition hover:border-blue-400 hover:shadow-lift"
        >
          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {t("home.offerBadge")}
          </div>
          <OilBarrels className="h-11 w-auto" />
          <h2 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-blue-700">
            {t("home.offerTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("home.offerText")}{" "}
            {t(listingCount === 1 ? "home.activeOffers.one" : "home.activeOffers.other").replace(
              "{n}",
              String(listingCount),
            )}
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
            {t("home.offerLink")} <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/rfqs"
          className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-6 shadow-soft transition hover:border-amber-400 hover:shadow-lift"
        >
          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {t("home.seekBadge")}
          </div>
          <div className="text-3xl">🔎</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-amber-700">
            {t("home.seekTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("home.seekText")}
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
            {t("home.seekLink")} <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </section>

      {/* Einstieg über die Aufgabe statt über den Produktnamen */}
      <ApplicationEntry />

      {/* Entdecken — Wissensbasis */}
      <section className="grid gap-4 sm:grid-cols-3">
        <DiscoverTile
          href="/sds"
          icon={<FlaskConical className="h-5 w-5" />}
          value={sdsCount.toLocaleString("de-CH")}
          title={t("home.tileSdsTitle")}
          hint={t("home.tileSdsHint")}
        />
        <DiscoverTile
          href="/manufacturers"
          icon={<Building2 className="h-5 w-5" />}
          value={String(manufacturerCount)}
          title={t("home.tileMfrTitle")}
          hint={t("home.tileMfrHint")}
        />
        <DiscoverTile
          href="/prices"
          icon={<TrendingUp className="h-5 w-5" />}
          value={t("home.tilePriceValue")}
          title={t("home.tilePriceTitle")}
          hint={t("home.tilePriceHint")}
        />
      </section>

      {/* Neu im Markt */}
      {freshListings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">{t("home.newInMarket")}</h2>
            <Link
              href="/listings"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              {t("home.allOffers")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {freshListings.map((l) => (
              <ListingCard key={l.id} listing={l} hideStatus />
            ))}
          </div>
        </section>
      )}

      {/* Kennzahlen */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="stat-value text-brand-600">{listingCount}</div>
          <div className="mt-0.5 text-sm text-slate-600">{t("home.statOffers")}</div>
        </div>
        <div className="card">
          <div className="stat-value text-brand-600">{userCount}</div>
          <div className="mt-0.5 text-sm text-slate-600">{t("home.statResellers")}</div>
        </div>
        <div className="card">
          <div className="stat-value text-brand-600">
            {sdsCount.toLocaleString("de-CH")}
          </div>
          <div className="mt-0.5 text-sm text-slate-600">{t("home.tileSdsTitle")}</div>
        </div>
      </section>
    </div>
  );
}

function DiscoverTile({
  href,
  icon,
  value,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  value: string;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-brand-400 hover:shadow-lift"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-lg font-bold text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-500">{hint}</div>
      </div>
    </Link>
  );
}

async function PersonalDashboard({ userId, pseudonym }: { userId: string; pseudonym: string }) {
  const [unreadConversations, openRfqsForMe, freshListings, openOffersToMe, me] = await Promise.all([
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
      include: { seller: { select: { id: true, pseudonym: true, trustTier: true, searchBoost: true } } },
      // Bezahlter Boost zuerst (als "Gesponsert" gekennzeichnet), dann neueste Angebote.
      orderBy: [{ seller: { searchBoost: "desc" } }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.rfqOffer.count({
      where: { status: "PENDING", rfq: { buyerId: userId } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } }),
  ]);
  const creditBalance = me?.creditBalance ?? 0;

  return (
    <div className="space-y-8">
      {/* Werbeplatzierung */}
      <AdSlot placement="HOME" />

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Willkommen zurück, {pseudonym}</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/kss-finder"
            className="btn bg-purple-600 font-semibold text-white shadow-soft hover:bg-purple-700"
          >
            <Sparkles size={16} className="mr-1" /> KSS-Berater (KI)
          </Link>
          <Link
            href="/listings/new"
            className="btn bg-blue-600 font-semibold text-white shadow-soft hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" /> Anbieten
          </Link>
          <Link
            href="/rfqs/new"
            className="btn bg-amber-500 font-semibold text-white shadow-soft hover:bg-amber-600"
          >
            <Plus size={16} className="mr-1" /> Suchen
          </Link>
        </div>
      </section>

      {/* KSS-Berater — das Aushängeschild-Feature, prominent auf der Startseite */}
      <section>
        <Link
          href="/kss-finder"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50 p-5 shadow-soft transition hover:border-purple-300 hover:shadow-lift"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <div className="text-base font-bold text-slate-900">
                KSS-Berater — finde den passenden Kühlschmierstoff
              </div>
              <div className="text-sm text-slate-600">
                KI-gestützt: Problem beschreiben oder Filter wählen, Alternativen mit Begründung
                erhalten — inkl. Dichtungs-Check und Web-Recherche.
              </div>
            </div>
          </div>
          <span className="btn bg-purple-600 font-semibold text-white group-hover:bg-purple-700">
            Jetzt starten →
          </span>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          href="/dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dein Dashboard"
          value="öffnen"
          hint="Angebote, Anfragen, Transaktionen"
        />
        <QuickStat
          href="/conversations"
          icon={<MessageSquare className="h-5 w-5" />}
          label="Konversationen"
          value={String(unreadConversations.length)}
          hint="aktive Threads"
        />
        <QuickStat
          href="/rfqs"
          icon={<Inbox className="h-5 w-5" />}
          label="Eingegangene Angebote"
          value={String(openOffersToMe)}
          hint="auf deine Anfragen, offen"
        />
        <QuickStat
          href="/mitgliedschaft"
          icon={<Sparkles className="h-5 w-5" />}
          label="Credits"
          value={String(creditBalance)}
          hint="für KI-Funktionen · aufladen"
        />
      </section>

      {openRfqsForMe.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">
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
                className="group flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
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
                <span className="shrink-0 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-soft transition-colors group-hover:bg-amber-600">
                  Angebot abgeben →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {unreadConversations.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Letzte Nachrichten</h2>
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
            <h2 className="section-title">Neu im Markt</h2>
            <Link href="/listings" className="text-xs text-brand-500 hover:underline">
              alle →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {freshListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={{ ...l, sponsored: l.seller.searchBoost > 0 }}
                hideStatus
              />
            ))}
          </div>
        </section>
      )}

      {/* Einstieg über die Aufgabe statt über den Produktnamen */}
      <ApplicationEntry />
    </div>
  );
}

function QuickStat({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-brand-400 hover:shadow-lift"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="eyebrow">{label}</div>
        <div className="mt-0.5 stat-value leading-none">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      </div>
    </Link>
  );
}
