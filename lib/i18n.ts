/**
 * Mehrsprachigkeits-Fundament (vorbereitet, noch nicht flächendeckend ausgerollt).
 *
 * Die App ist standardmäßig deutsch. Dieser Baustein liefert:
 *  - die unterstützten Sprachen (LOCALES) inkl. Flagge,
 *  - ein Wörterbuch (MESSAGES) — aktuell für das Konto-/Sprachmenü,
 *  - eine translate()-Funktion mit Fallback auf Deutsch.
 *
 * Erweiterung: weitere Keys ins Wörterbuch aufnehmen und in den Komponenten
 * über `useLocale().t("key")` statt fester Strings verwenden.
 */
export type Locale = "de" | "en" | "fr" | "it";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export const DEFAULT_LOCALE: Locale = "de";

type Dict = Record<string, string>;

export const MESSAGES: Record<Locale, Dict> = {
  de: {
    "account.greeting": "Hallo,",
    "account.menu": "Konto",
    "account.signedInAs": "Angemeldet als",
    "account.profile": "Mein Profil",
    "account.dashboard": "Dashboard",
    "account.membership": "Zugang & Mitgliedschaft",
    "account.admin": "Admin-Bereich",
    "account.signout": "Abmelden",
    "nav.login": "Login",
    "nav.register": "Registrieren",
    "lang.label": "Sprache",
  },
  en: {
    "account.greeting": "Hello,",
    "account.menu": "Account",
    "account.signedInAs": "Signed in as",
    "account.profile": "My profile",
    "account.dashboard": "Dashboard",
    "account.membership": "Access & membership",
    "account.admin": "Admin area",
    "account.signout": "Sign out",
    "nav.login": "Log in",
    "nav.register": "Register",
    "lang.label": "Language",
  },
  fr: {
    "account.greeting": "Bonjour,",
    "account.menu": "Compte",
    "account.signedInAs": "Connecté en tant que",
    "account.profile": "Mon profil",
    "account.dashboard": "Tableau de bord",
    "account.membership": "Accès & adhésion",
    "account.admin": "Espace admin",
    "account.signout": "Se déconnecter",
    "nav.login": "Connexion",
    "nav.register": "S'inscrire",
    "lang.label": "Langue",
  },
  it: {
    "account.greeting": "Ciao,",
    "account.menu": "Account",
    "account.signedInAs": "Connesso come",
    "account.profile": "Il mio profilo",
    "account.dashboard": "Cruscotto",
    "account.membership": "Accesso e iscrizione",
    "account.admin": "Area admin",
    "account.signout": "Esci",
    "nav.login": "Accedi",
    "nav.register": "Registrati",
    "lang.label": "Lingua",
  },
};

export function translate(locale: Locale, key: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
}
