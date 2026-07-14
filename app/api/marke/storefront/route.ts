// POST /api/marke/storefront — ein Konto mit aktiver MARKE-Stufe legt fest,
// welchen Hersteller es offiziell vertritt, und pflegt den Schaufenster-Text.
// Schaltet das verifizierte Marken-Schaufenster (/manufacturers/[slug]) und
// die gekennzeichnete KSS-Wizard-Hervorhebung frei.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeTier, hasStorefront } from "@/lib/membership-tiers";

const schema = z.object({
  manufacturerId: z.string().min(1).nullable(),
  headline: z.string().max(160).optional(),
  about: z.string().max(1200).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, membershipValidUntil: true },
  });
  const tier = activeTier({
    membershipTier: user?.membershipTier ?? null,
    membershipValidUntil: user?.membershipValidUntil ?? null,
  });
  if (!hasStorefront(tier)) {
    return NextResponse.json(
      { error: "Das Marken-Schaufenster ist der Stufe Marke vorbehalten." },
      { status: 403 },
    );
  }

  // Zielhersteller prüfen (falls gesetzt)
  if (parsed.data.manufacturerId) {
    const exists = await prisma.manufacturer.findUnique({
      where: { id: parsed.data.manufacturerId },
      select: { id: true, slug: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Hersteller nicht gefunden." }, { status: 404 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        brandManufacturerId: parsed.data.manufacturerId,
        storefrontHeadline: parsed.data.headline?.trim() || null,
        about: parsed.data.about?.trim() || undefined,
      },
    });
    return NextResponse.json({ ok: true, slug: exists.slug });
  }

  // Kein Hersteller → Schaufenster deaktivieren
  await prisma.user.update({
    where: { id: session.user.id },
    data: { brandManufacturerId: null },
  });
  return NextResponse.json({ ok: true, slug: null });
}
