import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import type { EmailKind } from "@prisma/client";

/**
 * E-Mail-Versand über SMTP.
 *
 * Bewusst SMTP und kein Anbieter-SDK: Damit läuft jeder Dienst (das eigene
 * brisco.ch-Postfach, Postmark, Resend, SES, Mailtrap zum Testen) ohne
 * Code-Änderung — nur die Zugangsdaten wechseln.
 *
 * Konfiguration über Umgebungsvariablen (in Railway, NICHT im Repo):
 *   SMTP_HOST   z.B. smtp.example.com          (Pflicht)
 *   SMTP_PORT   z.B. 587 (STARTTLS) oder 465 (TLS)   — Standard 587
 *   SMTP_USER   Postfach/Benutzer               (Pflicht)
 *   SMTP_PASS   Passwort/API-Key               (Pflicht)
 *   MAIL_FROM   z.B. "Brisco Marketplace <noreply@brisco.ch>"  — Standard: SMTP_USER
 *
 * Ist SMTP NICHT konfiguriert (lokale Entwicklung), wird nichts verschickt,
 * sondern nur ins Server-Log geschrieben — dieselbe Fallback-Logik wie beim
 * ANTHROPIC_API_KEY. Der EmailLog-Eintrag entsteht in BEIDEN Fällen, damit der
 * Superadmin unter /admin sieht, was rausging bzw. rausgegangen wäre.
 */

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Absenderadresse: MAIL_FROM, sonst der SMTP-Benutzer. */
function mailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@brisco.ch";
}

// Transporter als Singleton — eine Verbindung pro Prozess statt pro Mail.
let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = TLS von Anfang an, 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(params: {
  /** Für den EmailLog. null = Vorgang ohne Konto-Bezug (z.B. Test). */
  userId: string | null;
  kind: EmailKind;
  to: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean }> {
  const tx = getTransporter();
  let sent = false;

  if (tx) {
    try {
      await tx.sendMail({
        from: mailFrom(),
        to: params.to,
        subject: params.subject,
        text: params.body,
      });
      sent = true;
    } catch (e) {
      // Nicht werfen: Ein Mailproblem darf den Aufrufer (z.B. Passwort-Reset)
      // nicht scheitern lassen — sonst verrät die Fehlermeldung dem Angreifer,
      // ob das Konto existiert. Der Fehler landet im Log.
      console.error(`[E-Mail] Versand an ${params.to} fehlgeschlagen:`, e);
    }
  } else {
    console.log(
      `[E-Mail] SMTP nicht konfiguriert — nicht verschickt. An ${params.to} — ${params.subject}\n${params.body}`,
    );
  }

  if (params.userId) {
    await prisma.emailLog.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        to: params.to,
        subject: params.subject,
        body: params.body,
      },
    });
  }

  return { sent };
}
