"use server";

import { prisma } from "@/lib/prisma";
import { analyzeListings, type AnalysisResult } from "@/lib/comparison-analysis";

/**
 * Server Action: analysiert die übergebenen Listings und liefert ein
 * strukturiertes Vergleichs-Bewertungs-Objekt zurück.
 *
 * - Mind. 2 IDs nötig.
 * - Alle Listings müssen denselben productType haben (sonst Fehler).
 * - Result wird in der DB gecacht über sha256 der sortierten IDs.
 */
export async function runComparisonAnalysis(
  listingIds: string[],
): Promise<{ ok: true; result: AnalysisResult } | { ok: false; error: string }> {
  if (listingIds.length < 2) {
    return { ok: false, error: "Mindestens 2 Listings nötig." };
  }
  if (listingIds.length > 6) {
    return { ok: false, error: "Maximal 6 Listings auf einmal." };
  }

  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
  });

  if (listings.length !== listingIds.length) {
    return { ok: false, error: "Mindestens ein Listing wurde nicht gefunden." };
  }

  const productTypes = new Set(listings.map((l) => l.productType));
  if (productTypes.size > 1) {
    return {
      ok: false,
      error:
        "Vergleich nicht sinnvoll: unterschiedliche Produkttypen (" +
        Array.from(productTypes).join(", ") +
        "). Bitte vorher per Filter auf eine Kategorie eingrenzen.",
    };
  }

  try {
    const result = await analyzeListings(listings);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
