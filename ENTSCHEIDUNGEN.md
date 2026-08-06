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
| **Nutzersichtbare Texte gehören in `lib/i18n.ts` (DE/EN/NL)** — nie fest in den Seitencode. Ausnahmen, bewusst nur deutsch: Rechtsseiten (AGB, Datenschutz, Impressum) und der Admin-Bereich | 2026-08-04: 111 feste deutsche Texte gefunden, die EN/NL-Nutzern Deutsch zeigten; in zwei Runden ~130 Schlüssel nachgezogen |
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

## Suche und leere Zustände (2026-08-03)

| Entscheidung | Begründung |
|---|---|
| **EIN Suchfeld pro Seite — und das ist die Kopfzeile** (auf jeder Seite vorhanden, dunkler Balken, gut sichtbar). Kein zweites großes Feld im Seiteninhalt | Betreiber-Feedback 2026-08-04: zwei Felder untereinander verwirren; ersetzt die frühere Hero-Suchfeld-Entscheidung |
| Auf der Startseite bleiben die **Beispielsuchen** als Chips (Blasocut 4000, HLP 46, Gleitbahnöl ISO 68, Bor-frei) — getippt wird oben | zeigen in einer Sekunde, wonach man hier sucht |
| **Dashboard entschlackt:** Kacheln „Dein Dashboard" (Doppel-Navigation) und „Credits" (steht schon als Chip in der Kopfzeile) entfernt — es bleiben Nachrichten und Eingegangene Angebote | „Bedienung zu komplex, zu viel angezeigt" (Betreiber 2026-08-04) |
| Darunter **Beispielsuchen** als Knöpfe (Blasocut 4000, HLP 46, Gleitbahnöl ISO 68, Bor-frei) | zeigt in einer Sekunde, wonach man hier sucht |
| **Jede leere Liste bietet einen Ausweg** über den Baustein `components/LeerHinweis.tsx`: „Alternative finden (KI)" und „Anfrage einstellen — wir holen Angebote ein" | Eine leere Liste ist der häufigste Absprungmoment; ehrlicher als so zu tun, als sei alles da |
| Kein „Keine Treffer" ohne nächsten Schritt | dito |
| Eingesetzt auf: Angebote, Anfragen, Datenblätter, Richtwerte, KSS-Finder, Praxis-Wissen, Herstellerseite, Werkstoffseite | Stand 2026-08-03 |
| **Produktdarstellung überall gleich:** Gebindebild + Herstellerlogo + Produktart-Chip. Gemeinsamer Baustein `components/ProduktZeile.tsx`; wo eine Seite eine eigene Karte braucht, mindestens dieselben drei Bestandteile | Dasselbe Produkt sah vorher auf acht Seiten acht Mal anders aus |

## Regionen und Märkte

| Entscheidung | Begründung |
|---|---|
| **Der Markt ist Europa, nicht Deutschland.** Die Lagerregion deckt **alle 27 EU-Staaten** ab, dazu Schweiz, Liechtenstein, Norwegen, Vereinigtes Königreich und übriges Europa (47 Länder) | Brisco sitzt in der Schweiz; die Liste war vorher faktisch auf Deutschland zugeschnitten |
| **Nur das Land, keine Kantone oder Bundesländer.** Verwaltungsebenen sind für Frachtkosten zu ungenau (Baden-Württemberg ist 300 km breit) und für die Bedienung zu umständlich | Entscheidung des Betreibers 2026-08-03 |
| Wenn Entfernung später wirklich zählt: **Postleitzahl plus Umkreis** (wie Kleinanzeigen und mobile.de) — nicht eine Verwaltungsebene dazwischen | der einzig sinnvolle nächste Schritt |
| Reihenfolge: **Schweiz, Österreich, Deutschland**, dann alphabetisch | Heimatmarkt zuerst |
| Eine Länderliste für alles: `lib/europe-countries.ts` versorgt Registrierung und Lagerregion | die Liste stand vorher doppelt im Seitencode |

## Farb- und Bediensprache (Design-Audit 2026-08-03, umgesetzt)

| Entscheidung | Begründung |
|---|---|
| **Eine Primäraktion pro Seite.** Auf der Angebots-Detailseite ist es „Angebot anfragen"; Kontakt und Muster sind Zweitaktionen, die KI steht abgesetzt darunter | Vorher vier gleichrangige Knöpfe in vier Farben am Konversionspunkt |
| **Grün ist Status, keine Handlungsfarbe** (angenommen/geeignet/frei). Verkauf = blau, Einkauf/Anfrage = amber — auch in Kennzahlen und Status-Chips | Farbkonvention Anbieten/Suchen gilt überall |
| Bestätigungsseiten tragen die Farbe ihrer Strecke: Angebot = blau, Anfrage = amber | Endpunkt gehört zur Strecke, Grün bleibt dem Status |
| **`text-brand-500` nie als Text-/Linkfarbe** — Kontrast ≈ 2,2:1 auf Weiß. Links: `text-brand-700` | Lesbarkeit (WCAG) |
| Am Geldpunkt steht die **Gebühren-Formel** (2,5 % + 0,25 €, trägt der Käufer) — und niemals „Brisco verdient nichts" | stand im Widerspruch zu den AGB; §12 „Provisions-" ebenfalls bereinigt |
| Anfrage-Detail: Überschrift ist das **Gesuchte**, die Menge der Untertitel; Status: offen = amber, angenommen = grün | Blickführung |
| Kachel „Nachrichten" zählt ehrlich Gespräche — kein „Ungelesen"-Signal, solange es keine Gelesen-Markierung gibt | keine vorgetäuschten Zähler |
| Werkstoffseite: Verträglichkeit **positiv zuerst** (empfohlen → verträglich → Vorsicht → ungeeignet) | gleiche Dramaturgie wie die Produktseite: Auswahlhilfe, keine Warnliste |
| Nach dem Veröffentlichen zeigt die Bearbeiten-Seite einen **Erfolgsbalken** (Angebot online + Foto-Hinweis) | der Belohnungsmoment ging vorher verloren |
| **Preisflächen sind neutral** (dunkel/weiß) — nie in Herstellerfarbe (Mobil-Rot = Fehlerfläche) und nie amber (gehört den Anfragen) | Preis ist Information |
| Datenqualität („gut belegt / mittel belegt / wenige Daten") **deutsch und ohne Rot** — Rot bleibt echten Gefahren (GHS, ungeeignet) vorbehalten | englische Enums und Rot für Datenqualität wirkten wie Warnungen |
| Produktseite hat eine **Primäraktion: „Preis anfragen — ohne Konto"** (amber) | vorher konnte man von der wichtigsten Seite weder anfragen noch anbieten |
| Formulare sagen, was Pflicht ist: „Pflicht sind nur mit * markierte Felder" | 11 freiwillige Felder wirkten wie eine Wand |
| Datenblatt-Detail: **Signalwort + Gefahrensymbole direkt im Kopf** — die 3-Sekunden-Antwort auf „wie gefährlich?" | standen vorher erst weit unten in Abschnitt 2 |
| Technische Datenblätter nummerieren **laufend** — feste Nummern hinterließen Lücken („2., 5., 7."), wenn Abschnitte fehlen | Dokument-Vertrauen |
| Die ganze Plattform **duzt** — auch Werbe- und Abo-Texte (siezte als einzige) | eine Ansprache |
| Leere Zustände auch auf Konto-Seiten mit Ausweg (Dashboard ×3, Nachrichten, Umsätze, Anfrage-Detail) | Sackgassen sind der häufigste Absprungmoment |

## AGB (Stand August 2026, erweitert 2026-08-04)

| Klausel | Zweck |
|---|---|
| Automatische §-Nummerierung im Code | feste Nummern erzeugten schon einmal falsche Querverweise |
| **Keine proaktive Prüfpflicht** — Brisco prüft Nutzerinhalte nicht vorab, handelt auf konkrete Hinweise | Hosting-Stellung; keine Übernahme fremder Inhalte |
| **Gefahrstoff-Verantwortung allein beim Anbieter** (ChemG/ChemV, REACH/CLP, ADR, Export/Sanktionen) | Kernrisiko einer Chemie-Plattform |
| **Nutzerinhalte/Fotos:** Rechte-Zusicherung des Nutzers + einfaches Nutzungsrecht für den Betrieb; **Dokumente Dritter:** maßgeblich ist das Hersteller-Original, Entfernung auf berechtigte Meldung | Foto-Upload und SDS-Hosting absichern |
| **Käuferschutz-Entscheid nach billigem Ermessen**, kein Anspruch auf ein bestimmtes Ergebnis, Rechtsweg unberührt | sonst haftete Brisco für die Streitentscheidung selbst |
| **Haftungshöchstbetrag:** Entgelte der letzten 12 Monate (außer bei zwingender Haftung) | Begrenzung der Resthaftung |
| **Freistellung:** Nutzer stellt Brisco von Drittansprüchen aus seinen Inhalten/Verträgen frei, inkl. Verteidigungskosten | wichtigster Schutzschild |
| **AGB-Änderungen:** 30 Tage Ankündigung, Weiternutzung gilt als Annahme, Widerspruchsrecht | sonst wären Änderungen nie durchsetzbar |
| Zwingende Haftung (Personenschäden, Produkthaftung, Vorsatz/grobe Fahrlässigkeit) bleibt ausdrücklich unberührt | Klauseln, die das ausschließen, wären insgesamt nichtig |
| **Die erweiterten AGB brauchen einen kurzen Anwalts-Blick vor Go-Live** — die frühere Freigabe betraf das SDS-Hosting, nicht diese neuen Klauseln | offener Punkt |

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
| **Erledigt am 2026-08-03: anwaltliche Prüfung zum Hosten fremder Sicherheitsdatenblätter abgeschlossen** — der Betreiber hat freigegeben, wir dürfen so verfahren | Angabe des Betreibers |

### Entschieden am 2026-08-03

| Entscheidung | Umsetzung |
|---|---|
| **Positionierung: „Die Suchmaschine für Industrieöle, Kühlschmierstoffe und Schmierstoffe."** Bewusst NICHT „Marktplatz" und bewusst NICHT „Lieferantenverzeichnis" — letzteres ist mit wlw, lieferanten.de und induux besetzt, dort wären wir der 20. Anbieter. Unser Unterschied sind Produktdaten, Alternativen und Fachlogik | Startseite, Seitentitel und Beschreibung angepasst |
| **Geldmodell: Abos.** Keine Provision als Hauptmodell — das ist in der Chemie fünfmal gescheitert (Chemdex, ChemConnect, Omnexus, OneTwoChem, CheMondis) | Abo-Seite umformuliert |
| **Zahlungsabwicklung über die Plattform ist freiwillig.** Nur wer sie nutzt, zahlt eine kleine Gebühr (2,5 % + 0,25 €, getragen vom Käufer). Wer direkt abwickelt, zahlt keine Provision | Käuferschutz-Text angepasst |
| **Keine 30 Reseller vor dem Start.** Der Start trägt über den Katalog; Reseller kommen über nachgewiesene Nachfrage | — |

| **Anfragen ohne Konto** (2026-08-03): Wer nicht angemeldet ist, gibt nur seine E-Mail-Adresse an. Das Konto entsteht dabei automatisch, der Anzeigename wird vergeben, und per Mail kommt der Link zum Passwortsetzen (derselbe Weg wie „Passwort vergessen"). Danach sieht man die Antworten der Händler | Baymard: 18–26 % Abbruch allein durch Kontozwang |
| **Anbieten verlangt weiterhin ein Konto** — ein Angebot ist eine Zusage, der Anbieter muss erreichbar und zurechenbar sein. Käufer sollen dagegen ohne Hürde fragen dürfen | Asymmetrie ist gewollt |
| **Das Konto entsteht aber ERST beim Absenden**, bei Anfrage wie bei Angebot: ausfüllen, E-Mail angeben, fertig. Vorher wurde man auf die Anmeldeseite geworfen und verlor alles Eingetippte | gemeinsamer Baustein `lib/konto-nebenbei.ts` |
| Nach dem Absenden ohne Konto führt der Weg auf eine Bestätigungsseite (`/rfqs/eingegangen`, `/listings/eingestellt`), nie in eine gesperrte Seite | Das Passwort ist zu diesem Zeitpunkt noch nicht gesetzt |

## Konto-Sperrung & REST-API (2026-08-04)

| Entscheidung | Umsetzung |
|---|---|
| **Admin sieht Kunden nach Abo-Stufe** (Marke / Pro / Basis / Kennenlernphase / ohne Zugang / gesperrt) als Kachelreihe oben im Admin | „Aktiv" = bezahlte Stufe mit gültigem Ablaufdatum |
| **Jedes Konto manuell sperrbar** (Spalte „Sperre" in der Kundentabelle, mit Rückfrage und internem Grund). Die Sperre wirkt sofort: Anmeldung verweigert, laufende Sitzungen verlieren beim nächsten Aufruf den Zugriff (JWT-Prüfung), API-Schlüssel abgewiesen. Admin-Konten sind nicht sperrbar | getestet: Anmeldung gesperrt → leere Session |
| **REST-API /api/v1 nur für aktive Marke-Stufe** — die Stufe wird bei JEDEM Aufruf geprüft; Abo abgelaufen oder Konto gesperrt = Schlüssel sofort wirkungslos | Endpunkte: Produkte (Suche + Detail), Datenblätter (ausgewertet + pdfUrl), KI-Alternativsuche |
| API-Schlüssel: nur sha256-Hash gespeichert, Klartext genau einmal sichtbar, max. 5 aktive, Selbstverwaltung unter Mitgliedschaft, Doku unter /api-doku | — |
| **KI über API kostet dieselben Credits wie auf der Plattform** (Web-Recherche 2, regelbasiert kostenlos), gleiche atomare Abbuchung, gleiches Buchungsjournal, automatische Erstattung bei Fehlschlag | End-zu-End getestet: 401/403/402, Abbuchung −2 mit Journal, Erstattung +2, Saldo unverändert bei zu wenig Guthaben |

## Praxis-Erfahrungen der Nutzer (2026-08-04)

| Entscheidung | Begründung / Beleg |
|---|---|
| Nutzer teilen Erfahrungen **per Text oder Diktat** — das Diktat nutzt die eingebaute Spracherkennung des Browsers/Smartphones; es wird nie Audio übertragen, nur der fertige, vom Nutzer korrigierte Text | keine externen Sprachdienste, keine Audio-Daten |
| **Belohnung: 2 Credits nach Freigabe** — und zwar für JEDE geprüfte Erfahrung gleich, positiv wie negativ; das steht auch sichtbar dabei | Punkte-Belohnung verdreifacht Beiträge (Yotpo); nur positive zu belohnen wäre unlauteres Review-Gating (FTC/UWG) |
| **Alles läuft über Moderation** (Admin-Warteschlange: freigeben = Prämie gutschreiben, ablehnen mit internem Grund) — nichts erscheint ungeprüft | Qualität und Missbrauchsschutz |
| Freigegebene Berichte erscheinen auf der Produktseite als „Erfahrungen aus der Praxis" mit Pseudonym, Vertrauensstufe und Diktat-Kennzeichen | Herstellerübergreifende Praxis-Daten sind der Datenschatz, den kein Wettbewerber kopieren kann |
| Höchstens ein offener Bericht je Produkt und Nutzer | Spam-Bremse ohne ehrliche Mehrfach-Erfahrungen zu blockieren |
| Buchungsart `EXPERIENCE` im Credit-Journal | Prämien sauber von Käufen/Verbrauch getrennt |

## KSS-Pflegewerte / CoolantGuide-Richtung (2026-08-05)

| Entscheidung | Begründung / Beleg |
|---|---|
| Die Wissensbasis wird um **Pflege-Sollwerte** ausgebaut (Refraktometer-Faktor, Konzentrationsfenster, pH-Bereich, Wasserhärte, Standzeit) — nicht nur Auswahl-, sondern auch Pflegewissen | Ein Wettbewerber (Uni-Projekt „CoolantGuide") deckt Auswahl UND Pflege ab, aber nur für einen Hersteller; unser Vorteil ist genau dieselbe Tiefe **herstellerübergreifend** |
| Daten-Sprint 2026-08-05: 102 der 137 wassermischbaren KSS mit belegten Sollwerten gefüllt (Refraktometer-Faktor 25 → 88, Konzentration 3 → 94, pH 1 → 94, Wasserhärte 10 → 24) | Ohne diese Werte konnte die Seite bei der laufenden Pflege im Betrieb nichts beitragen |
| **Nur belegte Werte, niemals geschätzte oder von ähnlichen Produkten übertragene** — je Produkt ist eine Quellen-URL hinterlegt (`prisma/data/kss-sollwerte-2026-08-05.json`); 35 Produkte bleiben bewusst leer | Falsche Sollwerte sind im Betrieb gefährlicher als fehlende (falsche Konzentration = Korrosion, Hautprobleme, Werkzeugverschleiß) |
| **Standzeit in Wochen bleibt überall leer** — kein einziges Herstellerdatenblatt nennt sie | Standzeit hängt vom Betrieb ab; sie kann nur aus echten Messdaten der Nutzer entstehen (nächster Baustein: Tank-Register) |
| Einspielen über idempotente Deploy-Aufgabe, die **nur NULL-Felder füllt** und vorhandene Werte nie überschreibt | Von Hand gepflegte oder aus dem Datenblatt gelesene Werte haben Vorrang |

Offene Punkte aus dem Sprint (Datenqualität, noch zu prüfen): „Avilub Metacorin 833" ist
laut Datenblatt kein KSS, sondern Korrosionsschutz (falsche Kategorie); die Reihe
„Eni Aquamet ECO/MD/Premium" und die drei „Hebro Cut"-Bezeichnungen waren bei den
Herstellern nicht auffindbar.

## Tank-Register / Messwerte (2026-08-05)

| Entscheidung | Begründung / Beleg |
|---|---|
| Betriebe führen ihre Tanks (Maschine, Füllmenge, Produkt, Ansetzdatum) und tragen Messwerte ein (Brix, pH, Nitrit, Keimzahl, Bemerkung) | Auswahl war einmalig, Pflege ist wöchentlich — das ist der Grund wiederzukommen |
| Die Bewertung vergleicht mit den **Sollwerten des Herstellers** aus dem Daten-Sprint; fehlt ein Sollwert, wird der Wert nur festgehalten und ausdrücklich **nicht bewertet** | Lieber keine Aussage als eine geratene — falsche Pflegehinweise verursachen Korrosion und Hautprobleme |
| Zwei produktunabhängige Grenzen gelten immer: **pH unter 8,5 = kritisch** (DGUV-Regel 109-003) und **Nitrit über 20 mg/l = kritisch** (TRGS 611, Nitrosamingefahr) | Gesetzliche bzw. berufsgenossenschaftliche Vorgaben, unabhängig vom Produkt |
| **Messwerte sind privat.** Nie öffentlich, nie für Hersteller sichtbar; nur anonymisierte Auswertungen über viele Betriebe dürfen später erscheinen — steht auch sichtbar auf der Seite | Ohne diese Zusage trägt kein Betrieb echte Werte ein |
| Konzentration wird aus Brix × Refraktometer-Faktor berechnet, kann aber direkt eingetragen werden | Refraktometer ist das Werkstatt-Standardgerät; Titration bleibt möglich |
| Nachdosier-Empfehlung bewusst grob (Volumen × Differenz), Ziel ist die Mitte des Herstellerfensters | Genauer wäre Scheingenauigkeit — Verschleppung und Verdunstung sind unbekannt |
| Diktat auch bei der Messung (wie bei den Erfahrungen): nie Audio, nur Text | An der Maschine mit öligen Händen tippt niemand |
| **Echte Standzeit** entsteht aus Ansetzdatum und Messreihe — die Zahl, die in keinem Herstellerdatenblatt steht | Der eigentliche Datenschatz: nicht abschreibbar, weil sie nur im Betrieb entsteht |

## Datenqualität: erfundene Produkte (Prüfung 2026-08-05)

Beim Sollwerte-Sprint fiel auf, dass eine frühere automatische Anreicherung
(„Auto-generiert aus Hersteller-Produktreihen-Template", 507 Produkte)
Bezeichnungen erzeugt hat, die es nicht gibt. Geprüft wurden die 150
riskantesten (weder SDS noch Datenblatt-Link); 147 Urteile liegen vor:

| Urteil | Zahl |
|---|---|
| belegt | 69 |
| falsch geschrieben (Produkt existiert, Name falsch) | 25 |
| nicht belegbar | 53 |

Belege je Eintrag in `prisma/data/pruefung-a…f.json`. Muster: ganze Marken
erfunden („Jokisol" bei Jokisch, „Renogear" bei Fuchs, „Divinol Bohröl" statt
Zubora, „Isohyd"/„Ferrocoat" bei Petrofer), oder eine Viskositätsvariante
ergänzt, die es in der Reihe nicht gibt.

**Festlegung:** Erfundene Produktseiten sind für eine Plattform, die Vertrauen
verkauft, das schwerste Datenproblem — wer sie findet, hält sie für belegt.
Nicht belegbare Einträge werden entfernt, falsch geschriebene umbenannt
(Löschung nur mit Sicherheitsnetz: nichts, woran Preise, Probleme oder
Erfahrungsberichte hängen). Offen: die restlichen 357 template-erzeugten
Produkte mit SDS-/Datenblatt-Beleg stichprobenweise prüfen.

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
