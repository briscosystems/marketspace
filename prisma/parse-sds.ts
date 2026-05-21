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
  const hits = {
    hStmts: 0, ph: 0, flash: 0, density: 0, cas: 0, transport: 0, ghs: 0,
    reach: 0, boron: 0, boronFree: 0, formaldehyde: 0, secondaryAmines: 0,
    chlorParaffins: 0, mineralOil: 0, paa: 0, bactericide: 0, fungicide: 0,
    svhc: 0,
  };

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
        reachCompliant: parsed.reachCompliant,
        reachNotes: parsed.reachNotes,
        svhcSubstances: parsed.svhcSubstances,
        containsBoron: parsed.containsBoron,
        containsFormaldehydeReleaser: parsed.containsFormaldehydeReleaser,
        containsSecondaryAmines: parsed.containsSecondaryAmines,
        containsChlorinatedParaffins: parsed.containsChlorinatedParaffins,
        containsMineralOil: parsed.containsMineralOil,
        containsPrimaryAromaticAmines: parsed.containsPrimaryAromaticAmines,
        hasBactericide: parsed.hasBactericide,
        hasFungicide: parsed.hasFungicide,
        biocidalActives: parsed.biocidalActives,
        parsedAt: new Date(),
        parsedVersion: PARSER_VERSION,
      },
    });
    updated++;
    if (parsed.hStatements.length > 0) hits.hStmts++;
    if (parsed.phValue != null) hits.ph++;
    if (parsed.flashpointC != null) hits.flash++;
    if (parsed.densityGcm3 != null) hits.density++;
    if (parsed.casNumbers.length > 0) hits.cas++;
    if (parsed.transportClass) hits.transport++;
    if (parsed.ghsPictograms.length > 0) hits.ghs++;
    if (parsed.reachCompliant != null) hits.reach++;
    if (parsed.containsBoron === true) hits.boron++;
    if (parsed.containsBoron === false) hits.boronFree++;
    if (parsed.containsFormaldehydeReleaser === true) hits.formaldehyde++;
    if (parsed.containsSecondaryAmines === true) hits.secondaryAmines++;
    if (parsed.containsChlorinatedParaffins === true) hits.chlorParaffins++;
    if (parsed.containsMineralOil === true) hits.mineralOil++;
    if (parsed.containsPrimaryAromaticAmines === true) hits.paa++;
    if (parsed.hasBactericide === true) hits.bactericide++;
    if (parsed.hasFungicide === true) hits.fungicide++;
    if (parsed.svhcSubstances.length > 0) hits.svhc++;
  }

  console.log(`\nFertig: ${updated}/${sdsList.length} SDS aktualisiert (Parser v${PARSER_VERSION}).\n`);
  console.log(`Trefferquote — Standard-Felder:`);
  console.log(`  H-Sätze:       ${hits.hStmts}/${updated} (${pct(hits.hStmts, updated)}%)`);
  console.log(`  GHS-Piktogr.:  ${hits.ghs}/${updated} (${pct(hits.ghs, updated)}%)`);
  console.log(`  pH-Wert:       ${hits.ph}/${updated} (${pct(hits.ph, updated)}%)`);
  console.log(`  Flammpunkt:    ${hits.flash}/${updated} (${pct(hits.flash, updated)}%)`);
  console.log(`  Dichte:        ${hits.density}/${updated} (${pct(hits.density, updated)}%)`);
  console.log(`  CAS-Nummern:   ${hits.cas}/${updated} (${pct(hits.cas, updated)}%)`);
  console.log(`  Transport-Cl.: ${hits.transport}/${updated} (${pct(hits.transport, updated)}%)`);
  console.log(`\nTrefferquote — REACH & Inhaltsstoffe:`);
  console.log(`  REACH-Aussage:    ${hits.reach}/${updated} (${pct(hits.reach, updated)}%)`);
  console.log(`  Bor enthält:      ${hits.boron}/${updated}`);
  console.log(`  Bor-frei:         ${hits.boronFree}/${updated}`);
  console.log(`  Formaldehyd-Don.: ${hits.formaldehyde}/${updated}`);
  console.log(`  Sek. Amine:       ${hits.secondaryAmines}/${updated}`);
  console.log(`  Chlorparaffine:   ${hits.chlorParaffins}/${updated}`);
  console.log(`  Mineralöl:        ${hits.mineralOil}/${updated}`);
  console.log(`  PAA:              ${hits.paa}/${updated}`);
  console.log(`  Bakterizid:       ${hits.bactericide}/${updated}`);
  console.log(`  Fungizid:         ${hits.fungicide}/${updated}`);
  console.log(`  SVHC erkannt:     ${hits.svhc}/${updated}`);
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
