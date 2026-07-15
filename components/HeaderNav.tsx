"use client";

import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";
import { Plus, Heart } from "lucide-react";

// Die Kopfzeile ist zweizeilig aufgebaut (siehe app/layout.tsx):
//
//   Zeile 1  →  <HeaderNav>      Sprache + Konto/Anmelden
//   Zeile 2  →  <SecondaryNav>   Anbieten + Merkliste, neben der Suche
//
// Der Sprachumschalter steht bewusst hier und nicht im Konto-Menü: Er muss auch
// für abgemeldete Besucher erreichbar sein — wer die Seite nicht versteht, kann
// sich schlecht erst anmelden.

/** Zeile 1: Sprache und Konto. */
export function HeaderNav({ user }: { user: { name: string; isAdmin?: boolean } | null }) {
  const { t } = useLocale();
  return (
    <nav className="flex items-center gap-2 text-sm">
      <LanguageSwitcher />

      {user ? (
        <AccountMenu user={user} />
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          {t("header.signin")}
        </Link>
      )}
    </nav>
  );
}

/** Zeile 2: die täglichen Aktionen, direkt neben dem Suchfeld. */
export function SecondaryNav() {
  const { t } = useLocale();
  return (
    <div className="flex shrink-0 items-center gap-2 text-sm">
      <Link
        href="/compare"
        aria-label={t("header.watchlist")}
        title={t("header.watchlist")}
        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-rose-500"
      >
        <Heart size={17} />
      </Link>

      <Link
        href="/listings/new"
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">{t("header.offer")}</span>
      </Link>
    </div>
  );
}
