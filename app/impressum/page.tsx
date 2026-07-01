import { AlertTriangle } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

export const metadata = { title: "Impressum — Brisco Marketplace" };

// Impressum / Offenlegung nach § 5 ECG und § 25 MedienG (Österreich).
// Platzhalter [ … ] vor Live-Gang mit den echten Firmendaten füllen.
export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Impressum</h1>

      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p>
          <strong>Vor dem Live-Gang ausfüllen:</strong> Die mit <code>[ … ]</code> markierten
          Felder müssen mit den echten Firmendaten ergänzt werden. In Österreich ist ein
          vollständiges Impressum gesetzlich verpflichtend (§ 5 ECG, § 25 MedienG).
        </p>
      </div>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Medieninhaber & Diensteanbieter</h2>
        <p><strong>Brisco Systems GmbH</strong></p>
        <p>[ Straße und Hausnummer ]</p>
        <p>[ PLZ ] Linz, Österreich</p>
        <p className="pt-2">UID-Nummer: <strong>[ ATU… ]</strong></p>
        <p>Firmenbuchnummer: <strong>[ FN … ]</strong></p>
        <p>Firmenbuchgericht: [ z. B. Landesgericht Linz ]</p>
        <p>Rechtsform: Gesellschaft mit beschränkter Haftung (GmbH)</p>
        <p>Sitz: Linz</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Vertretungsbefugte</h2>
        <p>Geschäftsführung: [ Vor- und Nachname(n) ]</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Kontakt</h2>
        <p>E-Mail: [ kontakt@… ]</p>
        <p>Telefon: [ +43 … ]</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Unternehmensgegenstand & Aufsicht</h2>
        <p>Unternehmensgegenstand: Betrieb einer Online-Vermittlungsplattform für den
          B2B-Handel mit Industrieölen, Kühlschmierstoffen und Schmierstoffen.</p>
        <p>Gewerbeordnung: <a className="text-brand-600 hover:underline" href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">www.ris.bka.gv.at</a></p>
        <p>Mitglied der WKO (Wirtschaftskammer Österreich): [ Sparte/Fachgruppe ]</p>
        <p>Aufsichtsbehörde: [ zuständige Bezirksverwaltungsbehörde ]</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Hinweis zur Plattform</h2>
        <p>
          Brisco ist eine reine Vermittlungsplattform und wird nicht Vertragspartei der
          zwischen den Nutzern geschlossenen Verträge (siehe{" "}
          <a className="text-brand-600 hover:underline" href={withBasePath("/agb")}>AGB</a>). Die Plattform
          richtet sich ausschließlich an Unternehmer (B2B).
        </p>
      </section>
    </div>
  );
}
