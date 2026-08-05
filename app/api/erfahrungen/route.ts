/**
 * Praxis-Erfahrungen einreichen (Text oder Diktat).
 *
 * Belohnung: Credits nach Freigabe durch den Betreiber — für JEDE geprüfte
 * Erfahrung gleich, ob positiv oder negativ (alles andere wäre unlauteres
 * „Review-Gating"). Freigabe und Gutschrift laufen über den Admin-Bereich.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ERFAHRUNG_CREDITS = 2;

const schema = z.object({
  productId: z.string().optional(),
  productFreetext: z.string().max(120).optional(),
  text: z.string().min(40, "Bitte mindestens ein paar Sätze — kurze Zurufe helfen niemandem."),
  source: z.enum(["TEXT", "VOICE"]).default("TEXT"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte zuerst anmelden." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }
  const { productId, productFreetext, text, source } = parsed.data;

  // Höchstens ein offener Bericht je Produkt und Nutzer — verhindert Spam,
  // ohne ehrliche Mehrfach-Erfahrungen (nach Freigabe) zu blockieren.
  if (productId) {
    const offen = await prisma.experienceReport.findFirst({
      where: { userId: session.user.id, productId, status: "PENDING" },
      select: { id: true },
    });
    if (offen) {
      return NextResponse.json(
        { error: "Du hast zu diesem Produkt bereits einen Bericht in Prüfung." },
        { status: 409 },
      );
    }
  }

  const bericht = await prisma.experienceReport.create({
    data: {
      userId: session.user.id,
      productId: productId ?? null,
      productFreetext: productFreetext ?? null,
      text: text.trim(),
      source,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: bericht.id, credits: ERFAHRUNG_CREDITS }, { status: 201 });
}
