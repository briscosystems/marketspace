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
  { re: /gleitbahn|bettbahn|führungsbahn|fuehrungsbahn|slideway|way.?oil|\bcgl?p\b/, cats: ["SLIDEWAY_OIL"] },
  // Drahtziehen ist ein eigener Markt (Ziehseifen/-fette, Nassziehmittel) und
  // wird von Umform-/Stanzölen getrennt — Einkäufer suchen gezielt danach.
  { re: /drahtzieh|ziehseife|ziehfett|nassziehmittel|drawing.?soap|wire.?draw/, cats: ["WIRE_DRAWING"] },
  { re: /ziehmittel|ziehöl|ziehoel|tiefzieh|umform|stanz|drückwalz|drueckwalz|abkant|forming/, cats: ["FORMING_OIL"] },
  { re: /trennmittel|formentrenn|schalungsöl|schalungsoel|release.?agent|druckguss.?trenn/, cats: ["RELEASE_AGENT"] },
  { re: /erodier|\bedm\b|funkenerosion|dielektrikum|dielectric/, cats: ["EDM_FLUID"] },
  { re: /schleiföl|schleifoel|honöl|honoel|läppöl|laeppoel|schleifen.*öl|grinding/, cats: ["GRINDING_OIL"] },
  { re: /wärmeträger|waermetraeger|thermalöl|thermaloel|thermoöl|thermoel|heat.?transfer|\bwtö\b/, cats: ["HEAT_TRANSFER_OIL"] },
  { re: /härteöl|haerteoel|abschrecköl|abschreckoel|abschreckmittel|quench/, cats: ["QUENCHING_OIL"] },
  { re: /isolieröl|isolieroel|transformatoren|trafoöl|trafooel|transformer.?oil|iec ?60296/, cats: ["TRANSFORMER_OIL"] },
  { re: /turbinenöl|turbinenoel|turbine|\btd\b ?öl|\btg\b ?öl|din ?51515/, cats: ["TURBINE_OIL"] },
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
