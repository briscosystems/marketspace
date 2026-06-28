/**
 * Katalog typischer Probleme/Pain-Points über ALLE Produktkategorien:
 * wassermischbare KSS, nicht-wassermischbare Bearbeitungsöle, Umlauf-/
 * Schmieröle (Hydraulik/Getriebe/Motor/Kompressor) und Schmierfette.
 *
 * Wird benutzt für:
 * - RFQ-Form: "Welche Probleme MUSS das Produkt vermeiden?" (nach Produkttyp gefiltert)
 * - Alternative-Suche: zusätzliche Anforderungen
 * - KI-Prompt: Claude wird gebeten, in den SDS-Texten nach Hinweisen auf
 *   diese Probleme zu suchen und im Vergleich darauf einzugehen.
 *
 * Jedes Problem trägt EINEN oder MEHRERE `scope`-Werte. "general" = gilt für
 * alle Produktkategorien. So zeigt das RFQ-Formular pro Kategorie nur die
 * relevanten Pain-Points an (siehe components/KssIssueSelect.tsx).
 */
export type IssueScope =
  | "water_miscible" // wassermischbare KSS/Emulsion
  | "neat_oil" // nicht-wassermischbare Bearbeitungsöle (Schneid-/Schleif-/Honöl)
  | "circulating_oil" // Umlauf-/Schmieröle: Hydraulik, Getriebe, Motor, Kompressor
  | "grease" // Schmierfette
  | "general"; // gilt kategorieübergreifend für alle Produkte

/** Abfrage-Scope an die UI — "both" zeigt ALLE Probleme (z.B. Alternativ-Suche). */
export type IssueQueryScope = IssueScope | "both";

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
  | "low_emulsion_stability"
  // — kategorieübergreifend / Umlauföle / Fette (neu) —
  | "oil_oxidation"
  | "deposits_varnish"
  | "air_release"
  | "poor_demulsibility"
  | "viscosity_shear"
  | "filterability"
  | "micropitting"
  | "cold_flow"
  | "oil_bleed"
  | "dropping_point"
  | "water_washout"
  | "hazard_labeling"
  | "not_biodegradable";

export type KssIssue = {
  id: KssIssueId;
  /** Worunter es der User kennt — gibt's auf der UI als Label */
  label: string;
  /** Eine Zeile Erklärung für den Tooltip */
  short: string;
  /** Für welche Produktkategorien ist das relevant? "general" = alle */
  scope: IssueScope[];
  /**
   * Stichwörter, die typischerweise in einem SDS-Text auf das Problem hinweisen
   * (für die regelbasierte Vorprüfung — Claude bekommt die Roh-Texte ohnehin)
   */
  keywords: string[];
};

export const KSS_ISSUES: KssIssue[] = [
  // ─────────────────────────────────────────────────────────────────────
  // Kategorieübergreifend (gilt für alle Produkte)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "corrosion",
    label: "Korrosionsschutz schwach",
    short: "Rost am Werkstück oder an Maschinenteilen — Korrosionsinhibitor unzureichend.",
    scope: ["general"],
    keywords: ["korrosion", "rost", "corrosion", "rust"],
  },
  {
    id: "staining_yellow_metal",
    label: "Verfärbung Buntmetall (Cu/Al)",
    short: "Aggressiv auf Kupfer/Messing/Aluminium — Werkstücke oder Lager verfärben sich gelb/grün.",
    scope: ["general"],
    keywords: ["buntmetall", "kupfer", "yellow metal", "aluminium", "stain", "verfärb", "messing"],
  },
  {
    id: "seal_attack",
    label: "Aggressiv auf Dichtungen",
    short: "Greift NBR/FKM-Dichtungen an — führt zu Leckagen an Spindel, Hydraulik und Lagern.",
    scope: ["general"],
    keywords: ["dichtung", "seal", "nbr", "fkm", "elastomer", "viton"],
  },
  {
    id: "skin_irritation",
    label: "Hautreizung",
    short: "Auslöser für Kontaktekzeme — pH zu hoch, aggressive Biozide oder Allergene.",
    scope: ["general"],
    keywords: ["dermatitis", "hautreiz", "haut", "irritation", "sensibilisier", "allergen"],
  },
  {
    id: "food_grade",
    label: "Lebensmitteltauglich (FDA/NSF H1)",
    short: "Bei Maschinen mit Lebensmittel-Kontakt zwingend — H1-Freigabe nötig.",
    scope: ["general"],
    keywords: ["nsf", "h1", "food", "lebensmittel"],
  },
  {
    id: "hazard_labeling",
    label: "Gefahrstoff-Kennzeichnung / SVHC",
    short: "Kennzeichnungspflichtige H-Sätze oder SVHC-Stoffe — Arbeitsschutz- und Entsorgungsaufwand.",
    scope: ["general"],
    keywords: ["svhc", "gefahrstoff", "kennzeichnung", "h-satz", "ghs", "gefahr", "reach"],
  },
  {
    id: "not_biodegradable",
    label: "Nicht biologisch abbaubar (Mineralöl)",
    short: "Für umweltsensible Anwendungen (EAL) ungeeignet — Mineralöl statt Ester/PAG.",
    scope: ["general"],
    keywords: ["biolog", "abbaubar", "biodegradable", "eal", "mineralöl", "umwelt"],
  },
  {
    id: "cold_flow",
    label: "Kälteverhalten / Pumpbarkeit",
    short: "Zu zäh bei Kälte — schlechter Kaltstart, Pumpe zieht Luft, Fett wird nicht gefördert.",
    scope: ["circulating_oil", "grease"],
    keywords: ["pourpoint", "stockpunkt", "kälte", "pour point", "pumpbar", "cold"],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Wassermischbare KSS / Emulsionen
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "foam",
    label: "Schaumbildung",
    short:
      "Übermäßiger Schaum überläuft das Becken und reduziert Pumpen-/Kühlleistung — oft durch weiches Wasser oder Mikroben.",
    scope: ["water_miscible"],
    keywords: ["schaum", "antifoam", "foam"],
  },
  {
    id: "microbial_growth",
    label: "Bakterien-/Pilzbefall",
    short:
      "Verkeimung führt zu Gestank, Werkzeugverschleiß und Hautreizungen — oft am Wochenende ohne Umwälzung.",
    scope: ["water_miscible"],
    keywords: ["bakterien", "verkeim", "pilz", "microbial", "rancid", "bacteria"],
  },
  {
    id: "rancidity_odor",
    label: "Geruch / Ranzigkeit",
    short: "Stinkende Emulsion am Montagmorgen — Indikator für mikrobielle Aktivität.",
    scope: ["water_miscible"],
    keywords: ["geruch", "stink", "ranzig", "rancid", "odor"],
  },
  {
    id: "hard_water",
    label: "Empfindlich gegen hartes Wasser",
    short:
      "Schäumt/separiert bei hoher Wasserhärte — wichtig bei Standorten ohne Wasseraufbereitung.",
    scope: ["water_miscible"],
    keywords: ["wasserhärte", "hard water", "carbonat"],
  },
  {
    id: "tramp_oil",
    label: "Tramp-Oil-empfindlich",
    short:
      "Verträgt keine Fremdöle aus Spindel/Hydraulik — Emulsion bricht oder verkeimt schneller.",
    scope: ["water_miscible"],
    keywords: ["tramp", "fremdöl", "fremdoel", "leakage"],
  },
  {
    id: "biocide_release",
    label: "Formaldehyd-/Bor-Depot",
    short: "BG-Auflagen: Formaldehyd-Abspalter und Bor-Verbindungen vermeiden.",
    scope: ["water_miscible"],
    keywords: ["formaldehyd", "formaldehyde", "bor", "boron", "borat"],
  },
  {
    id: "low_emulsion_stability",
    label: "Emulsionsstabilität",
    short: "Emulsion separiert, Öltropfen schwimmen auf — kurze Standzeit, häufiger Wechsel.",
    scope: ["water_miscible"],
    keywords: ["emulsion", "stabilit", "separat", "stable"],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Bearbeitung (wasser- + nicht-wassermischbar)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "mist_aerosol",
    label: "Nebel-/Aerosolbildung",
    short:
      "Atembare Aerosole bei Hochdruck-Spindeln — schlecht für die Lunge, oft Absaugpflicht.",
    scope: ["water_miscible", "neat_oil"],
    keywords: ["nebel", "mist", "aerosol", "spray"],
  },
  {
    id: "residue_stickiness",
    label: "Klebrige Rückstände",
    short:
      "Ablagerungen auf Maschine und Werkstück — erschwert Reinigung und Folgeprozesse (z.B. Schweißen).",
    scope: ["water_miscible", "neat_oil"],
    keywords: ["rückstand", "kleb", "residue", "sticky", "ablager"],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Nicht-wassermischbare Bearbeitungsöle
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "smoke_at_temp",
    label: "Rauchbildung bei hoher Temperatur",
    short: "Schneidöle: Rauch- und Brandgefahr bei hoher Schnittgeschwindigkeit (niedriger Flammpunkt).",
    scope: ["neat_oil"],
    keywords: ["rauch", "smoke", "flammpunkt", "flash point", "raucharm"],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Umlauf-/Schmieröle (Hydraulik, Getriebe, Motor, Kompressor)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "oil_oxidation",
    label: "Oxidation / kurze Standzeit",
    short: "Öl altert, dunkelt nach, Säurezahl steigt — vorzeitiger Wechsel, Verschlammung.",
    scope: ["neat_oil", "circulating_oil"],
    keywords: ["oxidation", "alterung", "säurezahl", "tan", "verharz", "oxidation stability"],
  },
  {
    id: "deposits_varnish",
    label: "Ablagerungen / Lackbildung (Varnish)",
    short: "Verlackung an Ventilen, Lagern und Filtern — klemmende Ventile, Funktionsstörungen.",
    scope: ["circulating_oil"],
    keywords: ["varnish", "lack", "ablagerung", "schlamm", "sludge", "deposit"],
  },
  {
    id: "air_release",
    label: "Lufteintrag / schlechte Luftabscheidung",
    short: "Luftbläschen im Öl → Kavitation, schwammige Hydraulik, schlechte Wärmeabfuhr.",
    scope: ["circulating_oil"],
    keywords: ["luftabscheid", "air release", "entlüft", "kavitation", "schaum"],
  },
  {
    id: "poor_demulsibility",
    label: "Wasserabscheidung schlecht (Demulgierung)",
    short: "Öl trennt sich nicht vom Wasser, emulgiert — Rost, Schmierfilm-Abriss, Filterprobleme.",
    scope: ["circulating_oil"],
    keywords: ["demulg", "wasserabscheid", "demulsib", "emulgier", "water separation"],
  },
  {
    id: "viscosity_shear",
    label: "Viskositätsabfall / Scherstabilität",
    short: "Mehrbereichsöl schert ab und verliert Viskosität — Schmierfilm wird zu dünn, Verschleiß.",
    scope: ["circulating_oil"],
    keywords: ["scherstabil", "viskositätsindex", "shear", "vi-verbesserer", "viscosity loss"],
  },
  {
    id: "filterability",
    label: "Filtrierbarkeit / Filterverblockung",
    short: "Additive fallen aus, Filter verstopfen — besonders bei Wassereintrag.",
    scope: ["circulating_oil"],
    keywords: ["filtrier", "filterability", "filter", "verblock"],
  },
  {
    id: "micropitting",
    label: "Graufleckigkeit / Micropitting (Getriebe)",
    short: "Oberflächenermüdung an Zahnflanken — graue Flecken, fortschreitender Schaden.",
    scope: ["circulating_oil"],
    keywords: ["micropitting", "graufleck", "grübchen", "pitting", "flankentrag"],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Schmierfette
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "oil_bleed",
    label: "Ölausblutung / Verhärtung (Fett)",
    short: "Fett trennt das Grundöl ab und verhärtet — kein Schmierfilm mehr, Lagerausfall.",
    scope: ["grease"],
    keywords: ["ölabscheid", "bleed", "ölsepar", "verhärt", "konsistenz", "ölaustritt"],
  },
  {
    id: "dropping_point",
    label: "Tropfpunkt zu niedrig (Hochtemp.)",
    short: "Fett wird bei Hitze flüssig und läuft aus dem Lager — Mangelschmierung.",
    scope: ["grease"],
    keywords: ["tropfpunkt", "dropping point", "hochtemperatur", "drop point"],
  },
  {
    id: "water_washout",
    label: "Auswaschung durch Wasser (Fett)",
    short: "Fett wird bei Nässe ausgewaschen — Korrosion und Mangelschmierung am Lager.",
    scope: ["grease"],
    keywords: ["auswasch", "washout", "wasserbeständ", "water resistance"],
  },
];

export function getKssIssue(id: KssIssueId): KssIssue {
  const i = KSS_ISSUES.find((x) => x.id === id);
  if (!i) throw new Error(`Unknown KSS issue: ${id}`);
  return i;
}

/** Alle für einen Produkt-Scope relevanten Probleme (inkl. „general"). */
export function issuesForScope(scope: IssueScope): KssIssue[] {
  return KSS_ISSUES.filter((i) => i.scope.includes("general") || i.scope.includes(scope));
}
