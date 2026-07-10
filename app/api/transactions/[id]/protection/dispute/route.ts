// POST /api/transactions/[id]/protection/dispute — Käufer meldet ein Problem
// mit der Lieferung: das geparkte Geld bleibt stehen, der Superadmin
// entscheidet unter /admin (Freigabe an Verkäufer oder Rückerstattung).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { buyerId: true, protectionStatus: true },
  });
  if (!tx) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (tx.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Nur der Käufer kann ein Problem melden." }, { status: 403 });
  }
  if (tx.protectionStatus !== "HELD") {
    return NextResponse.json({ error: "Keine geparkte Zahlung vorhanden." }, { status: 409 });
  }

  await prisma.transaction.update({
    where: { id },
    data: { protectionStatus: "DISPUTED", status: "DISPUTED" },
  });

  return NextResponse.json({ ok: true });
}
