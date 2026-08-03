/**
 * Konto nebenbei anlegen — für Anfragen und Angebote von nicht angemeldeten
 * Besuchern.
 *
 * Der Gedanke: Niemand soll ein Formular ausfüllen müssen, BEVOR er das tun
 * darf, weswegen er gekommen ist. Erst die Sache, dann das Konto — und das
 * Konto entsteht aus der E-Mail-Adresse, die ohnehin gebraucht wird, um
 * Antworten zuzustellen. (Baymard misst 18–26 % Abbruch allein durch
 * Kontozwang.)
 *
 * Das Passwort setzt der Nutzer über denselben Link, den auch
 * „Passwort vergessen" verschickt — ein Weg, ein geprüfter Ablauf.
 */
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generatePseudonym } from "@/lib/pseudonym";
import { generateResetToken, hashResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { sendEmail } from "@/lib/mailer";
import { withBasePath } from "@/lib/base-path";

export type KontoErgebnis = { userId: string; neuAngelegt: boolean };

export async function kontoNebenbei(params: {
  email: string;
  /** Rolle des neuen Kontos: wer anbietet ist Händler, wer fragt ist Endkunde. */
  rolle: "RESELLER" | "ENDKUNDE";
  origin: string;
  betreff: string;
  /** Einleitung der Mail, ohne den Link — der wird angehängt. */
  einleitung: string[];
}): Promise<KontoErgebnis> {
  const adresse = params.email.toLowerCase();

  const vorhanden = await prisma.user.findUnique({
    where: { email: adresse },
    select: { id: true },
  });
  if (vorhanden) return { userId: vorhanden.id, neuAngelegt: false };

  let pseudonym = generatePseudonym();
  for (let i = 0; i < 12; i++) {
    const belegt = await prisma.user.findUnique({ where: { pseudonym }, select: { id: true } });
    if (!belegt) break;
    pseudonym = generatePseudonym();
  }

  const nutzer = await prisma.user.create({
    data: {
      email: adresse,
      // Zufälliges Passwort: niemand kennt es, auch wir nicht. Der Zugang läuft
      // ausschließlich über den Link aus der Bestätigungsmail.
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
      pseudonym,
      role: params.rolle,
      country: "CH",
    },
    select: { id: true, email: true },
  });

  const token = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: nutzer.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  const link = `${params.origin}${withBasePath("/reset-password")}?token=${token}`;
  const stunden = Math.round(RESET_TOKEN_TTL_MS / 3_600_000);

  // Bewusst ohne await: Die Antwort darf nicht auf den Mailserver warten.
  void sendEmail({
    userId: nutzer.id,
    kind: "PASSWORD_RESET",
    to: nutzer.email,
    subject: params.betreff,
    body: [
      ...params.einleitung,
      "",
      "Vergib hier dein Passwort:",
      link,
      "",
      `Der Link ist ${stunden} Stunden gültig.`,
      "Wenn du das nicht warst, ignoriere diese Nachricht einfach.",
    ].join("\n"),
  });

  return { userId: nutzer.id, neuAngelegt: true };
}
