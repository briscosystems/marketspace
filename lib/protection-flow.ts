import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Serverseitige Abläufe des Käuferschutzes (Bestätigung nach Zahlung,
// Freigabe nach Lieferbestätigung, Rückerstattung im Problemfall).
// Wording bewusst "Käuferschutz", nicht "Treuhand" (Stripe-Vorgabe).

/**
 * Markiert eine Käuferschutz-Zahlung als eingegangen (HELD). Idempotent —
 * wird sowohl vom Webhook (checkout.session.completed) als auch vom
 * Erfolgs-Redirect (Dev-Fallback ohne Webhook) aufgerufen.
 */
export async function confirmProtectionPayment(session: Stripe.Checkout.Session): Promise<void> {
  const txId = session.metadata?.transactionId;
  if (!txId) return;
  if (session.payment_status !== "paid" && session.status !== "complete") return;

  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
    select: { protectionStatus: true, stripeProtectionSessionId: true },
  });
  if (!tx || tx.stripeProtectionSessionId !== session.id) return;
  if (tx.protectionStatus !== "PENDING_PAYMENT") return; // bereits verarbeitet

  const intentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  await prisma.transaction.update({
    where: { id: txId },
    data: { protectionStatus: "HELD", stripeProtectionPaymentIntentId: intentId },
  });
}

/**
 * Zahlungsfreigabe nach Lieferbestätigung: überweist den Warenwert (ohne
 * Abwicklungsgebühr) an das Connect-Konto des Verkäufers. Idempotent über
 * stripeProtectionTransferId.
 */
export async function releaseProtection(txId: string): Promise<{ ok: boolean; error?: string }> {
  if (!stripe) return { ok: false, error: "Stripe nicht konfiguriert." };

  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
    include: { seller: { select: { stripeConnectAccountId: true } } },
  });
  if (!tx) return { ok: false, error: "Transaktion nicht gefunden." };
  if (tx.stripeProtectionTransferId) return { ok: true }; // bereits freigegeben
  if (tx.protectionStatus !== "HELD" && tx.protectionStatus !== "DISPUTED") {
    return { ok: false, error: "Keine geparkte Zahlung zum Freigeben." };
  }
  if (!tx.seller.stripeConnectAccountId) {
    return { ok: false, error: "Verkäufer hat kein Auszahlungskonto." };
  }

  const transfer = await stripe.transfers.create({
    amount: Math.round(tx.totalEur * 100),
    currency: "eur",
    destination: tx.seller.stripeConnectAccountId,
    transfer_group: tx.id,
    description: `Brisco Käuferschutz — Freigabe Transaktion ${tx.id}`,
  });

  await prisma.transaction.update({
    where: { id: tx.id },
    data: { protectionStatus: "RELEASED", stripeProtectionTransferId: transfer.id },
  });
  return { ok: true };
}

/**
 * Problemfall-Entscheidung des Superadmins: Zahlung an den Käufer
 * zurückerstatten (inkl. Abwicklungsgebühr — der Käufer soll im
 * Problemfall keinen Verlust haben).
 */
export async function refundProtection(txId: string): Promise<{ ok: boolean; error?: string }> {
  if (!stripe) return { ok: false, error: "Stripe nicht konfiguriert." };

  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx) return { ok: false, error: "Transaktion nicht gefunden." };
  if (tx.protectionStatus !== "HELD" && tx.protectionStatus !== "DISPUTED") {
    return { ok: false, error: "Keine geparkte Zahlung zum Erstatten." };
  }
  if (!tx.stripeProtectionPaymentIntentId) {
    return { ok: false, error: "Keine Zahlung hinterlegt." };
  }

  await stripe.refunds.create({ payment_intent: tx.stripeProtectionPaymentIntentId });
  await prisma.transaction.update({
    where: { id: tx.id },
    data: { protectionStatus: "REFUNDED" },
  });
  return { ok: true };
}
