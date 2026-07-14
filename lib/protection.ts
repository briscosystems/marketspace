// Käuferschutz — zentrale Konstanten & Helfer.
//
// Wording-Vorgabe (Stripe-Support-Bestätigung): "Käuferschutz" /
// "Zahlungsfreigabe nach Lieferbestätigung" — niemals "Treuhand"/"Escrow".
// Geldfluss: separate charges & transfers, Auszahlung erst nach
// Lieferbestätigung des Käufers (Haltefrist immer < 90 Tage).

/**
 * Käuferschutz-Gebühr, die der Käufer trägt: standardmäßig 2,5 % + 0,25 €.
 * Deckt die Zahlungsabwicklung (Stripe) UND den Käuferschutz-Service
 * (sichere Verwahrung bis Lieferbestätigung, Streitschlichtung); ein Teil
 * verbleibt als Marge bei der Plattform. Satz per Superadmin einstellbar
 * (protectionFeeBp / protectionFeeFixedCt) — Defaults hier als Fallback.
 */
export function protectionFeeEur(totalEur: number, feeBp = 250, fixedCt = 25): number {
  return Math.round(totalEur * (feeBp / 10000) * 100 + fixedCt) / 100;
}

export const PROTECTION_STATUS_LABEL: Record<string, string> = {
  NONE: "ohne Käuferschutz",
  PENDING_PAYMENT: "Zahlung offen",
  HELD: "bezahlt — Geld sicher geparkt",
  RELEASED: "freigegeben an Verkäufer",
  REFUNDED: "an Käufer zurückerstattet",
  DISPUTED: "Problem gemeldet — in Prüfung",
};
