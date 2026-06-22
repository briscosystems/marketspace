import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcTrustTier } from "@/lib/trust";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  tags: z
    .array(z.enum(["FAST_RESPONSE", "QUALITY_AS_DESCRIBED", "ON_TIME_DELIVERY", "FAIR_NEGOTIATION"]))
    .default([]),
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
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (tx.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Bewertung nur nach abgeschlossener Transaktion möglich." },
      { status: 409 }
    );
  }
  const isBuyer = tx.buyerId === session.user.id;
  const isSeller = tx.sellerId === session.user.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const revieweeId = isBuyer ? tx.sellerId : tx.buyerId;

  const review = await prisma.review.upsert({
    where: {
      transactionId_reviewerId: { transactionId: id, reviewerId: session.user.id },
    },
    update: parsed.data,
    create: {
      transactionId: id,
      reviewerId: session.user.id,
      revieweeId,
      ...parsed.data,
    },
  });

  await recalcTrustTier(revieweeId);

  return NextResponse.json(review, { status: 201 });
}
