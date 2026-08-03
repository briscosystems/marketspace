/**
 * Öffentliche Adresse der Plattform — für Sitemap, robots.txt und Vorschau-Karten
 * (Open Graph). Reihenfolge: ausdrücklich gesetzte Adresse, sonst die von Railway
 * gemeldete, sonst die lokale Entwicklungsadresse.
 */
export function siteUrl(): string {
  const roh =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ??
    "http://localhost:4100";
  return roh.replace(/\/+$/, "");
}
