// POST /api/billing/webhook
// Stripe-Webhook: verifiziert die Signatur und erfüllt bezahlte Sessions
// (Mitgliedschaft verlängern). Der zuverlässige Weg in Produktion.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/membership";

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

  if (event.type === "checkout.session.completed") {
    await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
