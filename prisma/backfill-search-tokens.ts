// One-time-Backfill: berechnet searchTokens für alle bestehenden SDS.
// Idempotent — kann mehrfach laufen.
import { PrismaClient } from "@prisma/client";
import { buildSearchTokens } from "../lib/normalize-search";

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.safetyDataSheet.findMany({
    select: { id: true, productName: true, manufacturer: true, version: true, searchTokens: true },
  });
  console.log(`SDS gesamt: ${all.length}`);

  let updated = 0;
  let unchanged = 0;
  for (const s of all) {
    const tokens = buildSearchTokens({
      productName: s.productName,
      manufacturer: s.manufacturer,
      version: s.version,
    });
    if (s.searchTokens === tokens) {
      unchanged++;
      continue;
    }
    await prisma.safetyDataSheet.update({
      where: { id: s.id },
      data: { searchTokens: tokens },
    });
    updated++;
  }
  console.log(`Aktualisiert: ${updated}, unverändert: ${unchanged}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
