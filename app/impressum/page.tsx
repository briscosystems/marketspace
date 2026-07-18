import { withBasePath } from "@/lib/base-path";

export const metadata = { title: "Impressum — Brisco Marketplace" };

// Impressum der Brisco Systems GmbH (Schweiz). Impressumspflicht nach
// Art. 3 Abs. 1 lit. s UWG (Schweiz); Angaben gemäß Handelsregister.
export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Impressum</h1>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Betreiberin & Diensteanbieterin</h2>
        <p><strong>Brisco Systems GmbH</strong></p>
        <p>Huebacherweg 27</p>
        <p>CH-8335 Hittnau, Schweiz</p>
        <p className="pt-2">UID-Nummer: <strong>CHE-112.100.301</strong></p>
        <p>Handelsregister-Nummer: <strong>CH-130.4.010.093-5</strong></p>
        <p>Rechtsform: Gesellschaft mit beschränkter Haftung (GmbH)</p>
        <p>Sitz: Hittnau, Kanton Zürich, Schweiz</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Vertretungsbefugte</h2>
        <p>Geschäftsführung: Jürgen Gosch</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a className="text-brand-600 hover:underline" href="mailto:jgosch@brisco.ch">
            jgosch@brisco.ch
          </a>
        </p>
        <p>
          Telefon:{" "}
          <a className="text-brand-600 hover:underline" href="tel:+41438830385">
            +41 43 883 03 85
          </a>
        </p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Unternehmensgegenstand & Gerichtsstand</h2>
        <p>
          Unternehmensgegenstand: Betrieb einer Online-Vermittlungsplattform für den
          B2B-Handel mit Industrieölen, Kühlschmierstoffen und Schmierstoffen.
        </p>
        <p>Gerichtsstand: Zürich, Schweiz</p>
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
