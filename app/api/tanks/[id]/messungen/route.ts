/**
 * Messwerte zu einem Tank erfassen.
 *
 * Bewusst tolerant: In der Werkstatt wird selten alles gemessen. Es genügt EIN
 * Wert (meist Brix), der Rest darf leer bleiben.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { konzentrationAusBrix } from "@/lib/tank-bewertung";

const MessungSchema = z
  .object({
    /**
     * Schlüssel aus dem QR-Code am Tank. Damit darf auch ohne Anmeldung
     * gemessen werden — der Aufkleber klebt an der Maschine des Betriebs,
     * und wer davor steht, soll nicht erst ein Konto anlegen müssen.
     * Der Schlüssel erlaubt ausschließlich das EINTRAGEN; gelesen wird die
     * Messreihe nur im angemeldeten Tank-Register.
     */
    token: z.string().trim().min(10).max(64).optional(),
    brix: z.number().min(0).max(30).optional().nullable(),
    concentrationPct: z.number().min(0).max(50).optional().nullable(),
    ph: z.number().min(0).max(14).optional().nullable(),
    temperatureC: z.number().min(-20).max(120).optional().nullable(),
    nitritePpm: z.number().min(0).max(500).optional().nullable(),
    bacteria: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).optional().nullable(),
    note: z.string().trim().max(2000).optional().nullable(),
    source: z.enum(["WEB", "QR", "VOICE"]).optional(),
    measuredAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (d) =>
      d.brix != null ||
      d.concentrationPct != null ||
      d.ph != null ||
      d.nitritePpm != null ||
      d.bacteria != null ||
      (d.note != null && d.note.length > 0),
    { message: "Bitte mindestens einen Messwert oder eine Bemerkung eintragen" },
  );

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = MessungSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Zwei Wege zum Tank: angemeldet (eigener Tank) oder über den Schlüssel aus
  // dem QR-Code am Tank. Beides führt zu genau einem Tank; alles andere = 404.
  const session = await getServerSession(authOptions);
  const tank = d.token
    ? await prisma.coolantTank.findFirst({
        where: { id, qrToken: d.token, archivedAt: null },
        select: { id: true, userId: true, product: { select: { refractometerFactor: true } } },
      })
    : session?.user?.id
      ? await prisma.coolantTank.findFirst({
          where: { id, userId: session.user.id },
          select: { id: true, userId: true, product: { select: { refractometerFactor: true } } },
        })
      : null;

  if (!tank) {
    return NextResponse.json(
      { error: session?.user?.id || d.token ? "Tank nicht gefunden" : "Nicht angemeldet" },
      { status: session?.user?.id || d.token ? 404 : 401 },
    );
  }

  // Konzentration aus Brix ableiten, wenn sie nicht direkt gemessen wurde und
  // für das Produkt ein Refraktometer-Faktor hinterlegt ist.
  const konz =
    d.concentrationPct ?? konzentrationAusBrix(d.brix ?? null, tank.product?.refractometerFactor ?? null);

  const m = await prisma.tankMeasurement.create({
    data: {
      tankId: tank.id,
      // Beim QR-Weg gibt es keine Anmeldung — die Messung wird dem Betrieb
      // zugeschrieben, dem der Tank gehört.
      userId: session?.user?.id ?? tank.userId,
      measuredAt: d.measuredAt ? new Date(d.measuredAt) : new Date(),
      brix: d.brix ?? null,
      concentrationPct: konz,
      ph: d.ph ?? null,
      temperatureC: d.temperatureC ?? null,
      nitritePpm: d.nitritePpm ?? null,
      bacteria: d.bacteria ?? null,
      note: d.note || null,
      source: d.source ?? "WEB",
    },
    select: { id: true, concentrationPct: true },
  });

  // Die gerechnete Konzentration kommt mit zurück: Der Mischungsrechner
  // übernimmt sie direkt, ohne den Refraktometer-Faktor selbst anzuwenden
  // (Betreiber 2026-08-19).
  return NextResponse.json(
    { ok: true, id: m.id, messung: { concentrationPct: m.concentrationPct } },
    { status: 201 },
  );
}
