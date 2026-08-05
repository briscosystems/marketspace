import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { isMembershipActive } from "@/lib/membership";
import { getTierPrices, TIER_META, TIER_ORDER, activeTier } from "@/lib/membership-tiers";
import { isStripeConfigured } from "@/lib/stripe";
import { MembershipActions } from "@/components/MembershipActions";
import { StorefrontManager } from "@/components/StorefrontManager";
import { CreditActions } from "@/components/CreditActions";
import { ReferralLinkBox } from "@/components/ReferralLinkBox";
import { RedeemCodeBox } from "@/components/RedeemCodeBox";
import { ConnectOnboardingBox } from "@/components/ConnectOnboardingBox";
import { syncConnectStatus } from "@/lib/connect";
import {
  CREDIT_PACKAGES,
  AI_ACTION_COSTS,
  getAllSettings,
  isTrialActive,
  packagePriceEur,
} from "@/lib/credits";
import { currencyForUser, convertCurrency, formatCurrency } from "@/lib/currency";
import { CreditCard, ShieldCheck, Lock, Coins, Gift, Clock, Ticket, ScrollText, Store, KeyRound } from "lucide-react";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export const metadata = { title: "Mitgliedschaft & Kosten — Brisco Marketplace" };

export default async function MembershipPage() {
  const t = await getT();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card text-sm text-slate-600">
        Bitte zuerst{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          einloggen
        </Link>
        .
      </div>
    );
  }

  const [user, settings, recentTx] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        membershipValidUntil: true,
        membershipCancelAtPeriodEnd: true,
        membershipTier: true,
        stripeSubscriptionId: true,
        creditBalance: true,
        trialEndsAt: true,
        pseudonym: true,
        country: true,
        preferredCurrency: true,
        brandManufacturerId: true,
        storefrontHeadline: true,
        about: true,
      },
    }),
    getAllSettings(),
    prisma.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, kind: true, note: true, createdAt: true },
    }),
  ]);
  const currency = currencyForUser(user ?? {});
  // Connect-Onboarding-Status mit Stripe abgleichen (Rückkehr vom Onboarding)
  const connectOnboarded = await syncConnectStatus(session.user.id);
  const active = isMembershipActive(user?.membershipValidUntil);
  const trialActive = isTrialActive(user?.trialEndsAt);
  const tierPrices = await getTierPrices();
  const currentTier = activeTier({
    membershipTier: user?.membershipTier ?? null,
    membershipValidUntil: user?.membershipValidUntil ?? null,
  });
  const tierOptions = TIER_ORDER.map((tier) => ({
    tier,
    name: TIER_META[tier].name,
    audience: TIER_META[tier].audience,
    featured: TIER_META[tier].featured,
    features: TIER_META[tier].features,
    priceEur: tierPrices[tier],
  }));
  const priceEur = tierPrices.BASIS;
  const configured = isStripeConfigured();
  // Herstellerliste nur laden, wenn das Marken-Schaufenster freigeschaltet ist.
  const manufacturerOptions =
    currentTier === "MARKE"
      ? await prisma.manufacturer.findMany({
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        })
      : [];
  const validUntilLabel = user?.membershipValidUntil
    ? user.membershipValidUntil.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const renewalSoon =
    active &&
    !user?.membershipCancelAtPeriodEnd &&
    user?.membershipValidUntil &&
    user.membershipValidUntil.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard size={20} className="text-brand-600" />
        <h1 className="page-title">{t("mem.title")}</h1>
      </div>
      <p className="text-sm text-slate-600">
{t("mem.lead")}
      </p>

      {/* Status */}
      <div className="card space-y-2">
        <div className="text-sm text-slate-600">{t("mem.status")}</div>
        {active ? (
          <div className="text-lg font-semibold text-emerald-700">
            {fill(t("mem.activeUntil"), { d: validUntilLabel ?? "" })}
          </div>
        ) : trialActive ? (
          <div className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Clock size={18} />
            {fill(t("mem.trialUntil"), { d: user!.trialEndsAt!.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) })}
          </div>
        ) : (
          <div className="text-lg font-semibold text-slate-900">{t("mem.noAccess")}</div>
        )}
        {renewalSoon && (
          <p className="rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-800">
            {t("mem.renewalReminder")}
          </p>
        )}
        <p className="text-sm text-slate-600">
          {fill(t("mem.tiersLine"), { b: tierPrices.BASIS, pr: tierPrices.PRO, m: tierPrices.MARKE })}
          {trialActive && t("mem.trialSuffix")}
        </p>
      </div>

      {!configured && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Hinweis:</strong> Die Kartenzahlung ist derzeit nicht verfügbar. Schreib uns
          kurz — wir schalten deine Mitgliedschaft von Hand frei.
        </div>
      )}

      <div className="card">
        <MembershipActions
          active={active}
          hasSubscription={!!user?.stripeSubscriptionId}
          cancelAtPeriodEnd={!!user?.membershipCancelAtPeriodEnd}
          validUntil={validUntilLabel}
          currentPriceEur={currentTier ? tierPrices[currentTier] : priceEur}
          currentTierName={currentTier ? TIER_META[currentTier].name : null}
          tiers={tierOptions}
        />
      </div>

      {/* Rechtliche Offenlegung — direkt bei der Abo-Aktion, nicht versteckt */}
      <div className="card space-y-2 border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ScrollText size={16} className="text-slate-500" />
          {t("mem.contractTitle")}
        </div>
        <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
          <li>{t("mem.contract1")}</li>
          <li>{t("mem.contract2")}</li>
          <li>{t("mem.contract3")}</li>
          <li>
            {t("mem.creditsTitle")} sind ein separates Guthaben (Prepaid, kein Abo) — siehe Preisliste unten.
          </li>
        </ul>
      </div>

      {/* KI-Credits: Guthaben, Preisliste, Pakete */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Coins size={18} className="text-amber-500" />
            KI-Credits
          </div>
          <div className="stat-value">
            {user?.creditBalance ?? 0}
            <span className="ml-1 text-sm font-normal text-slate-500">{t("mem.creditsWord")}</span>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {fill(t("mem.creditsCost"), { c1: AI_ACTION_COSTS.concierge, c2: AI_ACTION_COSTS.alternatives, c3: AI_ACTION_COSTS.alternativesWeb, price: formatCurrency(convertCurrency(settings.creditPriceCt / 100, "EUR", currency), currency) })}
        </p>
        <CreditActions
          packages={CREDIT_PACKAGES.map((p) => ({
            ...p,
            price: convertCurrency(packagePriceEur(p.credits, settings.creditPriceCt), "EUR", currency),
            currency,
          }))}
        />
        {recentTx.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <div className="eyebrow mb-2">
              {t("mem.recentBookings")}
            </div>
            <ul className="space-y-1 text-sm">
              {recentTx.map((t) => (
                <li key={t.id} className="flex justify-between gap-3">
                  <span className="truncate text-slate-600">
                    {t.createdAt.toLocaleDateString("de-CH")} · {t.note ?? t.kind}
                  </span>
                  <span
                    className={`shrink-0 font-medium ${t.amount >= 0 ? "text-emerald-700" : "text-slate-900"}`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Marken-Schaufenster (nur Stufe Marke) */}
      {currentTier === "MARKE" && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Store size={18} className="text-brand-600" />
            {t("mem.storefrontTitle")}
          </div>
          <p className="text-sm text-slate-600">
            {t("mem.storefrontText")}
          </p>
          <StorefrontManager
            manufacturers={manufacturerOptions}
            currentManufacturerId={user?.brandManufacturerId ?? null}
            currentHeadline={user?.storefrontHeadline ?? null}
            currentAbout={user?.about ?? null}
          />
          <Link
            href="/werbung"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            {t("mem.adsManage")}
          </Link>
        </div>
      )}

      {/* REST-API (nur Stufe Marke): Schlüssel-Verwaltung + Doku-Link */}
      {currentTier === "MARKE" && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <KeyRound size={18} className="text-brand-600" />
            REST-API
          </div>
          <p className="text-sm text-slate-600">
            Als Marke-Mitglied kannst du per API auf den Produktkatalog, die ausgewerteten
            Sicherheitsdatenblätter und die KI-Alternativsuche zugreifen — z. B. für dein ERP
            oder eigene Auswertungen. KI-Aufrufe kosten dieselben Credits wie auf der Plattform;
            Katalog-Abfragen sind kostenlos.{" "}
            <Link href="/api-doku" className="font-medium text-brand-700 hover:underline">
              Zur API-Dokumentation →
            </Link>
          </p>
          <ApiKeyManager />
        </div>
      )}

      {/* Käuferschutz als Verkäufer anbieten */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldCheck size={18} className="text-emerald-600" />
          {t("mem.protectionTitle")}
        </div>
        <p className="text-sm text-slate-600">
          {t("mem.protectionText")}
        </p>
        <ConnectOnboardingBox onboarded={connectOnboarded} />
      </div>

      {/* Code einlösen */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Ticket size={18} className="text-brand-600" />
          {t("mem.redeemTitle")}
        </div>
        <p className="text-sm text-slate-600">
          {t("mem.redeemText")}
        </p>
        <RedeemCodeBox />
      </div>

      {/* Referral: Freunde werben */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Gift size={18} className="text-brand-600" />
          {fill(t("mem.referralTitle"), { n: settings.referralCredits })}
        </div>
        <p className="text-sm text-slate-600">
          {fill(t("mem.referralText"), { n: settings.referralCredits })}
        </p>
        <ReferralLinkBox pseudonym={user?.pseudonym ?? ""} />
      </div>

      {/* Sichtbare Vertrauenssignale zur Zahlung */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldCheck size={18} className="text-emerald-600" />
          {t("mem.payTitle")}
        </div>
        <p className="text-sm text-slate-600">
          {t("mem.payText1")}<strong>{t("mem.payTextBold")}</strong>{t("mem.payText2")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* Muss zu den im Stripe-Dashboard aktivierten Zahlungsmethoden passen —
              Stripe zeigt in der Kaufabwicklung automatisch alles dort Aktivierte. */}
          {/* PayPal ist im Stripe-Dashboard noch NICHT aktiviert (Stand 2026-07-19) —
              erst hier ergänzen, wenn der User es dort eingeschaltet hat. */}
          {["Visa", "Mastercard", "American Express", "TWINT", "Google Pay", "Apple Pay"].map((brand) => (
            <span
              key={brand}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {brand}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Lock size={12} /> {t("mem.sslEncrypted")}
          </span>
        </div>
      </div>
    </div>
  );
}
