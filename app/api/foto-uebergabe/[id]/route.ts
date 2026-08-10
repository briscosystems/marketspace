/**
 * Foto-Übergabe — Schritt 2 (Handy lädt hoch) und Schritt 3 (Rechner holt ab).
 *
 * POST: Das Handy schickt das Foto. **Ohne Anmeldung** — der Nutzer hat den
 * QR-Code gerade eben am eigenen Rechner erzeugt und mit dem eigenen Handy
 * gescannt; ihn dort noch einmal anmelden zu lassen wäre genau die Hürde, die
 * diese Funktion beseitigen soll. Der Schutz liegt in der Adresse selbst:
 * kurzlebig (15 Minuten), nicht erratbar, genau ein Bild.
 *
 * GET: Der Rechner fragt im Sekundentakt nach. Sobald ein Bild da ist, gibt er
 * es einmal heraus und der Briefkasten wird geleert — das Bild liegt danach
 * nicht weiter in der Datenbank herum.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Bild = z.object({
  bild: z.string().startsWith("data:image/").max(8_000_000),
});

/** Handy → Plattform. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const uebergabe = await prisma.photoHandoff.findUnique({
    where: { id },
    select: { id: true, expiresAt: true, uploadedAt: true },
  });
  if (!uebergabe) {
    return NextResponse.json({ error: "Diese Übergabe gibt es nicht." }, { status: 404 });
  }
  if (uebergabe.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Der Code ist abgelaufen. Bitte am Rechner einen neuen erzeugen." },
      { status: 410 },
    );
  }
  if (uebergabe.uploadedAt) {
    return NextResponse.json(
      { error: "Für diesen Code wurde schon ein Foto geschickt." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = Bild.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte ein Foto mitschicken" }, { status: 400 });
  }
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(parsed.data.bild)) {
    return NextResponse.json({ error: "Nur JPEG, PNG oder WebP" }, { status: 400 });
  }

  await prisma.photoHandoff.update({
    where: { id },
    data: { imageData: parsed.data.bild, uploadedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

/** Plattform → Rechner (Abholen). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }
  const { id } = await params;

  const uebergabe = await prisma.photoHandoff.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, imageData: true, expiresAt: true, uploadedAt: true, fetchedAt: true },
  });
  if (!uebergabe) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (uebergabe.expiresAt < new Date()) {
    return NextResponse.json({ status: "abgelaufen" });
  }
  if (!uebergabe.imageData) {
    // Nach dem Abholen ist der Briefkasten leer — das ist kein „wartet" mehr.
    return NextResponse.json({ status: uebergabe.fetchedAt ? "abgeholt" : "wartet" });
  }

  // Einmal herausgeben, dann den Briefkasten leeren.
  await prisma.photoHandoff.update({
    where: { id },
    data: { imageData: null, fetchedAt: new Date() },
  });
  return NextResponse.json({ status: "fertig", bild: uebergabe.imageData });
}
