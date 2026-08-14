/**
 * „Eintreten" auf der Testkunden-Willkommensseite — jetzt mit Passwort
 * (Betreiber 2026-08-15).
 *
 * Das Passwort wird HIER auf dem Server geprüft, nie an den Browser
 * geschickt. Der Vergleich ist zeitkonstant, damit sich die Länge des
 * richtigen Passworts nicht über die Antwortzeit erraten lässt. Nach
 * korrekter Eingabe wird das Cookie mit dem Datum der Bestätigung gesetzt.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  TESTPHASE_COOKIE,
  TESTPHASE_COOKIE_MAXAGE,
  testphasePasswort,
} from "@/lib/testphase";

function passwortStimmt(eingabe: string): boolean {
  const richtig = Buffer.from(testphasePasswort());
  const geliefert = Buffer.from(eingabe);
  if (richtig.length !== geliefert.length) return false;
  return timingSafeEqual(richtig, geliefert);
}

export async function POST(req: Request) {
  let passwort = "";
  try {
    const body = await req.json();
    passwort = typeof body?.passwort === "string" ? body.passwort : "";
  } catch {
    /* leerer Body → leeres Passwort → Ablehnung */
  }

  if (!passwortStimmt(passwort.trim())) {
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  const antwort = NextResponse.json({ ok: true });
  antwort.cookies.set({
    name: TESTPHASE_COOKIE,
    value: new Date().toISOString().slice(0, 10),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TESTPHASE_COOKIE_MAXAGE,
  });
  return antwort;
}
