import nodemailer from "nodemailer";
import { mailProvider } from "@/lib/mailer";

/**
 * Prüft den E-Mail-Versand und liefert ein für den Admin-Bereich lesbares
 * Ergebnis. Erkennt den aktiven Weg (ZeptoMail über HTTPS oder SMTP) und benennt
 * den konkreten Fehler — damit man nicht raten muss, warum eine Mail nicht ankommt.
 */
export type MailStatus = {
  provider: "zeptomail" | "smtp" | "none";
  configured: boolean;
  loginOk: boolean;
  headline: string;
  detail: string;
  facts: { label: string; value: string }[];
};

export async function checkMailStatus(): Promise<MailStatus> {
  const provider = mailProvider();
  const from = process.env.MAIL_FROM || "— nicht gesetzt";

  if (provider === "none") {
    return {
      provider,
      configured: false,
      loginOk: false,
      headline: "Kein E-Mail-Versand konfiguriert",
      detail:
        "Weder ZeptoMail (ZEPTOMAIL_TOKEN) noch SMTP ist in den Railway-Variablen gesetzt. " +
        "Ohne das wird keine E-Mail verschickt (Passwort-Reset, Abo-Erinnerungen).",
      facts: [{ label: "Absender", value: from }],
    };
  }

  if (provider === "zeptomail") {
    const tokenLen = (process.env.ZEPTOMAIL_TOKEN ?? "").length;
    // ZeptoMail hat keinen „Verify"-Endpunkt ohne echten Versand. Wir prüfen die
    // Konfiguration und verlassen uns für den Live-Beweis auf den Test-Knopf.
    return {
      provider,
      configured: true,
      loginOk: true,
      headline: "E-Mail-Versand über ZeptoMail aktiv",
      detail:
        "ZeptoMail ist konfiguriert und wird über HTTPS angesprochen (kein SMTP-Port nötig). " +
        "Ob eine Mail wirklich ankommt, prüfst du am besten mit dem Test-Knopf unten oder über " +
        "„Passwort vergessen“ mit deiner eigenen Adresse.",
      facts: [
        { label: "Absender", value: from },
        { label: "Token hinterlegt", value: tokenLen ? `ja (${tokenLen} Zeichen)` : "NEIN" },
      ],
    };
  }

  // provider === "smtp"
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const passLen = (process.env.SMTP_PASS ?? "").length;
  const facts = [
    { label: "Weg", value: "SMTP" },
    { label: "Server", value: host },
    { label: "Port", value: String(port) },
    { label: "Passwort-Länge", value: passLen ? `${passLen} Zeichen` : "— leer" },
  ];

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 12_000,
  });

  try {
    await transporter.verify();
    return {
      provider,
      configured: true,
      loginOk: true,
      headline: "E-Mail-Versand über SMTP funktioniert",
      detail: "Die Anmeldung am Mailserver war erfolgreich.",
      facts,
    };
  } catch (e) {
    const err = e as { message?: string; code?: string; response?: string };
    const code = err.code ?? "";
    const resp = err.response ?? err.message ?? "unbekannter Fehler";
    let detail: string;
    if (code === "EAUTH" || resp.includes("535")) {
      detail = `Der Mailserver lehnt die Anmeldung ab (${resp}). Das Passwort stimmt nicht.`;
    } else if (code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET") {
      detail =
        `Keine Verbindung zum Mailserver (${code}). Der Hoster sperrt ausgehende SMTP-Ports. ` +
        `Auf Railway ist das normal — hier muss ZeptoMail (HTTPS) verwendet werden.`;
    } else {
      detail = `Anmeldung fehlgeschlagen: ${resp}${code ? ` (${code})` : ""}.`;
    }
    return { provider, configured: true, loginOk: false, headline: "E-Mail-Versand scheitert", detail, facts };
  }
}
