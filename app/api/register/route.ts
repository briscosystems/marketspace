import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findPseudonymLeak, generatePseudonym } from "@/lib/pseudonym";
import { getAllSettings, grantCredits } from "@/lib/credits";
import { passendeAktion } from "@/lib/aktionen";
import { sendEmail } from "@/lib/mailer";

// Betreiber-Benachrichtigung bei jeder Registrierung
const ADMIN_NOTIFY_EMAIL = "jgosch@brisco.ch";

/**
 * Für den Einstieg reichen E-Mail und Passwort (Entscheidung 2026-08-03).
 * Jedes zusätzliche Pflichtfeld kostet Anmeldungen — Baymard misst 18–26 %
 * Abbruch allein wegen Kontozwang. Rolle, Firma, Land und Umsatzsteuer-Nummer
 * werden dort abgefragt, wo sie gebraucht werden: beim ersten Einstellen eines
 * Angebots bzw. beim Käuferschutz. Das Pseudonym vergibt die Plattform selbst.
 */
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  pseudonym: z.string().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).optional(),
  role: z.enum(["RESELLER", "OEM", "ENDKUNDE"]).default("RESELLER"),
  companyName: z.string().min(2).optional(),
  vatId: z.string().optional(),
  country: z.string().length(2).optional(),
  // Empfehlungs-Code = Pseudonym des Werbers (optional, aus ?ref=…)
  referralCode: z.string().max(40).optional(),
  // Aktions-Code (optional) — z. B. von einem Flyer. Leer ist ok: codelose
  // Aktionen (Messe) gelten für jede Anmeldung im Zeitraum.
  aktionsCode: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, role, vatId, referralCode, aktionsCode } = parsed.data;
  const companyName = parsed.data.companyName ?? null;
  const country = (parsed.data.country ?? "CH").toUpperCase();

  // Pseudonym: selbst gewählt (Profil) oder von der Plattform vergeben.
  let pseudonym = parsed.data.pseudonym?.trim();
  if (pseudonym) {
    // Schutz: Ein selbst gewähltes Pseudonym darf die Identität nicht verraten
    // (Firma, E-Mail, USt-ID, bekannter Hersteller) — sonst lässt sich die
    // Plattform umgehen. Bei vergebenen Pseudonymen entfällt die Prüfung.
    const manufacturers = await prisma.manufacturer.findMany({ select: { name: true } });
    const leak = findPseudonymLeak(pseudonym, {
      companyName: companyName ?? undefined,
      email,
      vatId,
      manufacturerNames: manufacturers.map((m) => m.name),
    });
    if (leak) return NextResponse.json({ error: leak }, { status: 422 });
  } else {
    // Freies Pseudonym suchen — theoretisch kann eines doppelt entstehen.
    for (let i = 0; i < 12; i++) {
      const kandidat = generatePseudonym();
      const belegt = await prisma.user.findUnique({
        where: { pseudonym: kandidat },
        select: { id: true },
      });
      if (!belegt) { pseudonym = kandidat; break; }
    }
    if (!pseudonym) {
      return NextResponse.json(
        { error: "Konto konnte nicht angelegt werden. Bitte noch einmal versuchen." },
        { status: 500 },
      );
    }
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { pseudonym }] },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Email oder Pseudonym bereits vergeben" },
      { status: 409 }
    );
  }

  // Monetarisierungs-Einstellungen (Superadmin) → Trial + Startguthaben
  const settings = await getAllSettings();
  const trialEndsAt = new Date(Date.now() + settings.trialDays * 24 * 60 * 60 * 1000);

  // Referral: Empfehlungs-Code ist das Pseudonym des Werbers
  const referrer = referralCode
    ? await prisma.user.findUnique({
        where: { pseudonym: referralCode },
        select: { id: true, pseudonym: true },
      })
    : null;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      pseudonym,
      role,
      companyName,
      vatId,
      country,
      trialEndsAt,
      referredById: referrer?.id,
    },
    select: { id: true, pseudonym: true, role: true },
  });

  // Startguthaben für die Kennenlernphase
  if (settings.welcomeCredits > 0) {
    await grantCredits(
      user.id,
      settings.welcomeCredits,
      "WELCOME",
      "Startguthaben Kennenlernphase",
    );
  }
  // Referral-Prämie für den Werber
  if (referrer && settings.referralCredits > 0) {
    await grantCredits(
      referrer.id,
      settings.referralCredits,
      "REFERRAL",
      `Neukunde geworben: ${user.pseudonym}`,
    );
  }

  // Anmelde-Aktion (z. B. Messe 2026): Gutschrift für den Neukunden, bei
  // geworbener Anmeldung zusätzlich für den Werber. Fehler hier dürfen die
  // Registrierung nie scheitern lassen.
  try {
    const aktion = await passendeAktion(aktionsCode);
    if (aktion) {
      await grantCredits(
        user.id,
        aktion.creditsAnmeldung,
        "CODE",
        `Aktion „${aktion.titel}": ${(aktion.creditsAnmeldung / 10).toFixed(0)} € Gutschrift`,
      );
      if (referrer && aktion.creditsEmpfehlung > 0) {
        await grantCredits(
          referrer.id,
          aktion.creditsEmpfehlung,
          "CODE",
          `Aktion „${aktion.titel}": Weiterempfehlung ${user.pseudonym}`,
        );
      }
    }
  } catch {
    /* Aktion darf die Registrierung nicht blockieren */
  }

  // Betreiber-Benachrichtigung — fire-and-forget, darf die Registrierung nie blockieren
  void sendEmail({
    userId: user.id,
    kind: "ADMIN_NEW_USER",
    to: ADMIN_NOTIFY_EMAIL,
    subject: `Neue Registrierung: ${user.pseudonym} (${role})`,
    body: [
      "Neuer Nutzer auf markt.brisco.ch:",
      "",
      `Pseudonym: ${user.pseudonym}`,
      `E-Mail:    ${email.toLowerCase()}`,
      `Rolle:     ${role}`,
      `Firma:     ${companyName}`,
      `Land:      ${country.toUpperCase()}`,
      vatId ? `USt-ID:    ${vatId}` : "",
      referrer ? `Geworben von: ${referrer.pseudonym}` : "",
      `Trial bis: ${trialEndsAt.toLocaleDateString("de-CH")}`,
      "",
      "→ Admin: https://markt.brisco.ch/admin",
    ]
      .filter(Boolean)
      .join("\n"),
  }).catch((e) => {
    console.error("[Registrierung] Admin-Benachrichtigung fehlgeschlagen (ignoriert):", e);
  });

  return NextResponse.json(user, { status: 201 });
}
