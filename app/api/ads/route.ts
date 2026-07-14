// POST /api/ads — neue Anzeige anlegen (nur aktive Marke-Mitglieder/Admin).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeTier, hasStorefront } from "@/lib/membership-tiers";

const PLACEMENTS = ["HOME", "STOREFRONT", "LISTINGS"] as const;

export const adSchema = z.object({
  eyebrow: z.string().max(80).optional().nullable(),
  headline: z.string().min(2).max(120),
  chips: z.array(z.string().min(1).max(60)).max(4).default([]),
  // Bild: data:-URI (Upload) oder ausgelieferter Pfad. Größe begrenzt.
  image: z
    .string()
    .min(1)
    .max(1_400_000)
    .refine((s) => s.startsWith("data:image/") || s.startsWith("/"), "Ungültiges Bild"),
  ctaLabel: z.string().max(40).optional().nullable(),
  ctaUrl: z.string().url().max(300),
  origin: z.string().max(60).optional().nullable(),
  placements: z.array(z.enum(PLACEMENTS)).min(1),
  active: z.boolean().default(false),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

/** Zugriff: aktives Marke-Abo ODER Admin. Gibt {userId, isAdmin, brandId} oder null. */
export async function requireAdManager(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, membershipTier: true, membershipValidUntil: true, brandManufacturerId: true },
  });
  if (!user) return null;
  const isAdmin = user.role === "ADMIN";
  const isMarke = hasStorefront(
    activeTier({ membershipTier: user.membershipTier, membershipValidUntil: user.membershipValidUntil }),
  );
  if (!isAdmin && !isMarke) return null;
  return { isAdmin, brandId: user.brandManufacturerId };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const access = await requireAdManager(session.user.id);
  if (!access) {
    return NextResponse.json(
      { error: "Werbeanzeigen sind der Stufe Marke vorbehalten." },
      { status: 403 },
    );
  }

  const parsed = adSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const ad = await prisma.adBanner.create({
    data: {
      ownerId: session.user.id,
      manufacturerId: access.brandId, // Anzeige mit der eigenen Marke verknüpfen
      eyebrow: d.eyebrow?.trim() || null,
      headline: d.headline.trim(),
      chips: d.chips.map((c) => c.trim()).filter(Boolean),
      image: d.image,
      ctaLabel: d.ctaLabel?.trim() || "Mehr erfahren",
      ctaUrl: d.ctaUrl.trim(),
      origin: d.origin?.trim() || null,
      placements: d.placements,
      active: d.active,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
    },
  });
  return NextResponse.json({ id: ad.id }, { status: 201 });
}
