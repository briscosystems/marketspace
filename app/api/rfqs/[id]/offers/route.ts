import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const offerSchema = z.object({
  priceEur: z.number().positive(),
  quantity: z.number().positive(),
  quantityUnit: z.string().default("L"),
  deliveryDays: z.number().int().positive(),
  notes: z.string().optional(),
  alternativeProduct: z.string().optional(),
  alternativeReason: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const rfq = await prisma.rfq.findUnique({ where: { id } });
  if (!rfq) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rfq.buyerId === session.user.id) {
    return NextResponse.json(
      { error: "Du kannst nicht auf deine eigene Anfrage bieten." },
      { status: 400 }
    );
  }
  if (rfq.status !== "OPEN") {
    return NextResponse.json(
      { error: "Anfrage ist bereits geschlossen." },
      { status: 409 }
    );
  }
  if (rfq.deadline.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Frist ist abgelaufen." },
      { status: 409 }
    );
  }
  if (rfq.visibility === "VERIFIED_ONLY") {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { trustTier: true },
    });
    if (!me || me.trustTier === "UNVERIFIED") {
      return NextResponse.json(
        { error: "Nur Verified+ Reseller dürfen auf diese Anfrage bieten." },
        { status: 403 }
      );
    }
  }

  const offer = await prisma.rfqOffer.upsert({
    where: { rfqId_sellerId: { rfqId: id, sellerId: session.user.id } },
    update: { ...parsed.data, status: "PENDING" },
    create: { ...parsed.data, rfqId: id, sellerId: session.user.id },
  });
  return NextResponse.json(offer, { status: 201 });
}
