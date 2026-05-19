import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcTrustTier } from "@/lib/trust";

const patchSchema = z.object({
  action: z.enum(["SHIP", "COMPLETE", "CANCEL", "DISPUTE"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isBuyer = tx.buyerId === session.user.id;
  const isSeller = tx.sellerId === session.user.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const { action } = parsed.data;

  // State-machine: PENDING -> {SHIPPED, CANCELED, DISPUTED}; SHIPPED -> {COMPLETED, DISPUTED}
  let nextStatus: typeof tx.status | null = null;
  const data: Parameters<typeof prisma.transaction.update>[0]["data"] = {};

  if (action === "SHIP") {
    if (!isSeller) return NextResponse.json({ error: "Nur der Verkäufer darf versenden." }, { status: 403 });
    if (tx.status !== "PENDING") return NextResponse.json({ error: "Nur aus PENDING heraus möglich." }, { status: 409 });
    nextStatus = "SHIPPED";
    data.shippedAt = now;
  } else if (action === "COMPLETE") {
    if (!isBuyer) return NextResponse.json({ error: "Nur der Käufer darf bestätigen." }, { status: 403 });
    if (tx.status !== "PENDING" && tx.status !== "SHIPPED") {
      return NextResponse.json({ error: "Transaktion ist bereits abgeschlossen oder storniert." }, { status: 409 });
    }
    nextStatus = "COMPLETED";
    data.completedAt = now;
  } else if (action === "CANCEL") {
    if (tx.status !== "PENDING") {
      return NextResponse.json({ error: "Stornieren nur vor Versand möglich." }, { status: 409 });
    }
    nextStatus = "CANCELED";
    data.canceledAt = now;
  } else if (action === "DISPUTE") {
    if (tx.status === "COMPLETED" || tx.status === "CANCELED") {
      return NextResponse.json({ error: "Bereits abgeschlossen, Dispute nicht mehr möglich." }, { status: 409 });
    }
    nextStatus = "DISPUTED";
  }

  if (!nextStatus) {
    return NextResponse.json({ error: "Ungültiger Statusübergang." }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { ...data, status: nextStatus },
  });

  if (nextStatus === "COMPLETED") {
    await Promise.all([recalcTrustTier(tx.buyerId), recalcTrustTier(tx.sellerId)]);
  }

  return NextResponse.json(updated);
}
