// One-time-Backfill: berechnet searchTokens für alle bestehenden SDS und Products.
// Idempotent — kann mehrfach laufen.
import { PrismaClient } from "@prisma/client";
import { buildSearchTokens } from "../lib/normalize-search";

const prisma = new PrismaClient();

async function main() {
  // SDS
  const sds = await prisma.safetyDataSheet.findMany({
    select: { id: true, productName: true, manufacturer: true, version: true, searchTokens: true },
  });
  console.log(`SDS gesamt: ${sds.length}`);

  let sdsUpdated = 0;
  for (const s of sds) {
    const tokens = buildSearchTokens({
      productName: s.productName,
      manufacturer: s.manufacturer,
      version: s.version,
    });
    if (s.searchTokens === tokens) continue;
    await prisma.safetyDataSheet.update({ where: { id: s.id }, data: { searchTokens: tokens } });
    sdsUpdated++;
  }
  console.log(`  SDS aktualisiert: ${sdsUpdated}`);

  // Products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      productFamily: true,
      searchTokens: true,
      manufacturer: { select: { name: true } },
    },
  });
  console.log(`Products gesamt: ${products.length}`);

  let prodUpdated = 0;
  for (const p of products) {
    const tokens = buildSearchTokens({
      productName: p.name,
      manufacturer: p.manufacturer.name,
      version: p.productFamily,
    });
    if (p.searchTokens === tokens) continue;
    await prisma.product.update({ where: { id: p.id }, data: { searchTokens: tokens } });
    prodUpdated++;
  }
  console.log(`  Products aktualisiert: ${prodUpdated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
