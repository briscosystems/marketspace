"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { BASE_PATH } from "@/lib/base-path";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // basePath, damit NextAuth seine Endpunkte unter der Unteradresse aufruft
    // (z. B. /marketplace2026/api/auth statt /api/auth).
    <SessionProvider basePath={`${BASE_PATH}/api/auth`}>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}
