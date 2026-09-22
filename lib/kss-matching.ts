/**
 * KSS-Typ erkennen, wenn die Schreibweise nicht genau stimmt.
 *
 * Hintergrund (Betreiber 2026-09-22): Der eMix1500 schickt den Kühlschmierstoff
 * so, wie er in der Maschinensteuerung hinterlegt ist — mal „B-Cool 755", mal
 * „bcool755", mal „B Cool 755 Blaser". Die Plattform muss daraus das richtige
 * Katalogprodukt finden.
 *
 * Grundsatz: **Es wird nicht geraten.** Ein Treffer gilt nur dann als eindeutig,
 * wenn er deutlich besser passt als der zweitbeste. Sonst kommen alle Kandidaten
 * zurück und das Gerät fragt den Bediener — ein falscher Refraktometer-Faktor
 * führt sonst zu einer falsch angesetzten Emulsion.
 */
import { normalizeForSearch } from "@/lib/normalize-search";

export type MatchKandidat<T> = {
  produkt: T;
  /** 0–100; wie gut die Eingabe zum Katalognamen passt. */
  punkte: number;
  /** Wie der Treffer zustande kam — für die Nachvollziehbarkeit im Gerät. */
  art: "exakt" | "enthalten" | "aehnlich";
};

/** Levenshtein-Distanz — für Tippfehler wie „Blasocut" vs. „Blasokut". */
function distanz(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let vorige = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const aktuell = [i];
    for (let j = 1; j <= b.length; j++) {
      aktuell[j] = Math.min(
        vorige[j] + 1,
        aktuell[j - 1] + 1,
        vorige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    vorige = aktuell;
  }
  return vorige[b.length];
}

/**
 * Bewertet einen Katalognamen gegen die Eingabe des Geräts.
 * Verglichen wird normalisiert (Kleinbuchstaben, ohne Trennzeichen) — damit
 * trifft „bcool755" auf „B-Cool 755".
 */
export function bewerte(eingabe: string, katalogName: string, hersteller: string): MatchKandidat<null> | null {
  const e = normalizeForSearch(eingabe);
  const n = normalizeForSearch(katalogName);
  const nMitHersteller = normalizeForSearch(hersteller + katalogName);
  if (!e || !n) return null;

  if (e === n || e === nMitHersteller) {
    return { produkt: null, punkte: 100, art: "exakt" };
  }
  // Eingabe enthält den Katalognamen (z. B. mit Herstellerpräfix) oder umgekehrt.
  if (n.includes(e) || e.includes(n) || nMitHersteller.includes(e) || e.includes(nMitHersteller)) {
    const kurz = Math.min(e.length, n.length);
    const lang = Math.max(e.length, n.length);
    // Je ähnlicher die Länge, desto sicherer der Treffer.
    return { produkt: null, punkte: Math.round(70 + 25 * (kurz / lang)), art: "enthalten" };
  }
  // Tippfehler-Toleranz: höchstens ein Fünftel der Zeichen darf abweichen.
  const d = distanz(e, n);
  const erlaubt = Math.max(1, Math.floor(n.length / 5));
  if (d <= erlaubt) {
    return { produkt: null, punkte: Math.max(40, Math.round(85 - (d / n.length) * 100)), art: "aehnlich" };
  }
  return null;
}

/**
 * Sortiert Kandidaten und entscheidet, ob der beste Treffer eindeutig ist.
 *
 * Eindeutig heißt: mindestens 80 Punkte UND mindestens 15 Punkte Vorsprung vor
 * dem zweiten. Zwei fast gleich gute Namen (z. B. „Zubora 65 H Plus" und
 * „Zubora 65 H Extra") bleiben damit bewusst eine Rückfrage an den Bediener.
 */
export function entscheide<T>(kandidaten: MatchKandidat<T>[]): {
  eindeutig: boolean;
  beste: MatchKandidat<T> | null;
  alle: MatchKandidat<T>[];
} {
  const sortiert = [...kandidaten].sort((a, b) => b.punkte - a.punkte);
  const beste = sortiert[0] ?? null;
  const zweite = sortiert[1];
  const eindeutig =
    !!beste && beste.punkte >= 80 && (!zweite || beste.punkte - zweite.punkte >= 15);
  return { eindeutig, beste, alle: sortiert };
}
