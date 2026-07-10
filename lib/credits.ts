import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
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
  /** Verkaufspreis pro Credit in Cent (EUR-Cent). 10 Ct = EUR 0.10 */
  creditPriceCt: 10,
  /** Jahresgebühr des Abos in Euro (Default 350 €, Superadmin-einstellbar) */
  membershipPriceEur: 350,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

// Kosten je KI-Aktion in Credits. Kalkuliert so, dass bei einem
// Verkaufspreis von 10 Ct/Credit jede Aktion ≥100 % Marge auf die
// Anthropic-API-Kosten hat (teuerste Aktion: Web-Recherche ≈ EUR 0.07
// Selbstkosten → 2 Credits = EUR 0.20 Erlös).
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
  // Nutzungs-Messung: welche KI-Funktion wird wie oft genutzt (/admin → Nutzung).
  // Fire-and-forget — Messung darf die eigentliche Aktion nie ausbremsen.
  prisma.usageEvent
    .create({ data: { kind: "ai_action", meta: action, userId } })
    .catch(() => {});
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

/** Pakete — Preis ergibt sich aus creditPriceCt (Superadmin-Einstellung). */
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "S", credits: 50, label: "Starter" },
  { id: "M", credits: 200, label: "Standard" },
  { id: "L", credits: 500, label: "Profi" },
];

export function packagePriceEur(credits: number, priceCt: number): number {
  return Math.round(credits * priceCt) / 100;
}

// ---------- Referral-/Gutschein-Codes (Admin generiert, Nutzer löst ein) ----------

/** Zufälligen, gut lesbaren Code generieren, z.B. "BRISCO-7K4Q-XM2P". */
export function generateReferralCodeString(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne verwechselbare Zeichen (0/O, 1/I)
  const part = () =>
    Array.from(crypto.randomBytes(4))
      .map((b) => alphabet[b % alphabet.length])
      .join("");
  return `BRISCO-${part()}-${part()}`;
}

export async function createReferralCode(params: {
  createdById: string;
  credits: number;
  maxUses?: number;
  expiresAt?: Date | null;
  note?: string;
  code?: string;
}) {
  const code = (params.code?.trim().toUpperCase() || generateReferralCodeString()).replace(/\s+/g, "");
  return prisma.referralCode.create({
    data: {
      code,
      credits: params.credits,
      maxUses: params.maxUses ?? 1,
      expiresAt: params.expiresAt ?? null,
      note: params.note,
      createdById: params.createdById,
    },
  });
}

export type RedeemCodeResult =
  | { ok: true; credits: number; balance: number }
  | { ok: false; reason: "not_found" | "expired" | "exhausted" | "already_redeemed" };

/** Code für einen Nutzer einlösen — atomar, verhindert Doppel-Einlösung/Überbuchung. */
export async function redeemReferralCode(userId: string, rawCode: string): Promise<RedeemCodeResult> {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  const referralCode = await prisma.referralCode.findUnique({ where: { code } });
  if (!referralCode || !referralCode.active) return { ok: false, reason: "not_found" };
  if (referralCode.expiresAt && referralCode.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (referralCode.usedCount >= referralCode.maxUses) {
    return { ok: false, reason: "exhausted" };
  }
  const already = await prisma.referralCodeRedemption.findUnique({
    where: { codeId_userId: { codeId: referralCode.id, userId } },
  });
  if (already) return { ok: false, reason: "already_redeemed" };

  // Atomar: usedCount nur erhöhen, wenn weiterhin unter maxUses (verhindert Überbuchung bei Race)
  const claimed = await prisma.referralCode.updateMany({
    where: { id: referralCode.id, usedCount: { lt: referralCode.maxUses } },
    data: { usedCount: { increment: 1 } },
  });
  if (claimed.count === 0) return { ok: false, reason: "exhausted" };

  try {
    await prisma.$transaction([
      prisma.referralCodeRedemption.create({
        data: { codeId: referralCode.id, userId, credits: referralCode.credits },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: referralCode.credits } },
      }),
      prisma.creditTransaction.create({
        data: { userId, amount: referralCode.credits, kind: "CODE", note: `Code eingelöst: ${code}` },
      }),
    ]);
  } catch {
    // Unique-Verletzung (codeId_userId) durch parallelen Doppel-Versuch
    await prisma.referralCode.update({ where: { id: referralCode.id }, data: { usedCount: { decrement: 1 } } });
    return { ok: false, reason: "already_redeemed" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
  return { ok: true, credits: referralCode.credits, balance: user?.creditBalance ?? 0 };
}
