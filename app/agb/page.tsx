import { AlertTriangle } from "lucide-react";

export const metadata = {
  title: "AGB — Brisco Marketplace",
};

// Allgemeine Geschäftsbedingungen (Entwurf). B2B-Plattform, Vermittlermodell.
// WICHTIG: kein Rechtsrat — muss vor Live-Gang von einer/einem österreichischen
// Anwält:in geprüft werden (insb. AGB-Kontrolle nach § 879 ABGB, zwingende
// Haftung, DSGVO, ggf. KSchG falls Verbraucher zugelassen werden).
export default function AgbPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="text-sm text-slate-500">Stand: Juni 2026 · Version 0.3 (Entwurf)</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p>
          <strong>Hinweis (kein Rechtsrat):</strong> Dieser Text ist ein sorgfältig erstellter
          Entwurf, ersetzt aber keine anwaltliche Beratung. Vor dem Live-Betrieb muss er von einer
          bzw. einem in Österreich zugelassenen Rechtsanwält:in geprüft werden — insbesondere die
          Haftungs- und Gewährleistungsklauseln, die AGB-Inhaltskontrolle (§ 879 ABGB) und die
          Frage, ob ausschließlich Unternehmer (B2B) oder auch Verbraucher zugelassen sind.
        </p>
      </div>

      <Section n="1" title="Geltungsbereich & Plattformbetreiber">
        <p>
          Diese AGB regeln die Nutzung des Online-Marktplatzes „Brisco" (nachfolgend „Plattform"),
          betrieben von der <strong>Brisco Systems GmbH</strong>, Linz, Österreich (nachfolgend
          „Brisco"). Die Plattform richtet sich <strong>ausschließlich an Unternehmer</strong> im
          Sinne des § 1 KSchG bzw. § 1 UGB (Reseller, Hersteller, gewerbliche Endabnehmer). Eine
          Nutzung durch Verbraucher ist nicht vorgesehen.
        </p>
        <p>
          Mit der Registrierung akzeptiert der Nutzer diese AGB. Abweichende Bedingungen des Nutzers
          gelten nur, wenn Brisco ihnen ausdrücklich schriftlich zustimmt.
        </p>
      </Section>

      <Section n="2" title="Rolle von Brisco — reine Vermittlung">
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
      </Section>

      <Section n="3" title="Registrierung, Pseudonymität & Nutzerpflichten">
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
      </Section>

      <Section n="4" title="Kommunikation & Verbot des Austauschs von Kontaktdaten">
        <p>
          Die Kommunikation während der Anbahnung erfolgt über das plattforminterne Nachrichtensystem.
          Zur Wahrung der Pseudonymität und der Plattform-Integrität ist es{" "}
          <strong>untersagt, in Nachrichten direkte Kontaktdaten auszutauschen</strong> (insbesondere
          Telefon-/Faxnummern, E-Mail-Adressen, Messenger-IDs, Web-/Shop-Adressen, vollständige
          Firmen-/Personennamen) mit dem Ziel, die Plattform zu umgehen. Brisco darf solche Inhalte
          technisch erkennen, ausblenden oder beanstanden.
        </p>
      </Section>

      <Section n="5" title="Zustandekommen von Verträgen zwischen Nutzern">
        <p>
          Angebote und Anfragen auf der Plattform sind unverbindliche Aufforderungen zur Abgabe von
          Angeboten. Ein verbindlicher Vertrag kommt erst durch übereinstimmende Erklärungen der
          beteiligten Nutzer (z. B. Annahme eines Angebots) zustande. Inhalt, Qualität, Menge, Preis,
          Lieferung, Gewährleistung und Zahlung richten sich allein nach der Vereinbarung der Nutzer.
        </p>
      </Section>

      <Section n="6" title="Entgelte & Provision">
        <p>
          Für erfolgreich über die Plattform vermittelte Transaktionen schuldet der Anbieter Brisco
          eine <strong>Vermittlungsprovision in Höhe von 3 % des Netto-Kaufpreises</strong> der
          jeweiligen Transaktion, sofern nichts anderes vereinbart ist. Die Provision wird mit
          Zustandekommen des Vertrags zwischen den Nutzern fällig. Brisco kann die Entgeltstruktur mit
          angemessener Vorankündigung anpassen.
        </p>
      </Section>

      <Section n="7" title="Umgehungsverbot (Nichtumgehungsklausel)">
        <p>
          Nutzer, die über die Plattform in Kontakt gekommen sind, verpflichten sich, über die
          Plattform angebahnte Geschäfte <strong>nicht bewusst an der Plattform vorbei abzuwickeln</strong>,
          um die Provision zu vermeiden. Dieses Umgehungsverbot gilt für die angebahnte sowie für
          unmittelbar darauf aufbauende Folgegeschäfte für die Dauer von <strong>zwölf (12) Monaten</strong>{" "}
          ab Erstkontakt.
        </p>
        <p>
          Bei nachweislichem Verstoß ist Brisco berechtigt, die andernfalls angefallene Provision
          sowie eine angemessene Vertragsstrafe in Rechnung zu stellen und den Zugang zu sperren. Das
          Recht zur Geltendmachung weiteren Schadens bleibt unberührt.
        </p>
      </Section>

      <Section n="8" title="KI-Empfehlungen, KSS-Finder & Knowledge Base — ohne Gewähr">
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

      <Section n="9" title="Haftung & Haftungsausschluss">
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

      <Section n="10" title="Gewährleistung für die Plattform">
        <p>
          Brisco bemüht sich um hohe Verfügbarkeit, schuldet jedoch keine ununterbrochene
          Erreichbarkeit. Wartung, Störungen und höhere Gewalt können den Betrieb vorübergehend
          einschränken. Eine über Punkt 9 hinausgehende Gewährleistung ist im zulässigen Rahmen
          ausgeschlossen.
        </p>
      </Section>

      <Section n="11" title="Datenschutz">
        <p>
          Brisco verarbeitet personenbezogene Daten nach der Datenschutz-Grundverordnung (DSGVO) und
          dem österreichischen Datenschutzgesetz. Einzelheiten regelt die gesonderte
          Datenschutzerklärung.
        </p>
      </Section>

      <Section n="12" title="Laufzeit, Sperrung & Kündigung">
        <p>
          Die Nutzung kann von beiden Seiten jederzeit beendet werden. Brisco kann Zugänge bei
          Verstößen gegen diese AGB (insbesondere Punkt 4 und 7) mit sofortiger Wirkung sperren.
          Bereits entstandene Provisions- und Schadenersatzansprüche bleiben bestehen.
        </p>
      </Section>

      <Section n="13" title="Anwendbares Recht & Gerichtsstand">
        <p>
          Es gilt <strong>österreichisches Recht</strong> unter Einbeziehung der zwingenden Vorgaben
          des <strong>Rechts der Europäischen Union</strong>. Die Anwendung des UN-Kaufrechts (CISG)
          wird ausgeschlossen.
        </p>
        <p>
          Als ausschließlicher <strong>Gerichtsstand</strong> für alle Streitigkeiten aus oder im
          Zusammenhang mit der Nutzung der Plattform wird — soweit gesetzlich zulässig und im
          unternehmerischen Verkehr — <strong>Linz, Österreich</strong> vereinbart.
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
