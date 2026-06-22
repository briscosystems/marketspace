/**
 * Legt Hersteller-Datensätze für alle SDS an, die noch keinen manufacturerId
 * haben, deren Freitext-Hersteller aber in der Manufacturer-Tabelle fehlt
 * (z.B. Chevron, WD-40, OMV …). Danach kann migrate-manufacturer-refs.ts diese
 * SDS per exaktem Namens-Match verknüpfen.
 *
 * Idempotent: legt nur an, was per Name (case-insensitiv) noch nicht existiert.
 * Aufruf:  npx tsx prisma/seed-missing-sds-manufacturers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function main() {
  // Distinct Freitext-Hersteller der noch ungelinkten SDS
  const unlinked = await prisma.safetyDataSheet.findMany({
    where: { manufacturerId: null },
    select: { manufacturer: true },
  });

  const existing = await prisma.manufacturer.findMany({ select: { name: true } });
  const existingLower = new Set(existing.map((m) => m.name.trim().toLowerCase()));

  // Eindeutige, noch nicht vorhandene Namen (case-insensitiv dedupliziert)
  const toCreate = new Map<string, string>(); // lower -> Originalschreibweise
  for (const s of unlinked) {
    const name = (s.manufacturer ?? "").trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (existingLower.has(lower) || toCreate.has(lower)) continue;
    toCreate.set(lower, name);
  }

  let created = 0;
  const usedSlugs = new Set<string>();
  for (const name of toCreate.values()) {
    let slug = slugify(name) || `hersteller-${created}`;
    while (usedSlugs.has(slug)) slug = `${slug}-x`;
    usedSlugs.add(slug);
    try {
      await prisma.manufacturer.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          businessFocus: ["LUBRICANT"],
          description: `Automatisch aus SDS-Quellen angelegt (${name}).`,
        },
      });
      created++;
    } catch (e) {
      console.warn(`Übersprungen: ${name} (${(e as Error).message.split("\n")[0]})`);
    }
  }

  console.log(`Fehlende Hersteller angelegt: ${created} (aus ${toCreate.size} Kandidaten).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
