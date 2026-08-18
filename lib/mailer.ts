import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import type { EmailKind } from "@prisma/client";

/**
 * E-Mail-Versand mit drei Wegen — automatisch nach vorhandener Konfiguration:
 *
 *  1. ZeptoMail (HTTPS)  — für LIVE. Nötig, weil Railway die SMTP-Ports sperrt.
 *     Läuft über Port 443, den kein Hoster blockiert.
 *  2. SMTP               — für lokale Entwicklung (Zoho-Postfach, funktioniert hier).
 *  3. Nur-Log            — wenn nichts konfiguriert ist. Es wird nichts verschickt,
 *                          der Vorgang aber ins EmailLog geschrieben.
 *
 * Der EmailLog-Eintrag entsteht in ALLEN Fällen, damit der Superadmin unter /admin
 * sieht, was rausging bzw. rausgegangen wäre.
 *
 * ── Umgebungsvariablen (in Railway, NICHT im Repo) ──
 * ZeptoMail (LIVE):
 *   ZEPTOMAIL_TOKEN   der „Send Mail Token" (beginnt mit „Zoho-enczapikey …")
 *   ZEPTOMAIL_API     optional, Standard EU: https://api.zeptomail.eu/v1.1/email
 *   MAIL_FROM         Absender, z.B. "Brisco Marketplace <noreply@brisco.ch>"
 *
 * SMTP (lokal):
 *   SMTP_HOST · SMTP_PORT · SMTP_USER · SMTP_PASS · MAIL_FROM
 */

const ZEPTO_DEFAULT_API = "https://api.zeptomail.eu/v1.1/email";

export type MailProvider = "zeptomail" | "smtp" | "none";

/** Welcher Weg ist aktiv? ZeptoMail hat Vorrang (das ist der Live-Weg). */
export function mailProvider(): MailProvider {
  if (process.env.ZEPTOMAIL_TOKEN) return "zeptomail";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return "none";
}

export function isMailConfigured(): boolean {
  return mailProvider() !== "none";
}

/** Absender als "Name <adresse>" — für SMTP direkt, für ZeptoMail zerlegt. */
function mailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@brisco.ch";
}

/** "Brisco Marketplace <noreply@brisco.ch>" → { name, address }. */
function parseFrom(from: string): { name: string; address: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || "Brisco Marketplace", address: m[2].trim() };
  return { name: "Brisco Marketplace", address: from.trim() };
}

// ---------- Weg 1: ZeptoMail über HTTPS ----------
async function sendViaZeptoMail(to: string, subject: string, body: string): Promise<void> {
  const from = parseFrom(mailFrom());
  const res = await fetch(process.env.ZEPTOMAIL_API || ZEPTO_DEFAULT_API, {
    method: "POST",
    headers: {
      // ZeptoMail erwartet den Token GENAU so (inkl. "Zoho-enczapikey"-Präfix,
      // das der Token bereits enthält).
      Authorization: process.env.ZEPTOMAIL_TOKEN as string,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: { address: from.address, name: from.name },
      to: [{ email_address: { address: to } }],
      subject,
      textbody: body,
    }),
    // Auch hier eine Zeitgrenze, damit ein hängender Aufruf nicht die Seite blockiert.
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ZeptoMail HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

// ---------- Weg 2: SMTP (lokal) ----------
let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (mailProvider() !== "smtp") return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

async function sendViaSmtp(to: string, subject: string, body: string): Promise<void> {
  const tx = getTransporter();
  if (!tx) throw new Error("SMTP nicht konfiguriert");
  await tx.sendMail({ from: mailFrom(), to, subject, text: body });
}

export async function sendEmail(params: {
  /** Für den EmailLog. null = Vorgang ohne Konto-Bezug (z.B. Test). */
  userId: string | null;
  kind: EmailKind;
  to: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean }> {
  const provider = mailProvider();
  let sent = false;
  // Fehlergrund mitschreiben (Betreiber 2026-08-18): Das Protokoll allein sagte
  // bisher nicht, OB die Mail rausging — ein nie zugestellter Passwort-Reset
  // sah aus wie ein erfolgreicher.
  let fehler: string | null = null;

  try {
    if (provider === "zeptomail") {
      await sendViaZeptoMail(params.to, params.subject, params.body);
      sent = true;
    } else if (provider === "smtp") {
      await sendViaSmtp(params.to, params.subject, params.body);
      sent = true;
    } else {
      fehler = "Kein Versandweg konfiguriert (weder ZeptoMail noch SMTP).";
      console.log(
        `[E-Mail] kein Versand konfiguriert — nicht verschickt. An ${params.to} — ${params.subject}`,
      );
    }
  } catch (e) {
    fehler = e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500);
    // Nicht werfen: Ein Mailproblem darf den Aufrufer (z.B. Passwort-Reset) nicht
    // scheitern lassen — sonst verrät ein Fehler dem Angreifer, ob ein Konto
    // existiert. Der Fehler landet im Log; der Admin-Kasten zeigt den Grund.
    console.error(`[E-Mail] Versand an ${params.to} über ${provider} fehlgeschlagen:`, e);
  }

  if (params.userId) {
    await prisma.emailLog.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        to: params.to,
        subject: params.subject,
        body: params.body,
        sent,
        sendError: fehler,
      },
    });
  }

  return { sent };
}
