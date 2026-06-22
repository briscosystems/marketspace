// Produkt → empfohlene Dichtungswerkstoffe
//
// Logik: Aus den Produkt-Eigenschaften (chemistry, category, containsBor/-Chlor/-MineralOil/
// -FormaldehydeDepot) leiten wir die wahrscheinlich enthaltenen Inhaltsstoffe ab.
// Dann aggregieren wir pro Material die schlechteste Verträglichkeit über alle
// abgeleiteten Inhaltsstoffe — das gibt die "worst case"-Empfehlung pro Material.
//
// Konfidenz: Die Empfehlung ist immer "modelliert", weil sie aus generischen
// Eigenschaften abgeleitet wurde — keine produktspezifische Rezeptur-Analyse.

import { prisma } from "@/lib/prisma";

type ChemistryBase = "MINERAL" | "SEMI_SYNTHETIC" | "SYNTHETIC" | "ESTER" | "PAG" | "OTHER" | null;
type ProductCategory =
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
  | "SPECIALTY"
  | "ADDITIVE"
  | "OTHER";

export type ProductForRec = {
  category: ProductCategory;
  chemistry: ChemistryBase;
  containsBor?: boolean | null;
  containsFormaldehydeDepot?: boolean | null;
  containsMineralOil?: boolean | null;
  containsChlorine?: boolean | null;
};

// Severitäts-Reihenfolge für Aggregation: schlechteste gewinnt
const RATING_ORDER: Record<string, number> = {
  RECOMMENDED: 1,
  COMPATIBLE: 2,
  CAUTION: 3,
  UNSUITABLE: 4,
};

/**
 * Leitet aus Produkt-Eigenschaften die wahrscheinlich enthaltenen Inhaltsstoffe ab.
 * Liefert Ingredient-Slugs (entsprechend dem seed-materials.ts Katalog).
 */
export function inferIngredients(p: ProductForRec): {
  slugs: string[];
  rationale: { ingredient: string; why: string }[];
} {
  const slugs = new Set<string>();
  const rationale: { ingredient: string; why: string }[] = [];

  function add(slug: string, why: string) {
    if (!slugs.has(slug)) {
      slugs.add(slug);
      rationale.push({ ingredient: slug, why });
    }
  }

  // 1) Basisöl aus chemistry ableiten
  if (p.chemistry === "MINERAL" || p.chemistry === "SEMI_SYNTHETIC") {
    add("mineral-oil", "Mineralöl als Basisflüssigkeit oder Bestandteil (chemistry MINERAL/SEMI_SYNTHETIC).");
  }
  if (p.chemistry === "SYNTHETIC") {
    // Pauschalannahme: PAO-basiert — verhält sich wie Mineralöl gegenüber Elastomeren
    add("mineral-oil", "PAO-Synthetik verhält sich gegenüber Dichtungen ähnlich Mineralöl.");
  }
  if (p.chemistry === "ESTER") {
    add("ester-oil", "Ester-Basisöl (chemistry ESTER).");
  }
  if (p.chemistry === "PAG") {
    add("polyalkylene-glycol", "PAG-Basisöl (chemistry PAG).");
  }
  if (p.containsMineralOil === true) {
    add("mineral-oil", "Mineralöl-Anteil ist im Produkt-Datenblatt markiert.");
  }

  // 2) Aus Kategorie typische Begleitstoffe ableiten
  if (p.category === "COOLANT_WATER_MIX") {
    // Wassermischbare KSS — Wasser als Trägerphase, plus Amine als Korrosionsschutz
    add("water-hot", "Wasser ist Trägerphase wassermischbarer KSS (im Spalt > 60 °C).");
    add("triethanolamine", "Ethanolamine sind typische Korrosionsinhibitoren / pH-Stabilisatoren (TEA ist heute Standard).");
    add("anionic-surfactant", "Anionische Tenside emulgieren die Öl-Phase (typ. 5-15% des Konzentrats).");
  }
  if (p.category === "CLEANER") {
    add("water-hot", "Wässriger Reiniger.");
    add("anionic-surfactant", "Tenside sind Hauptwirkstoff in Industrie-Reinigern.");
  }

  // 3) Markierungen direkt umsetzen
  if (p.containsBor === true) {
    add("boric-acid", "Borsäure / Borate sind im Produkt enthalten.");
  }
  if (p.containsFormaldehydeDepot === true) {
    add("hexahydro-triazine", "Formaldehyd-Donor enthalten (typischster Vertreter: Triazin/Grotan).");
  }
  if (p.containsChlorine === true) {
    add("chlorinated-paraffin", "Chlorparaffine als EP-Additiv enthalten.");
  }

  // Fallback wenn nichts erkannt: nur Mineralöl annehmen
  if (slugs.size === 0) {
    add("mineral-oil", "Keine spezifischen Markierungen — Mineralöl als Standardannahme.");
  }

  return { slugs: [...slugs], rationale };
}

export type MaterialRec = {
  materialId: string;
  materialSlug: string;
  materialName: string;
  materialShortName: string;
  materialCategory: string;
  worstRating: "RECOMMENDED" | "COMPATIBLE" | "CAUTION" | "UNSUITABLE";
  drivers: {
    ingredientSlug: string;
    ingredientName: string;
    rating: string;
    note: string;
  }[];
};

/**
 * Berechnet für ein Produkt die Material-Empfehlungen.
 * Pro Material: Aggregation der schlechtesten Verträglichkeit über alle abgeleiteten Inhaltsstoffe.
 * Liefert nur Materialien aus den Kategorien ELASTOMER + THERMOPLASTIC (Dichtungs-/Kunststoff-Werkstoffe).
 */
export async function recommendMaterialsForProduct(p: ProductForRec): Promise<{
  recommendations: MaterialRec[];
  inferredIngredients: { slug: string; name: string; why: string }[];
}> {
  const { slugs, rationale } = inferIngredients(p);

  // Inhaltsstoffe + zugehörige Verträglichkeiten in einem Zug laden
  const ingredients = await prisma.ingredient.findMany({
    where: { slug: { in: slugs } },
    include: {
      compatibilities: {
        include: { material: true },
      },
    },
  });

  const ingredientNameMap = new Map(ingredients.map((i) => [i.slug, i.name]));

  // Material-ID → Aggregation
  type Agg = {
    material: typeof ingredients[0]["compatibilities"][0]["material"];
    worst: number;
    drivers: MaterialRec["drivers"];
  };
  const byMaterial = new Map<string, Agg>();

  for (const ing of ingredients) {
    for (const c of ing.compatibilities) {
      const cat = c.material.category;
      if (cat !== "ELASTOMER" && cat !== "THERMOPLASTIC") continue;
      const sev = RATING_ORDER[c.rating];
      let agg = byMaterial.get(c.materialId);
      if (!agg) {
        agg = { material: c.material, worst: 0, drivers: [] };
        byMaterial.set(c.materialId, agg);
      }
      if (sev > agg.worst) agg.worst = sev;
      // Sammle die "treibenden" Einträge (alle, die zur Worst-Bewertung beigetragen haben — oder Caution/Unsuitable)
      if (sev >= 3) {
        agg.drivers.push({
          ingredientSlug: ing.slug,
          ingredientName: ing.name,
          rating: c.rating,
          note: c.note,
        });
      }
    }
  }

  // Inverse Map: severity → rating
  const SEV_TO_RATING = ["RECOMMENDED", "RECOMMENDED", "COMPATIBLE", "CAUTION", "UNSUITABLE"] as const;

  const recommendations: MaterialRec[] = [];
  for (const agg of byMaterial.values()) {
    // Drivers eindeutig + nach Severität sortieren
    const seen = new Set<string>();
    const uniqueDrivers = agg.drivers
      .filter((d) => {
        const k = `${d.ingredientSlug}::${d.rating}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => (RATING_ORDER[b.rating] ?? 0) - (RATING_ORDER[a.rating] ?? 0));

    recommendations.push({
      materialId: agg.material.id,
      materialSlug: agg.material.slug,
      materialName: agg.material.name,
      materialShortName: agg.material.shortName,
      materialCategory: agg.material.category,
      worstRating: SEV_TO_RATING[agg.worst] as MaterialRec["worstRating"],
      drivers: uniqueDrivers,
    });
  }

  // Sortieren: erst die besten (RECOMMENDED, COMPATIBLE), dann CAUTION, dann UNSUITABLE
  recommendations.sort(
    (a, b) =>
      RATING_ORDER[a.worstRating] - RATING_ORDER[b.worstRating] ||
      a.materialShortName.localeCompare(b.materialShortName),
  );

  return {
    recommendations,
    inferredIngredients: rationale.map((r) => ({
      slug: r.ingredient,
      name: ingredientNameMap.get(r.ingredient) ?? r.ingredient,
      why: r.why,
    })),
  };
}
