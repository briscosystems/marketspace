// POST /api/billing/webhook
// Stripe-Webhook: verifiziert die Signatur und verarbeitet den vollen
// Abo-Lebenszyklus — Erstabschluss, jede automatische Verlängerung und
// Kündigungs-Synchronisation. Der zuverlässige Weg in Produktion (der
// Erfolgs-Redirect via /api/billing/confirm ist nur der Dev-Fallback ohne
// konfigurierten Webhook und deckt naturgemäß keine spätere automatische
// Verlängerung ab — dafür braucht es zwingend diesen Webhook).
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession, fulfillRenewalInvoice, syncSubscriptionStatus } from "@/lib/membership";

export const runtime = "nodejs"; // Roh-Body für Signaturprüfung nötig

export async function POST(req: Request) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !whSecret) {
    return NextResponse.json({ error: "Stripe-Webhook nicht konfiguriert" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e) {
    return NextResponse.json(
      { error: `Webhook-Signatur ungültig: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      // Erstabschluss (Abo ODER Credit-Kauf)
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "invoice.payment_succeeded":
      // Jede automatische Verlängerungszahlung — verlängert membershipValidUntil
      await fulfillRenewalInvoice(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // Hält membershipCancelAtPeriodEnd synchron (z.B. Kündigung direkt im
      // Stripe-Kundenportal statt über unseren Kündigen-Knopf)
      await syncSubscriptionStatus(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
