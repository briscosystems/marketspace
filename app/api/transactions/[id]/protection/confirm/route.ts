// POST /api/transactions/[id]/protection/confirm { sessionId }
// Dev-Fallback ohne konfigurierten Webhook: verifiziert die Checkout-Session
// direkt bei Stripe und markiert die Zahlung als geparkt (HELD). Idempotent.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { confirmProtectionPayment } from "@/lib/protection-flow";

const bodySchema = z.object({ sessionId: z.string().min(5) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert." }, { status: 503 });
  }
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });

  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { buyerId: true, stripeProtectionSessionId: true },
  });
  if (!tx) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (tx.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (tx.stripeProtectionSessionId !== parsed.data.sessionId) {
    return NextResponse.json({ error: "Session passt nicht zur Transaktion." }, { status: 400 });
  }

  const checkout = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
  await confirmProtectionPayment(checkout);

  const updated = await prisma.transaction.findUnique({
    where: { id },
    select: { protectionStatus: true },
  });
  return NextResponse.json({ ok: true, protectionStatus: updated?.protectionStatus });
}
