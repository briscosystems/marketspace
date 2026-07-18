import { withBasePath } from "@/lib/base-path";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Impressum — Brisco Marketplace" };

// Impressum der Brisco Systems GmbH (Schweiz). Impressumspflicht nach
// Art. 3 Abs. 1 lit. s UWG (Schweiz); Angaben gemäß Handelsregister.
//
// Die Firmendaten (Adresse, Name, Nummern) bleiben in jeder Sprache gleich —
// übersetzt werden nur die Beschriftungen. Anders als AGB/Datenschutz ist das
// Impressum informativ und darf mehrsprachig angezeigt werden.
export default async function ImpressumPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">{t("imp.title")}</h1>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">{t("imp.operator")}</h2>
        <p><strong>Brisco Systems GmbH</strong></p>
        <p>Huebacherweg 27</p>
        <p>CH-8335 Hittnau, Schweiz</p>
        <p className="pt-2">{t("imp.uid")}: <strong>CHE-112.100.301</strong></p>
        <p>{t("imp.regNo")}: <strong>CH-130.4.010.093-5</strong></p>
        <p>{t("imp.legalForm")}</p>
        <p>{t("imp.seat")}</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">{t("imp.representatives")}</h2>
        <p>{t("imp.management")}: Jürgen Gosch</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">{t("imp.contact")}</h2>
        <p>
          {t("imp.email")}:{" "}
          <a className="text-brand-600 hover:underline" href="mailto:jgosch@brisco.ch">
            jgosch@brisco.ch
          </a>
        </p>
        <p>
          {t("imp.phone")}:{" "}
          <a className="text-brand-600 hover:underline" href="tel:+41438830385">
            +41 43 883 03 85
          </a>
        </p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">{t("imp.purposeTitle")}</h2>
        <p>{t("imp.purpose")}</p>
        <p>{t("imp.jurisdiction")}</p>
      </section>

      <section className="card space-y-1 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-900">{t("imp.noteTitle")}</h2>
        <p>
          {t("imp.noteBefore")}
          <a className="text-brand-600 hover:underline" href={withBasePath("/agb")}>{t("footer.terms")}</a>
          {t("imp.noteAfter")}
        </p>
      </section>
    </div>
  );
}
