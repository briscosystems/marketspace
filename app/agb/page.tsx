export const metadata = {
  title: "AGB — Brisco Marketplace",
};

// Allgemeine Geschäftsbedingungen. B2B-Plattform, Vermittlermodell.
//
// Der nutzersichtbare "kein Rechtsrat / Entwurf"-Warnkasten wurde am 2026-07-15 auf
// Wunsch des Betreibers entfernt: Ein Hinweis "unsere AGB sind ein Entwurf" schwächt
// auf einer öffentlichen Rechtsseite genau das Dokument, das Verbindlichkeit schaffen
// soll. Die anwaltliche Prüfung (CH, insb. Art. 8 UWG, Haftung, DSG/DSGVO, Abgrenzung
// B2B) bleibt davon unberührt und ist als offener Punkt in GO-LIVE.md 1.2 festgehalten
// — der Betreiber führt sie selbst durch.
export default function AgbPage() {
  // Laufende Nummerierung: neue Abschnitte verschieben nie wieder Querverweise.
  let nr = 0;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="text-sm text-slate-500">Stand: August 2026</p>
      </div>

      <Section n={String(++nr)} title="Geltungsbereich & Plattformbetreiber">
        <p>
          Diese AGB regeln die Nutzung des Online-Marktplatzes „Brisco" (nachfolgend „Plattform"),
          betrieben von der <strong>Brisco Systems GmbH</strong>, Huebacherweg 27, CH-8335 Hittnau,
          Schweiz (nachfolgend
          „Brisco"). Die Plattform richtet sich <strong>ausschließlich an Unternehmer</strong>
          (Reseller, Hersteller, gewerbliche Endabnehmer). Eine
          Nutzung durch Verbraucher ist nicht vorgesehen.
        </p>
        <p>
          Mit der Registrierung akzeptiert der Nutzer diese AGB. Abweichende Bedingungen des Nutzers
          gelten nur, wenn Brisco ihnen ausdrücklich schriftlich zustimmt.
        </p>
      </Section>

      <Section n={String(++nr)} title="Rolle von Brisco — reine Vermittlung">
        <p>
          Brisco betreibt eine technische Vermittlungsplattform. Brisco bringt Anbieter und
          Nachfrager zusammen und stellt Werkzeuge zur Recherche, Kommunikation und Anbahnung bereit.
        </p>
        <p>
          <strong>Brisco wird nicht Vertragspartei</strong> der zwischen den Nutzern geschlossenen
          Kauf-, Liefer- oder sonstigen Verträge. Diese kommen ausschließlich und unmittelbar
          zwischen den beteiligten Nutzern zustande. Brisco ist insbesondere weder Verkäufer,
          Hersteller, Importeur noch Inverkehrbringer der gehandelten Produkte und übernimmt keine
          Erfüllungs-, Liefer- oder Zahlungspflichten aus diesen Verträgen.
        </p>
        <p>
          Brisco ist <strong>nicht verpflichtet, von Nutzern eingestellte Inhalte vorab zu
          prüfen</strong> (Angebote, Anfragen, Produktangaben, Nachrichten, Fotos). Brisco geht
          konkreten Hinweisen auf Rechtsverstöße nach und kann beanstandete Inhalte entfernen,
          ausblenden oder sperren.
        </p>
      </Section>

      <Section n={String(++nr)} title="Registrierung, Pseudonymität & Nutzerpflichten">
        <p>
          Nutzer treten auf der Plattform unter einem <strong>Pseudonym</strong> auf; die
          Klaridentität wird Brisco gegenüber im Rahmen der Verifizierung offengelegt, aber anderen
          Nutzern grundsätzlich nicht angezeigt. Der Nutzer sichert zu, dass seine Angaben (Firma,
          UID, Kontaktdaten gegenüber Brisco) wahr und aktuell sind.
        </p>
        <p>
          Der Nutzer ist für alle Aktivitäten unter seinem Zugang verantwortlich und hält die
          Zugangsdaten geheim. Eingestellte Angebote/Anfragen müssen sachlich richtig, rechtmäßig und
          vollständig sein (inkl. erforderlicher Sicherheits- und Gefahrstoffangaben).
        </p>
        <p>
          Bei Angeboten über chemische Produkte trägt der <strong>Anbieter die alleinige
          Verantwortung</strong> für die Einhaltung aller einschlägigen Vorschriften — insbesondere
          des Chemikalien- und Gefahrstoffrechts (in der Schweiz u. a. ChemG/ChemV, in der EU
          u. a. REACH und CLP), der Kennzeichnungs-, Verpackungs- und Transportvorschriften
          (u. a. ADR) sowie etwaiger Abgabe-, Export- und Sanktionsbeschränkungen. Der Anbieter
          stellt sicher, dass er zur Abgabe des Produkts an den jeweiligen Erwerber berechtigt ist.
        </p>
      </Section>

      <Section n={String(++nr)} title="Nutzerinhalte, Fotos & Dokumente Dritter">
        <p>
          Für hochgeladene Inhalte (insbesondere <strong>Fotos</strong>, Texte, Produktangaben)
          sichert der Nutzer zu, über die erforderlichen Rechte zu verfügen und keine Rechte
          Dritter zu verletzen. Der Nutzer räumt Brisco das einfache, unentgeltliche Recht ein,
          diese Inhalte zum Betrieb der Plattform zu speichern, anzuzeigen und technisch zu
          bearbeiten (z. B. Verkleinern von Bildern).
        </p>
        <p>
          Von Brisco bereitgestellte <strong>Dokumente Dritter</strong> (insbesondere Sicherheits-
          und technische Datenblätter der Hersteller) werden als Service wiedergegeben.
          <strong> Maßgeblich ist stets das aktuelle Originaldokument des jeweiligen
          Herstellers</strong>; für Aktualität, Vollständigkeit und Richtigkeit der Wiedergabe
          übernimmt Brisco keine Gewähr. Berechtigte Beanstandungen (z. B. von Rechteinhabern)
          werden nach Prüfung unverzüglich durch Entfernung oder Korrektur umgesetzt — Meldung an
          die im Impressum genannte Kontaktadresse.
        </p>
      </Section>

      <Section n={String(++nr)} title="Kommunikation & Verbot des Austauschs von Kontaktdaten">
        <p>
          Die Kommunikation während der Anbahnung erfolgt über das plattforminterne Nachrichtensystem.
          Zur Wahrung der Pseudonymität und der Plattform-Integrität ist es{" "}
          <strong>untersagt, in Nachrichten direkte Kontaktdaten auszutauschen</strong> (insbesondere
          Telefon-/Faxnummern, E-Mail-Adressen, Messenger-IDs, Web-/Shop-Adressen, vollständige
          Firmen-/Personennamen) mit dem Ziel, die Plattform zu umgehen. Brisco darf solche Inhalte
          technisch erkennen, ausblenden oder beanstanden.
        </p>
      </Section>

      <Section n={String(++nr)} title="Zustandekommen von Verträgen zwischen Nutzern">
        <p>
          Angebote und Anfragen auf der Plattform sind unverbindliche Aufforderungen zur Abgabe von
          Angeboten. Ein verbindlicher Vertrag kommt erst durch übereinstimmende Erklärungen der
          beteiligten Nutzer (z. B. Annahme eines Angebots) zustande. Inhalt, Qualität, Menge, Preis,
          Lieferung, Gewährleistung und Zahlung richten sich allein nach der Vereinbarung der Nutzer.
        </p>
      </Section>

      <Section n={String(++nr)} title="Entgelte">
        <p>
          Die Nutzung der Plattform setzt eine <strong>Jahres-Mitgliedschaft</strong> voraus
          (Preis gemäß aktueller Preisangabe, automatische Verlängerung mit jederzeitiger
          Kündigungsmöglichkeit, siehe Mitgliedschaftsseite). KI-Funktionen werden über ein
          separates <strong>Credit-Guthaben</strong> (Prepaid) abgerechnet.{" "}
          <strong>Brisco erhebt keine Provision und keine Gebühr auf Transaktionen zwischen
          Nutzern</strong> und ist am Warenumsatz nicht beteiligt.
        </p>
      </Section>

      <Section n={String(++nr)} title="Käuferschutz (optionale Zahlungsabwicklung)">
        <p>
          Verkäufer können freiwillig den <strong>Käuferschutz</strong> aktivieren
          (Identitäts- und Bankdaten-Prüfung durch den Zahlungsdienstleister Stripe).
          Wählt der Käufer diese Zahlungsart, wird der Kaufbetrag über Stripe eingezogen
          und dort geparkt; die <strong>Auszahlung an den Verkäufer erfolgt erst nach der
          Lieferbestätigung des Käufers</strong>. Meldet der Käufer ein Problem, bleibt der
          Betrag geparkt, bis Brisco nach Prüfung über Freigabe oder Rückerstattung
          entscheidet.
        </p>
        <p>
          Die beim Checkout ausgewiesene <strong>Käuferschutz-Gebühr</strong> (2,5 % des
          Kaufbetrags zzgl. 0,25 €) wird vom Käufer getragen. Sie deckt die
          Zahlungsabwicklung durch den Zahlungsdienstleister sowie den Käuferschutz-Service
          (sichere Verwahrung bis zur Lieferbestätigung, Streitschlichtung); ein Teil
          verbleibt als Entgelt bei Brisco. Brisco verwahrt das Geld nicht selbst; die Zahlung wickelt Stripe ab. Der Käuferschutz ist keine
          Bankdienstleistung von Brisco; die Zahlungsabwicklung erfolgt durch Stripe. Die
          Haltedauer geparkter Beträge beträgt maximal 90 Tage.
        </p>
        <p>
          Die Entscheidung über Freigabe oder Rückerstattung trifft Brisco <strong>nach billigem
          Ermessen</strong> auf Grundlage der von den Parteien eingereichten Belege. Sie ist ein
          Service zur Streitbeilegung; die vertraglichen Ansprüche der Nutzer untereinander und
          der Rechtsweg bleiben unberührt. Ein Anspruch auf ein bestimmtes Ergebnis besteht nicht.
        </p>
      </Section>

      <Section n={String(++nr)} title="KI-Empfehlungen, KSS-Finder & Knowledge Base — ohne Gewähr">
        <p>
          Die Plattform stellt automatisierte Hilfen bereit (u. a. KI-gestützte Empfehlungen,
          KSS-Finder, Preis- und Produktdaten, Sicherheitsdatenblätter, Materialverträglichkeit).
          Diese Angaben dienen ausschließlich der <strong>unverbindlichen Orientierung</strong> und
          stellen <strong>keine technische, chemische, sicherheitstechnische oder rechtliche Beratung</strong>{" "}
          dar.
        </p>
        <p>
          Empfehlungen können unvollständig, veraltet oder im Einzelfall <strong>falsch</strong> sein.
          Der Nutzer ist verpflichtet, jede Eignung, Sicherheit und Konformität eines Produkts für
          seinen konkreten Anwendungsfall <strong>eigenverantwortlich zu prüfen</strong> (insbesondere
          anhand des aktuellen Sicherheitsdatenblatts des Herstellers und der einschlägigen Vorschriften).
          Brisco haftet nicht für Entscheidungen, die der Nutzer auf Basis dieser Hilfen trifft, im
          Rahmen der Haftungsregelung nach Punkt 9.
        </p>
      </Section>

      <Section n={String(++nr)} title="Haftung & Haftungsausschluss">
        <ul className="ml-5 list-disc space-y-2">
          <li>
            Brisco haftet <strong>nicht für die Richtigkeit, Qualität, Vollständigkeit,
            Rechtmäßigkeit oder Verfügbarkeit</strong> der von Nutzern eingestellten Angebote,
            Anfragen, Produktangaben und Nachrichten.
          </li>
          <li>
            Brisco haftet <strong>nicht für die Erfüllung der zwischen Nutzern geschlossenen Verträge</strong>.
            Stellt sich nach einem Geschäftsabschluss heraus, dass ein Anbieter etwas Falsches,
            Mangelhaftes oder nicht Vereinbartes angeboten oder geliefert hat, richten sich Ansprüche{" "}
            <strong>ausschließlich gegen den jeweiligen Nutzer</strong> (Anbieter), nicht gegen Brisco.
          </li>
          <li>
            Brisco haftet nicht für mittelbare Schäden, entgangenen Gewinn, Produktions-/Betriebs­ausfälle
            oder Folgeschäden aus der Nutzung der Plattform oder der bereitgestellten Daten/Empfehlungen.
          </li>
          <li>
            Im Übrigen haftet Brisco <strong>nur für Vorsatz und grobe Fahrlässigkeit</strong>. Die
            Haftung für leichte Fahrlässigkeit ist — soweit gesetzlich zulässig — ausgeschlossen.
          </li>
          <li>
            <strong>Zwingende gesetzliche Haftung bleibt unberührt</strong>, insbesondere bei
            Personenschäden (Verletzung von Leben, Körper, Gesundheit) sowie nach dem
            Produkthaftungsgesetz. Diese kann durch diese AGB nicht ausgeschlossen werden.
          </li>
        </ul>
      </Section>

      <Section n={String(++nr)} title="Gewährleistung für die Plattform">
        <p>
          Brisco bemüht sich um hohe Verfügbarkeit, schuldet jedoch keine ununterbrochene
          Erreichbarkeit. Wartung, Störungen und höhere Gewalt können den Betrieb vorübergehend
          einschränken. Eine über Punkt 9 hinausgehende Gewährleistung ist im zulässigen Rahmen
          ausgeschlossen.
        </p>
      </Section>

      <Section n={String(++nr)} title="Datenschutz">
        <p>
          Brisco verarbeitet personenbezogene Daten nach dem schweizerischen Datenschutzgesetz
          (DSG) und — soweit anwendbar — der europäischen DSGVO. Einzelheiten regelt die gesonderte
          Datenschutzerklärung.
        </p>
      </Section>

      <Section n={String(++nr)} title="Freistellung">
        <p>
          Der Nutzer stellt Brisco von sämtlichen <strong>Ansprüchen Dritter</strong> frei, die auf
          einer Verletzung dieser AGB oder geltenden Rechts durch den Nutzer beruhen — insbesondere
          aus von ihm eingestellten Angeboten, Inhalten und Fotos sowie aus den von ihm
          geschlossenen Verträgen. Die Freistellung umfasst die angemessenen Kosten der
          Rechtsverteidigung. Der Nutzer unterstützt Brisco bei der Abwehr solcher Ansprüche
          nach besten Kräften.
        </p>
      </Section>

      <Section n={String(++nr)} title="Laufzeit, Sperrung & Kündigung">
        <p>
          Die Nutzung kann von beiden Seiten jederzeit beendet werden. Brisco kann Zugänge bei
          Verstößen gegen diese AGB (insbesondere gegen die Nutzerpflichten und das Verbot des Austauschs von Kontaktdaten) mit sofortiger Wirkung sperren.
          Bereits entstandene Entgelt- und Schadenersatzansprüche bleiben bestehen.
        </p>
      </Section>

      <Section n={String(++nr)} title="Änderungen dieser AGB">
        <p>
          Brisco kann diese AGB mit Wirkung für die Zukunft ändern. Änderungen werden mindestens
          <strong> 30 Tage vor Inkrafttreten</strong> per E-Mail oder auf der Plattform angekündigt.
          Widerspricht der Nutzer nicht bis zum Inkrafttreten oder nutzt er die Plattform danach
          weiter, gelten die geänderten AGB als angenommen; auf diese Folge wird in der Ankündigung
          hingewiesen. Im Fall des Widerspruchs kann jede Seite die Nutzung beenden.
        </p>
      </Section>

      <Section n={String(++nr)} title="Anwendbares Recht & Gerichtsstand">
        <p>
          Es gilt <strong>schweizerisches Recht</strong>. Die Anwendung des UN-Kaufrechts (CISG)
          wird ausgeschlossen.
        </p>
        <p>
          Als ausschließlicher <strong>Gerichtsstand</strong> für alle Streitigkeiten aus oder im
          Zusammenhang mit der Nutzung der Plattform wird — soweit gesetzlich zulässig und im
          unternehmerischen Verkehr — <strong>Zürich, Schweiz</strong> vereinbart.
        </p>
        <p>
          Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
          Bestimmungen unberührt (salvatorische Klausel). An die Stelle der unwirksamen Bestimmung
          tritt die gesetzlich zulässige Regelung, die dem wirtschaftlichen Zweck am nächsten kommt.
        </p>
      </Section>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-slate-900">
        § {n} {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
