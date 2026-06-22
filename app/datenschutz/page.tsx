import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Datenschutz — Brisco Marketplace" };

// Datenschutzerklärung (DSGVO-Grundgerüst). Platzhalter vor Live-Gang füllen
// und von einer/einem Datenschutz-Fachkundigen prüfen lassen.
export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Datenschutzerklärung</h1>

      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p>
          <strong>Entwurf:</strong> DSGVO-Grundgerüst. Vor dem Live-Gang die <code>[ … ]</code>-Felder
          ergänzen und fachkundig prüfen lassen (insb. Auftragsverarbeiter, Speicherdauern,
          Rechtsgrundlagen).
        </p>
      </div>

      <Block title="1. Verantwortlicher">
        <p>Brisco Systems GmbH, [ Adresse ], Linz, Österreich. Kontakt: [ datenschutz@… ].</p>
        <p>Datenschutz-Anfragen richten Sie bitte an die obige Adresse.</p>
      </Block>

      <Block title="2. Welche Daten wir verarbeiten">
        <ul className="ml-5 list-disc space-y-1">
          <li>Stammdaten der Registrierung: Pseudonym, E-Mail, Passwort (nur als Hash), Firma, UID, Land.</li>
          <li>Nutzungsdaten: Angebote, Anfragen, Nachrichten, Transaktionen, Bewertungen.</li>
          <li>Zahlungsdaten: über unseren Zahlungsdienstleister (wir speichern keine Kartendaten).</li>
          <li>Technische Daten: Server-Logs, IP-Adresse, Zeitpunkt des Zugriffs.</li>
        </ul>
      </Block>

      <Block title="3. Zwecke & Rechtsgrundlagen">
        <ul className="ml-5 list-disc space-y-1">
          <li>Vertragserfüllung (Bereitstellung der Plattform) — Art. 6 Abs. 1 lit. b DSGVO.</li>
          <li>Rechtliche Pflichten (z. B. Buchhaltung) — Art. 6 Abs. 1 lit. c DSGVO.</li>
          <li>Berechtigtes Interesse (Sicherheit, Betrugs-/Missbrauchsvermeidung) — Art. 6 Abs. 1 lit. f DSGVO.</li>
        </ul>
      </Block>

      <Block title="4. Empfänger / Auftragsverarbeiter">
        <p>Wir setzen sorgfältig ausgewählte Dienstleister ein, u. a.:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Stripe</strong> (Zahlungsabwicklung Kreditkarte).</li>
          <li><strong>Anthropic</strong> (KI-gestützte Produktempfehlungen / KSS-Finder).</li>
          <li><strong>[ Hosting-/Server-Anbieter ]</strong> (Betrieb der Plattform & Datenbank).</li>
        </ul>
        <p>Mit allen Auftragsverarbeitern bestehen entsprechende Verträge (Art. 28 DSGVO).</p>
      </Block>

      <Block title="5. Speicherdauer">
        <p>Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
          erforderlich ist bzw. gesetzliche Aufbewahrungsfristen (z. B. [ 7 Jahre ] für
          Buchhaltungsdaten) es verlangen.</p>
      </Block>

      <Block title="6. Ihre Rechte">
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch. Zudem besteht ein Beschwerderecht
          bei der <strong>österreichischen Datenschutzbehörde</strong>{" "}
          (<a className="text-brand-600 hover:underline" href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">www.dsb.gv.at</a>).</p>
      </Block>

      <Block title="7. Cookies">
        <p>Wir verwenden nur technisch notwendige Cookies (z. B. für die Anmeldesitzung). Es
          findet [ kein / ggf. anpassen ] Tracking zu Werbezwecken statt.</p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-1 text-sm text-slate-700">
      <h2 className="mb-1 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
