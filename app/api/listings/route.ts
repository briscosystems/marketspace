import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettingInt } from "@/lib/credits";
import { activeTier, listingLimitFor } from "@/lib/membership-tiers";
import { kontoNebenbei } from "@/lib/konto-nebenbei";

const listingSchema = z.object({
  productType: z.string().min(2),
  manufacturer: z.string().min(1),
  productName: z.string().min(2),
  isoViscosity: z.string().optional(),
  chemistry: z.enum(["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"]),
  applicationArea: z.string().min(2),
  quantity: z.number().positive(),
  quantityUnit: z.string().default("L"),
  minOrderQty: z.number().positive().optional(),
  locationRegion: z.string().min(2),
  packaging: z.enum(["DRUM", "IBC", "TANK", "CANISTER", "BULK", "OTHER"]),
  certificates: z.array(z.string()).default([]),
  priceEur: z.number().positive().optional(),
  shippingTerms: z.string().optional(),
  description: z.string().optional(),
  productionDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  // Fertigung, Rezeptur, Automation (alle optional)
  machiningOperations: z.array(z.string()).default([]),
  mineralOilContent: z.number().min(0).max(100).optional(),
  containsGlycol: z.boolean().nullable().optional(),
  automationSuitability: z.number().int().min(0).max(5).optional(),
  measurementMethods: z.array(z.string()).default([]),
  // Nur nötig, wenn niemand angemeldet ist. Anbieten verlangt weiterhin ein
  // Konto — es entsteht aber ERST beim Absenden, damit niemand ein Formular
  // ausfüllen muss, bevor er sein Angebot eintippen darf.
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => null);
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, ...data } = parsed.data;

  // Angemeldet? Dann gehört das Angebot dem Konto. Sonst reicht die
  // E-Mail-Adresse; das Konto entsteht dabei (Rolle: Händler).
  let sellerId = session?.user?.id ?? null;
  let kontoAngelegt = false;
  if (!sellerId) {
    if (!email) {
      return NextResponse.json(
        { error: "Bitte gib deine E-Mail-Adresse an — darüber erreichen dich Kaufinteressenten." },
        { status: 400 },
      );
    }
    const konto = await kontoNebenbei({
      email,
      rolle: "RESELLER",
      origin: new URL(req.url).origin,
      betreff: "Brisco Marketplace — dein Angebot ist online",
      einleitung: [
        "Danke, dein Angebot ist veröffentlicht.",
        "",
        "Wir haben dir dafür automatisch einen Zugang angelegt. Damit kannst du",
        "Fotos ergänzen, den Preis ändern und Anfragen von Käufern beantworten.",
      ],
    });
    sellerId = konto.userId;
    kontoAngelegt = konto.neuAngelegt;
  }

  // Angebots-Limit der Stufe durchsetzen: BASIS (und Nutzer ohne aktive Stufe,
  // z.B. in der Kennenlernphase) dürfen nur eine begrenzte Zahl gleichzeitig
  // aktiver Angebote führen; Pro/Marke sind unbegrenzt.
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { membershipTier: true, membershipValidUntil: true },
  });
  const tier = activeTier({
    membershipTier: seller?.membershipTier ?? null,
    membershipValidUntil: seller?.membershipValidUntil ?? null,
  });
  const limit = listingLimitFor(tier, await getSettingInt("basisListingLimit"));
  if (limit !== null) {
    const activeCount = await prisma.listing.count({
      where: { sellerId, status: "ACTIVE" },
    });
    if (activeCount >= limit) {
      return NextResponse.json(
        {
          error: `In der Basis-Stufe sind maximal ${limit} gleichzeitig aktive Angebote möglich. Für unbegrenzte Angebote auf Pro oder Marke wechseln (siehe Mitgliedschaft).`,
          code: "LISTING_LIMIT_REACHED",
        },
        { status: 422 },
      );
    }
  }

  const listing = await prisma.listing.create({
    data: {
      ...data,
      productionDate: data.productionDate ? new Date(data.productionDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      sellerId,
    },
  });
  return NextResponse.json({ ...listing, kontoAngelegt }, { status: 201 });
}
