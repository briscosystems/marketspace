import type { PackagingForm } from "@prisma/client";

/**
 * Gebinde-Wahl für Katalog-Produkte (Product hat — anders als Listing — kein
 * Packaging-Feld). Liefert ein plausibles, STABILES Gebinde je Produkt:
 *
 * - Reiniger / Korrosionsschutz / Additive / Spezialprodukte → Kanister
 * - Fette → Fass (Hobbock)
 * - Öle & KSS → überwiegend 200-L-Fass, jedes dritte Produkt IBC
 *   (deterministisch über einen Hash der Produkt-ID, damit dasselbe Produkt
 *   auf allen Seiten dasselbe Bild bekommt).
 */
export function packagingForProduct(
  category: string,
  productId: string,
): PackagingForm {
  switch (category) {
    case "CLEANER":
    case "CORROSION_PROTECTION":
    case "ADDITIVE":
    case "SPECIALTY":
      return "CANISTER";
    case "GREASE":
      return "DRUM";
    default: {
      // Öle / KSS: 2 von 3 als Fass, 1 von 3 als IBC — stabil per ID-Hash
      let h = 0;
      for (let i = 0; i < productId.length; i++) {
        h = (h * 31 + productId.charCodeAt(i)) | 0;
      }
      return Math.abs(h) % 3 === 0 ? "IBC" : "DRUM";
    }
  }
}
