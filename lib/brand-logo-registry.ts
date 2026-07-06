/**
 * Liste der Hersteller, für die ein Logo unter /public/brand-logos/<slug>.png
 * (oder .svg) hinterlegt ist. Wird zur Build-Zeit ausgewertet — kein FS-Zugriff
 * im Render-Pfad nötig.
 *
 * Wenn ein neues Logo unter /public/brand-logos/<slug>.png angelegt wird,
 * den Slug hier ergänzen.
 */

export const KNOWN_LOGO_SLUGS = new Set<string>([
  "avia-bantleon",
  "basf",
  "baywa",
  "bechem",
  "blaser-swisslube",
  "boss-lubricants",
  "brenntag",
  "castrol",
  "cimcool",
  "curtis",
  "divinol",
  "esgemo",
  "esso",
  "finke",
  "fuchs",
  "hebro-chemie",
  "henkel",
  "jokisch",
  "kluthe",
  "klueber",
  "laemmle",
  "lubrizol",
  "ml-lubrication",
  "master-fluid-solutions",
  "mobil",
  "motul",
  "oks",
  "oelheld",
  "oemeta",
  "oest",
  "petrofer",
  "petronas",
  "rheinol",
  "rhenus-lub",
  "rowe",
  "srs",
  "shell",
  "totalenergies",
  "unitech",
  "zeller-gmelin",
  "zett-chemie",
]);

export function slugifyManufacturer(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ALIAS: Record<string, string> = {
  bantleon: "avia-bantleon",
  "carl-bechem": "bechem",
  "chemische-werke-kluthe": "kluthe",
  "klueber-lubrication": "klueber",
  "laemmle-chemie": "laemmle",
  "laemmle-panolin": "laemmle",
  "rhenus": "rhenus-lub",
  "zet-chemie": "zett-chemie",
  "exxonmobil": "esso",
  "exxon": "esso",
  "houghton": "", // Houghton ist Quaker — kein Logo da
  "quaker": "",
  "panolin": "laemmle",
  "oemeta-chemische-werke": "oemeta",
  "oks-spezialschmierstoffe": "oks",
  "finke-mineraloelwerk": "finke",
  "fuchs-schmierstoffe": "fuchs",
  "fuchs-petrolub": "fuchs",
};

/**
 * Gibt den Pfad zum Logo zurück, oder null wenn keins hinterlegt ist.
 */
export function getLogoPath(manufacturer: string): string | null {
  const raw = slugifyManufacturer(manufacturer);
  if (KNOWN_LOGO_SLUGS.has(raw)) return `/brand-logos/${raw}.png`;
  const aliased = ALIAS[raw];
  if (aliased && KNOWN_LOGO_SLUGS.has(aliased)) return `/brand-logos/${aliased}.png`;
  return null;
}
