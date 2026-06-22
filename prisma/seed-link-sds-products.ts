// Verknüpft Products mit ihren SDS aus der DB.
//
// Match-Strategie: (manufacturer-Name normalisiert + productName normalisiert)
// Bei mehreren SDS-Treffern pro Produkt: bevorzuge DE-Sprache > Version mit
// höchster Seitenzahl > neuestes parsedAt.
//
// Idempotent — überschreibt safetyDataSheetId nur wenn besser oder leer.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Score: höher = besser, für Auswahl bei mehrfach-Treffern
function scoreSds(sds: { language: string; pageCount: number | null; parsedAt: Date | null }): number {
  let s = 0;
  if (sds.language === "DE") s += 100;
  if (sds.language === "EN") s += 50;
  if (sds.pageCount) s += Math.min(sds.pageCount, 30); // bevorzuge ausführlichere Dokumente
  if (sds.parsedAt) s += 10;
  return s;
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      manufacturerId: true,
      manufacturer: { select: { name: true } },
      safetyDataSheetId: true,
    },
  });

  const sdsAll = await prisma.safetyDataSheet.findMany({
    select: {
      id: true,
      manufacturer: true,
      manufacturerId: true,
      productName: true,
      language: true,
      pageCount: true,
      parsedAt: true,
    },
  });

  console.log(`Produkte: ${products.length}, SDS: ${sdsAll.length}`);

  // Lookup-Index: Map<manufacturerIdOrName, Map<normalizedProductName, SDS[]>>
  const byMfg = new Map<string, Map<string, typeof sdsAll>>();
  function addToIndex(key: string, productName: string, sds: (typeof sdsAll)[number]) {
    const n = norm(productName);
    if (!byMfg.has(key)) byMfg.set(key, new Map());
    const inner = byMfg.get(key)!;
    if (!inner.has(n)) inner.set(n, []);
    inner.get(n)!.push(sds);
  }
  for (const s of sdsAll) {
    // Indexiere unter manufacturerId (wenn gesetzt) UND unter normalisiertem Manufacturer-Namen
    if (s.manufacturerId) addToIndex(`id:${s.manufacturerId}`, s.productName, s);
    addToIndex(`name:${norm(s.manufacturer)}`, s.productName, s);
  }

  let linked = 0;
  let kept = 0;
  let noMatch = 0;
  const noMatchExamples: { name: string; mfg: string }[] = [];

  for (const p of products) {
    if (!p.manufacturer) continue;
    const mfgKeyById = `id:${p.manufacturerId}`;
    const mfgKeyByName = `name:${norm(p.manufacturer.name)}`;
    const productNameN = norm(p.name);

    // Suche zuerst über manufacturerId, dann über Manufacturer-Name
    let candidates: typeof sdsAll = [];
    for (const key of [mfgKeyById, mfgKeyByName]) {
      const inner = byMfg.get(key);
      if (!inner) continue;
      // Exact-Match auf normalisierten Produktnamen
      if (inner.has(productNameN)) {
        candidates = candidates.concat(inner.get(productNameN)!);
      }
      // Zusätzlich: ein SDS-Name, der den Produktnamen vollständig enthält oder umgekehrt
      // (z.B. SDS "Tellus S2 M 46 (Mineralöl)" matched Produkt "Tellus S2 M 46")
      for (const [sdsNameN, list] of inner) {
        if (sdsNameN === productNameN) continue; // exact bereits oben
        if (
          sdsNameN.length >= 6 &&
          productNameN.length >= 6 &&
          (sdsNameN.includes(productNameN) || productNameN.includes(sdsNameN))
        ) {
          // Längendifferenz max 30% — sonst zu lose
          const longer = Math.max(sdsNameN.length, productNameN.length);
          const shorter = Math.min(sdsNameN.length, productNameN.length);
          if (longer > 0 && shorter / longer >= 0.7) {
            candidates = candidates.concat(list);
          }
        }
      }
    }

    if (candidates.length === 0) {
      noMatch++;
      if (noMatchExamples.length < 10)
        noMatchExamples.push({ name: p.name, mfg: p.manufacturer.name });
      continue;
    }

    // Dedupe + bestes nach Score
    const seen = new Set<string>();
    const unique = candidates.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    unique.sort((a, b) => scoreSds(b) - scoreSds(a));
    const best = unique[0];

    if (p.safetyDataSheetId === best.id) {
      kept++;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { safetyDataSheetId: best.id },
    });
    linked++;
  }

  console.log(`\nFertig:`);
  console.log(`  ${linked} Produkte neu verlinkt`);
  console.log(`  ${kept} bestehende Links unverändert`);
  console.log(`  ${noMatch} Produkte ohne SDS-Match`);
  if (noMatchExamples.length > 0) {
    console.log(`\nBeispiele ohne Match (max 10):`);
    for (const ex of noMatchExamples) console.log(`  - ${ex.mfg} :: ${ex.name}`);
  }

  // Stats über die Coverage
  const withSds = await prisma.product.count({ where: { safetyDataSheetId: { not: null } } });
  const total = await prisma.product.count();
  console.log(`\nCoverage: ${withSds}/${total} (${((withSds / total) * 100).toFixed(1)} %) Produkte haben jetzt ein SDS verlinkt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
