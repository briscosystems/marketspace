/**
 * Such-Normalisierung — entfernt alle Trennzeichen, normalisiert Unicode,
 * lowercase. Ermöglicht "bcool755" → matcht "B-Cool 755" und "B-Cool MC-610"
 * matcht "bcoolmc610".
 *
 * Wird sowohl beim Indexieren (lib/normalize-search → searchTokens-Feld)
 * als auch beim Suchen (User-Input) angewendet — so funktioniert SQL-`contains`.
 */
export function normalizeForSearch(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Diakritika
    .replace(/[^a-z0-9]/g, ""); // alles außer a-z0-9 entfernen
}

/**
 * Baut das Such-Token aus den relevanten SDS-Feldern zusammen.
 * Wir nehmen productName + manufacturer + version + producten als single string,
 * dann normalisieren — ein einziger contains-Treffer matcht Teilstring.
 */
export function buildSearchTokens(parts: {
  productName?: string | null;
  manufacturer?: string | null;
  version?: string | null;
}): string {
  return normalizeForSearch(
    [parts.productName, parts.manufacturer, parts.version].filter(Boolean).join(" "),
  );
}
