/**
 * Neues Produkt melden — wenn das angebotene Produkt noch nicht im Katalog steht.
 *
 * Regeln (Betreiber 2026-08-11):
 *  - **Datenblatt UND Sicherheitsdatenblatt sind Pflicht.** Ohne Beleg kommt
 *    nichts in den Katalog; genau daran ist die frühere automatische
 *    Anreicherung gescheitert (53 erfundene Produkte, Prüfung 2026-08-05).
 *  - Der Melder bestätigt ausdrücklich **zweierlei**: dass die Angaben stimmen
 *    und dass die Plattform die Unterlagen verwenden darf.
 *  - Nichts erscheint automatisch. Jede Meldung landet im Admin-Bereich und
 *    wird von Hand freigegeben.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Erlaubt sind PDF und Bilder — mehr braucht ein Datenblatt nicht. */
const DATEI = z
  .string()
  .regex(/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/, "Nur PDF, JPEG, PNG oder WebP")
  .max(6_000_000, "Datei zu groß (max. ca. 4 MB)");

const Meldung = z.object({
  name: z.string().trim().min(2).max(160),
  manufacturer: z.string().trim().min(2).max(120),
  productType: z.string().trim().min(2).max(120),
  chemistry: z.string().trim().max(60).optional(),
  isoViscosity: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
  sdsFile: DATEI,
  sdsFileName: z.string().trim().min(1).max(200),
  tdsFile: DATEI,
  tdsFileName: z.string().trim().min(1).max(200),
  confirmedAccurate: z.literal(true, {
    errorMap: () => ({ message: "Bitte bestätige, dass die Angaben stimmen." }),
  }),
  consentToUse: z.literal(true, {
    errorMap: () => ({ message: "Bitte bestätige, dass wir die Unterlagen verwenden dürfen." }),
  }),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = Meldung.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Bitte alle Pflichtfelder ausfüllen." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Steht das Produkt inzwischen doch schon im Katalog? Dann melden wir es
  // nicht noch einmal — der Anbieter kann es einfach auswählen.
  const vorhanden = await prisma.product.findFirst({
    where: {
      name: { equals: d.name, mode: "insensitive" },
      manufacturer: { name: { contains: d.manufacturer.split(/\s+/)[0], mode: "insensitive" } },
    },
    select: { id: true, name: true, manufacturer: { select: { name: true } } },
  });
  if (vorhanden) {
    return NextResponse.json(
      {
        error: `Dieses Produkt steht bereits im Katalog: ${vorhanden.manufacturer.name} ${vorhanden.name}. Bitte oben auswählen.`,
        vorhandenId: vorhanden.id,
      },
      { status: 409 },
    );
  }

  const offen = await prisma.productSubmission.findFirst({
    where: { userId: session.user.id, name: { equals: d.name, mode: "insensitive" }, status: "PENDING" },
    select: { id: true },
  });
  if (offen) {
    return NextResponse.json(
      { error: "Für dieses Produkt liegt schon eine Meldung von dir zur Prüfung vor." },
      { status: 409 },
    );
  }

  const meldung = await prisma.productSubmission.create({
    data: {
      userId: session.user.id,
      name: d.name,
      manufacturer: d.manufacturer,
      productType: d.productType,
      chemistry: d.chemistry || null,
      isoViscosity: d.isoViscosity || null,
      notes: d.notes || null,
      sdsFile: d.sdsFile,
      sdsFileName: d.sdsFileName,
      tdsFile: d.tdsFile,
      tdsFileName: d.tdsFileName,
      confirmedAccurate: true,
      consentToUse: true,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: meldung.id }, { status: 201 });
}
