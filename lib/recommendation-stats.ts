/**
 * Zählt Produkt-Empfehlungen (Wizard, KI-Analyse, Alternativsuche) für die
 * Admin-Statistik "welche Hersteller profitieren von unseren Empfehlungen".
 *
 * Fire-and-forget: wird NICHT awaited-kritisch eingesetzt und darf nie werfen —
 * ein Statistik-Ausfall darf niemals eine Empfehlung blockieren.
 */
import { prisma } from "@/lib/prisma";

export function recordRecommendations(args: {
  productIds: string[];
  /** "kss_wizard" | "alt_search" */
  feature: string;
  /** "anthropic-claude" | "heuristic-fallback" | "rule-based" | "claude-web" */
  source?: string;
}): void {
  const ids = [...new Set(args.productIds)].filter(Boolean);
  if (ids.length === 0) return;

  void (async () => {
    try {
      // Hersteller-Zuordnung einmal auflösen, damit die Statistik direkt
      // nach Hersteller gruppieren kann.
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, manufacturerId: true },
      });
      const byId = new Map(products.map((p) => [p.id, p.manufacturerId]));
      await prisma.recommendationEvent.createMany({
        data: ids.map((productId) => ({
          productId,
          manufacturerId: byId.get(productId) ?? null,
          feature: args.feature,
          source: args.source ?? null,
        })),
      });
    } catch (e) {
      console.warn("[recommendation-stats] Zählung fehlgeschlagen (ignoriert):", e);
    }
  })();
}
