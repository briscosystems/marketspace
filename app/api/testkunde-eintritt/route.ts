/**
 * „Eintreten" auf der Testkunden-Willkommensseite.
 *
 * Setzt das Cookie mit dem Datum der Bestätigung. Mehr passiert nicht — die
 * Seite ist eine Aufklärung mit bewusster Zustimmung, keine Zugangssperre
 * (die ist das Gate, siehe lib/gate.ts).
 */
import { NextResponse } from "next/server";
import { TESTPHASE_COOKIE, TESTPHASE_COOKIE_MAXAGE } from "@/lib/testphase";

export async function POST() {
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
