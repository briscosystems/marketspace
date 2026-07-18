export const metadata = { title: "Datenschutz — Brisco Marketplace" };

// Datenschutzerklärung (DSGVO/DSG-Grundgerüst).
//
// Der nutzersichtbare „Entwurf“-Warnkasten wurde am 2026-07-17 entfernt (analog zu
// den AGB): Er schwächt auf einer öffentlichen Rechtsseite genau das Dokument, das
// Verbindlichkeit schaffen soll, und es standen keine offenen [ … ]-Platzhalter mehr
// darin. Die fachkundige Prüfung bleibt ein offener Punkt (GO-LIVE.md 1.2), der
// Betreiber führt sie selbst durch.
export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Datenschutzerklärung</h1>

      <Block title="1. Verantwortlicher">
        <p>
          Brisco Systems GmbH, Huebacherweg 27, CH-8335 Hittnau, Schweiz. Kontakt:{" "}
          <a className="text-brand-600 hover:underline" href="mailto:jgosch@brisco.ch">jgosch@brisco.ch</a>.
        </p>
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
          <li><strong>Stripe</strong> (Zahlungsabwicklung — Karten, Wallets, ggf. weitere Methoden).</li>
          <li><strong>Anthropic</strong> (KI-gestützte Produktempfehlungen / KSS-Finder).</li>
          <li><strong>Railway</strong> (Hosting — Betrieb der Plattform &amp; Datenbank).</li>
          <li><strong>Zoho / ZeptoMail</strong> (Versand von System-E-Mails, z. B. Passwort-Zurücksetzen).</li>
        </ul>
        <p>Mit allen Auftragsverarbeitern bestehen entsprechende Verträge (Art. 28 DSGVO).</p>
      </Block>

      <Block title="5. Übermittlung in Drittländer">
        <p>
          Einzelne der oben genannten Dienstleister verarbeiten Daten ganz oder teilweise
          außerhalb der Schweiz bzw. der EU/des EWR (insbesondere in den USA). Soweit dies der
          Fall ist, stützen wir die Übermittlung auf geeignete Garantien im Sinne der Art. 44 ff.
          DSGVO — namentlich die Standardvertragsklauseln der EU-Kommission (SCC) bzw. einen
          Angemessenheitsbeschluss, sowie die entsprechenden Regelungen des schweizerischen DSG.
          Wo möglich wählen wir Verarbeitung in der EU (z. B. EU-Rechenzentrum von ZeptoMail).
        </p>
      </Block>

      <Block title="6. Speicherdauer">
        <p>Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
          erforderlich ist bzw. gesetzliche Aufbewahrungsfristen (z. B. 10 Jahre für
          Geschäftsbücher nach Art. 958f OR) es verlangen.</p>
      </Block>

      <Block title="7. Ihre Rechte">
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch. Aufsichtsstelle in der Schweiz ist
          der <strong>Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB)</strong>{" "}
          (<a className="text-brand-600 hover:underline" href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer">www.edoeb.admin.ch</a>);
          für EU-Nutzer besteht zudem ein Beschwerderecht bei der jeweils zuständigen
          EU-Datenschutzbehörde.</p>
      </Block>

      <Block title="8. Cookies">
        <p>Wir verwenden nur technisch notwendige Cookies (z. B. für die Anmeldesitzung). Es
          findet kein Tracking zu Werbezwecken statt.</p>
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
