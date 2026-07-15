/**
 * Mehrsprachigkeits-Fundament.
 *
 * Die App ist standardmäßig deutsch (DEFAULT_LOCALE). Dieser Baustein liefert:
 *  - die unterstützten Sprachen (LOCALES) inkl. Flagge,
 *  - ein Wörterbuch (MESSAGES),
 *  - eine translate()-Funktion mit Fallback auf Deutsch.
 *
 * Erweiterung: weitere Keys ins Wörterbuch aufnehmen und in den Komponenten
 * über `useLocale().t("key")` statt fester Strings verwenden. Fehlt ein Key in
 * einer Sprache, greift automatisch der deutsche Text — die Seite bleibt also
 * immer benutzbar, auch wenn eine Übersetzung noch fehlt.
 *
 * Die gewählte Sprache steckt im Cookie LOCALE_COOKIE. Sie wird im RootLayout
 * SERVERSEITIG gelesen und an den LocaleProvider durchgereicht — dadurch kommt
 * die Seite schon in der richtigen Sprache aus dem Server (kein Aufblitzen von
 * Deutsch) und Server-Komponenten können `translate(locale, key)` direkt nutzen.
 *
 * STAND (2026-07-15): DE (Hauptsprache), EN, NL. Übersetzt sind Kopfzeile,
 * Navigation, Konto-Menü und Fußzeile. Bewusst NICHT übersetzt:
 *  - Produktnamen und Produktdaten (international identisch, s. GO-LIVE.md),
 *  - Rechtstexte (AGB/Impressum/Datenschutz) — nur Deutsch, maßgebliche Fassung.
 */
export type Locale = "de" | "en" | "nl";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
];

export const DEFAULT_LOCALE: Locale = "de";

/** Name des Cookies, in dem die Sprachwahl steckt (Server UND Browser lesen ihn). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Prüft einen beliebigen Wert und liefert eine gültige Sprache (sonst Deutsch). */
export function toLocale(value: string | undefined | null): Locale {
  return LOCALES.some((l) => l.code === value) ? (value as Locale) : DEFAULT_LOCALE;
}

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
    "account.revenue": "Meine Umsätze",
    "nav.login": "Login",
    "nav.register": "Registrieren",
    "lang.label": "Sprache",
    // Kopfzeile
    "header.searchPlaceholder": "Öl, Fett, Marke oder ISO VG suchen …",
    "header.searchAria": "Angebote durchsuchen",
    "header.searchButton": "Suchen",
    "header.offer": "Anbieten",
    "header.watchlist": "Merkliste",
    "header.signin": "Anmelden",
    // Vertrauens-Leiste
    "trust.reviews": "Bewertungen nur aus echten Geschäften",
    "trust.handling": "Dokumentierte Abwicklung über Brisco",
    "trust.data": "Preis-Richtwerte & Sicherheitsdatenblätter inklusive",
    // Navigation (Konto-Menü)
    "nav.rfqs": "Suchen (Anfragen)",
    "nav.prices": "Richtwerte",
    "nav.knowledge": "Praxis-Wissen",
    "nav.kssFinder": "KSS-Finder",
    "nav.manufacturers": "Hersteller",
    "nav.sds": "Sicherheitsdatenblätter",
    "nav.materials": "Materialien",
    // Fußzeile
    "footer.tagline": "Pseudonyme Reseller-Plattform",
    "footer.trust": "Vertrauen",
    "footer.terms": "AGB",
    "footer.imprint": "Impressum",
    "footer.privacy": "Datenschutz",
    "footer.legalNote": "Rechtstexte ausschließlich auf Deutsch — maßgeblich ist die deutsche Fassung.",
    // Startseite
    "home.eyebrow": "Für Reseller, Endkunden & Hersteller",
    "home.title": "Der B2B-Marktplatz für Industrieöle, KSS & Schmierstoffe",
    "home.lead":
      "Was dem einen fehlt, hat der andere im Lager. Öl-Händler gleichen Überschuss und Engpässe direkt untereinander aus — anonym, geprüft und sicher bezahlt.",
    "home.ctaBrowse": "Angebote entdecken",
    "home.ctaRegister": "Reseller-Konto anlegen",
    "home.offerBadge": "Anbieten",
    "home.offerTitle": "Ich habe Bestand zu verkaufen",
    "home.offerText":
      "Stell dein Lager als Angebot ein oder durchstöbere, was andere Anbieter verfügbar haben.",
    "home.offerLink": "Angebote durchsuchen",
    "home.seekBadge": "Suchen",
    "home.seekTitle": "Ich suche ein bestimmtes Produkt",
    "home.seekText":
      "Stell deinen Bedarf öffentlich ein und lass Anbieter dir Preise nennen. Oder schau dir an, was andere Käufer gerade suchen.",
    "home.seekLink": "Bedarfe durchsuchen",
    "home.tileSdsTitle": "Sicherheitsdatenblätter",
    "home.tileSdsHint": "geparste GHS-/REACH-Daten",
    "home.tileMfrTitle": "Hersteller",
    "home.tileMfrHint": "Marken im Produktkatalog",
    "home.tilePriceValue": "Richtwerte",
    "home.tilePriceTitle": "Preisorientierung",
    "home.tilePriceHint": "indikativ — zum Vergleichen",
    "home.newInMarket": "Neu im Markt",
    "home.activeOffers.one": "{n} aktives Angebot.",
    "home.activeOffers.other": "{n} aktive Angebote.",
    "home.allOffers": "alle Angebote",
    "home.statOffers": "aktive Angebote",
    "home.statResellers": "registrierte Reseller",
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
    "account.revenue": "My transactions",
    "nav.login": "Log in",
    "nav.register": "Register",
    "lang.label": "Language",
    // Header
    "header.searchPlaceholder": "Search oil, grease, brand or ISO VG …",
    "header.searchAria": "Search offers",
    "header.searchButton": "Search",
    "header.offer": "Offer",
    "header.watchlist": "Watchlist",
    "header.signin": "Sign in",
    // Trust bar
    "trust.reviews": "Reviews only from verified deals",
    "trust.handling": "Documented handling via Brisco",
    "trust.data": "Price guide values & safety data sheets included",
    // Navigation
    "nav.rfqs": "Requests",
    "nav.prices": "Guide values",
    "nav.knowledge": "Field knowledge",
    "nav.kssFinder": "Coolant finder",
    "nav.manufacturers": "Manufacturers",
    "nav.sds": "Safety data sheets",
    "nav.materials": "Materials",
    // Footer
    "footer.tagline": "Pseudonymous reseller platform",
    "footer.trust": "Trust",
    "footer.terms": "Terms",
    "footer.imprint": "Imprint",
    "footer.privacy": "Privacy",
    "footer.legalNote": "Legal texts in German only — the German version prevails.",
    // Home
    "home.eyebrow": "For resellers, end users & manufacturers",
    "home.title": "The B2B marketplace for industrial oils, coolants & lubricants",
    "home.lead":
      "What one is short of, another has on the shelf. Oil traders balance surplus and shortages directly between them — anonymously, verified and safely paid.",
    "home.ctaBrowse": "Browse offers",
    "home.ctaRegister": "Create reseller account",
    "home.offerBadge": "Offering",
    "home.offerTitle": "I have stock to sell",
    "home.offerText":
      "List your stock as an offer, or browse what other suppliers have available.",
    "home.offerLink": "Browse offers",
    "home.seekBadge": "Wanted",
    "home.seekTitle": "I am looking for a specific product",
    "home.seekText":
      "Post what you need and let suppliers quote you a price. Or see what other buyers are currently looking for.",
    "home.seekLink": "Browse requests",
    "home.tileSdsTitle": "Safety data sheets",
    "home.tileSdsHint": "parsed GHS / REACH data",
    "home.tileMfrTitle": "Manufacturers",
    "home.tileMfrHint": "brands in the product catalogue",
    "home.tilePriceValue": "Guide values",
    "home.tilePriceTitle": "Price orientation",
    "home.tilePriceHint": "indicative — for comparison",
    "home.newInMarket": "New on the market",
    "home.activeOffers.one": "{n} active offer.",
    "home.activeOffers.other": "{n} active offers.",
    "home.allOffers": "all offers",
    "home.statOffers": "active offers",
    "home.statResellers": "registered resellers",
  },
  nl: {
    "account.greeting": "Hallo,",
    "account.menu": "Account",
    "account.signedInAs": "Aangemeld als",
    "account.profile": "Mijn profiel",
    "account.dashboard": "Dashboard",
    "account.membership": "Toegang & lidmaatschap",
    "account.admin": "Beheer",
    "account.signout": "Afmelden",
    "account.revenue": "Mijn omzet",
    "nav.login": "Inloggen",
    "nav.register": "Registreren",
    "lang.label": "Taal",
    // Koptekst
    "header.searchPlaceholder": "Zoek olie, vet, merk of ISO VG …",
    "header.searchAria": "Aanbiedingen doorzoeken",
    "header.searchButton": "Zoeken",
    "header.offer": "Aanbieden",
    "header.watchlist": "Favorieten",
    "header.signin": "Inloggen",
    // Vertrouwensbalk
    "trust.reviews": "Beoordelingen alleen uit echte transacties",
    "trust.handling": "Gedocumenteerde afhandeling via Brisco",
    "trust.data": "Richtprijzen & veiligheidsinformatiebladen inbegrepen",
    // Navigatie
    "nav.rfqs": "Aanvragen",
    "nav.prices": "Richtwaarden",
    "nav.knowledge": "Praktijkkennis",
    "nav.kssFinder": "Koelsmeermiddel-zoeker",
    "nav.manufacturers": "Fabrikanten",
    "nav.sds": "Veiligheidsinformatiebladen",
    "nav.materials": "Materialen",
    // Voettekst
    "footer.tagline": "Pseudoniem resellerplatform",
    "footer.trust": "Vertrouwen",
    "footer.terms": "Algemene voorwaarden",
    "footer.imprint": "Colofon",
    "footer.privacy": "Privacy",
    "footer.legalNote": "Juridische teksten uitsluitend in het Duits — de Duitse versie is bindend.",
    // Startpagina
    "home.eyebrow": "Voor resellers, eindgebruikers & fabrikanten",
    "home.title": "De B2B-marktplaats voor industriële oliën, koelsmeermiddelen & smeermiddelen",
    "home.lead":
      "Wat de één tekortkomt, heeft de ander op voorraad. Oliehandelaren wisselen overschot en tekorten rechtstreeks onderling uit — anoniem, geverifieerd en veilig betaald.",
    "home.ctaBrowse": "Aanbiedingen ontdekken",
    "home.ctaRegister": "Reselleraccount aanmaken",
    "home.offerBadge": "Aanbieden",
    "home.offerTitle": "Ik heb voorraad te koop",
    "home.offerText":
      "Zet je voorraad als aanbieding online of bekijk wat andere aanbieders beschikbaar hebben.",
    "home.offerLink": "Aanbiedingen doorzoeken",
    "home.seekBadge": "Gezocht",
    "home.seekTitle": "Ik zoek een bepaald product",
    "home.seekText":
      "Plaats je vraag openbaar en laat aanbieders je een prijs noemen. Of bekijk waar andere kopers naar zoeken.",
    "home.seekLink": "Aanvragen doorzoeken",
    "home.tileSdsTitle": "Veiligheidsinformatiebladen",
    "home.tileSdsHint": "verwerkte GHS-/REACH-gegevens",
    "home.tileMfrTitle": "Fabrikanten",
    "home.tileMfrHint": "merken in de productcatalogus",
    "home.tilePriceValue": "Richtwaarden",
    "home.tilePriceTitle": "Prijsoriëntatie",
    "home.tilePriceHint": "indicatief — ter vergelijking",
    "home.newInMarket": "Nieuw op de markt",
    "home.activeOffers.one": "{n} actieve aanbieding.",
    "home.activeOffers.other": "{n} actieve aanbiedingen.",
    "home.allOffers": "alle aanbiedingen",
    "home.statOffers": "actieve aanbiedingen",
    "home.statResellers": "geregistreerde resellers",
  },
};

export function translate(locale: Locale, key: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
}
