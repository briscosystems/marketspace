import nodemailer from "nodemailer";
import { isMailConfigured } from "@/lib/mailer";

/**
 * Prüft den E-Mail-Versand und liefert ein für den Admin-Bereich lesbares
 * Ergebnis. Versucht eine echte Anmeldung am Mailserver (verify) und deutet den
 * konkreten Fehler — damit man nicht raten muss, warum eine Mail nicht ankommt.
 */
export type MailStatus = {
  configured: boolean;
  loginOk: boolean;
  headline: string;
  detail: string;
  /** Diagnose-Fakten, verraten kein Geheimnis (nur Längen und Hostname). */
  facts: { label: string; value: string }[];
};

export async function checkMailStatus(): Promise<MailStatus> {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const userLen = (process.env.SMTP_USER ?? "").length;
  const passLen = (process.env.SMTP_PASS ?? "").length;

  const facts = [
    { label: "Server", value: host || "— nicht gesetzt" },
    { label: "Port", value: String(port) },
    { label: "Benutzer-Länge", value: userLen ? `${userLen} Zeichen` : "— leer" },
    { label: "Passwort-Länge", value: passLen ? `${passLen} Zeichen` : "— leer" },
  ];

  if (!isMailConfigured()) {
    return {
      configured: false,
      loginOk: false,
      headline: "SMTP ist nicht vollständig konfiguriert",
      detail:
        "In den Railway-Variablen fehlt SMTP_HOST, SMTP_USER oder SMTP_PASS. " +
        "Ohne diese Werte wird keine E-Mail verschickt (Passwort-Reset, Abo-Erinnerungen).",
      facts,
    };
  }

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
      configured: true,
      loginOk: true,
      headline: "E-Mail-Versand funktioniert",
      detail: "Die Anmeldung am Mailserver war erfolgreich. Passwort-Reset & Co. werden zugestellt.",
      facts,
    };
  } catch (e) {
    const err = e as { message?: string; code?: string; response?: string };
    const code = err.code ?? "";
    const resp = err.response ?? err.message ?? "unbekannter Fehler";

    // Fehler deuten — die zwei wahrscheinlichen Ursachen benennen.
    let detail: string;
    if (code === "EAUTH" || resp.includes("535")) {
      detail =
        `Der Mailserver lehnt die Anmeldung ab (${resp}). Das Passwort stimmt nicht. ` +
        `Häufigste Ursache: Beim Kopieren aus der .env ist ein „\\“ vor dem „$“ mit ` +
        `hineingeraten — in Railway muss das Passwort das „$“ OHNE Backslash enthalten. ` +
        `Prüfe die Passwort-Länge unten: erwartet werden 25 Zeichen, bei 26 ist der ` +
        `Backslash mit drin.`;
    } else if (code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET") {
      detail =
        `Keine Verbindung zum Mailserver (${code}). Das deutet darauf hin, dass der ` +
        `Hosting-Anbieter ausgehende Mail-Ports sperrt. Dann müssen wir auf den ` +
        `E-Mail-Versand per API (statt SMTP) umstellen — sag Bescheid, das baue ich.`;
    } else {
      detail = `Anmeldung fehlgeschlagen: ${resp}${code ? ` (${code})` : ""}.`;
    }

    return {
      configured: true,
      loginOk: false,
      headline: "E-Mail-Versand scheitert",
      detail,
      facts,
    };
  }
}
