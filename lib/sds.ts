import type { SafetyDataSheet, Listing } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SDS_CATEGORY_LABEL: Record<string, string> = {
  WATER_MISCIBLE_COOLANT: "Wassermischbarer KSS",
  NEAT_CUTTING_OIL: "Schneidöl (nicht-wassermischbar)",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  MOTOR_OIL: "Motoröl",
  GREASE: "Schmierfett",
  OTHER: "Sonstiges",
};

export const SDS_LANGUAGE_LABEL: Record<string, string> = {
  DE: "Deutsch",
  EN: "English",
  FR: "Français",
  IT: "Italiano",
  OTHER: "—",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function manufacturerAliases(name: string): string[] {
  const n = normalize(name);
  if (n.includes("laemmle") || n.includes("panolin")) return ["laemmle", "panolin"];
  return [n];
}

function tokens(s: string): string[] {
  return normalize(s).split(" ").filter((t) => t.length >= 2);
}

export function scoreSds(
  listing: Pick<Listing, "manufacturer" | "productName">,
  sds: Pick<SafetyDataSheet, "manufacturer" | "productName">,
): number {
  const lMan = manufacturerAliases(listing.manufacturer);
  const sMan = manufacturerAliases(sds.manufacturer);
  const manufacturerMatch = lMan.some((a) => sMan.some((b) => a === b || a.includes(b) || b.includes(a)));
  if (!manufacturerMatch) return 0;

  const lTokens = new Set(tokens(listing.productName));
  const sTokens = new Set(tokens(sds.productName));
  if (lTokens.size === 0 || sTokens.size === 0) return manufacturerMatch ? 1 : 0;

  let overlap = 0;
  for (const t of lTokens) if (sTokens.has(t)) overlap++;

  return overlap === 0 ? 1 : 10 + overlap;
}

export async function findMatchingSds(
  listing: Pick<Listing, "manufacturer" | "productName" | "sdsId">,
  limit = 5,
): Promise<SafetyDataSheet[]> {
  if (listing.sdsId) {
    const linked = await prisma.safetyDataSheet.findUnique({ where: { id: listing.sdsId } });
    if (linked) return [linked];
  }

  const aliases = manufacturerAliases(listing.manufacturer);
  const candidates = await prisma.safetyDataSheet.findMany({
    where: {
      OR: aliases.map((a) => ({ manufacturer: { contains: a, mode: "insensitive" } })),
    },
    take: 50,
  });

  return candidates
    .map((s) => ({ s, score: scoreSds(listing, s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}
