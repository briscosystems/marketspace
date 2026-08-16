/**
 * Sitemap — meldet Suchmaschinen alle Fachseiten der Plattform.
 *
 * Das ist der Hebel für „flächendeckend am ersten Tag": Der Marktplatz startet
 * mit wenigen Angeboten, die Wissensbasis dagegen mit über 4.500 eigenen Seiten
 * (Produkte, Sicherheitsdatenblätter, Hersteller). Ohne Sitemap findet Google
 * davon fast nichts, weil kaum interne Links auf die Einzelseiten zeigen.
 *
 * Solange die Zugangssperre aktiv ist, bleibt die Sitemap leer — es soll nichts
 * indexiert werden, was hinter dem Passwort liegt.
 */
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { testphaseAktiv } from "@/lib/testphase";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 86400; // einmal täglich neu bauen

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Während der Testphase bleibt die Sitemap leer — wie zuvor beim Gate.
  if (testphaseAktiv()) return [];
  const basis = siteUrl();

  const feste: MetadataRoute.Sitemap = [
    { url: `${basis}/`, changeFrequency: "daily", priority: 1 },
    { url: `${basis}/listings`, changeFrequency: "daily", priority: 0.9 },
    { url: `${basis}/rfqs`, changeFrequency: "daily", priority: 0.8 },
    { url: `${basis}/kss-finder`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${basis}/manufacturers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${basis}/sds`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${basis}/prices`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${basis}/wissen`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${basis}/materials`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${basis}/vertrauen`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${basis}/impressum`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${basis}/agb`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${basis}/datenschutz`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [produkte, hersteller, datenblaetter, angebote] = await Promise.all([
      prisma.product.findMany({
        select: { slug: true, updatedAt: true, manufacturer: { select: { slug: true } } },
      }),
      prisma.manufacturer.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.safetyDataSheet.findMany({ select: { id: true, revisionDate: true } }),
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, updatedAt: true },
      }),
    ]);

    return [
      ...feste,
      ...produkte.map((p) => ({
        url: `${basis}/products/${p.manufacturer.slug}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...hersteller.map((m) => ({
        url: `${basis}/manufacturers/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...datenblaetter.map((s) => ({
        url: `${basis}/sds/${s.id}`,
        lastModified: s.revisionDate ?? undefined,
        changeFrequency: "yearly" as const,
        priority: 0.5,
      })),
      ...angebote.map((l) => ({
        url: `${basis}/listings/${l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Ohne Datenbank lieber eine kurze Sitemap als gar keine Seite.
    return feste;
  }
}
