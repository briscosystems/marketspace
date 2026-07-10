// Anzeige-/Abrechnungswährung des Nutzers. Basis-Kalkulation der Credits ist
// EUR (Superadmin-Einstellung `creditPriceCt`, EUR-Cent). Ohne explizite
// Wahl im Profil (`preferredCurrency`) wird die Währung aus `country`
// abgeleitet: Eurozone + inoffizielle Euro-Nutzer (Kosovo, Montenegro,
// Monaco, San Marino, Vatikan) → EUR, EU-Staaten mit eigener Währung sowie
// Nicht-EU-Europa → jeweilige Landeswährung.

export const COUNTRY_CURRENCY: Record<string, string> = {
  // Eurozone + inoffizielle Euro-Nutzer
  AD: "EUR", AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR",
  FI: "EUR", FR: "EUR", GR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR",
  LV: "EUR", MC: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR",
  SM: "EUR", VA: "EUR", XK: "EUR", ME: "EUR",
  // EU-Mitglied, aber eigene Währung
  BG: "BGN", CZ: "CZK", DK: "DKK", HU: "HUF", PL: "PLN", RO: "RON", SE: "SEK",
  // Nicht-EU-Europa
  CH: "CHF", GB: "GBP", NO: "NOK", IS: "ISK",
  AL: "ALL", BA: "BAM", MK: "MKD", RS: "RSD", MD: "MDL", UA: "UAH",
  RU: "RUB", BY: "BYN",
};

// Näherungs-Kurse zu EUR — grobe Annahme wie in lib/price-aggregation.ts
// (FX_TO_EUR), kein Live-Kurs. Für echten Zahlungsverkehr durch eine
// FX-Quelle ersetzen.
const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  CHF: 1.05,
  GBP: 1.17,
  NOK: 0.085,
  SEK: 0.088,
  DKK: 0.134,
  PLN: 0.23,
  CZK: 0.04,
  HUF: 0.0025,
  RON: 0.2,
  BGN: 0.51,
  ISK: 0.0065,
  ALL: 0.01,
  BAM: 0.51,
  MKD: 0.016,
  RSD: 0.0085,
  MDL: 0.05,
  UAH: 0.024,
  RUB: 0.0095,
  BYN: 0.29,
};

// Währungen, die Stripe Checkout zuverlässig als Presentment-Currency
// unterstützt. Kleinere Balkan-Währungen sowie RUB/BYN (Sanktionen) fallen
// für die tatsächliche Abbuchung auf EUR zurück, damit der Checkout nicht
// mit einer nicht unterstützten Währung fehlschlägt.
const STRIPE_SUPPORTED = new Set([
  "EUR", "CHF", "GBP", "NOK", "SEK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "ISK",
]);

// Auswahl im Profil — auf zuverlässig abrechenbare Währungen beschränkt
// (identisch mit STRIPE_SUPPORTED), damit Anzeige- und Abrechnungswährung
// immer übereinstimmen.
export const CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: "EUR", label: "Euro (EUR)" },
  { code: "CHF", label: "Schweizer Franken (CHF)" },
  { code: "GBP", label: "Britisches Pfund (GBP)" },
  { code: "NOK", label: "Norwegische Krone (NOK)" },
  { code: "SEK", label: "Schwedische Krone (SEK)" },
  { code: "DKK", label: "Dänische Krone (DKK)" },
  { code: "PLN", label: "Polnischer Złoty (PLN)" },
  { code: "CZK", label: "Tschechische Krone (CZK)" },
  { code: "HUF", label: "Ungarischer Forint (HUF)" },
  { code: "RON", label: "Rumänischer Leu (RON)" },
  { code: "BGN", label: "Bulgarischer Lew (BGN)" },
  { code: "ISK", label: "Isländische Krone (ISK)" },
];

export function isSupportedCurrency(currency: string): boolean {
  return STRIPE_SUPPORTED.has(currency);
}

// Stripe erwartet den Betrag bei diesen Währungen in ganzen Einheiten statt
// in Untereinheiten (Cent-Äquivalent).
const ZERO_DECIMAL = new Set(["ISK"]);

/** Anzeige-Währung für ein Land (Default: EUR). */
export function currencyForCountry(country: string | null | undefined): string {
  return (country && COUNTRY_CURRENCY[country]) || "EUR";
}

/** Anzeige-Währung des Nutzers — eigene Wahl im Profil geht vor Länder-Default. */
export function currencyForUser(user: {
  country?: string | null;
  preferredCurrency?: string | null;
}): string {
  if (user.preferredCurrency && isSupportedCurrency(user.preferredCurrency)) {
    return user.preferredCurrency;
  }
  return currencyForCountry(user.country);
}

/** Abrechnungs-Währung für Stripe — fällt auf EUR zurück, wenn Stripe die
 * Währung nicht als Presentment-Currency unterstützt. */
export function billingCurrencyForUser(user: {
  country?: string | null;
  preferredCurrency?: string | null;
}): string {
  const currency = currencyForUser(user);
  return STRIPE_SUPPORTED.has(currency) ? currency : "EUR";
}

/** Rechnet einen Betrag von einer Währung in eine andere um (via EUR-Pivot). */
export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const eur = amount * (FX_TO_EUR[from] ?? 1);
  return eur / (FX_TO_EUR[to] ?? 1);
}

/** Betrag für Stripe in der kleinsten Einheit der Währung (Cent-Äquivalent). */
export function toStripeAmount(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100);
}

/** Formatiert einen Betrag in der übergebenen Währung, deutsches Zahlenformat. */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
}
