import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMembershipActive, getMembershipPriceEur } from "@/lib/membership";
import { isStripeConfigured } from "@/lib/stripe";
import { MembershipActions } from "@/components/MembershipActions";
import { CreditActions } from "@/components/CreditActions";
import { ReferralLinkBox } from "@/components/ReferralLinkBox";
import { RedeemCodeBox } from "@/components/RedeemCodeBox";
import {
  CREDIT_PACKAGES,
  AI_ACTION_COSTS,
  getAllSettings,
  isTrialActive,
  packagePriceChf,
} from "@/lib/credits";
import { CreditCard, ShieldCheck, Lock, Coins, Gift, Clock, Ticket, ScrollText } from "lucide-react";

export const metadata = { title: "Mitgliedschaft & Kosten — Brisco Marketplace" };

export default async function MembershipPage() {
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
        stripeSubscriptionId: true,
        creditBalance: true,
        trialEndsAt: true,
        pseudonym: true,
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
  const active = isMembershipActive(user?.membershipValidUntil);
  const trialActive = isTrialActive(user?.trialEndsAt);
  const priceEur = await getMembershipPriceEur();
  const configured = isStripeConfigured();
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
        <h1 className="page-title">Mitgliedschaft &amp; Kosten</h1>
      </div>
      <p className="text-sm text-slate-600">
        Alle Kosten auf einen Blick: Jahres-Abo für den Plattform-Zugang, dazu Credits für
        KI-Funktionen. Beides ist unabhängig voneinander nutzbar/kündbar.
      </p>

      {/* Status */}
      <div className="card space-y-2">
        <div className="text-sm text-slate-600">Status</div>
        {active ? (
          <div className="text-lg font-semibold text-emerald-700">
            Abo aktiv bis {validUntilLabel}
          </div>
        ) : trialActive ? (
          <div className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Clock size={18} />
            Kennenlernphase bis{" "}
            {user!.trialEndsAt!.toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        ) : (
          <div className="text-lg font-semibold text-slate-900">Kein aktiver Zugang</div>
        )}
        {renewalSoon && (
          <p className="rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-800">
            Erinnerung: Dein Abo verlängert sich in weniger als 30 Tagen automatisch.
          </p>
        )}
        <p className="text-sm text-slate-600">
          Der Jahres-Zugang kostet <strong>{priceEur} €</strong> und schaltet die Plattform für
          12 Monate frei.
          {trialActive &&
            " Während der Kennenlernphase kannst du alles ohne Abo ausprobieren."}
        </p>
      </div>

      {!configured && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Hinweis:</strong> Stripe ist noch nicht konfiguriert. Trage{" "}
          <code>STRIPE_SECRET_KEY</code> (Test-Key <code>sk_test_…</code>) in die <code>.env</code>{" "}
          ein und starte den Dev-Server neu — dann funktioniert die Kartenzahlung im Testmodus.
        </div>
      )}

      <div className="card">
        <MembershipActions
          active={active}
          priceEur={priceEur}
          hasSubscription={!!user?.stripeSubscriptionId}
          cancelAtPeriodEnd={!!user?.membershipCancelAtPeriodEnd}
          validUntil={validUntilLabel}
        />
      </div>

      {/* Rechtliche Offenlegung — direkt bei der Abo-Aktion, nicht versteckt */}
      <div className="card space-y-2 border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ScrollText size={16} className="text-slate-500" />
          Vertragslaufzeit &amp; Kündigung
        </div>
        <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
          <li>Laufzeit 12 Monate, danach automatische Verlängerung um jeweils 12 Monate.</li>
          <li>
            Kündigung jederzeit möglich, ohne Vorlauffrist — über den Knopf{" "}
            <strong>„Abo kündigen"</strong> oben auf dieser Seite. Der Zugang bleibt bis zum Ende
            der bereits bezahlten Periode aktiv, danach erfolgt keine weitere Abbuchung.
          </li>
          <li>Zahlungsmethode: Kreditkarte über Stripe, jährliche Abbuchung.</li>
          <li>
            KI-Credits sind ein separates Guthaben (Prepaid, kein Abo) — siehe Preisliste unten.
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
          <div className="text-2xl font-bold text-slate-900">
            {user?.creditBalance ?? 0}
            <span className="ml-1 text-sm font-normal text-slate-500">Credits</span>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          KI-Funktionen kosten Credits: Concierge-Frage und KSS-Wizard je{" "}
          {AI_ACTION_COSTS.concierge} Credit, KI-Alternativen{" "}
          {AI_ACTION_COSTS.alternatives} Credit, Web-Recherche{" "}
          {AI_ACTION_COSTS.alternativesWeb} Credits. 1 Credit ={" "}
          {(settings.creditPriceRp / 100).toFixed(2).replace(".", ",")} CHF.
        </p>
        <CreditActions
          packages={CREDIT_PACKAGES.map((p) => ({
            ...p,
            priceChf: packagePriceChf(p.credits, settings.creditPriceRp),
          }))}
        />
        {recentTx.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Letzte Buchungen
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

      {/* Code einlösen */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Ticket size={18} className="text-brand-600" />
          Gutschein-Code einlösen
        </div>
        <p className="text-sm text-slate-600">
          Hast du einen Code von Brisco erhalten? Hier einlösen für zusätzliche Credits.
        </p>
        <RedeemCodeBox />
      </div>

      {/* Referral: Freunde werben */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Gift size={18} className="text-brand-600" />
          Kunden werben — {settings.referralCredits} Credits pro Neukunde
        </div>
        <p className="text-sm text-slate-600">
          Teile deinen Empfehlungs-Link. Registriert sich darüber ein Neukunde,
          bekommst du {settings.referralCredits} Credits gutgeschrieben.
        </p>
        <ReferralLinkBox pseudonym={user?.pseudonym ?? ""} />
      </div>

      {/* Sichtbare Vertrauenssignale zur Zahlung */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldCheck size={18} className="text-emerald-600" />
          Sichere Bezahlung über Stripe
        </div>
        <p className="text-sm text-slate-600">
          Die Zahlung läuft über <strong>Stripe</strong>, einen weltweit führenden
          Zahlungsdienstleister. Ihre Kartendaten werden verschlüsselt direkt bei Stripe
          verarbeitet und <strong>niemals auf dieser Plattform gespeichert</strong>
          {" "}(Sicherheitsstandard PCI-DSS Level 1).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {["Visa", "Mastercard", "American Express"].map((brand) => (
            <span
              key={brand}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {brand}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Lock size={12} /> SSL-verschlüsselt
          </span>
        </div>
      </div>
    </div>
  );
}
