import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  replacedProductName: z.string().trim().min(2).max(120).nullable(),
  replacedPricePerUnit: z.number().positive().max(100000).nullable(),
});

// Einsparung durch Produktwechsel erfassen — nur der KÄUFER der Transaktion
// darf das (er hat das Alternativprodukt eingesetzt). Beide Felder null =
// Einsparung wieder entfernen.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { buyerId: true },
  });
  if (!tx) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (tx.buyerId !== session.user.id) {
    return NextResponse.json(
      { error: "Nur der Käufer kann eine Einsparung erfassen." },
      { status: 403 },
    );
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      replacedProductName: parsed.data.replacedProductName,
      replacedPricePerUnit: parsed.data.replacedPricePerUnit,
    },
  });

  return NextResponse.json({ ok: true });
}
