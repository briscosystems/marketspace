import Link from "next/link";
import { Search } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { getT } from "@/lib/i18n-server";

/**
 * DAS Suchfeld der Plattform — ein Baustein für Startseite und Dashboard.
 *
 * Wir positionieren uns als „die Suchmaschine für Industrieöle" — dann muss
 * die Suche auf jeder Einstiegsseite das erste gleichwertige Element sein,
 * nicht nur eine Zeile in der Kopfleiste. Einfaches GET-Formular, arbeitet
 * auch ohne JavaScript.
 */
export async function SuchFeld({
  beispiele = true,
}: {
  /** Beispielsuchen unter dem Feld anzeigen. */
  beispiele?: boolean;
}) {
  const t = await getT();
  return (
    <div>
      <form
        action={withBasePath("/listings")}
        method="get"
        role="search"
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-slate-200 bg-white pl-4 pr-1.5 transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/30">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <input
            name="q"
            type="search"
            placeholder={t("home.searchPlaceholder")}
            aria-label={t("home.ctaBrowse")}
            className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-slate-900 px-7 py-3 text-base font-semibold text-white shadow-soft transition-colors hover:bg-slate-800"
        >
          {t("home.ctaBrowse")}
        </button>
      </form>
      {beispiele && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-slate-500">{t("home.searchExamplesLabel")}</span>
          {["Blasocut 4000", "HLP 46", "Gleitbahnöl ISO 68", "Bor-frei"].map((b) => (
            <Link
              key={b}
              href={`/listings?q=${encodeURIComponent(b)}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition hover:bg-brand-100 hover:text-brand-800"
            >
              {b}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
