import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const startSchema = z.object({
  sellerId: z.string().min(1),
  listingId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { sellerId, listingId } = parsed.data;
  const buyerId = session.user.id;
  if (sellerId === buyerId) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst kontaktieren." },
      { status: 400 }
    );
  }

  const existing = await prisma.conversation.findFirst({
    where: { buyerId, sellerId, listingId: listingId ?? null },
  });
  if (existing) return NextResponse.json(existing);

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return NextResponse.json({ error: "Verkäufer nicht gefunden" }, { status: 404 });
  }

  const conversation = await prisma.conversation.create({
    data: { buyerId, sellerId, listingId: listingId ?? null },
  });
  return NextResponse.json(conversation, { status: 201 });
}
