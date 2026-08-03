/**
 * Liefert ein Angebots-Foto aus und löscht es auf Wunsch des Eigentümers.
 *
 * GET  /api/listing-photos/<id>          → Anzeigegröße
 * GET  /api/listing-photos/<id>?v=klein  → Vorschau für Karten und Listen
 *
 * Bilder sind öffentlich abrufbar (wie das Angebot selbst) und werden lange
 * zwischengespeichert — die ID ändert sich, wenn ein neues Bild hochgeladen wird.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params;
  const klein = req.nextUrl.searchParams.get("v") === "klein";

  const foto = await prisma.listingPhoto.findUnique({
    where: { id: photoId },
    select: { data: !klein, thumb: klein, mimeType: true },
  });
  if (!foto) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Kein Vorschaubild vorhanden (ältere Uploads) → große Fassung ausliefern.
  let bytes = (klein ? foto.thumb : foto.data) as Buffer | null;
  if (!bytes) {
    const gross = await prisma.listingPhoto.findUnique({
      where: { id: photoId },
      select: { data: true },
    });
    bytes = (gross?.data as Buffer) ?? null;
  }
  if (!bytes) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": foto.mimeType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { photoId } = await params;

  const foto = await prisma.listingPhoto.findUnique({
    where: { id: photoId },
    select: { id: true, listing: { select: { sellerId: true } } },
  });
  if (!foto) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  if (foto.listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Das ist nicht dein Angebot." }, { status: 403 });
  }

  await prisma.listingPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
