import Link from "next/link";
import type { ReactNode } from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * Einheitliche Filterleiste im Galaxus-/Digitec-Stil:
 *   ① fette Ergebnis-Anzahl als Überschrift
 *   ② optionales Suchfeld (SearchInput)
 *   ③ Raster aus Pillen-Dropdowns (FilterDropdown) — die `children`
 *   ④ optionale Werkzeugleiste (Sortierung links, Ansicht-Umschalter rechts)
 *
 * Präsentationskomponente ohne Client-State — die Interaktivität steckt in den
 * einzelnen Pillen (FilterDropdown/SearchInput), die direkt die URL anpassen.
 */
export function FilterBar({
  count,
  noun = "Ergebnisse",
  title,
  search,
  children,
  toolbar,
  resetHref,
  filterCount = 0,
  collapsible = false,
}: {
  count: number;
  noun?: string;
  /** Klarer Abschnitts-Titel (z.B. „Aktuelle Angebote"). Die Anzahl erscheint dann als dezenter Zusatz. */
  title?: string;
  search?: ReactNode;
  children?: ReactNode;
  toolbar?: ReactNode;
  resetHref?: string;
  filterCount?: number;
  /** Suchmenü einklappbar machen — standardmäßig zu, öffnet sich automatisch bei aktiven Filtern. */
  collapsible?: boolean;
}) {
  const filterBody = (
    <>
      {search}
      {children && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
      )}
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          {toolbar}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title ? (
            <>
              {title}{" "}
              <span className="text-lg font-semibold text-slate-400">
                · {count.toLocaleString("de-CH")}
              </span>
            </>
          ) : (
            <>
              {count.toLocaleString("de-CH")}{" "}
              <span className="text-lg font-semibold text-slate-400">{noun}</span>
            </>
          )}
        </h2>
        {resetHref && filterCount > 0 && (
          <Link
            href={resetHref}
            className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
          >
            {filterCount} Filter zurücksetzen
          </Link>
        )}
      </div>

      {collapsible ? (
        <details open={filterCount > 0} className="group card p-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Search size={16} className="text-slate-400" /> Suchen &amp; filtern
              {filterCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {filterCount}
                </span>
              )}
            </span>
            <ChevronDown
              size={18}
              className="text-slate-400 transition group-open:rotate-180"
            />
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-4">{filterBody}</div>
        </details>
      ) : (
        <div className="card space-y-3 p-4">{filterBody}</div>
      )}
    </div>
  );
}
