/**
 * DIE eine Liste der Produktarten (ProductCategory aus prisma/schema.prisma).
 *
 * Warum es das gibt: Die Beschriftungen standen vorher vierfach kopiert im Code
 * (Produktseite, Herstellerseite, Alternativ-Suche, i18n). Eine neue Produktart
 * hinzuzufügen hieß, vier Stellen zu finden — und eine wurde immer vergessen.
 * Neue Produktart? Hier eintragen, in prisma/schema.prisma ergänzen, Stichwörter
 * in lib/product-category-detect.ts hinterlegen. Fertig.
 *
 * Die Reihenfolge ist die Anzeige-Reihenfolge (Filter-Chips, Auswahllisten):
 * Zerspanung zuerst, dann Anlagenschmierung, dann Umformen/Wärme, dann Hilfsstoffe.
 */

export const PRODUCT_CATEGORIES = [
  // Zerspanung
  "COOLANT_WATER_MIX",
  "COOLANT_NEAT",
  "GRINDING_OIL",
  "HONING_LAPPING_OIL",
  "MQL_FLUID",
  "EDM_FLUID",
  // Maschinen- und Anlagenschmierung
  "HYDRAULIC_OIL",
  "FIRE_RESISTANT_HYDRAULIC",
  "GEAR_OIL",
  "CIRCULATION_OIL",
  "OPEN_GEAR_LUBRICANT",
  "COMPRESSOR_OIL",
  "SLIDEWAY_OIL",
  "SPINDLE_OIL",
  "TURBINE_OIL",
  "CHAIN_OIL",
  "REFRIGERATION_OIL",
  "VACUUM_PUMP_OIL",
  // Umformen
  "FORMING_OIL",
  "FORGING_LUBRICANT",
  "WIRE_DRAWING",
  "RELEASE_AGENT",
  "MASS_FINISHING_COMPOUND",
  // Wärmebehandlung / Energietechnik
  "HEAT_TRANSFER_OIL",
  "QUENCHING_OIL",
  "POLYMER_QUENCHANT",
  "TRANSFORMER_OIL",
  // Hilfs- und Betriebsstoffe
  "CLEANER",
  "CORROSION_PROTECTION",
  "GREASE",
  "LUBRICATING_PASTE",
  "DRY_FILM_LUBRICANT",
  "ADDITIVE",
  "SPECIALTY",
  "OTHER",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/**
 * Deutsche Anzeige-Namen. Für DE/EN/NL laufen die Beschriftungen über
 * lib/i18n.ts (`cat.<WERT>`); diese Liste ist der deutsche Rückfall für
 * Stellen ohne Sprachumschaltung.
 */
export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl (nicht wassermischbar)",
  GRINDING_OIL: "Schleiföl",
  HONING_LAPPING_OIL: "Hon-/Läppöl",
  MQL_FLUID: "Minimalmengen-Schmierstoff (MMS)",
  EDM_FLUID: "Erodier-Dielektrikum",
  HYDRAULIC_OIL: "Hydrauliköl",
  FIRE_RESISTANT_HYDRAULIC: "Schwer entflammbare Hydraulikflüssigkeit",
  GEAR_OIL: "Getriebeöl",
  CIRCULATION_OIL: "Umlauf-/Lageröl",
  OPEN_GEAR_LUBRICANT: "Haftschmierstoff (offene Getriebe)",
  COMPRESSOR_OIL: "Kompressorenöl",
  SLIDEWAY_OIL: "Bettbahnöl",
  SPINDLE_OIL: "Spindelöl",
  TURBINE_OIL: "Turbinenöl",
  CHAIN_OIL: "Kettenöl",
  REFRIGERATION_OIL: "Kältemaschinenöl",
  VACUUM_PUMP_OIL: "Vakuumpumpenöl",
  FORMING_OIL: "Umform-/Stanzöl",
  FORGING_LUBRICANT: "Gesenkschmierstoff (Schmieden)",
  WIRE_DRAWING: "Drahtzieh-Schmierstoff",
  RELEASE_AGENT: "Trennmittel",
  MASS_FINISHING_COMPOUND: "Gleitschleifmittel",
  HEAT_TRANSFER_OIL: "Wärmeträgeröl",
  QUENCHING_OIL: "Härteöl",
  POLYMER_QUENCHANT: "Polymer-Abschreckmittel",
  TRANSFORMER_OIL: "Isolieröl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  LUBRICATING_PASTE: "Montage-/Schmierpaste",
  DRY_FILM_LUBRICANT: "Gleitlack / Trockenschmierstoff",
  ADDITIVE: "Additiv",
  SPECIALTY: "Spezialschmierstoff",
  OTHER: "Sonstiges",
};

/** Kurzform für enge Stellen (Diagramm-Achsen, Chips). */
export const PRODUCT_CATEGORY_SHORT: Record<ProductCategory, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl",
  GRINDING_OIL: "Schleiföl",
  HONING_LAPPING_OIL: "Honöl",
  MQL_FLUID: "MMS",
  EDM_FLUID: "EDM",
  HYDRAULIC_OIL: "Hydrauliköl",
  FIRE_RESISTANT_HYDRAULIC: "Schwer entflammbar",
  GEAR_OIL: "Getriebeöl",
  CIRCULATION_OIL: "Umlauföl",
  OPEN_GEAR_LUBRICANT: "Haftschmierstoff",
  COMPRESSOR_OIL: "Kompressoröl",
  SLIDEWAY_OIL: "Bettbahnöl",
  SPINDLE_OIL: "Spindelöl",
  TURBINE_OIL: "Turbinenöl",
  CHAIN_OIL: "Kettenöl",
  REFRIGERATION_OIL: "Kälteöl",
  VACUUM_PUMP_OIL: "Vakuumöl",
  FORMING_OIL: "Umform",
  FORGING_LUBRICANT: "Gesenk",
  WIRE_DRAWING: "Drahtzug",
  RELEASE_AGENT: "Trennmittel",
  MASS_FINISHING_COMPOUND: "Gleitschleifen",
  HEAT_TRANSFER_OIL: "Wärmeträger",
  QUENCHING_OIL: "Härteöl",
  POLYMER_QUENCHANT: "Polymer-Abschreck",
  TRANSFORMER_OIL: "Isolieröl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  LUBRICATING_PASTE: "Paste",
  DRY_FILM_LUBRICANT: "Gleitlack",
  ADDITIVE: "Additiv",
  SPECIALTY: "Spezial",
  OTHER: "Andere",
};

/** Beschriftung mit sicherem Rückfall auf den Rohwert (unbekannte/alte Werte). */
export function categoryLabel(category: string | null | undefined): string {
  if (!category) return PRODUCT_CATEGORY_LABEL.OTHER;
  return PRODUCT_CATEGORY_LABEL[category as ProductCategory] ?? category;
}
