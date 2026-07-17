"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { grantCredits, setSetting, createReferralCode, type SettingKey } from "@/lib/credits";

/**
 * Stellt sicher, dass NUR der Eigentümer (Rolle ADMIN) diese Aktionen ausführt.
 * Wirft sonst — die Seite selbst liefert für alle anderen ohnehin 404.
 */
async function assertOwner() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Nicht berechtigt.");
  }
}

/**
 * Setzt den versteckten Sichtbarkeits-Boost eines Resellers.
 * Höherer Wert ⇒ dessen Angebote erscheinen weiter oben in Suche & Vorschlägen.
 * Wert wird auf 0–100 begrenzt. Für normale Nutzer ist das komplett unsichtbar.
 */
export async function updateSearchBoost(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("boost") ?? 0);
  if (!userId) return;

  const boost = Math.max(0, Math.min(100, Math.round(Number.isFinite(raw) ? raw : 0)));
  await prisma.user.update({ where: { id: userId }, data: { searchBoost: boost } });

  // Seiten neu rendern, deren Reihenfolge vom Boost abhängt.
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
}

/**
 * Monetarisierungs-Einstellungen speichern: Startguthaben, Trial-Dauer,
 * Referral-Prämie, Credit-Preis. Werte landen in AppSetting.
 */
export async function updateMonetizationSettings(formData: FormData) {
  await assertOwner();

  const fields: { name: SettingKey; min: number; max: number }[] = [
    { name: "welcomeCredits", min: 0, max: 1000 },
    { name: "trialDays", min: 0, max: 365 },
    { name: "referralCredits", min: 0, max: 500 },
    { name: "creditPriceCt", min: 1, max: 1000 },
    { name: "membershipPriceEur", min: 1, max: 100000 },
    { name: "membershipPriceProEur", min: 1, max: 100000 },
    { name: "membershipPriceMarkeEur", min: 1, max: 100000 },
    { name: "protectionFeeBp", min: 0, max: 2000 },
    { name: "protectionFeeFixedCt", min: 0, max: 10000 },
    { name: "basisListingLimit", min: 1, max: 100000 },
  ];
  for (const f of fields) {
    const raw = Number(formData.get(f.name));
    if (!Number.isFinite(raw)) continue;
    const value = Math.max(f.min, Math.min(f.max, Math.round(raw)));
    await setSetting(f.name, value);
  }
  revalidatePath("/admin");
  revalidatePath("/mitgliedschaft");
}

/**
 * Credits eines Nutzers manuell anpassen (positiv = gutschreiben,
 * negativ = abziehen). Mit Historieneintrag ADMIN_ADJUST.
 */
export async function adjustCredits(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("amount") ?? 0);
  if (!userId || !Number.isFinite(raw) || raw === 0) return;

  const amount = Math.max(-100000, Math.min(100000, Math.round(raw)));
  await grantCredits(userId, amount, "ADMIN_ADJUST", "Manuelle Anpassung durch Eigentümer");

  revalidatePath("/admin");
}

/**
 * Kennenlernphase eines Nutzers verlängern/setzen (Tage ab heute).
 */
export async function setTrialDays(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("days") ?? 0);
  if (!userId || !Number.isFinite(raw)) return;

  const days = Math.max(0, Math.min(365, Math.round(raw)));
  const trialEndsAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
  await prisma.user.update({ where: { id: userId }, data: { trialEndsAt } });

  revalidatePath("/admin");
}

/**
 * Referral-/Gutschein-Code generieren. Nur der Eigentümer sieht diesen
 * Bereich in /admin. Ein leeres "code"-Feld erzeugt einen Zufalls-Code.
 */
export async function createReferralCodeAction(formData: FormData) {
  await assertOwner();
  const session = await getServerSession(authOptions);
  const adminId = session!.user.id;

  const codeRaw = String(formData.get("code") ?? "").trim();
  const credits = Math.max(1, Math.min(10000, Math.round(Number(formData.get("credits") ?? 0))));
  const maxUses = Math.max(1, Math.min(100000, Math.round(Number(formData.get("maxUses") ?? 1))));
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || undefined;
  if (!Number.isFinite(credits) || credits <= 0) return;

  await createReferralCode({
    createdById: adminId,
    credits,
    maxUses,
    expiresAt: expiresRaw ? new Date(expiresRaw) : null,
    note,
    code: codeRaw || undefined,
  });

  revalidatePath("/admin");
}

/** Code deaktivieren — kann danach nicht mehr eingelöst werden. */
export async function deactivateReferralCode(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.referralCode.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin");
}

/**
 * Löscht einen Referral-Code — aber NUR, wenn er nie eingelöst wurde. Ein bereits
 * genutzter Code bleibt als Beleg erhalten (wer hat wann Credits erhalten); dafür
 * gibt es „Deaktivieren". So geht keine Nachvollziehbarkeit verloren.
 */
export async function deleteReferralCode(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const code = await prisma.referralCode.findUnique({
    where: { id },
    select: { usedCount: true },
  });
  if (!code || code.usedCount > 0) return; // benutzte Codes nicht löschen
  await prisma.referralCode.delete({ where: { id } });
  revalidatePath("/admin");
}

// ---------- Käuferschutz: Problemfall-Entscheidung ----------

/** Problemfall: geparktes Geld trotz Reklamation an den Verkäufer freigeben. */
export async function resolveProtectionRelease(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { releaseProtection } = await import("@/lib/protection-flow");
  const result = await releaseProtection(id);
  if (result.ok) {
    await prisma.transaction.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
  revalidatePath("/admin");
}

/** Problemfall: geparktes Geld an den Käufer zurückerstatten (inkl. Gebühr). */
export async function resolveProtectionRefund(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { refundProtection } = await import("@/lib/protection-flow");
  const result = await refundProtection(id);
  if (result.ok) {
    await prisma.transaction.update({
      where: { id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }
  revalidatePath("/admin");
}
