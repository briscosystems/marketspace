import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";
import { AdSlot } from "@/components/AdSlot";
import { OilBarrels, SearchCanister } from "@/components/OilBarrels";
import { ApplicationEntry } from "@/components/ApplicationEntry";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { getSettingInt } from "@/lib/credits";
import { withBasePath } from "@/lib/base-path";
import {
  Building2,
  Search,
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
  return <PersonalDashboard userId={session.user.id} />;
}

/**
 * Ab wie vielen Einträgen eine Zahl auf der Startseite gezeigt wird. Darunter
 * wirbt der Zähler nur für die eigene Leere („5 Angebote") — das kostet in den
 * ersten Sekunden mehr Vertrauen, als die Zahl je einbringt.
 */
const MIN_ZAHL = 25;

async function PublicLanding() {
  const t = await getT();
  // Trial-Zahlen aus den Superadmin-Einstellungen — nie fest im Text.
  const [trialDays, welcomeCredits] = await Promise.all([
    getSettingInt("trialDays"),
    getSettingInt("welcomeCredits"),
  ]);
  const [listingCount, rfqCount, sdsCount, manufacturerCount, productCount, freshListings] =
    await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.rfq.count({ where: { status: "OPEN" } }),
      prisma.safetyDataSheet.count(),
      prisma.manufacturer.count(),
      prisma.product.count(),
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include: {
          seller: { select: { id: true, pseudonym: true, trustTier: true } },
          photos: { select: { id: true }, orderBy: { position: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  return (
    <div className="space-y-10">
      {/* Hero — ruhig, weiß, Lime nur als Akzent */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-soft md:p-10">
        <div className="eyebrow text-brand-700">{t("home.eyebrow")}</div>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {t("home.title")}
        </h1>
        {/* Zahlen als Vertrauenssignal — aber nur die, die auch tragen.
            Ein Zähler unter der Schwelle bewirbt die eigene Leere („5 Angebote")
            und schadet mehr, als er nützt; er erscheint erst ab MIN_ZAHL. */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
          <Link href="/listings" className="hover:text-brand-700 hover:underline">
            <strong className="font-bold text-slate-900">{productCount.toLocaleString("de-CH")}</strong>{" "}
            {t("home.heroStatProducts")}
          </Link>
          <Link href="/sds" className="hover:text-brand-700 hover:underline">
            <strong className="font-bold text-slate-900">{sdsCount.toLocaleString("de-CH")}</strong>{" "}
            {t("home.heroStatSds")}
          </Link>
          <Link href="/manufacturers" className="hover:text-brand-700 hover:underline">
            <strong className="font-bold text-slate-900">{manufacturerCount.toLocaleString("de-CH")}</strong>{" "}
            {t("home.heroStatMfr")}
          </Link>
          {listingCount >= MIN_ZAHL && (
            <Link href="/listings" className="hover:text-brand-700 hover:underline">
              <strong className="font-bold text-slate-900">{listingCount.toLocaleString("de-CH")}</strong>{" "}
              {t("home.heroStatOffers")}
            </Link>
          )}
          {rfqCount >= MIN_ZAHL && (
            <Link href="/rfqs" className="hover:text-brand-700 hover:underline">
              <strong className="font-bold text-slate-900">{rfqCount.toLocaleString("de-CH")}</strong>{" "}
              {t("home.heroStatRfqs")}
            </Link>
          )}
          <Link href="/prices" className="hover:text-brand-700 hover:underline">
            {t("home.tilePriceTitle")}
          </Link>
        </div>
        {/* Wir nennen uns Suchmaschine — dann gehört das Suchfeld auch in die
            Mitte der Startseite und nicht nur in die Kopfzeile. Es ist ein
            einfaches Formular (GET), damit es auch ohne JavaScript arbeitet. */}
        <form
          action={withBasePath("/listings")}
          method="get"
          role="search"
          className="mt-6 flex flex-col gap-2 sm:flex-row"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-slate-200 bg-white pl-4 pr-1.5 transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/30">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              name="q"
              type="search"
              placeholder={t("home.searchPlaceholder")}
              aria-label={t("home.ctaBrowse")}
              className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-slate-900 px-7 py-3 text-base font-semibold text-white shadow-soft transition-colors hover:bg-slate-800"
          >
            {t("home.ctaBrowse")}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-slate-500">{t("home.searchExamplesLabel")}</span>
          {["Blasocut 4000", "HLP 46", "Gleitbahnöl ISO 68", "Bor-frei"].map((b) => (
            <Link
              key={b}
              href={`/listings?q=${encodeURIComponent(b)}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition hover:bg-brand-100 hover:text-brand-800"
            >
              {b}
            </Link>
          ))}
        </div>
        <div className="mt-5">
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

      {/* EIN Karten-Block statt zwei: „Für wen?" und „Anbieten/Suchen" sagten
          dasselbe zweimal. Jetzt drei Wege — Anbieten (blau), Suchen (amber),
          Hersteller (Marke) — mit Bild, Titel, Knopf. Der Erklärsatz erscheint
          erst beim Darüberfahren. */}
      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/listings"
          className="group rounded-2xl border-t-4 border border-slate-200 border-t-blue-600 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="flex items-center justify-between gap-2">
            <OilBarrels className="h-10 w-auto transition duration-200 group-hover:scale-105" />
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              {t("home.offerBadge")}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-blue-700">
            {t("home.groupResellerTitle")}
          </h3>
          <p className="hover-hint text-sm text-slate-600">{t("home.groupResellerText")}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
            {t("home.offerLink")}{" "}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/kss-finder"
          className="group rounded-2xl border-t-4 border border-slate-200 border-t-amber-500 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="flex items-center justify-between gap-2">
            <SearchCanister className="h-10 w-auto transition duration-200 group-hover:scale-105" />
            <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              {t("home.seekBadge")}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-amber-700">
            {t("home.groupBuyerTitle")}
          </h3>
          <p className="hover-hint text-sm text-slate-600">{t("home.groupBuyerText")}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
            {t("home.groupBuyerCta")}{" "}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/register"
          className="group rounded-2xl border-t-4 border border-slate-200 border-t-brand-500 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition duration-200 group-hover:scale-105">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              {t("home.groupMfrBadge")}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-brand-700">
            {t("home.groupMfrTitle")}
          </h3>
          <p className="hover-hint text-sm text-slate-600">{t("home.groupMfrText")}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            {t("home.groupMfrCta")}{" "}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Link>
      </section>

      {/* Einstieg über die Aufgabe statt über den Produktnamen */}
      <ApplicationEntry />

      {/* Werbeplatzierung — kompakt, unterhalb der Kern-Inhalte */}
      <AdSlot placement="HOME" />

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

    </div>
  );
}

async function PersonalDashboard({ userId }: { userId: string }) {
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
    prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true, role: true } }),
  ]);
  const creditBalance = me?.creditBalance ?? 0;
  const role = me?.role ?? "RESELLER";

  // Rollenbasierte Haupt-Aktionen: jede Zielgruppe wird direkt abgeholt.
  //   RESELLER   → viele Produkte anbieten + offene Anfragen bedienen
  //   ENDKUNDE   → KI-Alternative finden + Anfrage einstellen
  //   OEM        → Produkte anbieten + Marke präsentieren
  const actions =
    role === "ENDKUNDE"
      ? [
          {
            href: "/kss-finder",
            cls: "border-purple-200 hover:border-purple-400",
            iconBg: "bg-purple-600",
            icon: <Sparkles className="h-6 w-6" />,
            title: "Alternative finden (KI)",
            text: "Produkt oder Problem eingeben — die KI schlägt passende Alternativen vor, inkl. Dichtungs-Check.",
            linkCls: "text-purple-700",
          },
          {
            href: "/rfqs/new",
            cls: "border-amber-200 hover:border-amber-400",
            iconBg: "bg-amber-500",
            icon: <Plus className="h-6 w-6" />,
            title: "Anfrage einstellen",
            text: "Bedarf beschreiben — Händler melden sich mit Angeboten. Kostenlos und ohne Verpflichtung.",
            linkCls: "text-amber-700",
          },
        ]
      : role === "OEM"
        ? [
            {
              href: "/listings/new",
              cls: "border-blue-200 hover:border-blue-400",
              iconBg: "bg-blue-600",
              icon: <Plus className="h-6 w-6" />,
              title: "Produkte anbieten",
              text: "Bestände und Katalogware einstellen — Käufer finden dich über die Suche.",
              linkCls: "text-blue-700",
            },
            {
              href: "/mitgliedschaft",
              cls: "border-brand-200 hover:border-brand-400",
              iconBg: "bg-brand-600",
              icon: <Building2 className="h-6 w-6" />,
              title: "Marke präsentieren",
              text: "Herstellerprofil und Produkte prominent zeigen — dort, wo Einkäufer suchen.",
              linkCls: "text-brand-700",
            },
          ]
        : [
            {
              href: "/listings/new",
              cls: "border-blue-200 hover:border-blue-400",
              iconBg: "bg-blue-600",
              icon: <Plus className="h-6 w-6" />,
              title: "Produkte anbieten",
              text: "Je mehr Angebote online sind, desto öfter wirst du gefunden — Bestände schnell in Aufträge verwandeln.",
              linkCls: "text-blue-700",
            },
            {
              href: "/rfqs",
              cls: "border-amber-200 hover:border-amber-400",
              iconBg: "bg-amber-500",
              icon: <Inbox className="h-6 w-6" />,
              title: "Anfragen bedienen",
              text: "Offene Käufer-Anfragen ansehen und Angebote abgeben — direkte Verkaufschancen.",
              linkCls: "text-amber-700",
            },
          ];

  return (
    <div className="space-y-8">
      {/* Kein „Willkommen zurück"-Block mehr — der Anmelde-Status steht oben
          rechts im Kopf (AccountMenu); die Seite beginnt direkt mit den Aktionen. */}
      {role !== "ENDKUNDE" && (
        <section className="flex justify-end">
          <Link
            href="/kss-finder"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:underline"
          >
            <Sparkles size={15} /> KSS-Berater (KI) öffnen
          </Link>
        </section>
      )}

      {/* Die zwei wichtigsten Aktionen für DIESE Rolle — groß und eindeutig */}
      <section className="grid gap-4 md:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group flex items-center gap-4 rounded-2xl border-2 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift ${a.cls}`}
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white transition duration-200 group-hover:scale-110 ${a.iconBg}`}
            >
              {a.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-slate-900">{a.title}</div>
              <div className="hover-hint text-sm text-slate-600">{a.text}</div>
            </div>
            <ArrowRight
              className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1.5 ${a.linkCls}`}
            />
          </Link>
        ))}
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

      {/* Werbeplatzierung — kompakt, unterhalb der eigenen Kennzahlen */}
      <AdSlot placement="HOME" />

      {openRfqsForMe.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">
              Offene Anfragen — vielleicht hast du das auf Lager
            </h2>
            <Link href="/rfqs" className="text-xs text-brand-700 hover:underline">
              alle →
            </Link>
          </div>
          <div className="card divide-y divide-slate-200">
            {openRfqsForMe.map((r) => (
              <Link
                key={r.id}
                href={`/rfqs/${r.id}`}
                className="group flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700"
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
            <Link href="/conversations" className="text-xs text-brand-700 hover:underline">
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
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700"
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
            <Link href="/listings" className="text-xs text-brand-700 hover:underline">
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
        <div className="hover-hint text-xs text-slate-500">{hint}</div>
      </div>
    </Link>
  );
}
