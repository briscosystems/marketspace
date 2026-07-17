// GET /api/admin/mail-check  — nur für ADMIN.
//
// Diagnose für den E-Mail-Versand: prüft, ob SMTP konfiguriert ist, und versucht
// eine echte Anmeldung am Mailserver (transporter.verify()). Gibt den KONKRETEN
// Fehler zurück — damit man nicht raten muss, warum eine Mail nicht ankommt.
//
// Sicher: Der Endpunkt gibt weder Passwort noch Benutzernamen aus, nur Hostname,
// Port und die Fehlermeldung des Servers. Für alle außer ADMIN → 404.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/auth";
import { isMailConfigured } from "@/lib/mailer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const host = process.env.SMTP_HOST ?? null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const userLen = (process.env.SMTP_USER ?? "").length;
  const passLen = (process.env.SMTP_PASS ?? "").length;

  if (!isMailConfigured()) {
    return NextResponse.json({
      configured: false,
      hint: "SMTP_HOST, SMTP_USER oder SMTP_PASS fehlt in den Railway-Variablen.",
      host,
      port,
      userLen,
      passLen,
    });
  }

  const transporter = nodemailer.createTransport({
    host: host ?? undefined,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 12_000,
  });

  try {
    await transporter.verify();
    return NextResponse.json({
      configured: true,
      loginOk: true,
      message: "Anmeldung am Mailserver erfolgreich — der Versand funktioniert.",
      host,
      port,
      userLen,
      passLen,
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; response?: string };
    return NextResponse.json({
      configured: true,
      loginOk: false,
      // Der wahre Grund. Typische Fälle:
      //  ETIMEDOUT/ECONNECTION → Railway blockt ausgehende SMTP-Ports.
      //  535 / EAUTH           → Passwort falsch (z. B. \$-Backslash mitkopiert).
      code: err.code ?? null,
      serverResponse: err.response ?? null,
      message: err.message ?? "unbekannter Fehler",
      host,
      port,
      userLen, // Länge verrät, ob überhaupt ein Wert ankam
      passLen, // 26 statt 25 = ein Zeichen zu viel (Backslash!)
    });
  }
}
