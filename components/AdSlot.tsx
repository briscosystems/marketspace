import type { AdPlacement } from "@prisma/client";
import { getActiveAd } from "@/lib/ads";
import { AdBannerView } from "@/components/AdBannerView";

// Server-Slot: lädt eine live-Anzeige für die Platzierung und zeigt sie
// klar gekennzeichnet als "Anzeige" (P2B-VO). Gibt es keine Anzeige, wird
// nichts gerendert (der Platz verschwindet).
export async function AdSlot({
  placement,
  manufacturerId,
}: {
  placement: AdPlacement;
  manufacturerId?: string;
}) {
  const ad = await getActiveAd(placement, manufacturerId);
  if (!ad) return null;

  return (
    <section aria-label="Anzeige">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Anzeige
      </div>
      <AdBannerView
        ad={{
          eyebrow: ad.eyebrow,
          headline: ad.headline,
          chips: ad.chips,
          image: ad.image,
          ctaLabel: ad.ctaLabel,
          ctaUrl: ad.ctaUrl,
          origin: ad.origin,
        }}
      />
    </section>
  );
}
