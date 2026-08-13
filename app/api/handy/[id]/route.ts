/**
 * Einstieg für das Handy beim Foto-QR-Code.
 *
 * Warum dieser Umweg (2026-08-13): Seit dem Testbetrieb steht vor dem
 * Marktplatz die Willkommensseite für Testkunden. Das Handy, das gerade einen
 * QR-Code gescannt hat, würde dort landen statt bei der Kamera — mitten im
 * Arbeitsgang an der Maschine.
 *
 * Diese Route setzt deshalb die Testphasen-Bestätigung (die derjenige am
 * Rechner ohnehin schon gegeben hat) und leitet auf die Aufnahmeseite weiter.
 * Die Passwortsperre (Gate) wird NICHT angefasst — die bleibt, wie sie ist.
 */
import { NextResponse } from "next/server";
import { TESTPHASE_COOKIE, TESTPHASE_COOKIE_MAXAGE } from "@/lib/testphase";
import { siteUrl } from "@/lib/site-url";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const antwort = NextResponse.redirect(`${siteUrl()}/f/${encodeURIComponent(id)}`);
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
