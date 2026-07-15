"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { BASE_PATH } from "@/lib/base-path";
import type { Locale } from "@/lib/i18n";

export function Providers({
  locale,
  children,
}: {
  /** Serverseitig aus dem Sprach-Cookie gelesen (siehe RootLayout). */
  locale?: Locale;
  children: React.ReactNode;
}) {
  return (
    // basePath, damit NextAuth seine Endpunkte unter der Unteradresse aufruft
    // (z. B. /marketplace2026/api/auth statt /api/auth).
    <SessionProvider basePath={`${BASE_PATH}/api/auth`}>
      <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    </SessionProvider>
  );
}
