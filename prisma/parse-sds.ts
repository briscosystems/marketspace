/**
 * Parser-Lauf über alle SafetyDataSheets in der DB.
 * Liest extractedText, lässt den Parser drüberlaufen, schreibt strukturierte
 * Felder zurück. Idempotent.
 *
 * Aufruf: npx tsx prisma/parse-sds.ts
 */
import { PrismaClient } from "@prisma/client";
import { parseSdsText, PARSER_VERSION } from "../lib/sds-parser";

const prisma = new PrismaClient();

async function main() {
  const sdsList = await prisma.safetyDataSheet.findMany({
    select: { id: true, productName: true, extractedText: true, parsedVersion: true },
  });
  console.log(`Parser-Version ${PARSER_VERSION} — ${sdsList.length} SDS zu verarbeiten.`);

  let updated = 0;
  let withHStmts = 0;
  let withPh = 0;
  let withFlash = 0;
  let withDensity = 0;
  let withCas = 0;
  let withTransport = 0;
  let withGhs = 0;

  for (const s of sdsList) {
    const parsed = parseSdsText(s.extractedText);
    await prisma.safetyDataSheet.update({
      where: { id: s.id },
      data: {
        hStatements: parsed.hStatements,
        pStatements: parsed.pStatements,
        ghsPictograms: parsed.ghsPictograms,
        signalWord: parsed.signalWord,
        physicalState: parsed.physicalState,
        appearanceColor: parsed.appearanceColor,
        odor: parsed.odor,
        phValue: parsed.phValue,
        phContext: parsed.phContext,
        flashpointC: parsed.flashpointC,
        densityGcm3: parsed.densityGcm3,
        viscosityKv40: parsed.viscosityKv40,
        pourpointC: parsed.pourpointC,
        boilingPointC: parsed.boilingPointC,
        waterSolubility: parsed.waterSolubility,
        casNumbers: parsed.casNumbers,
        adrClass: parsed.adrClass,
        unNumber: parsed.unNumber,
        transportClass: parsed.transportClass,
        supplierName: parsed.supplierName,
        supplierAddress: parsed.supplierAddress,
        emergencyPhone: parsed.emergencyPhone,
        parsedAt: new Date(),
        parsedVersion: PARSER_VERSION,
      },
    });
    updated++;
    if (parsed.hStatements.length > 0) withHStmts++;
    if (parsed.phValue != null) withPh++;
    if (parsed.flashpointC != null) withFlash++;
    if (parsed.densityGcm3 != null) withDensity++;
    if (parsed.casNumbers.length > 0) withCas++;
    if (parsed.transportClass) withTransport++;
    if (parsed.ghsPictograms.length > 0) withGhs++;
  }

  console.log(`\nFertig: ${updated}/${sdsList.length} SDS aktualisiert.\n`);
  console.log(`Trefferquote pro Feld:`);
  console.log(`  H-Sätze:       ${withHStmts}/${updated} (${pct(withHStmts, updated)}%)`);
  console.log(`  GHS-Piktogr.:  ${withGhs}/${updated} (${pct(withGhs, updated)}%)`);
  console.log(`  pH-Wert:       ${withPh}/${updated} (${pct(withPh, updated)}%)`);
  console.log(`  Flammpunkt:    ${withFlash}/${updated} (${pct(withFlash, updated)}%)`);
  console.log(`  Dichte:        ${withDensity}/${updated} (${pct(withDensity, updated)}%)`);
  console.log(`  CAS-Nummern:   ${withCas}/${updated} (${pct(withCas, updated)}%)`);
  console.log(`  Transport-Cl.: ${withTransport}/${updated} (${pct(withTransport, updated)}%)`);
}

function pct(n: number, total: number): string {
  if (total === 0) return "0";
  return ((n / total) * 100).toFixed(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
