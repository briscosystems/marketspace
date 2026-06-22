/**
 * Pseudonym-Schutz — verhindert, dass das öffentliche Pseudonym die echte
 * Person, Firma oder einen bekannten Hersteller verrät. Sonst könnten andere
 * Reseller die Gegenseite erkennen und die Plattform umgehen.
 *
 * Zwei Bausteine:
 *  1. generatePseudonym()  — neutraler Zufallsname als Vorschlag (Weg A).
 *  2. findPseudonymLeak()  — prüft eine eigene Eingabe gegen Firmenname,
 *                            E-Mail, USt-ID und bekannte Hersteller (Weg B).
 */

import { normalizeForSearch } from "@/lib/normalize-search";

/** Neutrale Wortbausteine — bewusst generisch, ohne Firmen-/Personenbezug. */
const PSEUDONYM_PREFIXES = [
  "Anbieter",
  "Trader",
  "Partner",
  "Kontakt",
  "Handel",
  "Bezug",
  "Quelle",
  "Markt",
];

// Ohne 0/O/1/I/L — vermeidet Verwechslung beim Vorlesen/Abtippen.
const SUFFIX_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Erzeugt einen neutralen Vorschlag wie "Anbieter-7F3K". Rein zufällig,
 * ohne Bezug zur Person — erfüllt das Pseudonym-Regex [A-Za-z0-9_-]+.
 */
export function generatePseudonym(): string {
  const prefix =
    PSEUDONYM_PREFIXES[Math.floor(Math.random() * PSEUDONYM_PREFIXES.length)];
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
}

/** Rechtsform-Zusätze & Füllwörter — als Firmen-„Kern" nicht aussagekräftig. */
const COMPANY_STOPWORDS = new Set([
  "gmbh",
  "ag",
  "kg",
  "ohg",
  "ug",
  "ltd",
  "limited",
  "inc",
  "llc",
  "bv",
  "sa",
  "sarl",
  "srl",
  "spa",
  "co",
  "company",
  "und",
  "and",
  "the",
  "group",
  "gruppe",
  "holding",
  "international",
  "deutschland",
  "schweiz",
  "europe",
  "europa",
]);

/**
 * Zerlegt einen Firmen-/Herstellernamen in aussagekräftige Wort-Kerne
 * (normalisiert, ohne Rechtsform-Zusätze, min. 3 Zeichen).
 */
function significantTokens(name: string | null | undefined): string[] {
  if (!name) return [];
  return name
    .split(/[\s,.\-_/&]+/)
    .map((w) => normalizeForSearch(w))
    .filter((w) => w.length >= 3 && !COMPANY_STOPWORDS.has(w));
}

/**
 * Prüft, ob das Pseudonym einen verräterischen Bezug enthält.
 * Liefert eine deutsche Begründung (für die Anzeige) oder `null`, wenn sauber.
 *
 * @param manufacturerNames Liste aller bekannten Hersteller-Namen (aus der DB).
 */
export function findPseudonymLeak(
  pseudonym: string,
  context: {
    companyName?: string | null;
    email?: string | null;
    vatId?: string | null;
    manufacturerNames?: string[];
  },
): string | null {
  const pn = normalizeForSearch(pseudonym);
  if (!pn) return null;

  // Hilfsfunktion: matcht ein Kern-Wort gegen das Pseudonym (beidseitig,
  // damit "muelleroil" ⊇ "mueller" UND "mueller" ⊇ "muelleroil" greift).
  const hits = (token: string) =>
    token.length >= 3 && (pn.includes(token) || token.includes(pn));

  // 1) Firmenname
  for (const token of significantTokens(context.companyName)) {
    if (hits(token)) {
      return "Das Pseudonym darf nicht an deinen Firmennamen erinnern.";
    }
  }

  // 2) E-Mail (Teil vor dem @ und die Domain ohne Endung)
  if (context.email) {
    const [local, domain] = context.email.toLowerCase().split("@");
    const emailTokens = [
      normalizeForSearch(local),
      ...significantTokens(domain?.replace(/\.[a-z]+$/, "")),
    ].filter((t) => t.length >= 3);
    for (const token of emailTokens) {
      if (hits(token)) {
        return "Das Pseudonym darf keinen Teil deiner E-Mail-Adresse enthalten.";
      }
    }
  }

  // 3) USt-ID
  if (context.vatId) {
    const vat = normalizeForSearch(context.vatId);
    if (vat.length >= 4 && pn.includes(vat)) {
      return "Das Pseudonym darf nicht deine USt-ID enthalten.";
    }
  }

  // 4) Bekannte Hersteller
  for (const name of context.manufacturerNames ?? []) {
    for (const token of significantTokens(name)) {
      if (hits(token)) {
        return "Das Pseudonym darf nicht an einen bekannten Hersteller erinnern.";
      }
    }
  }

  return null;
}
