/**
 * Tank mit einem anderen Nutzer teilen (Betreiber 2026-08-17).
 *
 * Freigegeben wird LESEND: Der Empfänger sieht die Messreihe samt Bemerkungen
 * und Bildern, kann aber nichts eintragen und nichts ändern. Angesprochen wird
 * er über sein Pseudonym — die E-Mail-Adresse bleibt wie überall verborgen.
 *
 * Widerruf jederzeit über DELETE; Betriebsdaten müssen mit einem Klick wieder
 * privat sein.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Eingabe = z.object({ pseudonym: z.string().trim().min(2).max(60) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  const { id } = await params;

  const parsed = Eingabe.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte ein Pseudonym angeben." }, { status: 400 });
  }

  const tank = await prisma.coolantTank.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!tank) return NextResponse.json({ error: "Tank nicht gefunden" }, { status: 404 });

  const empfaenger = await prisma.user.findFirst({
    where: { pseudonym: { equals: parsed.data.pseudonym, mode: "insensitive" } },
    select: { id: true, pseudonym: true },
  });
  if (!empfaenger) {
    return NextResponse.json(
      { error: "Diesen Anzeigenamen gibt es nicht. Bitte genau so schreiben wie beim Empfänger angezeigt." },
      { status: 404 },
    );
  }
  if (empfaenger.id === session.user.id) {
    return NextResponse.json({ error: "Mit dir selbst musst du nichts teilen." }, { status: 400 });
  }

  await prisma.tankFreigabe.upsert({
    where: { tankId_userId: { tankId: tank.id, userId: empfaenger.id } },
    update: {},
    create: { tankId: tank.id, ownerId: session.user.id, userId: empfaenger.id },
  });
  return NextResponse.json({ ok: true, pseudonym: empfaenger.pseudonym });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";

  const tank = await prisma.coolantTank.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!tank) return NextResponse.json({ error: "Tank nicht gefunden" }, { status: 404 });

  await prisma.tankFreigabe.deleteMany({ where: { tankId: tank.id, userId } });
  return NextResponse.json({ ok: true });
}
