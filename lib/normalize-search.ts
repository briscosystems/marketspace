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

/**
 * Splittet die User-Suchanfrage in einzelne normalisierte Tokens.
 * - "blaser bcool 755" → ["blaser", "bcool", "755"]
 * - "b-cool" → ["bcool"]
 * - "hocut795mp" → ["hocut795mp"] (kein Split bei Verklebung — User soll AND haben)
 *
 * Jeder Token wird einzeln als AND-Filter angewandt — User-Reihenfolge egal.
 * Tokens kürzer als 2 Zeichen werden verworfen (zu unspezifisch).
 */
export function tokenizeQuery(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[\s,;]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 2);
}

/**
 * Baut eine Prisma-WhereInput für ein normalisiertes searchTokens-Feld:
 * jeder User-Token muss als contains gegen searchTokens passen (AND).
 * Liefert null wenn keine Tokens — Caller soll Filter dann skippen.
 */
export function buildSearchWhere<T extends string>(
  field: T,
  query: string | null | undefined,
): { AND: { [k in T]: { contains: string } }[] } | null {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return null;
  return {
    AND: tokens.map((t) => ({ [field]: { contains: t } } as { [k in T]: { contains: string } })),
  };
}
