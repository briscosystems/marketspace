import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale, translate, type Locale } from "@/lib/i18n";

/**
 * Sprach-Helfer für SERVER-Komponenten (Seiten, Layout).
 *
 * Bewusst eine eigene Datei: `next/headers` darf nicht in `lib/i18n.ts` stehen,
 * weil das auch von Client-Komponenten importiert wird.
 *
 * Verwendung in einer Server-Seite:
 *
 *   const t = await getT();
 *   <h1>{t("home.title")}</h1>
 *
 * Client-Komponenten nutzen stattdessen `useLocale().t(...)`.
 */

/** Aktuelle Sprache aus dem Cookie (Fallback: Deutsch). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Übersetzungsfunktion für die aktuelle Sprache. */
export async function getT(): Promise<(key: string) => string> {
  const locale = await getLocale();
  return (key: string) => translate(locale, key);
}
