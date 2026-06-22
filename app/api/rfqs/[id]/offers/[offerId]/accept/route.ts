import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; offerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, offerId } = await ctx.params;

  const rfq = await prisma.rfq.findUnique({ where: { id } });
  if (!rfq) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rfq.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (rfq.status !== "OPEN") {
    return NextResponse.json(
      { error: "Anfrage ist nicht mehr offen." },
      { status: 409 }
    );
  }

  const offer = await prisma.rfqOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.rfqId !== id) {
    return NextResponse.json({ error: "Angebot nicht gefunden." }, { status: 404 });
  }

  // Composite unique mit NULL-listingId greift in Postgres nicht — manuelles find/create
  const existingConvo = await prisma.conversation.findFirst({
    where: {
      buyerId: session.user.id,
      sellerId: offer.sellerId,
      listingId: null,
    },
  });
  const conversation =
    existingConvo ??
    (await prisma.conversation.create({
      data: { buyerId: session.user.id, sellerId: offer.sellerId },
    }));

  const totalEur = offer.priceEur * offer.quantity;
  const [, , , transaction] = await prisma.$transaction([
    prisma.rfq.update({
      where: { id },
      data: { status: "ACCEPTED", acceptedOfferId: offerId },
    }),
    prisma.rfqOffer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    }),
    prisma.rfqOffer.updateMany({
      where: { rfqId: id, id: { not: offerId }, status: "PENDING" },
      data: { status: "DECLINED" },
    }),
    prisma.transaction.create({
      data: {
        buyerId: session.user.id,
        sellerId: offer.sellerId,
        rfqId: id,
        totalEur,
        quantity: offer.quantity,
        quantityUnit: offer.quantityUnit,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        body: `Angebot zu RFQ #${id.slice(-6)} angenommen: ${offer.quantity} ${offer.quantityUnit} à ${offer.priceEur.toFixed(2)} € (gesamt ${totalEur.toFixed(2)} €), Lieferung in ${offer.deliveryDays} Tagen. Stripe-Checkout folgt mit nächster Iteration — Status-Übergänge der Transaktion vorerst per Buttons.`,
      },
    }),
  ]);

  return NextResponse.json(
    { conversationId: conversation.id, transactionId: transaction.id },
    { status: 200 }
  );
}
