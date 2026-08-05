/**
 * Selbstverwaltung der API-Schlüssel (Mitgliedschaftsseite).
 *
 * Anlegen nur mit aktiver Marke-Stufe; Widerruf jederzeit. Der Klartext-
 * Schlüssel wird genau EINMAL zurückgegeben und nirgends gespeichert.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/api-auth";
import { activeTier } from "@/lib/membership-tiers";

const MAX_SCHLUESSEL = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, membershipValidUntil: true, blockedAt: true },
  });
  if (!user || user.blockedAt) {
    return NextResponse.json({ error: "Konto gesperrt." }, { status: 403 });
  }
  if (activeTier(user) !== "MARKE") {
    return NextResponse.json(
      { error: "API-Schlüssel stehen nur Konten mit aktiver Marke-Stufe offen." },
      { status: 403 },
    );
  }

  const anzahl = await prisma.apiKey.count({
    where: { userId: session.user.id, revokedAt: null },
  });
  if (anzahl >= MAX_SCHLUESSEL) {
    return NextResponse.json(
      { error: `Maximal ${MAX_SCHLUESSEL} aktive Schlüssel — widerrufe zuerst einen.` },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = (body?.name ?? "").trim().slice(0, 60) || "API-Schlüssel";

  const klartext = generateApiKey();
  const key = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      keyHash: hashApiKey(klartext),
      prefix: klartext.slice(0, 12),
    },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });
  // Klartext genau einmal — danach existiert nur noch der Hash.
  return NextResponse.json({ ...key, schluessel: klartext }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Schlüssel-ID fehlt." }, { status: 400 });
  const r = await prisma.apiKey.updateMany({
    where: { id: body.id, userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (r.count === 0) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
