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
    "home.ctaRegister": "{n} Tage kostenlos testen",
    "home.ctaRegisterHint": "Ohne Abo, ohne Kreditkarte — inkl. {c} KI-Credits.",
    "trial.badge": "{n} Tage gratis",
    "trial.pitch": "Neu hier? {n} Tage voller Zugang — ohne Abo, ohne Kreditkarte, inkl. {c} KI-Credits.",
    "listing.signinToContact": "Anmelden & Anbieter kontaktieren",
    "listing.signinHint": "Neu? {n} Tage kostenlos testen — ohne Kreditkarte.",
    "register.lead": "{n} Tage voller Zugang, {c} KI-Credits, keine Kreditkarte nötig. Das Abo beginnt erst, wenn du dich dafür entscheidest.",
    // Angebote (/listings) + Suchen (/rfqs)
    "filter.all": "Alle",
    "filter.manufacturer": "Hersteller",
    "filter.application": "Anwendung",
    "filter.chemistry": "Chemie",
    "filter.packaging": "Gebinde",
    "filter.region": "Region",
    "filter.approvals": "Freigaben",
    "filter.productType": "Produkttyp",
    "filter.isoVg": "ISO VG",
    "filter.status": "Status",
    "filter.reset": "{n} Filter zurücksetzen",
    "listings.catalogTitle": "Produkte im Katalog für „{q}“",
    "listings.catalogHint":
      "Diese Produkte sind in unserer Wissensbasis erfasst, aktuell aber nicht als Angebot gelistet. Details, Sicherheitsdatenblatt und Preis-Richtwerte findest du auf der Produktseite.",
    "listings.sort": "Sortieren",
    "listings.sortRecommended": "Empfohlen",
    "listings.sortPriceAsc": "Preis aufsteigend",
    "listings.sortPriceDesc": "Preis absteigend",
    "listings.sortQty": "Größte Menge",
    "listings.watch": "Merken",
    "listings.sponsoredHint": "Dieser Anbieter hat eine bezahlte Platzierung — das Angebot erscheint dadurch weiter oben.",
    "listings.offer": "Angebot",
    "listings.close": "Schließen",
    "listings.onRequest": "Auf Anfrage",
    "rfqs.iAmLooking": "Ich suche",
    "rfqs.currentNeeds": "Aktuelle Bedarfe",
    "rfqs.searchPlaceholder": "z.B. Castrol, KSS, Schleifen…",
    "rfqs.viewCompact": "Kompakte Liste",
    "rfqs.viewCards": "Detaillierte Karten",
    "rfqs.seeker": "Suchender:",
    // Anwendungen (Kacheln „Nach Anwendung einsteigen“ + Filter)
    // Normale Fachwörter, keine Markennamen — werden übersetzt.
    "app.fraesen": "Fräsen",
    "app.drehen": "Drehen",
    "app.bohren": "Bohren",
    "app.gewindeschneiden": "Gewindeschneiden",
    "app.schleifen": "Schleifen",
    "app.saegen": "Sägen/Trennen",
    "app.umformen": "Umformen/Stanzen",
    "app.hydraulik": "Hydraulik",
    "app.gleitbahn": "Gleitbahn",
    "app.getriebe": "Getriebe",
    "appEntry.title": "Nach Anwendung einsteigen",
    "appEntry.lead": "Produktname unbekannt? Starte bei deiner Aufgabe — wir zeigen passende Angebote.",
    "appEntry.offers.one": "{n} Angebot",
    "appEntry.offers.other": "{n} Angebote",
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
    "home.ctaRegister": "Try {n} days free",
    "home.ctaRegisterHint": "No subscription, no credit card — includes {c} AI credits.",
    "trial.badge": "{n} days free",
    "trial.pitch": "New here? {n} days of full access — no subscription, no credit card, includes {c} AI credits.",
    "listing.signinToContact": "Sign in & contact supplier",
    "listing.signinHint": "New? Try {n} days free — no credit card.",
    "register.lead": "{n} days of full access, {c} AI credits, no credit card required. The subscription only starts when you decide to take it.",
    // Offers (/listings) + Requests (/rfqs)
    "filter.all": "All",
    "filter.manufacturer": "Manufacturer",
    "filter.application": "Application",
    "filter.chemistry": "Chemistry",
    "filter.packaging": "Packaging",
    "filter.region": "Region",
    "filter.approvals": "Approvals",
    "filter.productType": "Product type",
    "filter.isoVg": "ISO VG",
    "filter.status": "Status",
    "filter.reset": "Reset {n} filters",
    "listings.catalogTitle": "Catalogue products for “{q}”",
    "listings.catalogHint":
      "These products are in our knowledge base but are not currently listed as an offer. You will find details, the safety data sheet and price guide values on the product page.",
    "listings.sort": "Sort",
    "listings.sortRecommended": "Recommended",
    "listings.sortPriceAsc": "Price, lowest first",
    "listings.sortPriceDesc": "Price, highest first",
    "listings.sortQty": "Largest quantity",
    "listings.watch": "Save",
    "listings.sponsoredHint": "This supplier has a paid placement — that is why the offer appears higher up.",
    "listings.offer": "Offer",
    "listings.close": "Close",
    "listings.onRequest": "On request",
    "rfqs.iAmLooking": "I am looking for",
    "rfqs.currentNeeds": "Current requests",
    "rfqs.searchPlaceholder": "e.g. Castrol, coolant, grinding…",
    "rfqs.viewCompact": "Compact list",
    "rfqs.viewCards": "Detailed cards",
    "rfqs.seeker": "Requested by:",
    // Applications (tiles “Start from your job” + filter)
    "app.fraesen": "Milling",
    "app.drehen": "Turning",
    "app.bohren": "Drilling",
    "app.gewindeschneiden": "Tapping & threading",
    "app.schleifen": "Grinding",
    "app.saegen": "Sawing & cutting",
    "app.umformen": "Forming & stamping",
    "app.hydraulik": "Hydraulics",
    "app.gleitbahn": "Slideways",
    "app.getriebe": "Gearboxes",
    "appEntry.title": "Start from your job",
    "appEntry.lead": "Don’t know the product name? Start from the job — we will show matching offers.",
    "appEntry.offers.one": "{n} offer",
    "appEntry.offers.other": "{n} offers",
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
    "home.ctaRegister": "{n} dagen gratis proberen",
    "home.ctaRegisterHint": "Geen abonnement, geen creditcard — inclusief {c} AI-credits.",
    "trial.badge": "{n} dagen gratis",
    "trial.pitch": "Nieuw hier? {n} dagen volledige toegang — geen abonnement, geen creditcard, inclusief {c} AI-credits.",
    "listing.signinToContact": "Inloggen & aanbieder contacteren",
    "listing.signinHint": "Nieuw? {n} dagen gratis proberen — geen creditcard.",
    "register.lead": "{n} dagen volledige toegang, {c} AI-credits, geen creditcard nodig. Het abonnement start pas als je daarvoor kiest.",
    // Aanbiedingen (/listings) + Aanvragen (/rfqs)
    "filter.all": "Alle",
    "filter.manufacturer": "Fabrikant",
    "filter.application": "Toepassing",
    "filter.chemistry": "Chemie",
    "filter.packaging": "Verpakking",
    "filter.region": "Regio",
    "filter.approvals": "Vrijgaven",
    "filter.productType": "Producttype",
    "filter.isoVg": "ISO VG",
    "filter.status": "Status",
    "filter.reset": "{n} filters wissen",
    "listings.catalogTitle": "Catalogusproducten voor „{q}”",
    "listings.catalogHint":
      "Deze producten staan in onze kennisbank, maar zijn op dit moment niet als aanbieding geplaatst. Details, het veiligheidsinformatieblad en richtprijzen vind je op de productpagina.",
    "listings.sort": "Sorteren",
    "listings.sortRecommended": "Aanbevolen",
    "listings.sortPriceAsc": "Prijs oplopend",
    "listings.sortPriceDesc": "Prijs aflopend",
    "listings.sortQty": "Grootste hoeveelheid",
    "listings.watch": "Bewaren",
    "listings.sponsoredHint": "Deze aanbieder heeft een betaalde plaatsing — daardoor staat de aanbieding hoger.",
    "listings.offer": "Aanbieding",
    "listings.close": "Sluiten",
    "listings.onRequest": "Op aanvraag",
    "rfqs.iAmLooking": "Ik zoek",
    "rfqs.currentNeeds": "Actuele aanvragen",
    "rfqs.searchPlaceholder": "bijv. Castrol, koelsmeermiddel, slijpen…",
    "rfqs.viewCompact": "Compacte lijst",
    "rfqs.viewCards": "Gedetailleerde kaarten",
    "rfqs.seeker": "Gezocht door:",
    // Toepassingen (tegels „Begin bij je taak” + filter)
    "app.fraesen": "Frezen",
    "app.drehen": "Draaien",
    "app.bohren": "Boren",
    "app.gewindeschneiden": "Draadsnijden",
    "app.schleifen": "Slijpen",
    "app.saegen": "Zagen/snijden",
    "app.umformen": "Omvormen/stansen",
    "app.hydraulik": "Hydrauliek",
    "app.gleitbahn": "Glijbanen",
    "app.getriebe": "Tandwielkasten",
    "appEntry.title": "Begin bij je taak",
    "appEntry.lead": "Productnaam onbekend? Begin bij je taak — wij tonen passende aanbiedingen.",
    "appEntry.offers.one": "{n} aanbieding",
    "appEntry.offers.other": "{n} aanbiedingen",
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

/**
 * Ersetzt Platzhalter wie {n} oder {c} in einem übersetzten Text.
 *
 *   fill(t("trial.pitch"), { n: 10, c: 20 })
 *
 * Wird für die Trial-Werbung gebraucht: Die Zahlen kommen aus den
 * Superadmin-Einstellungen (trialDays, welcomeCredits) und stehen NICHT fest im
 * Text — sonst wirbt die Seite irgendwann mit 10 Tagen, während die Software 30
 * gewährt.
 */
export function fill(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(String(v)),
    text,
  );
}
