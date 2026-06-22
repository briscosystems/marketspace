// Step B1: Generiert Product-Einträge aus vorhandenen SDS, die noch kein
// zugehöriges Product haben. Idempotent (upsert auf manufacturerId+slug).
//
// Mapping SDS-Category → Product-Category:
//   WATER_MISCIBLE_COOLANT → COOLANT_WATER_MIX
//   NEAT_CUTTING_OIL       → COOLANT_NEAT
//   HYDRAULIC_OIL          → HYDRAULIC_OIL
//   GEAR_OIL               → GEAR_OIL
//   MOTOR_OIL              → SPECIALTY
//   GREASE                 → GREASE
//   OTHER                  → OTHER

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const CATEGORY_MAP: Record<string, string> = {
  WATER_MISCIBLE_COOLANT: "COOLANT_WATER_MIX",
  NEAT_CUTTING_OIL: "COOLANT_NEAT",
  HYDRAULIC_OIL: "HYDRAULIC_OIL",
  GEAR_OIL: "GEAR_OIL",
  MOTOR_OIL: "SPECIALTY",
  GREASE: "GREASE",
  OTHER: "OTHER",
};

async function main() {
  // Wir gruppieren SDS nach (manufacturer-name, product-name) und nehmen pro
  // Gruppe das beste Exemplar (DE bevorzugt, längster Name).
  const sds = await prisma.safetyDataSheet.findMany({
    select: {
      manufacturer: true,
      productName: true,
      category: true,
      language: true,
      reachCompliant: true,
      containsBoron: true,
      containsFormaldehydeReleaser: true,
      containsMineralOil: true,
      containsChlorinatedParaffins: true,
      pageCount: true,
      sourceUrl: true,
    },
  });
  console.log(`Bestehende SDS: ${sds.length}`);

  // Manufacturer-Lookup-Map über Name (case-insensitiv)
  const manufacturers = await prisma.manufacturer.findMany({
    select: { id: true, name: true, slug: true },
  });
  const mfgByName = new Map<string, { id: string; name: string; slug: string }>();
  for (const m of manufacturers) {
    mfgByName.set(m.name.toLowerCase().trim(), m);
  }
  console.log(`Bekannte Hersteller: ${manufacturers.length}`);

  // Gruppieren nach (manufacturer, productName)
  const groups = new Map<string, typeof sds>();
  for (const s of sds) {
    const key = `${s.manufacturer.toLowerCase().trim()}::${s.productName.toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  let created = 0;
  let updated = 0;
  let skippedNoMfg = 0;
  let skippedBadName = 0;
  const unknownMfg = new Set<string>();

  for (const [key, items] of groups) {
    // Prefer DE über andere Sprachen; sonst längster Name
    items.sort((a, b) => {
      if (a.language === "DE" && b.language !== "DE") return -1;
      if (a.language !== "DE" && b.language === "DE") return 1;
      return b.productName.length - a.productName.length;
    });
    const best = items[0];

    // Hersteller nachschlagen (case-insensitive). Auch alternative Bindestrich-Varianten probieren.
    const mfgKey = best.manufacturer.toLowerCase().trim();
    let mfg = mfgByName.get(mfgKey);
    if (!mfg) {
      // Versuche normalisierte Variante (z.B. "Klüber Lubrication" → "kluber lubrication")
      const normalized = mfgKey
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      for (const [name, m] of mfgByName) {
        const nameNorm = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
        if (nameNorm === normalized) {
          mfg = m;
          break;
        }
      }
    }
    if (!mfg) {
      unknownMfg.add(best.manufacturer);
      skippedNoMfg++;
      continue;
    }

    // Name säubern (gleicher Eintrag wie best.productName)
    const name = best.productName.trim();
    if (name.length < 2 || name.length > 200) {
      skippedBadName++;
      continue;
    }
    const productSlug = slug(name);

    // Kategorie mappen
    const category = (CATEGORY_MAP[best.category] ?? "OTHER") as
      | "COOLANT_WATER_MIX"
      | "COOLANT_NEAT"
      | "HYDRAULIC_OIL"
      | "GEAR_OIL"
      | "GREASE"
      | "SPECIALTY"
      | "OTHER";

    // Markierungen aus SDS übernehmen (Boolean-Felder im Product-Schema)
    const data = {
      name,
      slug: productSlug,
      category,
      containsBor: best.containsBoron ?? undefined,
      containsFormaldehydeDepot: best.containsFormaldehydeReleaser ?? undefined,
      containsMineralOil: best.containsMineralOil ?? undefined,
      containsChlorine: best.containsChlorinatedParaffins ?? undefined,
      sdsUrl: best.sourceUrl ?? undefined,
      sourceConfidence: "modelliert" as const,
      notes: `Auto-generiert aus SDS-Bestand. ${items.length > 1 ? `${items.length} SDS-Varianten gefunden (Sprachen, Versionen).` : ""}`,
    };

    const existing = await prisma.product.findUnique({
      where: { manufacturerId_slug: { manufacturerId: mfg.id, slug: productSlug } },
    });
    if (existing) {
      // Nur leere Felder ergänzen — bestehende manuelle Daten nicht überschreiben
      const patch: Record<string, unknown> = {};
      if (existing.containsBor == null && data.containsBor != null)
        patch.containsBor = data.containsBor;
      if (existing.containsFormaldehydeDepot == null && data.containsFormaldehydeDepot != null)
        patch.containsFormaldehydeDepot = data.containsFormaldehydeDepot;
      if (existing.containsMineralOil == null && data.containsMineralOil != null)
        patch.containsMineralOil = data.containsMineralOil;
      if (existing.containsChlorine == null && data.containsChlorine != null)
        patch.containsChlorine = data.containsChlorine;
      if (!existing.sdsUrl && data.sdsUrl) patch.sdsUrl = data.sdsUrl;
      if (Object.keys(patch).length > 0) {
        await prisma.product.update({ where: { id: existing.id }, data: patch });
        updated++;
      }
    } else {
      await prisma.product.create({
        data: { ...data, manufacturerId: mfg.id },
      });
      created++;
    }
  }

  console.log(`\nFertig:`);
  console.log(`  ${created} Produkte neu angelegt`);
  console.log(`  ${updated} Produkte ergänzt`);
  console.log(`  ${skippedNoMfg} übersprungen (Hersteller nicht in DB)`);
  console.log(`  ${skippedBadName} übersprungen (Name zu kurz/lang)`);

  if (unknownMfg.size > 0) {
    console.log(`\nUnbekannte Hersteller (${unknownMfg.size}):`);
    for (const m of [...unknownMfg].sort()) console.log(`  - ${m}`);
  }

  const total = await prisma.product.count();
  console.log(`\nDB-Stand: ${total} Produkte`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
