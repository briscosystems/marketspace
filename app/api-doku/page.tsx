import Link from "next/link";
import { KeyRound } from "lucide-react";

export const metadata = {
  title: "API-Dokumentation — Brisco Marketplace",
  description:
    "REST-API für Marke-Mitglieder: Produktkatalog, ausgewertete Sicherheitsdatenblätter und KI-Alternativsuche.",
};

/**
 * Dokumentation der REST-API (v1). Bewusst eine einzige, ruhige Seite —
 * die API hat vier Endpunkte, dafür braucht es kein Portal.
 */
export default function ApiDokuPage() {
  const basis = "https://markt.brisco.ch";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="eyebrow">REST-API · Version 1</div>
        <h1 className="page-title mt-1">API-Dokumentation</h1>
        <p className="mt-2 text-sm text-slate-600">
          Der volle Katalog-Zugang steht Konten mit <strong>aktiver Marke-Stufe</strong> offen.
          Die <Link href="#geraete" className="font-medium text-brand-700 hover:underline">Geräte-Schnittstelle</Link>{" "}
          für Mischer wie den eMix1500 kann dagegen <strong>jedes Konto</strong> nutzen.
          Schlüssel verwaltest du unter{" "}
          <Link href="/mitgliedschaft" className="font-medium text-brand-700 hover:underline">
            Mitgliedschaft
          </Link>
          . Jeder Aufruf trägt den Schlüssel im Kopf:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            Authorization: Bearer brisco_…
          </code>
        </p>
      </div>

      <section className="card space-y-2">
        <h2 className="section-title">Grundsätze</h2>
        <ul className="ml-5 list-disc space-y-1.5 text-sm text-slate-700">
          <li>Alle Antworten sind JSON; Fehler kommen als <code>{`{ "error": { "code", "message" } }`}</code>.</li>
          <li>Katalog- und Datenblatt-Abfragen sind <strong>kostenlos</strong>.</li>
          <li>
            KI-Aufrufe kosten <strong>dieselben Credits wie auf der Plattform</strong> und werden
            vom Konto-Guthaben abgebucht — jede Abbuchung erscheint im Buchungsjournal unter
            Mitgliedschaft. Schlägt der KI-Aufruf fehl, werden die Credits automatisch erstattet.
          </li>
          <li>Läuft das Abo aus oder wird das Konto gesperrt, sind alle Schlüssel sofort wirkungslos.</li>
        </ul>
      </section>

      <Endpunkt
        methode="GET"
        pfad="/api/v1/produkte"
        titel="Produkte suchen"
        text="Volltextsuche über den Katalog. Parameter: q (Suchbegriff), kategorie (z. B. HYDRAULIC_OIL), seite. 50 Treffer pro Seite."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/produkte?q=blasocut&seite=1"`}
      />
      <Endpunkt
        methode="GET"
        pfad="/api/v1/produkte/{id}"
        titel="Einzelnes Produkt"
        text="Alle Felder eines Produkts inklusive Hersteller und Verweis auf das verknüpfte Sicherheitsdatenblatt."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/produkte/cmp…"`}
      />
      <Endpunkt
        methode="GET"
        pfad="/api/v1/datenblaetter/{id}"
        titel="Sicherheitsdatenblatt (ausgewertet)"
        text="GHS-Einstufung, H-/P-Sätze, Kennwerte, CAS-Nummern und Inhaltsstoff-Kennzeichen — plus pdfUrl zum Original."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/datenblaetter/cmp…"`}
      />
      <Endpunkt
        methode="POST"
        pfad="/api/v1/ki/alternativen"
        titel="KI-Alternativsuche"
        text='Findet Alternativen zu einem Produkt oder zu freien Anforderungen. Ohne "web" regelbasiert und kostenlos; mit "web": true recherchiert die KI zusätzlich im Internet (2 Credits, mit Quellenangaben).'
        beispiel={`curl -X POST -H "Authorization: Bearer brisco_…" \\
  -H "Content-Type: application/json" \\
  -d '{"produkt": "Blasocut 4000", "web": false}' \\
  "${basis}/api/v1/ki/alternativen"`}
      />

      <section id="geraete" className="card space-y-3 scroll-mt-20 ring-2 ring-brand-100">
        <h2 className="section-title">Geräte-Schnittstelle (eMix1500 und andere Mischer)</h2>
        <p className="text-sm text-slate-600">
          Ein Mischgerät braucht vor allem eine Zahl: den <strong>Umrechnungsfaktor von Brix
          auf Konzentration</strong>. Dazu kommen das Sollfenster, die pH-Werte und die Vorgaben
          zur Wasserhärte. Genau das liefern die Endpunkte unter{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/v1/geraet/</code>.
          Sie brauchen <strong>keine Marke-Stufe</strong> — es reicht ein Geräte-Schlüssel, den
          jedes Konto unter Mitgliedschaft anlegen kann, am besten einen je Maschine. Die
          vollständige Spezifikation für Techniker/Entwickler von Drittgeräten liegt als
          eigenständiges Dokument bei:{" "}
          <a
            href="https://github.com/briscosystems/marketspace/blob/main/GERAETE_API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 hover:underline"
          >
            GERAETE_API.md →
          </a>
        </p>
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <strong>Es wird nicht geraten.</strong> Passt der übergebene Name nicht eindeutig zu
          genau einem Katalogprodukt, kommt <code>eindeutig: false</code> mit einer Kandidatenliste
          zurück — dann muss der Bediener am Gerät auswählen. Und fehlt zu einem Produkt der
          Refraktometer-Faktor, steht dort <code>null</code> und <code>faktorVorhanden: false</code>,
          niemals ein angenommener Wert wie 1,0. Ein falscher Faktor setzt die Emulsion falsch an:
          zu mager gibt Korrosion und Werkzeugverschleiss, zu fett kostet Geld und reizt die Haut.
        </div>
      </section>

      <Endpunkt
        methode="GET"
        pfad="/api/v1/geraet/kss"
        titel="KSS-Typ erkennen (der Haupt-Aufruf)"
        text="Das Gerät schickt den Kühlschmierstoff so, wie er in der Steuerung steht — Schreibweise egal. Parameter: typ (Pflicht), hersteller (freiwillig, grenzt stark ein), alle=1 (auch nicht wassermischbare Produkte). Tippfehler und fehlende Leerzeichen werden verziehen."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/geraet/kss?typ=bcool755&hersteller=blaser"

{
  "eindeutig": true,
  "treffer": {
    "id": "cmp…",
    "name": "B-Cool 755",
    "hersteller": "Blaser Swisslube",
    "refraktometerFaktor": 1.2,
    "faktorVorhanden": true,
    "sollKonzentrationMin": 6,
    "sollKonzentrationMax": 10,
    "phEmulsionMin": 8.8,
    "phEmulsionMax": 9.4,
    "wasserhaerteMinDh": 5,
    "wasserhaerteMaxDh": 20,
    "enthaeltBor": false,
    "datenblattUrl": "https://…",
    "trefferGuete": 100,
    "trefferArt": "exakt"
  },
  "kandidaten": []
}`}
      />
      <Endpunkt
        methode="GET"
        pfad="/api/v1/geraet/hersteller"
        titel="Hersteller für die Auswahlbox"
        text="Alle Hersteller, die wassermischbare Kühlschmierstoffe im Katalog haben, mit Anzahl. Die Liste ist klein und ändert sich selten — sie darf im Gerät zwischengespeichert werden."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/geraet/hersteller"`}
      />
      <Endpunkt
        methode="GET"
        pfad="/api/v1/geraet/produkte"
        titel="Produkte eines Herstellers auflisten"
        text="Zweiter Schritt der Auswahlbox: Hersteller gewählt, jetzt die Liste zum Antippen. Parameter: hersteller (Slug oder Name), q (Textfilter), seite (100 je Seite). Hier wird nichts erraten — es ist eine schlichte Liste."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/geraet/produkte?hersteller=blaser-swisslube"`}
      />
      <Endpunkt
        methode="GET"
        pfad="/api/v1/geraet/kss/{id}"
        titel="Werte zu einer gemerkten Kennung holen"
        text="Ist der Stoff einmal ausgewählt, merkt sich das Gerät nur die id und fragt hier die aktuellen Werte ab — so zieht es nach, wenn ein Faktor im Katalog nachgepflegt wird. Statt der id wird auch der Slug akzeptiert."
        beispiel={`curl -H "Authorization: Bearer brisco_…" \\
  "${basis}/api/v1/geraet/kss/cmp…"`}
      />

      <section className="card space-y-2">
        <h2 className="section-title">Fehler-Codes</h2>
        <ul className="ml-5 list-disc space-y-1.5 text-sm text-slate-700">
          <li><code>401 missing_key / invalid_key</code> — Schlüssel fehlt, ist falsch oder widerrufen.</li>
          <li><code>403 tier_required</code> — keine aktive Marke-Stufe (bei Geräte-Schlüsseln kommt dieser Fehler nicht vor).</li>
          <li><code>400 missing_typ</code> — beim Erkennen fehlt der Parameter <code>typ</code>.</li>
          <li><code>404 not_found</code> — keine Kennung dieses Namens im Katalog.</li>
          <li><code>403 account_blocked</code> — Konto gesperrt.</li>
          <li><code>402 insufficient_credits</code> — Guthaben reicht nicht; Credits unter Mitgliedschaft aufladen.</li>
          <li><code>503 ai_failed</code> — KI-Aufruf fehlgeschlagen, Credits wurden erstattet.</li>
        </ul>
      </section>
    </div>
  );
}

function Endpunkt({
  methode,
  pfad,
  titel,
  text,
  beispiel,
}: {
  methode: string;
  pfad: string;
  titel: string;
  text: string;
  beispiel: string;
}) {
  return (
    <section className="card space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`chip font-mono font-bold ${
            methode === "GET" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
          }`}
        >
          {methode}
        </span>
        <code className="text-sm font-semibold text-slate-900">{pfad}</code>
      </div>
      <h2 className="text-sm font-semibold text-slate-800">
        <KeyRound size={13} className="mr-1 inline text-slate-400" />
        {titel}
      </h2>
      <p className="text-sm text-slate-600">{text}</p>
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
        {beispiel}
      </pre>
    </section>
  );
}
