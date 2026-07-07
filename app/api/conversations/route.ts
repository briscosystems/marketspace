import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const startSchema = z.object({
  sellerId: z.string().min(1),
  listingId: z.string().optional(),
  // Optionale Erstnachricht — genutzt von "Muster anfordern" / "Angebot anfragen",
  // damit der Thread direkt mit der strukturierten Anfrage beginnt.
  initialMessage: z.string().trim().min(1).max(2000).optional(),
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
  const { sellerId, listingId, initialMessage } = parsed.data;
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
  if (existing) {
    if (initialMessage) {
      await prisma.message.create({
        data: { conversationId: existing.id, senderId: buyerId, body: initialMessage },
      });
    }
    return NextResponse.json(existing);
  }

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return NextResponse.json({ error: "Verkäufer nicht gefunden" }, { status: 404 });
  }

  const conversation = await prisma.conversation.create({
    data: { buyerId, sellerId, listingId: listingId ?? null },
  });
  if (initialMessage) {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderId: buyerId, body: initialMessage },
    });
  }
  return NextResponse.json(conversation, { status: 201 });
}
