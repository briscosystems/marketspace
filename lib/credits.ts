import { prisma } from "@/lib/prisma";
import type { CreditTxKind } from "@prisma/client";
import { isMembershipActive } from "@/lib/membership";

// ============================================================
// KI-Credits, Trial & Referral — zentrale Logik.
//
// Geschäftsmodell (FDS C.9): Abo (Jahres-Zugang) = Plattform-Zugang,
// Credits = Bezahlung der KI-Funktionen. Neukunden bekommen eine
// Kennenlernphase (Trial) + Startguthaben; beides stellt der
// Superadmin in /admin ein.
// ============================================================

// Standardwerte — der Superadmin kann jeden Wert in /admin überschreiben
// (gespeichert in AppSetting). Kalkulation siehe FDS C.9.
export const SETTING_DEFAULTS = {
  /** Startguthaben (Credits) für Neukunden in der Kennenlernphase */
  welcomeCredits: 20,
  /** Dauer der Kennenlernphase (Trial) in Tagen — ohne Abo nutzbar */
  trialDays: 30,
  /** Prämie (Credits) für den Werber, wenn sein Empfehlungs-Code genutzt wird */
  referralCredits: 10,
  /** Verkaufspreis pro Credit in Rappen (CHF-Cent). 10 Rp = CHF 0.10 */
  creditPriceRp: 10,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

// Kosten je KI-Aktion in Credits. Kalkuliert so, dass bei einem
// Verkaufspreis von 10 Rp/Credit jede Aktion ≥100 % Marge auf die
// Anthropic-API-Kosten hat (teuerste Aktion: Web-Recherche ≈ CHF 0.07
// Selbstkosten → 2 Credits = CHF 0.20 Erlös).
export const AI_ACTION_COSTS = {
  concierge: 1, // Haiku, ~CHF 0.005 Selbstkosten
  kssWizard: 1, // Haiku, ~CHF 0.015
  alternatives: 1, // Haiku + SDS-Vergleich, ~CHF 0.035
  alternativesWeb: 2, // Sonnet + Websuche, ~CHF 0.07
} as const;

export type AiAction = keyof typeof AI_ACTION_COSTS;

export const AI_ACTION_LABEL: Record<AiAction, string> = {
  concierge: "Concierge-Frage",
  kssWizard: "KSS-Wizard-Analyse",
  alternatives: "KI-Alternativen (SDS-Vergleich)",
  alternativesWeb: "KI-Alternativsuche mit Web-Recherche",
};

// ---------- Einstellungen (AppSetting) ----------

export async function getSettingInt(key: SettingKey): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  const parsed = row ? parseInt(row.value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : SETTING_DEFAULTS[key];
}

export async function getAllSettings(): Promise<Record<SettingKey, number>> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: Object.keys(SETTING_DEFAULTS) } },
  });
  const byKey = new Map(rows.map((r) => [r.key, parseInt(r.value, 10)]));
  const out = { ...SETTING_DEFAULTS } as Record<SettingKey, number>;
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    const v = byKey.get(key);
    if (v !== undefined && Number.isFinite(v)) out[key] = v;
  }
  return out;
}

export async function setSetting(key: SettingKey, value: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}

// ---------- Guthaben ----------

/** Credits gutschreiben (Willkommen, Kauf, Referral, Admin) — atomar mit Historie. */
export async function grantCredits(
  userId: string,
  amount: number,
  kind: CreditTxKind,
  note?: string,
): Promise<void> {
  if (amount === 0) return;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: { userId, amount, kind, note },
    }),
  ]);
}

export type ChargeResult =
  | { ok: true; cost: number; balance: number }
  | { ok: false; cost: number; balance: number; reason: "no_credits" | "no_access" };

/**
 * Eine KI-Aktion abbuchen. Atomar: bucht nur ab, wenn genug Guthaben da ist
 * (kein negativer Saldo möglich). Zusätzlich Zugangs-Check: KI setzt aktives
 * Abo ODER laufende Kennenlernphase voraus.
 */
export async function chargeForAiAction(
  userId: string,
  action: AiAction,
): Promise<ChargeResult> {
  const cost = AI_ACTION_COSTS[action];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true, trialEndsAt: true, membershipValidUntil: true },
  });
  if (!user) return { ok: false, cost, balance: 0, reason: "no_access" };

  const hasAccess =
    isMembershipActive(user.membershipValidUntil) || isTrialActive(user.trialEndsAt);
  if (!hasAccess) {
    return { ok: false, cost, balance: user.creditBalance, reason: "no_access" };
  }

  // Atomare Abbuchung: nur wenn Saldo reicht (verhindert Race/negativen Saldo)
  const updated = await prisma.user.updateMany({
    where: { id: userId, creditBalance: { gte: cost } },
    data: { creditBalance: { decrement: cost } },
  });
  if (updated.count === 0) {
    return { ok: false, cost, balance: user.creditBalance, reason: "no_credits" };
  }
  await prisma.creditTransaction.create({
    data: { userId, amount: -cost, kind: "USAGE", note: AI_ACTION_LABEL[action] },
  });
  return { ok: true, cost, balance: user.creditBalance - cost };
}

/** Fehlgeschlagene KI-Aktion zurückerstatten (z.B. Claude-Aufruf abgebrochen). */
export async function refundAiAction(userId: string, action: AiAction): Promise<void> {
  const cost = AI_ACTION_COSTS[action];
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: cost } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: cost,
        kind: "USAGE",
        note: `Erstattung: ${AI_ACTION_LABEL[action]} fehlgeschlagen`,
      },
    }),
  ]);
}

// ---------- Trial ----------

export function isTrialActive(trialEndsAt: Date | null | undefined): boolean {
  return !!trialEndsAt && trialEndsAt.getTime() > Date.now();
}

export type AccessStatus = {
  memberActive: boolean;
  trialActive: boolean;
  trialEndsAt: Date | null;
  membershipValidUntil: Date | null;
  creditBalance: number;
};

export async function getAccessStatus(userId: string): Promise<AccessStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true, trialEndsAt: true, membershipValidUntil: true },
  });
  if (!user) return null;
  return {
    memberActive: isMembershipActive(user.membershipValidUntil),
    trialActive: isTrialActive(user.trialEndsAt),
    trialEndsAt: user.trialEndsAt,
    membershipValidUntil: user.membershipValidUntil,
    creditBalance: user.creditBalance,
  };
}

// ---------- Credit-Pakete (Kauf via Stripe) ----------

export type CreditPackage = { id: string; credits: number; label: string };

/** Pakete — Preis ergibt sich aus creditPriceRp (Superadmin-Einstellung). */
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "S", credits: 50, label: "Starter" },
  { id: "M", credits: 200, label: "Standard" },
  { id: "L", credits: 500, label: "Profi" },
];

export function packagePriceChf(credits: number, priceRp: number): number {
  return Math.round(credits * priceRp) / 100;
}
