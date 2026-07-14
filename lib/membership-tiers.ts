import type { MembershipTier } from "@prisma/client";
import { getSettingInt, type SettingKey } from "@/lib/credits";
import { isMembershipActive } from "@/lib/membership";

// ============================================================
// Preisstufen (Basis / Pro / Marke) — Metadaten, Preise, Freischaltung.
//
// Geschäftsmodell (GTM-Konzept 07/2026): ein Einheitspreis lässt bei aktiven
// Vielhändlern und Herstellern Erlös liegen. Drei Stufen holen die
// Zahlungsbereitschaft ab; die Marke-Stufe erschließt die bisher ungenutzte
// Herstellerseite (eigenes Schaufenster + gesponserte KSS-Wizard-Platzierung).
// ============================================================

export const TIER_ORDER: MembershipTier[] = ["BASIS", "PRO", "MARKE"];

/** Reihenfolge der Stufen als Rang (für "höher/gleich"-Vergleiche). */
export function tierRank(tier: MembershipTier): number {
  return TIER_ORDER.indexOf(tier);
}

const TIER_SETTING_KEY: Record<MembershipTier, SettingKey> = {
  BASIS: "membershipPriceEur",
  PRO: "membershipPriceProEur",
  MARKE: "membershipPriceMarkeEur",
};

export type TierMeta = {
  tier: MembershipTier;
  name: string;
  audience: string;
  featured?: boolean;
  /** Kurz-Nutzen für die Preiskarte. */
  features: string[];
};

/** Anzeige-Metadaten der Stufen (Preise kommen aus den Einstellungen). */
export const TIER_META: Record<MembershipTier, TierMeta> = {
  BASIS: {
    tier: "BASIS",
    name: "Basis",
    audience: "Für Reseller",
    features: [
      "Voller Zugang zur Wissens-Datenbank",
      "Bis zu 10 aktive Angebote",
      "Suchen & Anfragen unbegrenzt",
      "Käuferschutz nutzbar",
    ],
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    audience: "Für aktive Händler",
    featured: true,
    features: [
      "Alles aus Basis",
      "Unbegrenzte Angebote",
      "Bevorzugte Platzierung in der Suche",
      "Umsatz- & Einsparungs-Analysen",
    ],
  },
  MARKE: {
    tier: "MARKE",
    name: "Marke",
    audience: "Für OEM & Hersteller",
    features: [
      "Eigenes Marken-Schaufenster",
      "Gesponserte Alternative im KSS-Wizard (gekennzeichnet)",
      "Anfragen zu eigenen Produkten als Leads",
      "Alles aus Pro",
    ],
  },
};

/** Jahrespreis (EUR) einer Stufe aus den Superadmin-Einstellungen. */
export async function getTierPriceEur(tier: MembershipTier): Promise<number> {
  return getSettingInt(TIER_SETTING_KEY[tier]);
}

/** Alle drei Jahrespreise (EUR) auf einmal. */
export async function getTierPrices(): Promise<Record<MembershipTier, number>> {
  const [basis, pro, marke] = await Promise.all([
    getSettingInt("membershipPriceEur"),
    getSettingInt("membershipPriceProEur"),
    getSettingInt("membershipPriceMarkeEur"),
  ]);
  return { BASIS: basis, PRO: pro, MARKE: marke };
}

/** Stripe-Produktname/-beschreibung je Stufe (für den Checkout). */
export function tierProduct(tier: MembershipTier): { name: string; description: string } {
  const m = TIER_META[tier];
  return {
    name: `Brisco — Jahres-Abo ${m.name}`,
    description:
      "Jährlich kündbares Abo für den Zugang zur Brisco-Plattform. Verlängert sich automatisch, sofern nicht vorher gekündigt.",
  };
}

// ---------- Funktions-Freischaltung ----------

/**
 * Wirksame Stufe eines Nutzers: nur solange das Abo aktiv ist. Ohne aktives
 * Abo (abgelaufen/nie gebucht) gilt keine Stufe — die gebuchte `membershipTier`
 * bleibt zwar gespeichert, ist aber wirkungslos.
 */
export function activeTier(user: {
  membershipTier: MembershipTier | null;
  membershipValidUntil: Date | null;
}): MembershipTier | null {
  return isMembershipActive(user.membershipValidUntil) ? user.membershipTier : null;
}

/** Angebots-Limit einer Stufe. null = unbegrenzt (Pro/Marke). */
export function listingLimitFor(tier: MembershipTier | null, basisLimit: number): number | null {
  if (tier === "PRO" || tier === "MARKE") return null;
  return basisLimit; // BASIS oder keine Stufe → Limit
}

/** Bevorzugte Platzierung in Suche/Vorschlägen (Pro und Marke). */
export function hasPriorityPlacement(tier: MembershipTier | null): boolean {
  return tier === "PRO" || tier === "MARKE";
}

/** Umsatz-/Einsparungs-Analysen (Pro und Marke). */
export function hasAnalytics(tier: MembershipTier | null): boolean {
  return tier === "PRO" || tier === "MARKE";
}

/** Eigenes Marken-Schaufenster + gesponserte KSS-Wizard-Platzierung (nur Marke). */
export function hasStorefront(tier: MembershipTier | null): boolean {
  return tier === "MARKE";
}
