import { prisma } from "@/lib/prisma";

// ============================================================
// Marke-Stufe: Hersteller-Schaufenster & gesponserte Platzierung.
//
// Ein Hersteller gilt als "gesponsert", sobald ein Konto mit AKTIVER
// MARKE-Stufe ihn offiziell vertritt (User.brandManufacturerId +
// membershipTier=MARKE + membershipValidUntil in der Zukunft). Daraus leiten
// sich das öffentliche Schaufenster (/marke/[slug]) und die gekennzeichnete
// Hervorhebung im KSS-Wizard ab — beides P2B-VO-konform sichtbar gemacht.
// ============================================================

/** IDs aller Hersteller mit einem aktiven Marke-Vertreter. */
export async function sponsoredManufacturerIds(): Promise<Set<string>> {
  const reps = await prisma.user.findMany({
    where: {
      membershipTier: "MARKE",
      membershipValidUntil: { gt: new Date() },
      brandManufacturerId: { not: null },
    },
    select: { brandManufacturerId: true },
  });
  return new Set(reps.map((r) => r.brandManufacturerId!).filter(Boolean));
}

export type StorefrontData = {
  manufacturer: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    website: string | null;
    logoPath: string | null;
    knownForApplications: string[];
    productFamilies: string[];
  };
  headline: string | null;
  about: string | null;
  repPseudonym: string;
};

/**
 * Schaufenster-Daten für einen Hersteller — nur wenn ein aktiver
 * Marke-Vertreter existiert. Sonst null (Seite → 404).
 */
export async function storefrontForManufacturerSlug(slug: string): Promise<StorefrontData | null> {
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      logoPath: true,
      knownForApplications: true,
      productFamilies: true,
    },
  });
  if (!manufacturer) return null;

  const rep = await prisma.user.findFirst({
    where: {
      brandManufacturerId: manufacturer.id,
      membershipTier: "MARKE",
      membershipValidUntil: { gt: new Date() },
    },
    select: { pseudonym: true, storefrontHeadline: true, about: true },
    orderBy: { membershipValidUntil: "desc" },
  });
  if (!rep) return null;

  return {
    manufacturer,
    headline: rep.storefrontHeadline,
    about: rep.about,
    repPseudonym: rep.pseudonym,
  };
}
