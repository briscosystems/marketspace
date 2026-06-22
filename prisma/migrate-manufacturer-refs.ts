/**
 * Migriert bestehende Listing.manufacturer und SafetyDataSheet.manufacturer
 * (Freitext) auf manufacturerId (FK auf Manufacturer).
 *
 * Mapping-Strategie:
 *   1. exakter Name-Match (case-insensitiv)
 *   2. fallback: Regex über bekannte Aliase
 *
 * Idempotent: setzt nur, wo manufacturerId noch null ist (oder erzwungen via --force).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Aliase für Freitext-Werte, die nicht 1:1 auf einen Hersteller-Namen passen.
// "Mobil" wird zur Laufzeit als eigener Hersteller angelegt (ExxonMobil-Marke
// für Schmierstoffe — eigenständig genug von Esso, dass es einen eigenen
// Eintrag verdient, auch wenn wir noch kein Logo haben).
const ALIASES: { pattern: RegExp; slug: string }[] = [
  { pattern: /^mobil$|^exxonmobil$/i, slug: "mobil" },
  { pattern: /panolin/i, slug: "laemmle" },
  { pattern: /loctite/i, slug: "henkel" },
  { pattern: /divinol/i, slug: "divinol" },
  { pattern: /blasocut|blaser/i, slug: "blaser-swisslube" },
];

async function ensureMobilExists() {
  await prisma.manufacturer.upsert({
    where: { slug: "mobil" },
    update: {},
    create: {
      name: "Mobil",
      slug: "mobil",
      logoPath: null,
      website: "https://www.mobil.com",
      headquartersCountry: "US",
      businessFocus: ["LUBRICANT"],
      description: "ExxonMobil-Marke für Schmierstoffe.",
    },
  });
}

async function resolve(freetext: string): Promise<string | null> {
  const trimmed = freetext.trim();
  if (!trimmed) return null;

  // 1. exakter Name-Match (case-insensitiv)
  const byName = await prisma.manufacturer.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (byName) return byName.id;

  // 2. Alias
  for (const a of ALIASES) {
    if (a.pattern.test(trimmed)) {
      const found = await prisma.manufacturer.findUnique({
        where: { slug: a.slug },
        select: { id: true },
      });
      if (found) return found.id;
    }
  }

  // 3. partial (substring beide Richtungen)
  const all = await prisma.manufacturer.findMany({ select: { id: true, name: true } });
  const lower = trimmed.toLowerCase();
  for (const m of all) {
    const mn = m.name.toLowerCase();
    if (mn.includes(lower) || lower.includes(mn)) return m.id;
  }

  return null;
}

async function main() {
  await ensureMobilExists();

  // Listings
  const listings = await prisma.listing.findMany({
    where: { manufacturerId: null },
    select: { id: true, manufacturer: true },
  });
  let lOk = 0;
  const lMiss: string[] = [];
  for (const l of listings) {
    const mid = await resolve(l.manufacturer);
    if (mid) {
      await prisma.listing.update({ where: { id: l.id }, data: { manufacturerId: mid } });
      lOk++;
    } else {
      lMiss.push(l.manufacturer);
    }
  }
  console.log(`Listings: ${lOk}/${listings.length} verknüpft.${lMiss.length ? ` Nicht gemappt: ${[...new Set(lMiss)].join(", ")}` : ""}`);

  // SDS
  const sds = await prisma.safetyDataSheet.findMany({
    where: { manufacturerId: null },
    select: { id: true, manufacturer: true },
  });
  let sOk = 0;
  const sMiss: string[] = [];
  for (const s of sds) {
    const mid = await resolve(s.manufacturer);
    if (mid) {
      await prisma.safetyDataSheet.update({ where: { id: s.id }, data: { manufacturerId: mid } });
      sOk++;
    } else {
      sMiss.push(s.manufacturer);
    }
  }
  console.log(`SDS: ${sOk}/${sds.length} verknüpft.${sMiss.length ? ` Nicht gemappt: ${[...new Set(sMiss)].join(", ")}` : ""}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
