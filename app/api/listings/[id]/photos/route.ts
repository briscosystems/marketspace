/**
 * Fotos zu einem Angebot hochladen und verwalten.
 *
 * Der Browser des Anbieters verkleinert die Aufnahme vorher (siehe
 * components/ListingPhotoUpload.tsx) und schickt sie als Data-URL. Serverseitig
 * wird nur noch geprüft, begrenzt und gespeichert — bewusst ohne Bildbibliothek,
 * damit der Server schlank bleibt.
 *
 * Nur der Eigentümer des Angebots darf hochladen oder löschen.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { MAX_FOTOS } from "@/lib/listing-photos";
const MAX_BYTES = 1_500_000; // 1,5 MB pro Bild nach dem Verkleinern — großzügig
const ERLAUBT = new Set(["image/jpeg", "image/png", "image/webp"]);

function ausDataUrl(dataUrl: string): { mime: string; bytes: Buffer } | null {
  const m = /^data:([a-z/+.-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!ERLAUBT.has(mime)) return null;
  try {
    return { mime, bytes: Buffer.from(m[2], "base64") };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte zuerst anmelden." }, { status: 401 });
  }
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, sellerId: true, _count: { select: { photos: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Angebot nicht gefunden." }, { status: 404 });
  if (listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Das ist nicht dein Angebot." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    fotos?: { bild: string; vorschau?: string; breite?: number; hoehe?: number }[];
  } | null;
  const eingang = body?.fotos ?? [];
  if (eingang.length === 0) {
    return NextResponse.json({ error: "Kein Bild erhalten." }, { status: 400 });
  }

  const frei = MAX_FOTOS - listing._count.photos;
  if (frei <= 0) {
    return NextResponse.json(
      { error: `Mehr als ${MAX_FOTOS} Fotos je Angebot sind nicht möglich.` },
      { status: 409 },
    );
  }

  const letzte = await prisma.listingPhoto.findFirst({
    where: { listingId: id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let position = (letzte?.position ?? -1) + 1;

  const angelegt: string[] = [];
  for (const f of eingang.slice(0, frei)) {
    const bild = ausDataUrl(f.bild ?? "");
    if (!bild) continue;
    if (bild.bytes.length > MAX_BYTES) continue;
    const vorschau = f.vorschau ? ausDataUrl(f.vorschau) : null;
    const sha256 = crypto.createHash("sha256").update(bild.bytes).digest("hex");

    // Dasselbe Bild nicht zweimal am selben Angebot.
    const schonDa = await prisma.listingPhoto.findFirst({
      where: { listingId: id, sha256 },
      select: { id: true },
    });
    if (schonDa) continue;

    const foto = await prisma.listingPhoto.create({
      data: {
        listingId: id,
        position: position++,
        mimeType: bild.mime,
        width: f.breite ?? null,
        height: f.hoehe ?? null,
        data: new Uint8Array(bild.bytes),
        thumb: vorschau ? new Uint8Array(vorschau.bytes) : null,
        bytesSize: bild.bytes.length,
        sha256,
      },
      select: { id: true },
    });
    angelegt.push(foto.id);
  }

  if (angelegt.length === 0) {
    return NextResponse.json(
      { error: "Kein Bild konnte gespeichert werden (Format oder Größe)." },
      { status: 400 },
    );
  }
  return NextResponse.json({ angelegt, gesamt: listing._count.photos + angelegt.length });
}

/** Reihenfolge ändern — Position 0 ist das Titelbild. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!listing) return NextResponse.json({ error: "Angebot nicht gefunden." }, { status: 404 });
  if (listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Das ist nicht dein Angebot." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { reihenfolge?: string[] } | null;
  const ids = body?.reihenfolge ?? [];
  if (ids.length === 0) return NextResponse.json({ error: "Keine Reihenfolge." }, { status: 400 });

  await prisma.$transaction(
    ids.map((fotoId, i) =>
      prisma.listingPhoto.updateMany({
        where: { id: fotoId, listingId: id },
        data: { position: i },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
