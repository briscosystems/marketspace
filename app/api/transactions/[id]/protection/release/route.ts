// POST /api/transactions/[id]/protection/release — Käufer bestätigt die
// Lieferung: geparktes Geld wird an den Verkäufer überwiesen und die
// Transaktion als abgeschlossen markiert.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseProtection } from "@/lib/protection-flow";
import { recalcTrustTier } from "@/lib/trust";
import { capturePriceFromTransaction } from "@/lib/transaction-price-capture";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { buyerId: true, sellerId: true, protectionStatus: true, status: true },
  });
  if (!tx) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (tx.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Nur der Käufer kann die Lieferung bestätigen." }, { status: 403 });
  }
  if (tx.protectionStatus !== "HELD") {
    return NextResponse.json({ error: "Keine geparkte Zahlung zum Freigeben." }, { status: 409 });
  }

  const result = await releaseProtection(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Lieferbestätigung schließt zugleich die Transaktion ab
  if (tx.status !== "COMPLETED") {
    await prisma.transaction.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await Promise.all([
      recalcTrustTier(tx.buyerId),
      recalcTrustTier(tx.sellerId),
      capturePriceFromTransaction(id),
    ]);
  }

  return NextResponse.json({ ok: true });
}
