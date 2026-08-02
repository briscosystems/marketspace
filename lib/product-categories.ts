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
  "EDM_FLUID",
  // Maschinen- und Anlagenschmierung
  "HYDRAULIC_OIL",
  "GEAR_OIL",
  "COMPRESSOR_OIL",
  "SLIDEWAY_OIL",
  "SPINDLE_OIL",
  "TURBINE_OIL",
  "CHAIN_OIL",
  "REFRIGERATION_OIL",
  "VACUUM_PUMP_OIL",
  // Umformen
  "FORMING_OIL",
  "WIRE_DRAWING",
  "RELEASE_AGENT",
  // Wärmebehandlung / Energietechnik
  "HEAT_TRANSFER_OIL",
  "QUENCHING_OIL",
  "TRANSFORMER_OIL",
  // Hilfs- und Betriebsstoffe
  "CLEANER",
  "CORROSION_PROTECTION",
  "GREASE",
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
  EDM_FLUID: "Erodier-Dielektrikum",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  COMPRESSOR_OIL: "Kompressorenöl",
  SLIDEWAY_OIL: "Bettbahnöl",
  SPINDLE_OIL: "Spindelöl",
  TURBINE_OIL: "Turbinenöl",
  CHAIN_OIL: "Kettenöl",
  REFRIGERATION_OIL: "Kältemaschinenöl",
  VACUUM_PUMP_OIL: "Vakuumpumpenöl",
  FORMING_OIL: "Umform-/Stanzöl",
  WIRE_DRAWING: "Drahtzieh-Schmierstoff",
  RELEASE_AGENT: "Trennmittel",
  HEAT_TRANSFER_OIL: "Wärmeträgeröl",
  QUENCHING_OIL: "Härteöl",
  TRANSFORMER_OIL: "Isolieröl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  ADDITIVE: "Additiv",
  SPECIALTY: "Spezialschmierstoff",
  OTHER: "Sonstiges",
};

/** Kurzform für enge Stellen (Diagramm-Achsen, Chips). */
export const PRODUCT_CATEGORY_SHORT: Record<ProductCategory, string> = {
  COOLANT_WATER_MIX: "KSS (wassermischbar)",
  COOLANT_NEAT: "Schneidöl",
  GRINDING_OIL: "Schleiföl",
  EDM_FLUID: "EDM",
  HYDRAULIC_OIL: "Hydrauliköl",
  GEAR_OIL: "Getriebeöl",
  COMPRESSOR_OIL: "Kompressoröl",
  SLIDEWAY_OIL: "Bettbahnöl",
  SPINDLE_OIL: "Spindelöl",
  TURBINE_OIL: "Turbinenöl",
  CHAIN_OIL: "Kettenöl",
  REFRIGERATION_OIL: "Kälteöl",
  VACUUM_PUMP_OIL: "Vakuumöl",
  FORMING_OIL: "Umform",
  WIRE_DRAWING: "Drahtzug",
  RELEASE_AGENT: "Trennmittel",
  HEAT_TRANSFER_OIL: "Wärmeträger",
  QUENCHING_OIL: "Härteöl",
  TRANSFORMER_OIL: "Isolieröl",
  CLEANER: "Reiniger",
  CORROSION_PROTECTION: "Korrosionsschutz",
  GREASE: "Fett",
  ADDITIVE: "Additiv",
  SPECIALTY: "Spezial",
  OTHER: "Andere",
};

/** Beschriftung mit sicherem Rückfall auf den Rohwert (unbekannte/alte Werte). */
export function categoryLabel(category: string | null | undefined): string {
  if (!category) return PRODUCT_CATEGORY_LABEL.OTHER;
  return PRODUCT_CATEGORY_LABEL[category as ProductCategory] ?? category;
}
