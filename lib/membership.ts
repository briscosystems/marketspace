import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { grantCredits, getSettingInt } from "@/lib/credits";
import { formatCurrency } from "@/lib/currency";
import { sendEmail } from "@/lib/mailer";
import { renewalConfirmationEmail } from "@/lib/membership-emails";
import { appBaseUrl } from "@/lib/stripe";

// ============================================================
// Abo mit ECHTER automatischer Verlängerung (Stripe Subscriptions).
//
// Rechtlicher Rahmen (siehe /mitgliedschaft-Offenlegungstext + FDS C.9):
// B2B-Verträge (Reseller/OEM) unterliegen nicht den deutschen
// Verbraucherschutz-Vorgaben (§309/§312j/§312k BGB gelten nur für
// Verbraucherverträge, § 310 Abs. 1 BGB). Da die Plattform auch die Rolle
// „Endkunde" kennt, ist die Kündigung bewusst SICHERER als gesetzlich nötig
// umgesetzt: jederzeit kündbar, Wirkung zum Ende der bezahlten Periode,
// kein erzwungenes Vorlauf-Fenster — plus ein persistenter Kündigen-Knopf
// (erfüllt sinngemäß § 312k BGB "Kündigungsbutton", ohne dass ihn das
// Gesetz für B2B verlangen würde). Keine Rechtsberatung — vor Live-Schaltung
// von einer Anwältin/einem Anwalt in CH und DE prüfen lassen.
// ============================================================

/** Jahresgebühr in Euro — Superadmin-Einstellung, Default 350 €. */
export async function getMembershipPriceEur(): Promise<number> {
  return getSettingInt("membershipPriceEur");
}

// Aktiv, solange das Ablaufdatum in der Zukunft liegt.
export function isMembershipActive(validUntil: Date | null | undefined): boolean {
  return !!validUntil && validUntil.getTime() > Date.now();
}

/** Membership-Ende direkt setzen (z.B. aus Stripe current_period_end). */
async function setMembershipUntil(userId: string, until: Date): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { membershipValidUntil: until } });
}

/** Manuelle Verlängerung um `months` ab dem späteren von (jetzt | bisherigem Ende) — für Admin-Grants ohne Stripe. */
export async function extendMembership(userId: string, months = 12): Promise<Date> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { membershipValidUntil: true } });
  const stillActive = user?.membershipValidUntil && user.membershipValidUntil.getTime() > Date.now();
  const base = stillActive ? new Date(user!.membershipValidUntil!) : new Date();
  base.setMonth(base.getMonth() + months);
  await setMembershipUntil(userId, base);
  return base;
}

function periodEndOf(subscription: Stripe.Subscription): Date {
  // current_period_end liegt beim Stripe-Node-SDK auf dem Subscription-Item,
  // nicht mehr auf der Subscription selbst (API-Änderung 2025).
  const item = subscription.items.data[0];
  const ts = item?.current_period_end ?? Math.floor(Date.now() / 1000) + 365 * 86400;
  return new Date(ts * 1000);
}

/**
 * Erfüllt eine bezahlte Checkout-Session (Erstabschluss) — genau EINMAL
 * (idempotent), egal ob der Aufruf vom Webhook oder vom Erfolgs-Redirect
 * kommt:
 *   - kind MEMBERSHIP → Stripe-Subscription verknüpfen, Laufzeit setzen
 *   - kind CREDITS    → gekaufte Credits gutschreiben (metadata.credits)
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  // Käuferschutz-Zahlungen haben einen eigenen Ablauf (lib/protection-flow.ts)
  if (session.metadata?.kind === "PROTECTION") {
    const { confirmProtectionPayment } = await import("@/lib/protection-flow");
    await confirmProtectionPayment(session);
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) return;
  if (session.payment_status !== "paid" && session.status !== "complete") return;

  const existing = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
  if (existing?.status === "PAID") return; // bereits erfüllt

  const kind = session.metadata?.kind === "CREDITS" ? "CREDITS" : "MEMBERSHIP";
  const intentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  let periodEnd: Date | null = null;
  let amountEur = (session.amount_total ?? 0) / 100;

  if (kind === "MEMBERSHIP") {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (subId && stripe) {
      const subscription = await stripe.subscriptions.retrieve(subId);
      periodEnd = periodEndOf(subscription);
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: subscription.id,
          membershipValidUntil: periodEnd,
          membershipCancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
    } else {
      // Fallback ohne Stripe-Rückfrage (sollte praktisch nicht vorkommen)
      periodEnd = await extendMembership(userId, 12);
    }
  } else {
    const credits = parseInt(session.metadata?.credits ?? "0", 10);
    if (credits > 0) {
      await grantCredits(userId, credits, "PURCHASE", `Credit-Paket (${credits} Credits)`);
    }
  }

  const data = {
    status: "PAID" as const,
    stripePaymentIntentId: intentId,
    periodStart: new Date(),
    periodEnd,
  };

  if (existing) {
    await prisma.payment.update({ where: { stripeSessionId: session.id }, data: { ...data, amountEur } });
  } else {
    await prisma.payment.create({
      data: {
        userId,
        kind,
        amountEur,
        currency: session.currency ?? "eur",
        stripeSessionId: session.id,
        ...data,
      },
    });
  }
}

/**
 * Erfüllt eine erfolgreiche Verlängerungszahlung (Webhook
 * invoice.payment_succeeded). Idempotent über stripeInvoiceId — Stripe kann
 * denselben Webhook mehrfach zustellen.
 */
export async function fulfillRenewalInvoice(invoice: Stripe.Invoice): Promise<void> {
  const subId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;
  if (!subId || !stripe) return;

  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subId },
    select: { id: true, email: true, pseudonym: true },
  });
  if (!user) return;

  const existing = await prisma.payment.findFirst({ where: { stripeInvoiceId: invoice.id } });
  const alreadyFulfilled = existing?.status === "PAID";

  const subscription = await stripe.subscriptions.retrieve(subId);
  const periodEnd = periodEndOf(subscription);

  if (!alreadyFulfilled) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipValidUntil: periodEnd,
        membershipCancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  const data = {
    status: "PAID" as const,
    periodStart: new Date(),
    periodEnd,
    amountEur: (invoice.amount_paid ?? 0) / 100,
  };
  if (existing) {
    await prisma.payment.update({ where: { id: existing.id }, data });
  } else {
    await prisma.payment.create({
      data: {
        userId: user.id,
        kind: "MEMBERSHIP",
        currency: invoice.currency ?? "eur",
        stripeInvoiceId: invoice.id,
        ...data,
      },
    });
  }

  // Bestätigungs-Mail nur bei einer ECHTEN automatischen Verlängerung
  // (billing_reason "subscription_cycle"), nicht beim Erstabschluss — und
  // nicht erneut bei einer doppelt zugestellten Webhook-Nachricht.
  if (!alreadyFulfilled && invoice.billing_reason === "subscription_cycle") {
    const priceLabel = formatCurrency((invoice.amount_paid ?? 0) / 100, (invoice.currency ?? "eur").toUpperCase());
    const email = renewalConfirmationEmail({
      pseudonym: user.pseudonym,
      validUntil: periodEnd,
      priceLabel,
      cancelUrl: `${appBaseUrl()}/mitgliedschaft`,
    });
    await sendEmail({ userId: user.id, kind: "MEMBERSHIP_RENEWED", to: user.email, ...email });
  }
}

/** Hält membershipCancelAtPeriodEnd mit Stripe synchron (Webhook customer.subscription.updated/deleted). */
export async function syncSubscriptionStatus(subscription: Stripe.Subscription): Promise<void> {
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { membershipCancelAtPeriodEnd: subscription.cancel_at_period_end },
  });
}

/** Nutzer kündigt: Abo läuft zum Ende der bezahlten Periode aus, keine weitere Abbuchung. */
export async function cancelMembership(userId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true } });
  if (!user?.stripeSubscriptionId) return { ok: false, error: "Kein aktives Abo gefunden." };
  if (!stripe) return { ok: false, error: "Stripe nicht konfiguriert." };
  await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
  await prisma.user.update({ where: { id: userId }, data: { membershipCancelAtPeriodEnd: true } });
  return { ok: true };
}

/** Nutzer widerruft eine Kündigung, solange die Periode noch läuft. */
export async function reactivateMembership(userId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true } });
  if (!user?.stripeSubscriptionId) return { ok: false, error: "Kein aktives Abo gefunden." };
  if (!stripe) return { ok: false, error: "Stripe nicht konfiguriert." };
  await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: false });
  await prisma.user.update({ where: { id: userId }, data: { membershipCancelAtPeriodEnd: false } });
  return { ok: true };
}
