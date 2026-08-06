/**
 * Tank-Register: Anlegen und Auflisten von Tanks.
 *
 * Messwerte sind Betriebsdaten — jeder Zugriff ist an den angemeldeten Nutzer
 * gebunden, es gibt keinen öffentlichen Lesepfad.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TankSchema = z.object({
  name: z.string().trim().min(2, "Bitte einen Namen angeben").max(80),
  machine: z.string().trim().max(120).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  volumeLiters: z.number().positive().max(1_000_000).optional().nullable(),
  productId: z.string().trim().min(1).optional().nullable(),
  productFreetext: z.string().trim().max(160).optional().nullable(),
  waterHardnessDh: z.number().min(0).max(200).optional().nullable(),
  filledAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const tanks = await prisma.coolantTank.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, manufacturer: { select: { name: true } } } },
      measurements: { orderBy: { measuredAt: "desc" }, take: 1 },
    },
  });
  return NextResponse.json({ tanks });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const parsed = TankSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Produkt muss existieren, sonst lieber als Freitext führen.
  let productId: string | null = d.productId ?? null;
  if (productId) {
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!p) productId = null;
  }

  const tank = await prisma.coolantTank.create({
    data: {
      userId: session.user.id,
      name: d.name,
      machine: d.machine || null,
      location: d.location || null,
      volumeLiters: d.volumeLiters ?? null,
      productId,
      productFreetext: productId ? null : d.productFreetext || null,
      waterHardnessDh: d.waterHardnessDh ?? null,
      filledAt: d.filledAt ? new Date(d.filledAt) : null,
      notes: d.notes || null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: tank.id }, { status: 201 });
}
