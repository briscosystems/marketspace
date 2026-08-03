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

## Zwei Daueraufträge (2026-08-03, gelten ohne Nachfrage)

1. **Diese Datei laufend nachführen.** Jede Änderung an Funktion, Gestaltung,
   Wording oder Fachlogik wird hier im selben Arbeitsschritt eingetragen — nicht
   später, nicht „wenn Zeit ist". Es darf nichts verloren gehen.
2. **Erst recherchieren, dann gestalten.** Vor Design- und Feature-Entscheidungen
   nachsehen, wie bekannte erfolgreiche Plattformen (eBay, Kleinanzeigen, Amazon,
   Alibaba, Airbnb, Mobile.de …) die Aufgabe lösen, und die bewährten Muster
   übernehmen — statt sich etwas Eigenes auszudenken.

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
| Zahlen-Leiste im Kopf ersetzt den Erklärabsatz | gesetzt 2026-08-03 |
| **Zähler unter 25 werden nicht angezeigt** — die Leiste führt mit Katalog-Stärke (Produkte, Datenblätter, Hersteller); Angebote/Anfragen erscheinen erst, wenn die Zahl trägt | „5 Angebote" bewarb die eigene Leere; NN/g: die ersten Sekunden entscheiden |
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

## Angebots-Fotos (neu 2026-08-03)

| Entscheidung | Begründung / Beleg |
|---|---|
| Anbieter können **eigene Fotos** aufnehmen und anhängen — „Foto aufnehmen" öffnet am Handy direkt die Kamera, „Aus Galerie" erlaubt Mehrfachauswahl | Muster von eBay/Kleinanzeigen |
| **Max. 12 Fotos** je Angebot, zentral in `lib/listing-photos.ts` | Vergleichsplattformen: Etsy 10, Facebook 10, mobile.de 15, Kleinanzeigen/Vinted 20, eBay 24 |
| **Erstes Bild = Titelbild**, per Klick auf ein anderes Bild wechselbar | durchgängiges Marktmuster |
| Verkleinert wird **im Browser** (1600 px Anzeige + 400 px Vorschau, WebP mit JPEG-Rückfall), Bildlage aus EXIF übernehmen | Handyfotos haben 4–12 MB; ohne `imageOrientation` liegen iPhone-Bilder quer |
| Fotos liegen **in der Datenbank**, nicht als Datei | Railway hat kein dauerhaftes Dateisystem — Dateien wären nach dem Deploy weg. Ab einigen Hundert Angeboten auf Objektspeicher umstellen |
| Detailseite: großes Bild + **sichtbare Auswahlbilder** (keine reinen Punkte), Vollbild mit Pfeilen/Tastatur | Baymard: reine Punkt-Indikatoren sind ein belegtes Bedienproblem |
| Trefferliste: Titelbild füllt die Fläche, **Kamera-Symbol mit Anzahl**; ohne Foto bleibt die gezeichnete Gebinde-Grafik — nie ein leerer Kasten | Marktmuster; Platzhalter wirken billiger als eine gute Grafik |
| Hinweis **„Eigene Aufnahme des Anbieters · hochgeladen am …"** unter der Galerie | Vertrauenssignal; Cornell-Studie: eigene Fotos schlagen Katalogbilder im Vertrauen (3,8 vs. 3,7 von 5) |
| Regel im Upload: **nur eigene Fotos der echten Ware**, keine Hersteller-/Katalogbilder, kein Text, keine Wasserzeichen | eBay-Bildrichtlinie, Vinted-Begründung („zeigen nicht den Zustand") |
| Motiv-Reihenfolge vorgeschlagen: Gebinde → Etikett → Charge → Verschluss → Palette | B2B-Besonderheit: Fotos sind Nachweis über Ware und Betrieb |

## Fachliche Regeln

| Entscheidung | Begründung |
|---|---|
| Dichtungs-Hinweise **positiv** formulieren (geeignet zuerst, dann Vorsicht, dann meiden) | Es wird ein Alternativprodukt empfohlen — „ungeeignet" allein passt dort nicht |
| Vergleich erlaubt, sobald die **Produktart** übereinstimmt (nicht der Freitext) | Hydrauliköl vs. Hydrauliköl (HLPD) ist vergleichbar |
| Produktarten sauber trennen: Gleitbahnöl-Suche zeigt **nie** KSS | Tester-Rückmeldung 2026-08-02 |
| „Mineralölbasiert" ohne Zusatz „(Soluble Oil)" | Soluble Oil ist ein KSS-Begriff, bei Hydrauliköl falsch |
| Standardannahme Tankwechsel ≈ **1×/Jahr** (48 Wochen), Herkunft aller Vorgaben wird erklärt | Tester-Rückmeldung; sonst Angriffsfläche für Markenvertreter |
| Nicht belegbare Produktdaten bleiben **leer** statt geschätzt | Glaubwürdigkeit |

## Start / Go-Live

| Entscheidung | Stand |
|---|---|
| Die **Zugangssperre bleibt an**, bis die Plattform fehlerfrei ist. Kein Go-Live „auf Verdacht" | gesetzt 2026-08-03 |
| Der Start muss **flächendeckend, schnell und prägnant** wirken — ein halber Start lädt Wettbewerber ein | gesetzt 2026-08-03 |
| **Auffindbarkeit ist die Startgrundlage:** Sitemap (`app/sitemap.ts`) und `robots.txt` melden alle 4.600 Fachseiten; Produkt-, Datenblatt- und Herstellerseiten haben eigene Seitentitel. Solange die Zugangssperre an ist, sperrt robots.txt alles und die Sitemap bleibt leer | gesetzt 2026-08-03 |
| **Registrierung: nur E-Mail + Passwort.** Rolle, Firma, Land, Umsatzsteuer-Nummer und Anzeigename sind freiwillig und stehen unter „Weitere Angaben"; das Pseudonym vergibt die Plattform, wenn nichts eingegeben wird | gesetzt 2026-08-03; Baymard: 18–26 % Abbruch allein durch Kontozwang |

## Business Case — Erkenntnisse der Recherche vom 2026-08-03

> Grundlage für die Start-Strategie. Selbst nachgeprüft, wo es zählt.

| Befund | Beleg |
|---|---|
| **CheMondis ist tot.** Der von LANXESS gegründete deutsche Chemie-Marktplatz hat zum 1. Mai 2026 eingestellt — mit 1.900 Lieferanten, 12.000 Käufern und Brenntag als Partner | chemondis.com selbst abgerufen: „we have terminated operations" |
| **Knowde** (bestfinanzierter Chemie-Marktplatz, 146 Mio. USD) firmiert heute als „AI for Industrial Operations" — der Marktplatz ist eine Nebensäule | knowde.com selbst abgerufen |
| **Kein überlebendes Vorbild lebt von Transaktionsprovision.** Knowde, SpecialChem, Thomasnet, Octopart, Alibaba B2B verdienen über Abo, Leads und Sichtbarkeit | Recherche mit Quellenliste |
| **Alle Provisions-Marktplätze der Chemie sind gescheitert:** Chemdex, ChemConnect, Omnexus (Dow/DuPont/BASF/Bayer), OneTwoChem (Evonik), CheMondis (LANXESS) | dito |
| Wiederkehrende Scheiterungsgründe: fehlende Liquidität, Angst der Anbieter vor Preistransparenz, Umgehung nach Erstkontakt, fehlende Neutralität bei Hersteller-Plattformen | dito |
| **Unsere Neutralität ist ein Vorteil** — genau daran sind die Konzern-Plattformen gescheitert | dito |
| Unser eigener Katalog ist über §§ 87a ff. UrhG (Datenbankherstellerrecht) schützbar; das rohe fremde Datenblatt nicht | Recherche, keine Rechtsberatung |
| **Offener Punkt vor breitem Ausrollen:** anwaltliche Prüfung zum Hosten fremder Sicherheitsdatenblätter (keine deutsche Entscheidung auffindbar → ungeklärt, nicht „erlaubt") | — |

**Ableitung (Entscheidung des Betreibers steht noch aus):** Der Start trägt über den
Daten-/Katalogteil, nicht über 30 vorab gewonnene Reseller. Handel als Anbahnung,
nicht als Abwicklung. Geld über Sichtbarkeit und Abo, nicht über Provision.

## Technik

| Entscheidung | Begründung |
|---|---|
| Lokaler Entwicklungs-Server läuft auf **Port 4100** | 3000/3001 sind beim Betreiber belegt |
| Datenbank-Änderungen für live **nur** über `prisma/deploy-tasks.ts`, idempotent, nie werfend | Ein `git push` bringt nur Code nach Railway |
| Schema-Änderungen ausschließlich **additiv** — die Live-Datenbank darf nie überschrieben werden | Ausdrückliche Ansage des Betreibers |
| Vor Datenarbeiten **Backup**: `./scripts/backup.sh --commit --label X` | dito |
| KI-Aufrufe brauchen Absicherung: Zeitlimit, Wiederholungs-Sperre, Rückfall auf Heuristik | Kostenkontrolle |
| Produktarten zentral in `lib/product-categories.ts` — keine kopierten Listen | Es gab vier Kopien, eine wurde immer vergessen |
| Auch Geschäftsschwerpunkte (`focus.*`) und Praxis-Wissen-Kategorien (`issuecat.*`, `sev.*`) laufen über lib/i18n.ts | Standen vorher nur auf Deutsch im Seitencode — englische und niederländische Nutzer sahen Deutsch |
| **Ausnahme, bewusst so gelassen:** `PRODUCT_TYPE_PRESETS` in `app/rfqs/new/page.tsx`. Das sind Freitext-Werte des Feldes `Listing.productType`, keine Produktarten — sie müssen wörtlich zu den Angeboten passen, sonst greift die Zuordnung nicht mehr | Änderung wäre riskant ohne Nutzen |
