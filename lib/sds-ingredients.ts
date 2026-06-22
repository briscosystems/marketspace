/**
 * Inhaltsstoff- und Biozid-Heuristik für SDS-Texte.
 *
 * Wird vom SDS-Parser konsumiert, um REACH-/Inhaltsstoff-Flags am
 * SafetyDataSheet-Datensatz zu setzen. Treffer kombinieren CAS-Nummer-Erkennung
 * (zuverlässig) mit Klartext-Treffern aus Section 3 (Zusammensetzung) und
 * Negativ-Aussagen ("borfrei", "chlorfrei").
 *
 * Ziel: für 80% der EU-Standard-SDS die regulatorisch relevanten Felder
 * tri-state (true / false / null = unklar) füllen.
 */

export type IngredientFlags = {
  reachCompliant: boolean | null;
  reachNotes: string | null;
  svhcSubstances: string[];

  containsBoron: boolean | null;
  containsFormaldehydeReleaser: boolean | null;
  containsSecondaryAmines: boolean | null;
  containsChlorinatedParaffins: boolean | null;
  containsMineralOil: boolean | null;
  containsPrimaryAromaticAmines: boolean | null;

  hasBactericide: boolean | null;
  hasFungicide: boolean | null;
  biocidalActives: string[];
};

export const EMPTY_FLAGS: IngredientFlags = {
  reachCompliant: null,
  reachNotes: null,
  svhcSubstances: [],
  containsBoron: null,
  containsFormaldehydeReleaser: null,
  containsSecondaryAmines: null,
  containsChlorinatedParaffins: null,
  containsMineralOil: null,
  containsPrimaryAromaticAmines: null,
  hasBactericide: null,
  hasFungicide: null,
  biocidalActives: [],
};

// ----------------------------------------------------------------------------
// CAS-Kataloge: bekannte regulatorisch relevante Stoffe für KSS und Schmierstoffe
// ----------------------------------------------------------------------------

const BORON_CAS: Record<string, string> = {
  "10043-35-3": "Borsäure",
  "1303-86-2": "Bortrioxid",
  "1303-96-4": "Dinatriumtetraborat-Decahydrat (Borax)",
  "1330-43-4": "Dinatriumtetraborat (wasserfrei)",
  "12179-04-3": "Borax-Pentahydrat",
  "12267-73-1": "Dinatriumtetraborat-Tetrahydrat",
  "11138-47-9": "Natriumperborat",
  "10486-00-7": "Natriumperborat-Tetrahydrat",
  "7775-19-1": "Natriummetaborat",
};

const FORMALDEHYDE_RELEASER_CAS: Record<string, string> = {
  "52-51-7": "Bronopol (BNPD)",
  "1854-26-8": "DMDM-Hydantoin",
  "4080-31-3": "Quaternium-15",
  "78491-02-8": "Tris(hydroxymethyl)nitromethan",
  "139-87-7": "EHTM",
  "3724-43-4": "Methenamine",
  "100-97-0": "Hexamethylentetramin (Urotropin)",
  "75673-43-7": "Hexahydrotriazin",
  "4719-04-4": "Hexahydro-1,3,5-tris(2-hydroxyethyl)-1,3,5-triazin (Grotan BK)",
  "50-00-0": "Formaldehyd (frei)",
};

const SECONDARY_AMINE_CAS: Record<string, string> = {
  "111-42-2": "Diethanolamin (DEA)",
  "110-91-8": "Morpholin",
  "109-89-7": "Diethylamin",
  "108-91-8": "Cyclohexylamin",
  "101-83-7": "Dicyclohexylamin",
  "142-84-7": "Dipropylamin",
  "111-92-2": "Dibutylamin",
};

const PAA_CAS: Record<string, string> = {
  "62-53-3": "Anilin",
  "95-53-4": "o-Toluidin",
  "106-49-0": "p-Toluidin",
  "95-69-2": "4-Chlor-2-methylanilin",
};

const CHLORINATED_PARAFFIN_CAS: Record<string, string> = {
  "85535-84-8": "SCCP (C10-13)",
  "85535-85-9": "MCCP (C14-17)",
  "63449-39-8": "Chlorparaffine",
  "108171-26-2": "Chlorierte Paraffine",
};

const MINERAL_OIL_CAS: Record<string, string> = {
  "64742-65-0": "Mineralöl, schwer (hydrobehandelt)",
  "64742-54-7": "Mineralöl, schwer (Paraffinöl)",
  "64742-52-5": "Mineralöl, schwer (Naphthenöl)",
  "64742-53-6": "Mineralöl (hydrobehandelt, naphtenisch)",
  "72623-87-1": "Mineralöl, schwerparaffinisch",
  "72623-86-0": "Mineralöl, leicht (paraffinisch)",
  "64741-88-4": "Mineralöl (lösungsmittelraffiniert, schwer)",
  "64741-89-5": "Mineralöl (lösungsmittelraffiniert, leicht)",
  "8042-47-5": "Weißöl",
};

const BACTERICIDE_CAS: Record<string, string> = {
  "2682-20-4": "MIT (Methylisothiazolinon)",
  "2634-33-5": "BIT (Benzisothiazolinon)",
  "26172-55-4": "CMIT (Chlormethylisothiazolinon)",
  "55965-84-9": "CMIT/MIT-Mischung (Kathon)",
  "64359-81-5": "DCOIT (Sea-Nine)",
  "26530-20-1": "OIT (Octylisothiazolinon)",
  "10222-01-2": "DBNPA",
  "2372-82-9": "Nonylphenol-EO-Quat",
  "115-77-5": "Pentaerythrit",
  "3811-73-2": "Natrium-Pyrithion (Natrium-Omadine)",
};

const FUNGICIDE_CAS: Record<string, string> = {
  "55406-53-6": "IPBC",
  "3811-73-2": "Natrium-Pyrithion (Natrium-Omadine)",
  "13463-41-7": "Zink-Pyrithion",
  "64359-81-5": "DCOIT (Sea-Nine)",
};

// SVHC-Kandidatenliste (Auszug REACH Anhang XIV/Annex XV, häufig in KSS auftauchend)
const SVHC_CAS: Record<string, string> = {
  "85535-84-8": "SCCP (SVHC)",
  "78-93-3": "MEK", // nicht SVHC, aber zur Vorsicht; falls falsch, später entfernen
  "75-09-2": "Dichlormethan",
  "111-15-9": "EGEE-Acetat",
  "111-96-6": "Bis(2-methoxyethyl)-ether (Diglyme)",
  "10043-35-3": "Borsäure (SVHC, repr. tox.)",
  "1303-96-4": "Borax (SVHC, repr. tox.)",
  "1330-43-4": "Dinatriumtetraborat (SVHC)",
  "1303-86-2": "Bortrioxid (SVHC)",
};

// ----------------------------------------------------------------------------
// Hilfsfunktionen
// ----------------------------------------------------------------------------

function casListIntersection(
  casNumbers: string[],
  catalog: Record<string, string>,
): string[] {
  return casNumbers.filter((c) => c in catalog).map((c) => `${catalog[c]} (${c})`);
}

function hasAnyPhrase(text: string, phrases: RegExp[]): boolean {
  return phrases.some((p) => p.test(text));
}

// "borfrei", "boron free", "ohne Bor" — explizite Negativ-Aussagen
const BORON_FREE_PATTERNS = [
  /\bbor(?:[- ])?frei\b/i,
  /\bboron[- ]?free\b/i,
  /\bohne\s+Bor\b/i,
  /\benthält\s+kein\s+Bor\b/i,
  /\bfree\s+from\s+boron\b/i,
];

const CHLORINE_FREE_PATTERNS = [
  /\bchlor(?:[- ])?frei\b/i,
  /\bchlorine[- ]?free\b/i,
  /\bohne\s+Chlor\b/i,
  /\bfree\s+from\s+chlorin(?:e|ated)\b/i,
];

const FORMALDEHYDE_FREE_PATTERNS = [
  /\bformaldehyd(?:[- ])?frei\b/i,
  /\bformaldehyde[- ]?free\b/i,
  /\bohne\s+Formaldehyd\b/i,
];

const SECONDARY_AMINE_FREE_PATTERNS = [
  /\bamin(?:[- ])?frei\b/i,
  /\bohne\s+(?:sekund[äa]re\s+)?Amine?\b/i,
  /\bDEA[- ]frei\b/i,
];

const MINERAL_OIL_FREE_PATTERNS = [
  /\bmineral(?:öl)?(?:[- ])?frei\b/i,
  /\bmineral[- ]?oil[- ]?free\b/i,
  /\bohne\s+Mineral[öo]l\b/i,
];

// Positiv-Treffer auch via Klartext (falls CAS aus SDS verschleiert ist)
const BORON_TEXT_PATTERNS = [
  /\bBorsäure\b/i,
  /\bBoric\s+acid\b/i,
  /\bBorate?\b/i,
  /\bBorax\b/i,
];

const FORMALDEHYDE_RELEASER_TEXT_PATTERNS = [
  /\bBronopol\b/i,
  /\bDMDM[- ]?Hydantoin\b/i,
  /\bHexahydrotriazin\b/i,
  /\bGrotan\b/i,  // Marken-Name
  /\bFormaldehyd[- ]?(?:abspaltend|depot|donor)\b/i,
  /\bformaldehyd?e[- ]?(?:releasing|donor)\b/i,
];

const SECONDARY_AMINE_TEXT_PATTERNS = [
  /\bDiethanolamin\b/i,
  /\bDiethanolamine\b/i,
  /\bMorpholin\b/i,
  /\bMorpholine\b/i,
  /\bDicyclohexylamin\b/i,
  /\bDicyclohexylamine\b/i,
  /\bsekund[äa]re?\s+Amine?\b/i,
  /\bsecondary\s+amines?\b/i,
];

const BACTERICIDE_TEXT_PATTERNS = [
  /\bBakterizid\b/i,
  /\bBactericid/i,
  /\bBiozid\b/i,
  /\bBiocide\b/i,
  /\bIsothiazolinon/i,
  /\bIsothiazolone/i,
  /\bMethylisothiazolin/i,
  /\bBenzisothiazolin/i,
  /\bChlormethylisothiazolin/i,
  /\bKonservierungsmittel\b/i,
  /\bpreservative\b/i,
  /\bMicrobiocide\b/i,
  /\bMikrobiozid\b/i,
  /\b(?:Kathon|Acticide|Proxel|Mergal|Nipacide|Grotan|Bioban)\b/i,
];

const FUNGICIDE_TEXT_PATTERNS = [
  /\bFungizid\b/i,
  /\bFungicid/i,
  /\bIPBC\b/,
  /\bPyrithion\b/i,
];

const CHLORINATED_PARAFFIN_TEXT_PATTERNS = [
  /\bchlorierte\s+Paraffine\b/i,
  /\bchlorinated\s+paraffins?\b/i,
  /\bSCCP\b/,
  /\bMCCP\b/,
];

const MINERAL_OIL_TEXT_PATTERNS = [
  /\bMineral[öo]l\b/i,
  /\bMineral\s*oil\b/i,
  /\bParaffin(?:isches?\s+)?[öo]l\b/i,
  /\bNaphthen(?:isches?\s+)?[öo]l\b/i,
];

// REACH-Aussagen
const REACH_COMPLIANT_PATTERNS = [
  /\bREACH[- ]?konform\b/i,
  /\bkonform\s+(?:mit|gemäss)\s+REACH\b/i,
  /\bcompl(?:ies|iant)\s+with\s+REACH\b/i,
  /\bin\s+accordance\s+with\s+REACH\b/i,
  /\balle\s+(?:Bestandteile|Stoffe)\s+sind\s+(?:vorregistriert|registriert)\b/i,
  /\bregistered\s+under\s+REACH\b/i,
  /\bgemäß\s+(?:der\s+)?Verordnung\s+\(EG\)\s+Nr\.\s*1907\/2006\b/i,
];

const REACH_NON_COMPLIANT_PATTERNS = [
  /\bnicht\s+REACH[- ]?konform\b/i,
  /\bnicht\s+registriert\b.{0,40}\bREACH\b/i,
  /\bnot\s+REACH[- ]?compliant\b/i,
];

const SVHC_MENTION_PATTERNS = [
  /\bSVHC\b/,
  /\bKandidaten(?:liste|stoff)\b/i,
  /\bcandidate\s+list\b/i,
  /\bAnhang\s+XIV\b/i,
  /\bAnnex\s+XIV\b/i,
];

// ----------------------------------------------------------------------------
// Hauptfunktion
// ----------------------------------------------------------------------------

export function detectIngredientFlags(
  text: string,
  casNumbers: string[],
): IngredientFlags {
  if (!text || text.length < 100) return EMPTY_FLAGS;

  // CAS-basierte Erkennung
  const boronCas = casListIntersection(casNumbers, BORON_CAS);
  const formaldehydeCas = casListIntersection(casNumbers, FORMALDEHYDE_RELEASER_CAS);
  const secondaryAmineCas = casListIntersection(casNumbers, SECONDARY_AMINE_CAS);
  const paaCas = casListIntersection(casNumbers, PAA_CAS);
  const chlorinatedParaffinCas = casListIntersection(casNumbers, CHLORINATED_PARAFFIN_CAS);
  const mineralOilCas = casListIntersection(casNumbers, MINERAL_OIL_CAS);
  const bactericideCas = casListIntersection(casNumbers, BACTERICIDE_CAS);
  const fungicideCas = casListIntersection(casNumbers, FUNGICIDE_CAS);
  const svhcCas = casListIntersection(casNumbers, SVHC_CAS);

  // Klartext-Heuristik (ergänzt CAS — manchmal werden Stoffe < 1% nicht mit CAS gelistet)
  const boronText = hasAnyPhrase(text, BORON_TEXT_PATTERNS);
  const formaldehydeText = hasAnyPhrase(text, FORMALDEHYDE_RELEASER_TEXT_PATTERNS);
  const secondaryAmineText = hasAnyPhrase(text, SECONDARY_AMINE_TEXT_PATTERNS);
  const bactericideText = hasAnyPhrase(text, BACTERICIDE_TEXT_PATTERNS);
  const fungicideText = hasAnyPhrase(text, FUNGICIDE_TEXT_PATTERNS);
  const chlorinatedParaffinText = hasAnyPhrase(text, CHLORINATED_PARAFFIN_TEXT_PATTERNS);
  const mineralOilText = hasAnyPhrase(text, MINERAL_OIL_TEXT_PATTERNS);

  // Negativ-Aussagen (explizit "X-frei")
  const boronFree = hasAnyPhrase(text, BORON_FREE_PATTERNS);
  const chlorineFree = hasAnyPhrase(text, CHLORINE_FREE_PATTERNS);
  const formaldehydeFree = hasAnyPhrase(text, FORMALDEHYDE_FREE_PATTERNS);
  const secondaryAmineFree = hasAnyPhrase(text, SECONDARY_AMINE_FREE_PATTERNS);
  const mineralOilFree = hasAnyPhrase(text, MINERAL_OIL_FREE_PATTERNS);

  // REACH
  const reachPos = hasAnyPhrase(text, REACH_COMPLIANT_PATTERNS);
  const reachNeg = hasAnyPhrase(text, REACH_NON_COMPLIANT_PATTERNS);
  const svhcMentioned = hasAnyPhrase(text, SVHC_MENTION_PATTERNS);

  let reachCompliant: boolean | null = null;
  if (reachPos && !reachNeg) reachCompliant = true;
  else if (reachNeg) reachCompliant = false;

  // SVHC-Notes
  let reachNotes: string | null = null;
  if (svhcCas.length > 0) reachNotes = `SVHC-Stoffe gefunden: ${svhcCas.join(", ")}`;
  else if (/SVHC[^.]*keine?\b|no\s+SVHC|frei\s+von\s+SVHC/i.test(text))
    reachNotes = "Laut SDS keine SVHC-Stoffe enthalten";
  else if (svhcMentioned) reachNotes = "SVHC im Text erwähnt — manuell prüfen";

  // Negativ-Aussagen dominieren über schwache Positiv-Treffer:
  // wenn CAS gefunden UND "X-frei" Aussage steht, ist das ein Widerspruch → Positiv-CAS gewinnt.

  const containsBoron =
    boronCas.length > 0 || boronText ? true : boronFree ? false : null;
  const containsFormaldehydeReleaser =
    formaldehydeCas.length > 0 || formaldehydeText
      ? true
      : formaldehydeFree
        ? false
        : null;
  const containsSecondaryAmines =
    secondaryAmineCas.length > 0 || secondaryAmineText
      ? true
      : secondaryAmineFree
        ? false
        : null;
  const containsPrimaryAromaticAmines = paaCas.length > 0 ? true : null;
  const containsChlorinatedParaffins =
    chlorinatedParaffinCas.length > 0 || chlorinatedParaffinText
      ? true
      : chlorineFree
        ? false
        : null;
  const containsMineralOil =
    mineralOilCas.length > 0 || mineralOilText ? true : mineralOilFree ? false : null;

  const hasBactericide =
    bactericideCas.length > 0 || bactericideText ? true : null;
  const hasFungicide = fungicideCas.length > 0 || fungicideText ? true : null;

  const biocidalActives = Array.from(
    new Set([...bactericideCas, ...fungicideCas]),
  );

  return {
    reachCompliant,
    reachNotes,
    svhcSubstances: svhcCas,
    containsBoron,
    containsFormaldehydeReleaser,
    containsSecondaryAmines,
    containsChlorinatedParaffins,
    containsMineralOil,
    containsPrimaryAromaticAmines,
    hasBactericide,
    hasFungicide,
    biocidalActives,
  };
}
