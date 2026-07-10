// POST /api/transactions/[id]/protection/checkout — Käufer startet die
// Zahlung mit Käuferschutz. Separate charges & transfers: Die Zahlung geht
// an die Plattform (Geld bleibt bei Stripe geparkt), die Überweisung an den
// Verkäufer erfolgt erst nach Lieferbestätigung (release-Route).
// Abwicklungsgebühr trägt der Käufer (transparent als eigene Position).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";
import { protectionFeeEur } from "@/lib/protection";
import { transactionProductLabel } from "@/lib/transaction-label";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt)." },
      { status: 503 },
    );
  }
  const { id } = await ctx.params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      seller: { select: { stripeConnectAccountId: true, stripeConnectOnboarded: true } },
      listing: { select: { manufacturer: true, productName: true } },
      rfq: { select: { manufacturer: true, productType: true } },
    },
  });
  if (!tx) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (tx.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Nur der Käufer kann bezahlen." }, { status: 403 });
  }
  if (tx.status !== "PENDING" && tx.status !== "SHIPPED") {
    return NextResponse.json({ error: "Transaktion ist nicht mehr offen." }, { status: 409 });
  }
  if (tx.protectionStatus !== "NONE" && tx.protectionStatus !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Käuferschutz ist bereits aktiv." }, { status: 409 });
  }
  if (!tx.seller.stripeConnectOnboarded || !tx.seller.stripeConnectAccountId) {
    return NextResponse.json(
      { error: "Der Verkäufer bietet (noch) keinen Käuferschutz an." },
      { status: 422 },
    );
  }

  const fee = protectionFeeEur(tx.totalEur);
  const base = appBaseUrl();
  const product = transactionProductLabel(tx);

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(tx.totalEur * 100),
          product_data: {
            name: `Käuferschutz-Zahlung: ${product}`,
            description: `${tx.quantity.toLocaleString("de-DE")} ${tx.quantityUnit} — Freigabe an den Verkäufer nach Lieferbestätigung`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(fee * 100),
          product_data: {
            name: "Abwicklungsgebühr (Zahlungsdienstleister)",
            description: "Deckt die Stripe-Gebühren — Brisco verdient an der Transaktion nichts",
          },
        },
      },
    ],
    payment_intent_data: { transfer_group: tx.id },
    metadata: { kind: "PROTECTION", transactionId: tx.id, userId: session.user.id },
    success_url: `${base}/transactions/${tx.id}?protection=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/transactions/${tx.id}?protection=cancel`,
  });

  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      protectionStatus: "PENDING_PAYMENT",
      protectionFeeEur: fee,
      stripeProtectionSessionId: checkout.id,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
