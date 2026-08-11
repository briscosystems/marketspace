/**
 * Die vier Einstiege der Plattform — nach Zielgruppengröße geordnet:
 * Problem lösen (Instandhaltung), Suchen (Einkauf), Anbieten (Reseller),
 * Marke (Hersteller).
 *
 * Steht bewusst auf BEIDEN Startseiten: für Gäste UND im angemeldeten
 * Dashboard (Betreiber 2026-08-10). Wer angemeldet ist, braucht dieselben
 * Einstiege — vorher sah er nur „Anbieten" und „Anfragen bedienen" und fand
 * die Werkzeuge gar nicht.
 */
import Link from "next/link";
import { OilBarrels, SearchCanister } from "@/components/OilBarrels";
import { Camera, Building2, ArrowRight } from "lucide-react";

export function EinstiegsKarten({ t }: { t: (k: string) => string }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Link
        href="/erkennen"
        className="group rounded-2xl border-t-4 border border-slate-200 border-t-rose-500 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700 transition duration-200 group-hover:scale-105">
            <Camera className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {t("home.groupProblemBadge")}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-rose-700">
          {t("home.groupProblemTitle")}
        </h3>
        <p className="hover-hint text-sm text-slate-600">{t("home.groupProblemText")}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-700">
          {t("home.groupProblemCta")}{" "}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </Link>

      {/* Titel, Knopf und Ziel sagen jetzt dasselbe (Betreiber 2026-08-11):
          „Produkt anbieten" führte vorher auf die Angebotsliste — also zum
          Durchsuchen statt zum Anbieten. */}
      <Link
        href="/listings/new"
        className="group rounded-2xl border-t-4 border border-slate-200 border-t-blue-600 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="flex items-center justify-between gap-2">
          <OilBarrels className="h-10 w-auto transition duration-200 group-hover:scale-105" />
          <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {t("home.offerBadge")}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-blue-700">
          {t("home.groupResellerTitle")}
        </h3>
        <p className="hover-hint text-sm text-slate-600">{t("home.groupResellerText")}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
          {t("home.offerLink")}{" "}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </Link>

      <Link
        href="/kss-finder"
        className="group rounded-2xl border-t-4 border border-slate-200 border-t-amber-500 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="flex items-center justify-between gap-2">
          <SearchCanister className="h-10 w-auto transition duration-200 group-hover:scale-105" />
          <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {t("home.seekBadge")}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-amber-700">
          {t("home.groupBuyerTitle")}
        </h3>
        <p className="hover-hint text-sm text-slate-600">{t("home.groupBuyerText")}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
          {t("home.groupBuyerCta")}{" "}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </Link>

      <Link
        href="/register"
        className="group rounded-2xl border-t-4 border border-slate-200 border-t-brand-500 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition duration-200 group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {t("home.groupMfrBadge")}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-brand-700">
          {t("home.groupMfrTitle")}
        </h3>
        <p className="hover-hint text-sm text-slate-600">{t("home.groupMfrText")}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          {t("home.groupMfrCta")}{" "}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </Link>
    </section>
  );
}
