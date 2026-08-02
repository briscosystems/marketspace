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
  | "FORMING_OIL"
  | "CLEANER"
  | "CORROSION_PROTECTION"
  | "GREASE"
  | "ADDITIVE";

// Jede Regel: Muster (auf lowercase-Text angewendet) → Kategorien.
// Mehrere Kategorien, wenn der Begriff mehrdeutig ist (z. B. „KSS" =
// wassermischbar ODER nicht wassermischbar).
const RULES: { re: RegExp; cats: DetectedCategory[] }[] = [
  { re: /gleitbahn|bettbahn|führungsbahn|slideway|way.?oil/, cats: ["SLIDEWAY_OIL"] },
  { re: /drahtzieh|ziehmittel|ziehseife|ziehfett|ziehöl|ziehoel|tiefzieh|umform|stanz|drückwalz|wire.?draw/, cats: ["FORMING_OIL"] },
  { re: /erodier|edm|funkenerosion|dielektrikum/, cats: ["EDM_FLUID"] },
  { re: /schleiföl|schleifoel|schleifen.*öl|grinding/, cats: ["GRINDING_OIL"] },
  { re: /hydraulik|hlp\b|hvlp|hees\b|hetg\b|hydraulic/, cats: ["HYDRAULIC_OIL"] },
  { re: /getriebe|clp\b|gear.?oil/, cats: ["GEAR_OIL"] },
  { re: /kompressor|vdl\b|compressor/, cats: ["COMPRESSOR_OIL"] },
  { re: /systemreiniger|entschäumer|entschaeumer|stabilisator|ph.?booster|emulgator|additiv/, cats: ["ADDITIVE"] },
  { re: /korrosionsschutz|rostschutz|konservier/, cats: ["CORROSION_PROTECTION"] },
  { re: /reiniger|entfetter|cleaner/, cats: ["CLEANER"] },
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
