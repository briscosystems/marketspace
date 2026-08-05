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
          Die API steht Konten mit <strong>aktiver Marke-Stufe</strong> offen. Schlüssel verwaltest
          du unter{" "}
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

      <section className="card space-y-2">
        <h2 className="section-title">Fehler-Codes</h2>
        <ul className="ml-5 list-disc space-y-1.5 text-sm text-slate-700">
          <li><code>401 missing_key / invalid_key</code> — Schlüssel fehlt, ist falsch oder widerrufen.</li>
          <li><code>403 tier_required</code> — keine aktive Marke-Stufe.</li>
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
