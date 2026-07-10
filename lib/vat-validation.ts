// USt-ID-Prüfung gegen VIES — die offizielle, kostenlose EU-Datenbank
// (VAT Information Exchange System) der EU-Kommission. Deckt alle
// EU-Mitgliedstaaten ab; Schweizer UID (CHE-...) und andere Nicht-EU-Nummern
// können hier NICHT geprüft werden und liefern { checkable: false }.

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

// EU-Länder, deren USt-IDs VIES kennt (Präfix der USt-ID = Ländercode;
// Ausnahme Griechenland: "EL" statt ISO "GR").
const VIES_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK", "XI", // XI = Nordirland
]);

export type VatValidationResult =
  | { checkable: false; reason: string }
  | { checkable: true; valid: boolean; name: string | null };

/**
 * Prüft eine USt-ID gegen VIES. Erwartet das Format mit Länderpräfix,
 * z.B. "DE123456789" oder "ATU12345678". Wirft nicht — Netzwerk-/
 * Dienstfehler kommen als { checkable: false } zurück.
 */
export async function validateVatId(rawVatId: string): Promise<VatValidationResult> {
  const vatId = rawVatId.trim().toUpperCase().replace(/[\s.-]/g, "");
  let countryCode = vatId.slice(0, 2);
  if (countryCode === "GR") countryCode = "EL"; // VIES nutzt EL für Griechenland
  const vatNumber = vatId.slice(2);

  if (!/^[A-Z]{2}$/.test(countryCode) || vatNumber.length < 2) {
    return { checkable: false, reason: "Format nicht erkannt — bitte mit Länderpräfix eingeben, z.B. DE123456789." };
  }
  if (!VIES_COUNTRY_CODES.has(countryCode)) {
    return {
      checkable: false,
      reason: `${countryCode}-Nummern können nicht über die EU-Datenbank (VIES) geprüft werden — sie deckt nur EU-USt-IDs ab.`,
    };
  }

  try {
    const res = await fetch(VIES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, vatNumber }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { checkable: false, reason: "Die EU-Datenbank (VIES) ist gerade nicht erreichbar — bitte später erneut versuchen." };
    }
    const data = (await res.json()) as { valid?: boolean; name?: string };
    return {
      checkable: true,
      valid: data.valid === true,
      name: data.name && data.name !== "---" ? data.name : null,
    };
  } catch {
    return { checkable: false, reason: "Die EU-Datenbank (VIES) ist gerade nicht erreichbar — bitte später erneut versuchen." };
  }
}
