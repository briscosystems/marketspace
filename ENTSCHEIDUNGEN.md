# Gesetzte Entscheidungen — nicht ohne Rückfrage ändern

> **Regel für Claude (und jeden anderen, der hier arbeitet):**
> Was in dieser Datei steht, ist vom Betreiber bewusst so entschieden worden.
> Es darf **nicht stillschweigend entfernt, ersetzt oder „aufgeräumt"** werden —
> auch nicht als Nebeneffekt einer anderen Aufgabe (z. B. „Seite entschlacken",
> „vereinheitlichen", „Code zusammenführen").
>
> Wenn eine neue Aufgabe im Widerspruch zu einem Eintrag steht:
> **erst fragen, dann ändern.** Wird trotzdem etwas entfernt, gehört es
> ausdrücklich in die Antwort — nie kommentarlos.
>
> Diese Datei existiert, weil mehrfach Funktionen und Gestaltung ungefragt
> zurückgedreht wurden (2026-08-03). Sie überlebt jeden Gesprächsverlauf.

Vor jeder größeren UI- oder Datenänderung: **diese Datei lesen.**
Nach jeder Änderung, die hier etwas berührt: **Eintrag ergänzen oder anpassen.**

---

## Sprache und Wording

| Entscheidung | Begründung |
|---|---|
| Alles auf **Deutsch** — UI, Code-Kommentare, Doku, Seed-Daten | Zielmarkt DACH |
| Angebote heißen **„Anbieten"** (blau), Anfragen **„Suchen"** (amber) | Feste Marken-Konvention |
| Niemals „Listings" / „RFQs" in nutzersichtbarem Text | dito |
| Niemals „Treuhand" / „Escrow" — es heißt **Käuferschutz** | Stripe-Vorgabe für zulässige Geschäftsmodelle |
| „Sumpf" ist eine Falschübersetzung — es heißt **Tank** | Fachsprachlich korrekt |
| Einfache Sprache, keine unerklärten Fachbegriffe | Betreiber ist kein Techniker |

## Startseite

| Entscheidung | Stand |
|---|---|
| Drei Zielgruppen werden direkt abgeholt: **Reseller, Endkunden/Einkäufer, Hersteller** | gesetzt seit 2026-08-02 |
| Die drei Karten tragen die Kennzeichen **Anbieten** (blau), **Suchen** (amber), **Hersteller** (Marke) | 2026-08-03 versehentlich entfernt, wiederhergestellt |
| **Realistische Vektor-Grafiken** statt Emoji/Comic: `OilBarrels`, `SearchCanister` | gesetzt seit 2026-08-02 |
| Kein „Willkommen zurück"-Block — der Anmelde-Status steht oben rechts (grüner Punkt) | gesetzt 2026-08-03 |
| Werbebanner ist ein **schmaler Streifen**, kein Hero | gesetzt 2026-08-02 |
| Zahlen-Leiste im Kopf (Angebote / Anfragen / Datenblätter / Hersteller / Preise) ersetzt den Erklärabsatz | gesetzt 2026-08-03 |
| **Entfernt am 2026-08-03, ohne dass es verlangt war:** die drei „Entdecken"-Kacheln (Datenblätter / Hersteller / Preisorientierung). Ersatz ist die Zahlen-Leiste. Auf Wunsch zurückholbar. | offen |

## Bedienung / Gestaltung

| Entscheidung | Stand |
|---|---|
| Kleine Erklärtexte auf Kacheln erscheinen **erst beim Darüberfahren** | gesetzt 2026-08-03 |
| Der Hinweis erscheint als **Sprechblase unter der Karte** — die Karte darf weder wachsen noch dürfen Titel verdeckt werden | gesetzt 2026-08-03 |
| Auf Touch-Geräten stehen diese Texte fest in der Karte (kein Hover möglich) | dito |
| Karten heben sich beim Überfahren leicht an, Symbol wächst, Pfeil gleitet | gesetzt 2026-08-03 |
| Angebotskarten kompakt, 4 pro Reihe | älter |
| Suchtreffer aus dem Katalog zeigen **Gebindebild + Herstellerlogo + Produktart** | gesetzt 2026-08-03 |

## Fachliche Regeln

| Entscheidung | Begründung |
|---|---|
| Dichtungs-Hinweise **positiv** formulieren (geeignet zuerst, dann Vorsicht, dann meiden) | Es wird ein Alternativprodukt empfohlen — „ungeeignet" allein passt dort nicht |
| Vergleich erlaubt, sobald die **Produktart** übereinstimmt (nicht der Freitext) | Hydrauliköl vs. Hydrauliköl (HLPD) ist vergleichbar |
| Produktarten sauber trennen: Gleitbahnöl-Suche zeigt **nie** KSS | Tester-Rückmeldung 2026-08-02 |
| „Mineralölbasiert" ohne Zusatz „(Soluble Oil)" | Soluble Oil ist ein KSS-Begriff, bei Hydrauliköl falsch |
| Standardannahme Tankwechsel ≈ **1×/Jahr** (48 Wochen), Herkunft aller Vorgaben wird erklärt | Tester-Rückmeldung; sonst Angriffsfläche für Markenvertreter |
| Nicht belegbare Produktdaten bleiben **leer** statt geschätzt | Glaubwürdigkeit |

## Technik

| Entscheidung | Begründung |
|---|---|
| Lokaler Entwicklungs-Server läuft auf **Port 4100** | 3000/3001 sind beim Betreiber belegt |
| Datenbank-Änderungen für live **nur** über `prisma/deploy-tasks.ts`, idempotent, nie werfend | Ein `git push` bringt nur Code nach Railway |
| Schema-Änderungen ausschließlich **additiv** — die Live-Datenbank darf nie überschrieben werden | Ausdrückliche Ansage des Betreibers |
| Vor Datenarbeiten **Backup**: `./scripts/backup.sh --commit --label X` | dito |
| KI-Aufrufe brauchen Absicherung: Zeitlimit, Wiederholungs-Sperre, Rückfall auf Heuristik | Kostenkontrolle |
| Produktarten zentral in `lib/product-categories.ts` — keine kopierten Listen | Es gab vier Kopien, eine wurde immer vergessen |
