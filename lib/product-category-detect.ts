/**
 * Leitet aus einem Freitext (Suchanfrage, Anforderungsbeschreibung) die
 * gemeinte Produktart ab — damit Suchen/Alternativen sauber auf den richtigen
 * Produkttyp begrenzt werden und z. B. bei „Gleitbahnöl" keine
 * Kühlschmierstoffe in den Ergebnissen auftauchen.
 *
 * Deterministische Schlüsselwort-Heuristik (kein KI-Call). Reihenfolge zählt:
 * spezifischere Begriffe stehen vor allgemeinen.
 */

export type DetectedCategory =
  | "COOLANT_WATER_MIX"
  | "COOLANT_NEAT"
  | "GRINDING_OIL"
  | "EDM_FLUID"
  | "HYDRAULIC_OIL"
  | "GEAR_OIL"
  | "COMPRESSOR_OIL"
  | "HONING_LAPPING_OIL"
  | "MQL_FLUID"
  | "FIRE_RESISTANT_HYDRAULIC"
  | "CIRCULATION_OIL"
  | "OPEN_GEAR_LUBRICANT"
  | "FORGING_LUBRICANT"
  | "MASS_FINISHING_COMPOUND"
  | "POLYMER_QUENCHANT"
  | "LUBRICATING_PASTE"
  | "DRY_FILM_LUBRICANT"
  | "SLIDEWAY_OIL"
  | "SPINDLE_OIL"
  | "TURBINE_OIL"
  | "CHAIN_OIL"
  | "REFRIGERATION_OIL"
  | "VACUUM_PUMP_OIL"
  | "FORMING_OIL"
  | "WIRE_DRAWING"
  | "RELEASE_AGENT"
  | "HEAT_TRANSFER_OIL"
  | "QUENCHING_OIL"
  | "TRANSFORMER_OIL"
  | "CLEANER"
  | "CORROSION_PROTECTION"
  | "GREASE"
  | "ADDITIVE";

// Jede Regel: Muster (auf lowercase-Text angewendet) → Kategorien.
// Mehrere Kategorien, wenn der Begriff mehrdeutig ist (z. B. „KSS" =
// wassermischbar ODER nicht wassermischbar).
const RULES: { re: RegExp; cats: DetectedCategory[] }[] = [
  // Sonderfall zuerst: „wassermischbarer Schleif-KSS" / „Schleifemulsion" ist
  // eine Emulsion und KEIN Schleiföl. Nur diese Kombination greift vor — ein
  // pauschaler Emulsions-Vorrang würde z. B. „wassermischbare Ziehpaste"
  // fälschlich zum Kühlschmierstoff machen.
  {
    re: /(schleif|hon)\w*[\s-]*(emulsion|kss)|(emulsion|wassermischbar|wassergemischt)\w*[\s-]*(schleif|hon)/,
    cats: ["COOLANT_WATER_MIX"],
  },
  { re: /gleitbahn|bettbahn|führungsbahn|fuehrungsbahn|slideway|way.?oil|\bcgl?p\b/, cats: ["SLIDEWAY_OIL"] },
  // Drahtziehen ist ein eigener Markt (Ziehseifen/-fette, Nassziehmittel) und
  // wird von Umform-/Stanzölen getrennt — Einkäufer suchen gezielt danach.
  { re: /drahtzieh|drahtzug|ziehseife|ziehfett|ziehpaste|nassziehmittel|drawing.?soap|wire.?draw/, cats: ["WIRE_DRAWING"] },
  { re: /gesenkschmier|gesenktrenn|schmiedehilfsmittel|schmiedetrenn|warmumform|forging.?die/, cats: ["FORGING_LUBRICANT"] },
  { re: /ziehmittel|ziehöl|ziehoel|tiefzieh|umform|stanz|drückwalz|drueckwalz|abkant|forming/, cats: ["FORMING_OIL"] },
  { re: /trennmittel|formentrenn|schalungsöl|schalungsoel|schalöl|schaloel|betontrennmittel|release.?agent|druckguss.?trenn/, cats: ["RELEASE_AGENT"] },
  { re: /erodier|\bedm\b|funkenerosion|dielektrikum|dielectric/, cats: ["EDM_FLUID"] },
  // Honen/Läppen ist ein eigener Markt (eigene Viskositäten, eigene Produktlinien)
  { re: /honöl|honoel|läppöl|laeppoel|superfinish|honing|lapping/, cats: ["HONING_LAPPING_OIL"] },
  { re: /schleiföl|schleifoel|schleifen.*öl|grinding/, cats: ["GRINDING_OIL"] },
  { re: /minimalmenge|schmiernebel|sprühnebelschmierung|spruehnebelschmierung|\bmms\b|\bmmks\b|\bmql\b/, cats: ["MQL_FLUID"] },
  { re: /gleitschleif|trowalisier|vibrationsschleif|entgratmittel|verfahrensmittel|mass.?finishing|tumbling/, cats: ["MASS_FINISHING_COMPOUND"] },
  { re: /schwer.?entflammbar|wasserglykol|\bhfa\b|\bhfb\b|\bhfc\b|\bhfdu\b|\bhfdr\b|fire.?resistant|iso ?12922/, cats: ["FIRE_RESISTANT_HYDRAULIC"] },
  { re: /umlauföl|umlaufoel|umlaufschmieröl|papiermaschinenöl|papiermaschinenoel|kalanderöl|kalanderoel|lageröl|lageroel|circulation.?oil|bearing.?oil/, cats: ["CIRCULATION_OIL"] },
  { re: /haftschmierstoff|offene.?getriebe|zahnkranz|großzahnrad|grosszahnrad|drehrohrofen|open.?gear|girth.?gear/, cats: ["OPEN_GEAR_LUBRICANT"] },
  { re: /montagepaste|schmierpaste|kupferpaste|keramikpaste|trennpaste|anti.?seize|assembly.?paste/, cats: ["LUBRICATING_PASTE"] },
  { re: /gleitlack|trockenschmierstoff|trockenschmierung|festschmierstoff|gleitbeschichtung|dry.?film|bonded.?coating/, cats: ["DRY_FILM_LUBRICANT"] },
  { re: /polymer.?abschreck|abschreckpolymer|wasserverdünnbare.?abschreck|polymer.?quench/, cats: ["POLYMER_QUENCHANT"] },
  { re: /wärmeträger|waermetraeger|thermalöl|thermaloel|thermoöl|thermoel|heat.?transfer|\bwtö\b/, cats: ["HEAT_TRANSFER_OIL"] },
  { re: /härteöl|haerteoel|abschrecköl|abschreckoel|abschreckmittel|quench/, cats: ["QUENCHING_OIL"] },
  { re: /isolieröl|isolieroel|transformatoren|trafoöl|trafooel|transformer.?oil|iec ?60296/, cats: ["TRANSFORMER_OIL"] },
  { re: /turbinenöl|turbinenoel|turbine.?oil|dampfturbine|gasturbine|din ?51515/, cats: ["TURBINE_OIL"] },
  { re: /kältemaschinen|kaeltemaschinen|kälteöl|kaelteoel|kältemittelöl|refrigerat/, cats: ["REFRIGERATION_OIL"] },
  { re: /vakuumpumpen|vakuumöl|vakuumoel|vacuum.?pump/, cats: ["VACUUM_PUMP_OIL"] },
  { re: /kettenöl|kettenoel|kettenschmier|hochtemperaturkette|chain.?oil|chain.?lube/, cats: ["CHAIN_OIL"] },
  { re: /spindelöl|spindeloel|spindle.?oil/, cats: ["SPINDLE_OIL"] },
  { re: /hydraulik|hlp\b|hvlp|hlpd|hees\b|hetg\b|hydraulic/, cats: ["HYDRAULIC_OIL"] },
  { re: /getriebe|clp\b|gear.?oil/, cats: ["GEAR_OIL"] },
  { re: /kompressor|vdl\b|vcl\b|compressor/, cats: ["COMPRESSOR_OIL"] },
  { re: /systemreiniger|entschäumer|entschaeumer|stabilisator|ph.?booster|emulgator|additiv/, cats: ["ADDITIVE"] },
  { re: /korrosionsschutz|rostschutz|konservier|corrosion/, cats: ["CORROSION_PROTECTION"] },
  { re: /reiniger|entfetter|cleaner|degreas/, cats: ["CLEANER"] },
  { re: /fett\b|fette\b|grease|nlgi/, cats: ["GREASE"] },
  { re: /schneidöl|schneidoel|neat.?oil|minimalmenge|mms\b|mql\b/, cats: ["COOLANT_NEAT"] },
  { re: /emulsion|wassermischbar|bohrmilch|kühlschmier|kuehlschmier|coolant/, cats: ["COOLANT_WATER_MIX"] },
  { re: /\bkss\b/, cats: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] },
];

/**
 * Erkennt die Produktart(en) aus einem Freitext. Leeres Array = nicht erkennbar
 * (dann NICHT filtern — lieber breite Treffer als falsche Leere).
 */
export function detectCategoriesFromText(text: string | null | undefined): DetectedCategory[] {
  if (!text) return [];
  const t = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.re.test(t)) return rule.cats;
  }
  return [];
}
