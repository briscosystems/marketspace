/**
 * Anweisungen für Suchmaschinen.
 *
 * Solange die Testphase läuft (Willkommensseite mit Passwort), wird ALLES
 * gesperrt — sonst würde Google die Passwortseite indexieren und der spätere
 * Start begänne mit wertlosen Treffern. Endet die Testphase
 * (TESTPHASE=false), gibt diese Datei die Fachseiten frei
 * und hält private Bereiche (Konto, Verwaltung, Schnittstellen) draußen.
 */
import type { MetadataRoute } from "next";
import { testphaseAktiv } from "@/lib/testphase";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (testphaseAktiv()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/conversations",
          "/umsaetze",
          "/compare",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
