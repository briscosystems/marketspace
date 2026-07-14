import { prisma } from "@/lib/prisma";
import type { AdBanner, AdPlacement } from "@prisma/client";

// ============================================================
// Werbeplattform — Auslieferung & Rotation.
//
// Eine Anzeige ist "live", wenn sie aktiv ist und (falls gesetzt) im
// Laufzeitfenster liegt. Pro Platzierung wird bei jedem Aufruf eine der
// live-Anzeigen zufällig gewählt (einfache gleichverteilte Rotation).
// ============================================================

export const AD_PLACEMENT_LABEL: Record<AdPlacement, string> = {
  HOME: "Startseite",
  STOREFRONT: "Marken-Schaufenster",
  LISTINGS: "Angebotsübersicht",
};

/** Alle aktuell live-geschalteten Anzeigen einer Platzierung (optional auf
 *  eine Marke gefiltert — für das Schaufenster). */
export async function getLiveAds(
  placement: AdPlacement,
  manufacturerId?: string,
): Promise<AdBanner[]> {
  const now = new Date();
  return prisma.adBanner.findMany({
    where: {
      active: true,
      placements: { has: placement },
      ...(manufacturerId ? { manufacturerId } : {}),
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  });
}

/** Eine live-Anzeige für die Platzierung (zufällige Rotation) oder null. */
export async function getActiveAd(
  placement: AdPlacement,
  manufacturerId?: string,
): Promise<AdBanner | null> {
  const ads = await getLiveAds(placement, manufacturerId);
  if (ads.length === 0) return null;
  const idx = Math.floor(Math.random() * ads.length);
  return ads[idx];
}

/** Statuslabel einer Anzeige für die Verwaltung. */
export function adStatusLabel(ad: Pick<AdBanner, "active" | "startsAt" | "endsAt">): {
  label: string;
  tone: "live" | "scheduled" | "ended" | "paused";
} {
  const now = Date.now();
  if (!ad.active) return { label: "Pausiert", tone: "paused" };
  if (ad.endsAt && ad.endsAt.getTime() < now) return { label: "Abgelaufen", tone: "ended" };
  if (ad.startsAt && ad.startsAt.getTime() > now) return { label: "Geplant", tone: "scheduled" };
  return { label: "Live", tone: "live" };
}
