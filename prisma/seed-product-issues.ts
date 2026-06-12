/**
 * Seed-Skript für ProductIssue.
 *
 * Liest TypeScript-Arrays aus /workspace/prisma/product-issues-data/*.ts und
 * verarbeitet sie in die DB. Jede Datei exportiert default ein Array vom Typ
 * IssueInput[].
 *
 * Matched per (manufacturerName + productName). Wenn Match nicht eindeutig,
 * wird der Eintrag übersprungen und gelogged.
 *
 * Idempotent: Vermeidet Duplikate über (productId + sourceUrl + title).
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

type IssueInput = {
  productName: string;
  manufacturerName: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  symptoms?: string[];
  rootCause?: string | null;
  workaround?: string | null;
  preventiveMeasure?: string | null;
  affectedMaterials?: string[];
  affectedOperations?: string[];
  reportedConcentration?: number | null;
  reportedPh?: number | null;
  reportedWaterHardness?: number | null;
  sourceType: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  sourceAuthor?: string | null;
  sourceDate?: string | null;
  language?: string;
  isOfficial?: boolean;
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "");
}

async function main() {
  const dataDir = path.join(process.cwd(), "prisma", "product-issues-data");
  await fs.mkdir(dataDir, { recursive: true });
  const files = (await fs.readdir(dataDir)).filter((f) => f.endsWith(".ts") || f.endsWith(".json"));

  console.log(`Datendateien: ${files.length}`);

  // Alle Produkte einmalig laden für Lookup
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, manufacturer: { select: { name: true } } },
  });
  const productByKey = new Map<string, string[]>();  // exakt-key → product IDs
  // Prefix-Index: pro Hersteller alle Produkte (normalisierter Produktname → ID)
  const productsByMfr = new Map<string, Array<{ normName: string; id: string }>>();
  for (const p of allProducts) {
    const mfrKey = normalize(p.manufacturer.name);
    const prodKey = normalize(p.name);
    const key = mfrKey + "|" + prodKey;
    if (!productByKey.has(key)) productByKey.set(key, []);
    productByKey.get(key)!.push(p.id);
    if (!productsByMfr.has(mfrKey)) productsByMfr.set(mfrKey, []);
    productsByMfr.get(mfrKey)!.push({ normName: prodKey, id: p.id });
  }

  // Fuzzy-Match: gleicher Hersteller, normalisierter Produktname startsWith oder enthält
  function fuzzyMatch(mfrName: string, prodName: string): string[] {
    const mfrKey = normalize(mfrName);
    const target = normalize(prodName);
    const candidates = productsByMfr.get(mfrKey) || [];
    // 1. exact
    const exact = candidates.filter((c) => c.normName === target);
    if (exact.length > 0) return exact.map((c) => c.id);
    // 2. startsWith (DB-Produkt beginnt mit Suchterm, z.B. "Cimperial 1070 SLS" startsWith "cimperial1070")
    const prefix = candidates.filter((c) => c.normName.startsWith(target) && target.length >= 6);
    if (prefix.length === 1) return [prefix[0].id]; // nur bei eindeutig 1 Treffer
    // 3. enthält (Suchterm enthält DB-Produkt oder umgekehrt, längeres in kürzerem)
    const contains = candidates.filter(
      (c) => (target.length >= 6 && c.normName.length >= 6 &&
        (c.normName.includes(target) || target.includes(c.normName)))
    );
    if (contains.length === 1) return [contains[0].id];
    return [];
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const missingProducts = new Set<string>();

  for (const file of files) {
    const fullPath = path.join(dataDir, file);
    console.log(`\n→ ${file}`);
    let issues: IssueInput[] = [];
    try {
      if (file.endsWith(".json")) {
        const raw = await fs.readFile(fullPath, "utf8");
        issues = JSON.parse(raw);
      } else {
        // dynamic import the TS file
        const mod = await import(fullPath);
        issues = mod.default || mod.issues || [];
      }
    } catch (e) {
      console.error(`  ✗ Konnte Datei nicht laden: ${(e as Error).message}`);
      continue;
    }

    console.log(`  ${issues.length} Einträge im File`);

    for (const issue of issues) {
      const key = normalize(issue.manufacturerName) + "|" + normalize(issue.productName);
      let matchedIds = productByKey.get(key) || [];

      // Fallback: fuzzy match wenn kein exakter Treffer
      if (matchedIds.length === 0) {
        matchedIds = fuzzyMatch(issue.manufacturerName, issue.productName);
      }

      if (matchedIds.length === 0) {
        missingProducts.add(`${issue.manufacturerName} :: ${issue.productName}`);
        skipped++;
        continue;
      }

      // Bei mehreren Matches: alle bedienen (selten — z.B. Produktname doppelt)
      for (const productId of matchedIds) {
        const sourceDate = issue.sourceDate ? new Date(issue.sourceDate) : null;
        // Check ob schon existiert (productId + sourceUrl + title)
        const existing = await prisma.productIssue.findFirst({
          where: {
            productId,
            ...(issue.sourceUrl ? { sourceUrl: issue.sourceUrl } : {}),
            title: issue.title,
          },
        });

        const data = {
          productId,
          category: issue.category as never,
          severity: (issue.severity || "MEDIUM") as never,
          status: "PENDING" as never,
          title: issue.title.slice(0, 500),
          description: issue.description,
          symptoms: issue.symptoms || [],
          rootCause: issue.rootCause || null,
          workaround: issue.workaround || null,
          preventiveMeasure: issue.preventiveMeasure || null,
          affectedMaterials: issue.affectedMaterials || [],
          affectedOperations: issue.affectedOperations || [],
          reportedConcentration: issue.reportedConcentration ?? null,
          reportedPh: issue.reportedPh ?? null,
          reportedWaterHardness: issue.reportedWaterHardness ?? null,
          sourceType: (issue.sourceType || "OTHER") as never,
          sourceUrl: issue.sourceUrl || null,
          sourceTitle: issue.sourceTitle || null,
          sourceAuthor: issue.sourceAuthor || null,
          sourceDate,
          language: (issue.language || "DE") as never,
          isOfficial: !!issue.isOfficial,
        };

        if (existing) {
          await prisma.productIssue.update({
            where: { id: existing.id },
            data: { ...data, reportCount: { increment: 0 } },
          });
          updated++;
        } else {
          await prisma.productIssue.create({ data });
          inserted++;
        }
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped (Produkt nicht in DB): ${skipped}`);

  if (missingProducts.size > 0) {
    console.log(`\n  Top fehlende Produkte (Stichprobe):`);
    let i = 0;
    for (const p of missingProducts) {
      if (i++ >= 20) break;
      console.log(`    - ${p}`);
    }
  }

  const total = await prisma.productIssue.count();
  console.log(`\n  Total ProductIssue in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
