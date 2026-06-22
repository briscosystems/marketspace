/**
 * Katalog typischer Probleme bei wassermischbaren KSS / Emulsionen
 * sowie nicht-wassermischbaren Bearbeitungsölen.
 *
 * Wird benutzt für:
 * - RFQ-Form: "Welche Probleme MUSS das Produkt vermeiden?"
 * - Alternative-Suche: zusätzliche Anforderungen
 * - KI-Prompt: Claude wird gebeten, in den SDS-Texten nach Hinweisen auf
 *   diese Probleme zu suchen und im Vergleich darauf einzugehen.
 */
export type KssIssueId =
  | "foam"
  | "staining_yellow_metal"
  | "microbial_growth"
  | "corrosion"
  | "skin_irritation"
  | "mist_aerosol"
  | "rancidity_odor"
  | "seal_attack"
  | "smoke_at_temp"
  | "residue_stickiness"
  | "hard_water"
  | "tramp_oil"
  | "food_grade"
  | "biocide_release"
  | "low_emulsion_stability";

export type KssIssue = {
  id: KssIssueId;
  /** Worunter es der User kennt — gibt's auf der UI als Label */
  label: string;
  /** Eine Zeile Erklärung für den Tooltip */
  short: string;
  /** Welcher Bereich? Damit wir RFQ-relevante anzeigen können */
  scope: "water_miscible" | "neat_oil" | "both";
  /**
   * Stichwörter, die typischerweise in einem SDS-Text auf das Problem hinweisen
   * (für die regelbasierte Vorprüfung — Claude bekommt die Roh-Texte ohnehin)
   */
  keywords: string[];
};

export const KSS_ISSUES: KssIssue[] = [
  {
    id: "foam",
    label: "Schaumbildung",
    short:
      "Übermäßiger Schaum überläuft das Becken und reduziert Pumpen-/Kühlleistung — oft durch weiches Wasser oder Mikroben.",
    scope: "water_miscible",
    keywords: ["schaum", "antifoam", "foam"],
  },
  {
    id: "staining_yellow_metal",
    label: "Verfärbung Buntmetall (Cu/Al)",
    short:
      "Aggressiv auf Kupfer/Messing/Aluminium — Werkstücke verfärben sich gelb/grün.",
    scope: "both",
    keywords: ["buntmetall", "kupfer", "yellow metal", "aluminium", "stain", "verfärb"],
  },
  {
    id: "microbial_growth",
    label: "Bakterien-/Pilzbefall",
    short:
      "Verkeimung führt zu Gestank, Werkzeugverschleiß und Hautreizungen — oft am Wochenende ohne Umwälzung.",
    scope: "water_miscible",
    keywords: ["bakterien", "verkeim", "pilz", "microbial", "rancid", "bacteria"],
  },
  {
    id: "corrosion",
    label: "Korrosionsschutz schwach",
    short: "Rost am Werkstück oder an Maschinenteilen — Korrosionsinhibitor unzureichend.",
    scope: "both",
    keywords: ["korrosion", "rost", "corrosion", "rust"],
  },
  {
    id: "skin_irritation",
    label: "Hautreizung",
    short: "Auslöser für Kontaktekzeme — pH zu hoch, aggressive Biozide oder Allergene.",
    scope: "both",
    keywords: [
      "dermatitis",
      "hautreiz",
      "haut",
      "irritation",
      "sensibilisier",
      "allergen",
    ],
  },
  {
    id: "mist_aerosol",
    label: "Nebel-/Aerosolbildung",
    short:
      "Atembare Aerosole bei Hochdruck-Spindeln — schlecht für die Lunge, oft Absaugpflicht.",
    scope: "both",
    keywords: ["nebel", "mist", "aerosol", "spray"],
  },
  {
    id: "rancidity_odor",
    label: "Geruch / Ranzigkeit",
    short:
      "Stinkende Emulsion am Montagmorgen — Indikator für mikrobielle Aktivität.",
    scope: "water_miscible",
    keywords: ["geruch", "stink", "ranzig", "rancid", "odor"],
  },
  {
    id: "seal_attack",
    label: "Aggressiv auf Dichtungen",
    short:
      "Greift NBR/FKM-Dichtungen an — führt zu Leckagen an Spindel und Hydraulik.",
    scope: "both",
    keywords: ["dichtung", "seal", "nbr", "fkm", "elastomer", "viton"],
  },
  {
    id: "smoke_at_temp",
    label: "Rauchbildung bei hoher Temperatur",
    short: "Schneidöle: Rauch- und Brandgefahr bei hoher Schnittgeschwindigkeit.",
    scope: "neat_oil",
    keywords: ["rauch", "smoke", "flammpunkt", "flash point", "raucharm"],
  },
  {
    id: "residue_stickiness",
    label: "Klebrige Rückstände",
    short:
      "Ablagerungen auf Maschine und Werkstück — erschwert Reinigung und nachfolgende Prozesse (z.B. Schweißen).",
    scope: "both",
    keywords: ["rückstand", "kleb", "residue", "sticky", "ablager"],
  },
  {
    id: "hard_water",
    label: "Empfindlich gegen hartes Wasser",
    short:
      "Schäumt/separiert bei hoher Wasserhärte — wichtig bei Standorten ohne Wasseraufbereitung.",
    scope: "water_miscible",
    keywords: ["wasserhärte", "hard water", "carbonat"],
  },
  {
    id: "tramp_oil",
    label: "Tramp-Oil-empfindlich",
    short:
      "Verträgt keine Fremdöle aus Spindel/Hydraulik — Emulsion bricht oder verkeimt schneller.",
    scope: "water_miscible",
    keywords: ["tramp", "fremdöl", "fremdoel", "leakage"],
  },
  {
    id: "food_grade",
    label: "Lebensmitteltauglich (FDA/NSF H1)",
    short: "Bei Maschinen mit Lebensmittel-Kontakt zwingend — H1-Freigabe nötig.",
    scope: "both",
    keywords: ["nsf", "h1", "food", "lebensmittel"],
  },
  {
    id: "biocide_release",
    label: "Formaldehyd-/Bor-Depot",
    short: "Klaus' BG-Auflagen: Formaldehyd-Abspalter und Bor-Verbindungen vermeiden.",
    scope: "water_miscible",
    keywords: ["formaldehyd", "formaldehyde", "bor", "boron", "borat"],
  },
  {
    id: "low_emulsion_stability",
    label: "Emulsionsstabilität",
    short: "Emulsion separiert, Öltropfen schwimmen auf — kurze Standzeit, häufiger Wechsel.",
    scope: "water_miscible",
    keywords: ["emulsion", "stabilit", "separat", "stable"],
  },
];

export function getKssIssue(id: KssIssueId): KssIssue {
  const i = KSS_ISSUES.find((x) => x.id === id);
  if (!i) throw new Error(`Unknown KSS issue: ${id}`);
  return i;
}

export function issuesForScope(
  scope: "water_miscible" | "neat_oil",
): KssIssue[] {
  return KSS_ISSUES.filter((i) => i.scope === scope || i.scope === "both");
}
