"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, translate, type Locale } from "@/lib/i18n";

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

/**
 * Stellt die aktuelle Sprache bereit.
 *
 * `initialLocale` kommt aus dem RootLayout, das das Sprach-Cookie serverseitig
 * liest. Dadurch rendern Server und Browser von Anfang an dieselbe Sprache —
 * kein Hydration-Mismatch und kein kurzes Aufblitzen von Deutsch.
 *
 * Beim Umschalten wird das Cookie gesetzt und die Seite neu geladen, damit auch
 * die serverseitig gerenderten Texte in der neuen Sprache kommen.
 */
export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    setLocaleState(l);
    // Neu laden, damit die Server-Komponenten (Kopfzeile, Seiteninhalte) in der
    // neuen Sprache gerendert werden — ein reines State-Update erreicht sie nicht.
    window.location.reload();
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  return useContext(Ctx);
}
