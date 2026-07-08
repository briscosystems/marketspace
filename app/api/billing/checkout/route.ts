// POST /api/billing/checkout
// Erzeugt eine Stripe-Checkout-Session für ein ECHTES Jahres-Abo mit
// automatischer Verlängerung (mode: "subscription") und gibt die
// Weiterleitungs-URL zur gehosteten Stripe-Bezahlseite zurück.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";
import { getMembershipPriceEur, isMembershipActive } from "@/lib/membership";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe ist noch nicht konfiguriert. Bitte STRIPE_SECRET_KEY (Test-Key sk_test_…) in der .env eintragen und Dev-Server neu starten.",
      },
      { status: 503 },
    );
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true, membershipValidUntil: true, stripeSubscriptionId: true },
  });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
  if (isMembershipActive(user.membershipValidUntil) && user.stripeSubscriptionId) {
    return NextResponse.json({ error: "Du hast bereits ein aktives Abo." }, { status: 409 });
  }

  // Stripe-Customer sicherstellen (einmalig anlegen, dann wiederverwenden)
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const priceEur = await getMembershipPriceEur();
  const base = appBaseUrl();

  // Echtes Abo (mode: "subscription") — verlängert sich automatisch jährlich,
  // bis der Nutzer kündigt (siehe /api/billing/cancel). Kein vorab in Stripe
  // angelegtes Preis-Objekt nötig: price_data mit recurring geht auch inline.
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: priceEur * 100,
          recurring: { interval: "year" },
          product_data: {
            name: "Brisco — Jahres-Abo",
            description: "Jährlich kündbares Abo für den Zugang zur Brisco-Plattform. Verlängert sich automatisch, sofern nicht vorher gekündigt.",
          },
        },
      },
    ],
    metadata: { userId, kind: "MEMBERSHIP" },
    subscription_data: { metadata: { userId } },
    success_url: `${base}/mitgliedschaft?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/mitgliedschaft?status=cancel`,
  });

  await prisma.payment.create({
    data: {
      userId,
      kind: "MEMBERSHIP",
      status: "PENDING",
      amountEur: priceEur,
      currency: "eur",
      stripeSessionId: checkout.id,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
