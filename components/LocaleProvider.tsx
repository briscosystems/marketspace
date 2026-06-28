"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, translate, type Locale } from "@/lib/i18n";

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const Ctx = createContext<LocaleCtx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (k) => k,
});

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
  const v = m?.[1];
  return LOCALES.some((l) => l.code === v) ? (v as Locale) : DEFAULT_LOCALE;
}

/**
 * Stellt die aktuelle Sprache bereit. Start IMMER mit DEFAULT_LOCALE (= Server-
 * Render, vermeidet Hydration-Mismatch); nach dem Mounten wird die in einem
 * Cookie gespeicherte Auswahl übernommen.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readCookieLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000;samesite=lax`;
    setLocaleState(l);
    try {
      document.documentElement.lang = l;
    } catch {
      /* noop */
    }
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  return useContext(Ctx);
}
