import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Jahres-Zugangsgebühr in Euro (ganzzahlig), aus der Umgebung; Default 290 €.
export function membershipPriceEur(): number {
  const raw = parseInt(process.env.MEMBERSHIP_PRICE_EUR ?? "290", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 290;
}

// Aktiv, solange das Ablaufdatum in der Zukunft liegt.
export function isMembershipActive(validUntil: Date | null | undefined): boolean {
  return !!validUntil && validUntil.getTime() > Date.now();
}

// Verlängert die Mitgliedschaft um `months` ab dem späteren von (jetzt | bisherigem Ende).
export async function extendMembership(userId: string, months = 12): Promise<Date> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipValidUntil: true },
  });
  const stillActive =
    user?.membershipValidUntil && user.membershipValidUntil.getTime() > Date.now();
  const base = stillActive ? new Date(user!.membershipValidUntil!) : new Date();
  base.setMonth(base.getMonth() + months);
  await prisma.user.update({ where: { id: userId }, data: { membershipValidUntil: base } });
  return base;
}

/**
 * Erfüllt eine bezahlte Checkout-Session: markiert die Payment-Zeile als PAID
 * und verlängert die Mitgliedschaft — genau EINMAL (idempotent), egal ob der
 * Aufruf vom Webhook oder vom Erfolgs-Redirect kommt.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) return;
  if (session.payment_status !== "paid") return;

  const existing = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
  if (existing?.status === "PAID") return; // bereits erfüllt

  const until = await extendMembership(userId, 12);
  const intentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const data = {
    status: "PAID" as const,
    stripePaymentIntentId: intentId,
    periodStart: new Date(),
    periodEnd: until,
  };

  if (existing) {
    await prisma.payment.update({ where: { stripeSessionId: session.id }, data });
  } else {
    // Fallback, falls die PENDING-Zeile fehlt (z.B. Direktzahlung).
    await prisma.payment.create({
      data: {
        userId,
        kind: "MEMBERSHIP",
        amountEur: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "eur",
        stripeSessionId: session.id,
        ...data,
      },
    });
  }
}
