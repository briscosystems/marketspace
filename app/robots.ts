/**
 * Anweisungen für Suchmaschinen.
 *
 * Solange die Zugangssperre („Gate") aktiv ist, wird ALLES gesperrt — sonst
 * würde Google die Passwortseite indexieren und der spätere Start begänne mit
 * wertlosen Treffern. Fällt die Sperre, gibt diese Datei die Fachseiten frei
 * und hält private Bereiche (Konto, Verwaltung, Schnittstellen) draußen.
 */
import type { MetadataRoute } from "next";
import { gateEnabled } from "@/lib/gate";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (gateEnabled()) {
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
