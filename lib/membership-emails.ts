// Inhalte der beiden Abo-Kommunikations-E-Mails (Erinnerung vor automatischer
// Verlängerung + Bestätigung danach). Rechtlicher Hintergrund: In der EU gibt
// es KEINEN einheitlichen Mindeststandard für eine Vorab-Erinnerung — einige
// Länder verlangen sie gesetzlich mit fester Frist (Frankreich: 1–3 Monate
// vorher, Art. L215-1 Code de la consommation; Italien: ≥30 Tage; Spanien:
// ≥15 Tage; Schweden: ≥1 Monat), andere gar nicht (Deutschland, Schweiz,
// Luxemburg, Polen, Niederlande — dort nur Kündigungsbutton/Transparenz-
// Pflichten, keine Erinnerungspflicht). Damit eine EINZIGE Linie für alle
// Länder reicht, wird pauschal für ALLE Nutzer (unabhängig von Land oder
// Rolle Reseller/OEM/Endkunde) ~30 Tage vor Verlängerung erinnert — das
// erfüllt die strengste gefundene Frist (Frankreich) und übertrifft die
// übrigen. Die Bestätigung danach ist zusätzliche Transparenz, ersetzt aber
// nirgends die Vorab-Erinnerung (eine Nachher-Bestätigung allein reicht z.B.
// in Frankreich rechtlich NICHT aus). Keine Rechtsberatung — vor Live-
// Schaltung von einer Anwältin/einem Anwalt in den relevanten Ländern prüfen
// lassen (siehe auch den Hinweis in lib/membership.ts).

export const MEMBERSHIP_REMINDER_DAYS_BEFORE = 30;

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

export function renewalReminderEmail(params: {
  pseudonym: string;
  renewalDate: Date;
  priceLabel: string;
  cancelUrl: string;
}): { subject: string; body: string } {
  return {
    subject: "Deine Brisco-Mitgliedschaft verlängert sich bald automatisch",
    body: `Hallo ${params.pseudonym},

deine Jahres-Mitgliedschaft bei Brisco Marketplace verlängert sich automatisch am ${formatDate(params.renewalDate)} um ein weiteres Jahr, sofern du nicht vorher kündigst.

Preis der Verlängerung: ${params.priceLabel}

Möchtest du nicht verlängern, kannst du bis zu diesem Datum jederzeit mit einem Klick kündigen:
${params.cancelUrl}

Nach einer Kündigung bleibt dein Zugang bis zum Ende der bereits bezahlten Periode aktiv, es erfolgt keine weitere Abbuchung.

Viele Grüße
Brisco Marketplace`,
  };
}

export function renewalConfirmationEmail(params: {
  pseudonym: string;
  validUntil: Date;
  priceLabel: string;
  cancelUrl: string;
}): { subject: string; body: string } {
  return {
    subject: "Deine Brisco-Mitgliedschaft wurde um ein weiteres Jahr verlängert",
    body: `Hallo ${params.pseudonym},

deine Jahres-Mitgliedschaft bei Brisco Marketplace wurde automatisch um ein weiteres Jahr verlängert und ist nun gültig bis ${formatDate(params.validUntil)}.

Berechneter Betrag: ${params.priceLabel}

Du kannst jederzeit kündigen — der Zugang bleibt dann bis zum Ende der bereits bezahlten Periode aktiv:
${params.cancelUrl}

Viele Grüße
Brisco Marketplace`,
  };
}
