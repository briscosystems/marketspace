import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kontoNebenbei } from "@/lib/konto-nebenbei";

const rfqSchema = z.object({
  productType: z.string().min(2),
  manufacturer: z.string().optional(),
  productName: z.string().trim().max(160).optional(),
  isoViscosity: z.string().optional(),
  chemistry: z.enum(["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"]).optional(),
  applicationArea: z.string().optional(),
  quantity: z.number().positive(),
  quantityUnit: z.string().default("L"),
  locationRegion: z.string().min(2),
  deadline: z.string().datetime(),
  budgetMinEur: z.number().positive().optional(),
  budgetMaxEur: z.number().positive().optional(),
  notes: z.string().optional(),
  visibility: z.enum(["PUBLIC", "VERIFIED_ONLY"]).default("PUBLIC"),
  workpieceMaterial: z.string().optional(),
  requiredCertifications: z.array(z.string()).default([]),
  avoidIssues: z.array(z.string()).default([]),
  // Nur nötig, wenn niemand angemeldet ist: Anfragen sind ohne Konto möglich.
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => null);
  const parsed = rfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, ...data } = parsed.data;

  // Angemeldet? Dann gehört die Anfrage dem Konto. Sonst reicht eine
  // E-Mail-Adresse — das Konto entsteht im Hintergrund.
  let buyerId = session?.user?.id ?? null;
  let kontoAngelegt = false;
  if (!buyerId) {
    if (!email) {
      return NextResponse.json(
        { error: "Bitte gib deine E-Mail-Adresse an — dorthin schicken wir die Antworten." },
        { status: 400 },
      );
    }
    const konto = await kontoNebenbei({
      email,
      rolle: "ENDKUNDE",
      origin: new URL(req.url).origin,
      betreff: "Brisco Marketplace — deine Anfrage ist online",
      einleitung: [
        "Danke für deine Anfrage.",
        "",
        "Wir haben dir dafür automatisch einen Zugang angelegt — damit siehst du,",
        "welche Händler dir antworten.",
      ],
    });
    buyerId = konto.userId;
    kontoAngelegt = konto.neuAngelegt;
  }

  const rfq = await prisma.rfq.create({
    data: {
      ...data,
      deadline: new Date(data.deadline),
      buyerId,
    },
  });
  return NextResponse.json({ ...rfq, kontoAngelegt }, { status: 201 });
}
