# Functional Design Specification — Marketplace App

**Projekt:** Industrial Oil Trading Platform
**Version:** 0.1 (Initial Draft)
**Datum:** 2026-05-17
**Owner:** Klaus Gosch, Brisco Systems GmbH

---

## 1. Zweck und Vision

Ein B2B-Marktplatz für Reseller und OEM-Hersteller von Industrieölen, KSS und Schmierstoffen im DACH- und EU-Raum. Resellern wird ermöglicht, Über- und Unterbestände untereinander auszugleichen, ohne über Hauptlieferanten gehen zu müssen. Der Marktplatz löst das aktuelle Sourcing-Problem, das durch geopolitische Unsicherheiten (u.a. Iran-Konflikt, Strait-of-Hormuz-Risiken) und enge Base-Oil-Group-III-Versorgung verstärkt wurde.

Ziel: selbstverstärkendes Wachstum durch Mehrwert pro Transaktion, AI-gestütztes Matching und Markt-Intelligenz.

---

## 2. Geschäftsmodell

- Provision: 10 % auf jede über die Plattform abgewickelte Transaktion.
- Zahlungsabwicklung: Stripe Connect mit Split-Payment (90 % an Verkäufer, 10 % an Plattform).
- Keine manuelle Rechnungsstellung durch Plattformbetreiber.
- Stripe-Transaktionsgebühren werden an die Reseller weitergegeben.

---

## 3. Benutzertypen

| Typ | Beschreibung | Rechte |
|---|---|---|
| **Reseller** | Händler von Industrieölen, kauft und verkauft Bestände | Listings erstellen, suchen, chatten, kaufen, verkaufen |
| **OEM Manufacturer** | Kleinere Blender und Hersteller mit eigenen Formulierungen oder OEM-Brands | Produkte listen, mit Resellern matchen, verkaufen |
| **Admin** | Plattformbetreiber (Brisco Systems) | Volle Übersicht, Moderation, Reporting, Settings |

Alle Reseller treten gegenüber anderen Resellern unter **Pseudonym** auf. Klarname und Kontaktdaten bleiben verborgen, bis ein Revenue-Threshold mit einer bestimmten Gegenpartei überschritten wird (siehe Abschnitt 8).

---

## 4. Kernfunktionen — Phase 1 (Prototyp)

### 4.1 Registrierung und Onboarding
- Self-Service-Registrierung mit Kreditkarten-Hinterlegung (Stripe).
- Pflicht-Pseudonym bei Reseller-Konten.
- KYC light: Firmenname, USt-ID, Land — intern sichtbar, extern unsichtbar.
- Email-Verifikation.
- Profil-Typ-Auswahl: Reseller / OEM Manufacturer.

### 4.2 Produkt-Listings
Datenmodell pro Listing umfasst mindestens:
- Produkttyp (Hydrauliköl, KSS-Emulsion, Schmierstoff, Konzentrat, etc.)
- Hersteller (oder OEM-Eigenmarke)
- Produktbezeichnung
- ISO-Viskositätsklasse
- Additivpaket / Chemiebasis (Mineralöl, synthetisch, halbsynthetisch, esterbasiert, etc.)
- Anwendungsbereich (CNC, Schleifen, Hydraulik, Wire-Drawing, etc.)
- Verfügbare Menge (Liter / Fässer / IBC / Tank)
- Mindestabnahmemenge
- Lagerstandort (Region/Land — keine genaue Adresse extern)
- Verpackungsform
- Ablaufdatum / Produktionsdatum
- Zertifikate (OEM-Freigaben, ISO, DIN, TRGS 611, etc.)
- Preisvorstellung (optional, kann „auf Anfrage" sein)
- Versandkonditionen (Selbstabholung / Lieferung / verhandelbar)

### 4.3 Such- und Match-Engine
- Volltextsuche und Filter nach allen Listing-Attributen.
- AI-gestützte Ähnlichkeits-Suche: Bei nicht verfügbarem Produkt werden technisch äquivalente Alternativen vorgeschlagen, sortiert nach Kompatibilitäts-Score.
- Vektorbasierte semantische Suche auf Produktspezifikationen.
- Begründung der Empfehlung in natürlicher Sprache ("Ähnliche Viskosität, gleicher Anwendungsbereich, äquivalente Additivchemie").
- **Side-by-Side-Vergleichsansicht** (siehe Abschnitt 5.4): Original-Produkt
  und bis zu 3 Alternativen werden in einer Tabelle gegenübergestellt, mit:
  - Physikalisch-chemische Kennwerte (Viskosität bei 40 °C / 100 °C, VI, Flammpunkt, Pourpoint, Dichte, Wassergehalt, etc.)
  - Inhaltsstoffe aus den Sicherheitsdatenblättern: pro CAS-Nummer Stoffname,
    Konzentrationsbereich und Funktion (Grundöl, AW-Additiv, EP, Antioxidans,
    Korrosionsinhibitor, Biozid, etc.)
  - OEM-Freigaben und Normen (DIN, ISO, OEM-spezifisch)
  - Sicherheits-/Gefahren-Klassifikation (H-/P-Sätze, ADR-Klasse, AVV-Abfallschlüssel)
  - Kompatibilitäts-Score mit textueller Begründung der Abweichungen ("3 %
    höherer Anteil schwefelbasierter EP-Additive — Vorsicht bei Buntmetall").
- Jede Alternative wird mit einem **Substitutions-Konfidenz-Wert** (0–100 %)
  versehen, der aus drei Komponenten besteht: Spezifikations-Match, OEM-Freigabe-Match,
  historische Substitutions-Erfolgsquote in der Plattform-Datenbank.

### 4.4 Mobile App (iOS + Android, React Native via Expo)
- Anmelde-/Such-/Chat-/Transaktions-Flows wie Web.
- **Foto-Erkennung:** Reseller fotografiert Fass-Etikett im Lager, App identifiziert das Produkt automatisch (Hersteller, Produktname, Spezifikation), legt Listing oder Suchanfrage direkt an.
- Offline-Modus: Fotos und Listings werden lokal gepuffert und beim Reconnect synchronisiert.
- Push-Notifications für Matches, Chat-Nachrichten, Marktwarnungen.

### 4.5 Pseudonyme Kommunikation
- Reseller chatten nur über die Plattform; Pseudonym ist die einzige sichtbare Identität.
- AI-Filter scannt alle Nachrichten auf Kontaktdaten (E-Mail, Telefon, Firmennamen, Adressen) und blockiert bzw. maskiert diese.
- Versuchte Verstöße werden geloggt und können beim Admin Warnungen auslösen.

### 4.6 Stripe Split-Payment
- Käufer zahlt vollen Betrag in Stripe-Treuhand.
- Plattform behält automatisch 10 % ein.
- 90 % gehen an Verkäufer-Konto.
- Auto-generierte Beleg-PDFs für beide Parteien.
- Refund/Dispute-Handling über Stripe-Standardprozesse.

### 4.7 Bewertungs- und Ranking-System
- Nach jeder abgeschlossenen Transaktion können beide Seiten bewerten (1–5 Sterne, freier Kommentar).
- Reseller-Profil zeigt: Anzahl Transaktionen, Durchschnittsrating, Badges (z.B. „Verified Supplier", „Fast Shipper").
- Ranking beeinflusst Sichtbarkeit in Suchergebnissen und Empfehlungen.

### 4.8 Predictive Recommendation Engine
- Tracking pro Reseller: typische Produktkategorien, Volumen, Frequenz, regionale Verkaufsgebiete.
- Proaktive Hinweise im Dashboard: „Du hast letzten Monat X gekauft — neuer Bestand verfügbar."
- Background-Job, der bei neuen Listings automatisch passende Käufer-Kandidaten benachrichtigt.

### 4.9 Market Scarcity Detection
- Aggregierte Auswertung der Suchanfragen.
- Schwellwert-basierte Warnungen: Wenn ein Produkt von signifikant überdurchschnittlich vielen Resellern gesucht wird, Alert an Plattform und an alle Reseller, die dieses oder ähnliche Produkte handeln.
- Empfehlung kompatibler Alternativen, um Engpässe abzufedern.

---

## 5. Knowledge Base — Produktkompatibilität und Datenblatt-Pipeline

Die Knowledge Base ist das **zentrale strategische Asset** der Plattform. Sie
hebt den Marktplatz vom reinen Vermittler zum unverzichtbaren Werkzeug, weil
weder Käufer noch Verkäufer diese Datenbasis allein aufbauen oder pflegen können
(siehe Abschnitt 6 zu Value-Add).

### 5.1 Datenquellen

- **OEM-Freigabelisten** (Bosch Rexroth, Siemens, Mori Seiki, DMG Mori, Heller,
  Trumpf, Eaton, Parker, etc.) — initial manuell gepflegt, später per
  Web-Scraping mit menschlicher Validierung.
- **Hersteller-Datenblätter (TDS)** der großen Anbieter (Shell, Mobil, Fuchs,
  Total, Castrol, Klüber, Petronas, BP, ExxonMobil, Houghton, Quaker, Blaser,
  Oemeta, Rhenus, Motorex …).
- **Sicherheitsdatenblätter (SDS)** nach REACH Anhang II / GHS — Pflicht-Upload
  beim Anlegen eines Listings, ergänzt durch Crawling öffentlicher
  Hersteller-Portale.
- **Normen-Referenzen**: DIN 51517, DIN 51524, DIN 51519, DIN 51385, ISO 6743,
  ISO 11158, AGMA-Normen, NSF H1/H2 für Lebensmittel-tauglich.
- **Regulatorik-Listen**: REACH SVHC-Kandidatenliste, TRGS 611 (Nitrosamin-
  Bildung in KSS), TRGS 906 (Krebserzeugende Tätigkeiten), CLP-Verordnung,
  ADR-Klassifizierungen.
- **Plattform-eigene Transaktionsdaten**: gelungene und gescheiterte
  Substitutionen, Bewertungs-Kommentare, Reklamationen.

### 5.2 Datenblatt-Ingest-Pipeline

1. **Upload / Crawl**: PDF, HTML oder strukturiertes JSON.
2. **OCR + Layout-Erkennung** für gescannte PDFs (z. B. AWS Textract,
   Azure Document Intelligence oder Google Document AI).
3. **LLM-Extraktion** in ein strukturiertes Schema (siehe 5.3). Jede Extraktion
   erhält einen Confidence-Score und einen Quellen-Verweis (Seite/Abschnitt).
4. **Validierungs-Queue** für unsichere Felder: Admin prüft und bestätigt.
   Bestätigte Datensätze werden Trainingsmaterial für künftige Extraktionen.
5. **Versionierung**: SDS werden alle 12 Monate neu eingelesen; Änderungen an
   Inhaltsstoffen oder Klassifikation erzeugen Alerts an alle Reseller, die das
   Produkt jemals gehandelt haben.

### 5.3 Strukturiertes Daten-Modell

Pro Produkt-Variante (Hersteller × Produktname × Region × Charge optional):

- **Physikalische Kennwerte**: Viskositäten (40 °C, 100 °C), VI, Dichte,
  Flammpunkt, Pourpoint, TBN/TAN, Wassergehalt, Schaumverhalten, Demulgiervermögen.
- **Inhaltsstoffe** (pro Eintrag):
  - CAS-Nummer + EG-Nummer
  - Stoffname (REACH-konform)
  - Konzentrations-Range (z. B. „1–3 %", „< 0,1 %")
  - Funktions-Klassifikation: Grundöl / Verschleißschutz-Additiv (AW) /
    Hochdruck-Additiv (EP) / Antioxidans / Korrosionsinhibitor / Detergent /
    Dispergiermittel / Biozid / Emulgator / Komplexbildner / Tensid / Sonstiges.
  - Gefahren-Kennzeichnung (H-/P-Sätze, GHS-Piktogramme, Cancerogen/Mutagen/
    Reprotox-Klassifikation, Hautsensibilisierung).
- **Freigaben**: OEM × Spezifikation × Status (aktiv/zurückgezogen) × Datum.
- **Normen-Konformität**: Liste DIN/ISO/etc.
- **Logistik-Stammdaten**: ADR-UN-Nummer, ADR-Klasse, Verpackungsgruppe,
  AVV-Abfallschlüssel.
- **CO2-Footprint** (kg CO2e/kg Produkt, wenn vom Hersteller deklariert).

### 5.4 Vergleichs- und Substitutions-Engine

Aus dem Modell aus 5.3 berechnet die Engine drei orthogonale Scores:

- **Spezifikations-Match-Score**: gewichtete Differenz der physikalischen
  Kennwerte, normiert auf die Toleranzen der Anwendungs-Klasse (z. B. ± 10 %
  Viskosität für Hydrauliköl HLP).
- **Chemie-Match-Score**: Überlappung der Inhaltsstoff-Funktionsklassen und
  CAS-Übereinstimmung. Verschiedene Grundöl-Gruppen (API I–V) und unterschiedliche
  Additivpakete werden bewertet, nicht nur „gleich/ungleich".
- **Freigabe-Match-Score**: wie viele OEM-Freigaben des Originals erfüllt das
  Alternativprodukt ebenfalls.

Der Gesamt-Konfidenz-Wert ist gewichtetes Mittel; die Gewichte hängen von der
**Anwendungs-Kritikalität** ab (Servoventile streng, allgemeine Hydraulik
locker).

Bei jedem Vergleich wird textuell **erklärt**, welche Abweichungen relevant
sind ("höherer Zink-Gehalt — nicht für Buntmetall geeignet", "fehlt
DIN 51524-2 HLP-Freigabe — nur für leichte Hydraulik").

### 5.5 Vektor-Repräsentation

Zusätzlich zur strukturierten Speicherung wird pro Produkt ein **Embedding**
über eine kombinierte Text-Repräsentation der Spezifikationen, Anwendungs-
beschreibung und Inhaltsstoffe erzeugt und in pgvector indiziert. Damit
funktioniert die semantische Ähnlichkeitssuche auch bei unscharf formulierten
Anfragen ("etwas wie Tellus 46 aber bessere Demulgierung").

### 5.6 Selbstlernender Loop

- Wird ein Substitutions-Vorschlag akzeptiert und führt zu einer abgeschlossenen
  Transaktion ohne Reklamation, erhöht das den historischen Match-Score für
  dieses Produkt-Paar.
- Reklamationen oder Rückgaben senken ihn.
- Anonymisierte Substitutions-Erfolgsstatistiken sind ein eigener Premium-
  Datensatz (siehe 6.5).

---

## 6. Value-Add und Plattform-Stickiness

### 6.0 Strategischer Grundsatz

Die Plattform muss **nach jedem einzelnen Deal mehr Wert liefern als sie
Provision kostet**. Pseudonyme und Stripe-Treuhand reichen nicht — sobald zwei
Reseller einander identifizieren, wären sie ohne Mehrwert weg. Die folgenden
Module sind nach diesem Prinzip strukturiert: jedes generiert wiederkehrenden
Nutzen, der sich nicht durch einen einzelnen Direktkontakt replizieren lässt.

Eine grobe Klassifizierung der Stickiness-Hebel:

- **Daten-Asset** — die Knowledge Base ist privat und wächst mit jedem Deal.
- **Compliance-Übernahme** — die Plattform automatisiert regulatorische
  Pflichten, die der Reseller sonst selbst erledigen müsste.
- **Operationale Bequemlichkeit** — Logistik, Beleg, Lagerlogik werden bequemer
  als die manuelle Variante.
- **Netzwerk-Effekte** — Joint Procurement, Benchmarks, Sample-Tausch.
- **Lock-in über Tooling** — ERP-Integrationen, gespeicherte Analytik,
  Vertragsvorlagen.

### 6.1 Intelligence Layer (Daten & AI)

- **Knowledge Base** mit SDS/TDS-Pipeline und CAS-/Inhaltsstoff-Analyse
  (Abschnitt 5).
- **AI-Match- und Substitutions-Engine** (Abschnitt 4.3, 5.4) mit
  Side-by-Side-Vergleich.
- **Predictive Recommendation** (4.8): proaktive Hinweise auf passende
  Listings basierend auf Such-Historie, Volumen und Saisonalität.
- **Market Scarcity Detection** (4.9): aggregierte Warnung bei
  Angebots-Engpässen.
- **AI-Procurement-Agent**: Reseller stellt eine Anforderung in natürlicher
  Sprache ("5 000 L HLP 46, Bosch-Rexroth-frei, Lieferung DACH, max
  60 Tage"), die Plattform findet passende Angebote und Alternativen, inklusive
  Outreach an passive Verkäufer.
- **Charge-/Reklamations-Datenbank**: wenn mehrere Reseller eine bestimmte
  Charge eines Herstellers als problematisch melden, wird automatisch ein
  Marktwarnsignal ausgelöst.

### 6.2 Compliance & Sicherheit als Service

Diese Funktionen sind besonders bindend, weil sie regulatorische
Pflichten des Resellers automatisieren — wer einmal damit arbeitet, will den
Aufwand nicht wieder zurück nehmen.

- **TRGS 611 Nitrosamin-Risiko-Check** für KSS: Plattform prüft beim
  Listing, ob sekundäre Amine + Nitrite gemeinsam vorkommen — kritisch für
  wassergemischte KSS — und kennzeichnet Risikoprodukte.
- **TRGS 906 / CMR-Tagging**: krebserzeugende, mutagene oder fortpflanzungs-
  gefährdende Stoffe werden klar markiert; Listings mit CMR-Stoffen erfordern
  Reseller-Bestätigung der Schulungspflicht.
- **REACH-/SVHC-Sync**: täglicher Abgleich der SVHC-Kandidatenliste; sobald
  ein gehandelter Inhaltsstoff zur Aufnahme vorgeschlagen wird, geht Alert an
  alle Reseller, die das Produkt führen.
- **ADR-Gefahrgut-Klassifikation**: automatische UN-Nummer, Klasse,
  Verpackungsgruppe, beförderungsfähige Höchstmengen; CMR-/Begleitdokumente
  werden generiert.
- **AVV-Abfallschlüssel**: jedes Produkt erhält den korrekten Abfallschlüssel
  (z. B. 13 02 05* Mineralöle ohne Halogenverbindungen), inkl. Hinweis zur
  zugelassenen Entsorgung.
- **Mischungs-/Kompatibilitäts-Alarm**: warnt vor chemisch inkompatiblen
  Mischungen im Lager (z. B. Ester-Basis + Mineralöl, PAG + PAO, biostatische
  vs. fungizide KSS).
- **OEM-Garantie-Risiko-Indikator**: warnt, wenn ein Substitut die OEM-
  Freigabe nicht trägt und damit Maschinen-Garantie gefährdet sein könnte.

### 6.3 Operations, Logistik und Lebenszyklus

- **Frachtkosten-Schätzer**: Schnittstelle zu Spediteuren (DHL Freight,
  Schenker, regionale Tankzug-Anbieter), Schätzung pro Listing und Region.
- **Bundle-Frachten**: mehrere Listings aus derselben Region werden zu einer
  optimierten Tour zusammengefasst (Plattform schlägt Käufern aktiv vor).
- **Tank- und Lagerhygiene-Empfehlung**: bei Produktwechsel im selben Tank
  generiert die Plattform eine Reinigungs-Checkliste basierend auf
  Inkompatibilitäts-Risiken.
- **QR-Charge-Tracking**: jedes Listing erhält QR-Codes für Gebinde; per
  Mobile-Scan wird Charge, Standort und Verwendung dokumentiert (auch für
  Audit).
- **Liefer-Vorhersage** pro Region und Hersteller, basierend auf
  Plattform-Transaktionshistorie.
- **Inventar-Health-Monitor**: warnt vor ablaufendem Bestand, MHD-Risiko,
  Slow-Movern; schlägt automatisch Listing oder Cross-Marketing vor.
- **Altöl-/Re-Raffinations-Marktplatz**: separater Bereich, in dem Reseller
  Altöl an zertifizierte Aufbereiter abgeben. Schließt den Kreislauf und
  bringt zusätzlichen Provisionsumsatz.

### 6.4 Financial Services

- **Stripe Split-Payment** (4.6) als Basis-Layer.
- **Sammel-Beschaffung (Joint Procurement)**: mehrere Reseller bündeln eine
  Bestellung, um MOQs großer Grundöl-Lieferanten zu erreichen; die Plattform
  vermittelt und teilt die Lieferung.
- **Working-Capital-Linie**: auf Basis der nachweisbaren Plattform-Historie
  (Umsatz, Bewertungen, Reklamationsquote) wird Reseller-spezifisches
  Vorfinanzierungs-Limit angeboten — eigener Anbieter oder Partner-Fintech.
- **Versicherungs-Bundle**: Transport- und Produkthaftungs-Versicherung pro
  Transaktion auf Knopfdruck.
- **Vorab-Sample-Käufe**: kleine Mustermengen mit Treuhand, bevor der Käufer
  die Großbestellung freigibt — reduziert Reklamationsrisiko.

### 6.5 Markt-Intelligence (Premium)

Diese Daten entstehen ausschließlich aus dem aggregierten Plattform-Verkehr und
sind extern nicht reproduzierbar.

- **Anonyme Preis-Benchmarks**: "deine Preise für HLP 46 liegen 8 % über DACH-
  Median" — als Dashboard und API.
- **Substitutions-Erfolgsstatistik**: welche Alternativen tatsächlich
  problemlos eingesetzt wurden, pro Anwendung.
- **Reformulierungs-Insights für OEM-Manufacturer**: anonymisierter Marktbedarf
  ("16 % der KSS-Anfragen wollen biostatisch und chlorfrei").
- **Verfügbarkeits-Heatmap**: pro Produktklasse und Region.
- **CO2-Footprint-Dashboard**: gewichteter Fußabdruck pro gehandelter Tonne;
  unterstützt Reseller in ESG-Reporting (Scope-3-Emissionen).

### 6.6 Lock-in über Tooling und Workflow

- **ERP-/Warenwirtschafts-Integration** (TecCom, SAP, Sage, Lexware): Listings,
  Eingangs- und Ausgangsbestände werden automatisch synchronisiert. Sobald
  einmal integriert, steigt die Wechsel-Hürde drastisch.
- **Vertrags-Templates**: vorgefertigte Lieferverträge für wiederkehrende
  Geschäfte mit Preisgleitklauseln, INCOTERMS, Force-Majeure-Optionen
  (Iran/Hormuz spezifisch); jeder Vertrag wird Plattform-versioniert.
- **API für Eigenkunden des Resellers**: der Reseller kann seinen eigenen
  Endkunden eine White-Label-Bestandsabfrage über die Plattform-API anbieten.
- **Saved-Search mit AI-Watch**: hinterlegte Suchanfragen, die im Hintergrund
  weiterlaufen und proaktiv melden.
- **Reseller-Analytik**: persönliche Umsatz-/Margen-Auswertung, die nur über
  die Plattform verfügbar bleibt.
- **Schulungs- und Zertifizierungs-Programm**: Plattform bietet
  „Verified Lubricant Trader"-Zertifikate über Online-Schulungen (TRGS, ADR,
  OEM-Spezifika); die Zertifikate werden im Profil sichtbar und sind im
  Sucharanking-Faktor.

### 6.7 Anti-Leakage-Mechaniken

Mehrschichtiger Schutz gegen Plattform-Bypass — als Ergänzung zu den
inhaltlichen Hebeln 6.1–6.6:

1. **Pseudonyme** verhindern, dass Reseller die echte Gegenpartei kennen
   (Abschnitt 3, 4.5).
2. **AI-Nachrichten-Filter** entfernt Kontaktdaten aus In-Platform-Chat
   (4.5).
3. **Stripe-Treuhand** macht On-Platform-Abwicklung reibungsärmer als manuelle
   Abwicklung (4.6).
4. **Revenue-Threshold-Unlock**: Erst nach z. B. 50 000 € kumulierter
   Transaktionssumme mit einer bestimmten Gegenpartei wird ein
   „Direkt-Kontakt-Button" freigeschaltet, mit dem die Pseudonymität
   beidseitig aufgehoben werden kann.
5. **Loyalitäts-Provision**: Reseller, die kontinuierlich on-platform
   abwickeln, erhalten reduzierte Provision (z. B. 8 % statt 10 % ab dem
   25. Deal/Jahr).
6. **Mehrwert-Lock-in**: jede der Funktionen aus 6.1–6.6 erzeugt einen
   Komfort- oder Compliance-Vorteil, der bei Bypass verloren geht. Das ist
   der eigentliche Anti-Leakage-Schutz — alles andere wäre kosmetisch.

---

## 7. Technologie-Stack

| Komponente | Technologie |
|---|---|
| Backend & Web-Frontend | Next.js (App Router, TypeScript) |
| Datenbank | PostgreSQL 16 + pgvector |
| ORM | Prisma |
| Auth | NextAuth.js |
| Payments | Stripe Connect (Split Payments) |
| Mobile App | React Native (Expo) |
| Computer Vision (Label-Scan) | Google ML Kit (on-device) |
| AI Matching / Chat-Filter | Anthropic API (Claude) |
| Hosting (Prototyp) | Netlify oder Vercel + Managed Postgres (Neon / Supabase) |
| Repo | GitHub, briscosystems/marketplace |

---

## 8. Sicherheit und Compliance

- DSGVO-konform: Datenminimierung, Auskunfts- und Löschrechte, Auftragsverarbeitungsverträge mit Stripe und Hosting.
- PCI-DSS: keine Speicherung von Kartendaten auf Plattform-Seite (Stripe übernimmt).
- Verschlüsselung at-rest (Postgres) und in-transit (TLS).
- Audit-Logs für alle finanziellen Transaktionen und Admin-Aktionen.
- Rate-Limiting und Bot-Schutz auf öffentlichen Endpoints.

---

## 9. Testszenario für Prototyp

- Zwei pseudonyme Test-Reseller (z.B. „Alpha-Trader" und „Beta-Trader") mit Stripe-Test-Mode-Accounts.
- Drei realistische Produkt-Listings (Shell Tellus, Fuchs Renolin, Mobil DTE).
- Vollständiger Flow auf zwei realen Smartphones via Expo Go:
  1. Reseller Alpha listet Bestand per Foto-Scan.
  2. Reseller Beta sucht Produkt, erhält Direktmatch und einen AI-Alternative-Vorschlag.
  3. In-Platform-Chat zwischen Alpha und Beta (mit AI-Filter aktiv).
  4. Stripe-Test-Payment mit Split.
  5. Bewertung nach Transaktion.
- Web-Admin-Dashboard zeigt Transaktion, Provision und Reputation-Update.

---

## 10. Roadmap (vorläufig)

| Phase | Inhalt | Zielzeitraum |
|---|---|---|
| **Phase 1 — Prototyp** | Kernfunktionen 4.1–4.6, zwei Reseller-Testflows, mobile App via Expo | Woche 1–2 |
| **Phase 2 — Ratings, Recommendations, KB-Seed** | 4.7–4.8, erste 200–500 Produkte in der Knowledge Base mit SDS-/TDS-Ingest (Top-Marken) | Woche 3–4 |
| **Phase 3 — Vergleichs-Engine & Scarcity** | 4.9, Side-by-Side-Vergleich (5.4) lauffähig, UI-Politur, erste Pilot-Reseller | Woche 5–6 |
| **Phase 4 — Compliance-Module** | TRGS 611, REACH-Sync, ADR-/AVV-Generator (6.2), Onboarding 5–10 Pilot-Reseller | Monat 2 |
| **Phase 5 — Markt-Intelligence & Lock-in** | Preis-Benchmarks, Substitutions-Statistik, ERP-Integrationen (6.5, 6.6) | Monat 3 |
| **Phase 6 — Skalierung** | Multi-Language (EN/DE/FR/IT), Joint Procurement, Working-Capital-Pilot, Altöl-Marktplatz, OEM-Funktionen ausbauen | Monat 4+ |

---

## 11. Offene Punkte

- Endgültige Revenue-Threshold-Werte für Direktkontakt-Unlock (6.7) und
  Loyalitäts-Provisions-Staffelung.
- Tier-System für Premium-Features (Markt-Intelligence aus 6.5) — vorerst
  nicht im Prototyp; Preismodell separat zu klären.
- **Datenblatt-Akquise-Strategie**: rechtliche Klärung des Crawlings öffentlicher
  Hersteller-Portale für SDS/TDS; Pflicht-Upload durch Reseller wird gesetzt,
  aber Initial-Befüllung der Knowledge Base braucht zusätzliche Quelle (Kauf
  einer kommerziellen Datenbank, z. B. Chemwatch / SDS-Manager / KVU, prüfen).
- **OCR-/LLM-Extraktor**: Auswahl zwischen AWS Textract + Claude, Azure
  Document Intelligence, oder spezialisierten SDS-Parsing-Tools (z. B.
  SDSdatabase oder SAP EHS). Pilot mit 50 Datenblättern in Phase 2.
- Logistik-/Spediteur-Integration für automatische Versandkostenschätzung
  (6.3) — eigene Iteration in Phase 3 oder 4.
- ERP-Integrationen (6.6) — beginnend mit TecCom, da im DACH-Reseller-Markt
  weit verbreitet.
- Joint-Procurement-Mechanik (6.4) — rechtliche Klärung (Kartellrecht bei
  gemeinsamer Beschaffung) vor Pilotbetrieb.
- Working-Capital-Linie (6.4) — eigene Lizenz (Zahlungsdienst/Kreditvermittlung)
  oder Partner-Fintech (Banxware, Mondu, Billie)?
- CO2-Footprint-Datenbasis (6.5) — Quelle für emissions-faktoren pro Grundöl-
  Gruppe (DEFRA / GEMIS / GREET / hersteller-eigene Angaben).
- Mehrsprachigkeit der UI — initial DE, EN folgt; FR/IT mit Phase 6.
- Mandantenfähigkeit für größere Reseller-Gruppen — Phase 6 oder später.

---

# Teil B — UX & Marketplace-Patterns (v0.2-Erweiterung)

> Eingearbeitet aus der ursprünglich separaten Datei `FSD_UX_Extension_v0.2.md`
> vom 2026-05-17. Ergänzt FDS-Teil A um UX- und Feature-Patterns aus
> Best-in-Class-Marktplätzen (Alibaba, Faire, Amazon Business, eBay, Vinted).

## B.1 Zusatz-Features

### B.1.1 RFQ-Modul (Request for Quotation)

**Beschreibung:** Inverses Suchmodell. Reseller posten ihren Bedarf öffentlich, andere Reseller und OEM-Hersteller reichen Angebote ein.

**Begründung:** Bei akuten Lieferengpässen ist das aktive Suchen nach Listings ineffizient. RFQ kehrt den Flow um — der Markt kommt zum Käufer.

**Funktionsumfang:**
- RFQ-Erstellung mit: Produkttyp, gewünschter Hersteller (optional), ISO-VG, Menge, Lieferregion, Zieltermin, Budget-Range (optional), Notizen.
- Sichtbarkeit: alle relevanten Reseller und OEM-Hersteller (gefiltert nach Produktkategorie und Region).
- Angebotsabgabe pro Anbieter: Preis, Menge, Lieferzeit, Anmerkungen, optional Alternativvorschlag mit Begründung.
- RFQ-Status: offen / Angebote eingegangen / akzeptiert / abgelaufen / abgebrochen.
- Automatische Schließung nach Zieltermin oder bei Annahme.
- Reseller kann beim Anlegen wählen: "öffentlich" (alle sehen es) oder "nur Verified Partner" (nur höhere Trust-Tiers).
- Provision auf RFQ-Abschluss identisch zu regulärem Listing-Sale: 10 %.

### B.1.2 Trust-Tier-System

**Beschreibung:** Mehrstufiges Vertrauens-Badging, ergänzend zum bestehenden 5-Sterne-Rating.

**Tier-Definition:**

| Tier | Voraussetzung | Anzeige |
|---|---|---|
| **Unverified** | Neu registriert, USt-ID hinterlegt aber nicht geprüft | Kein Badge |
| **Verified Reseller** | USt-ID geprüft, Firmenadresse bestätigt, mind. 1 Transaktion abgeschlossen | Badge "Verified" (blau) |
| **Trade-Assured** | Mind. 10 abgeschlossene Transaktionen, Rating ≥ 4.2, keine offenen Disputes | Badge "Trade-Assured" (grün) |
| **Premium Partner** | Mind. 50.000 € kumulierter Umsatz, Rating ≥ 4.5, mind. 6 Monate aktiv | Badge "Premium" (gold) |

**Auswirkung:**
- Höhere Tiers haben bessere Sichtbarkeit in Suche und Empfehlungen (Ranking-Boost).
- "Premium Partner" können RFQs ausschließlich für Verified+ Partner posten.
- Tier wird automatisch berechnet und nightly aktualisiert.
- Tier-Verlust möglich bei Rating-Drop oder Dispute-Häufung.

### B.1.3 Anonymes Bewertungssystem

**Ergänzung zum bestehenden 5-Sterne-System:**
- Bewertungen sind pseudonym, aber die Pseudonyme sind dauerhaft (gleicher Reseller = gleiches Pseudonym).
- Bewertungen können nur nach abgeschlossener Transaktion abgegeben werden.
- Aggregierte Metriken pro Reseller-Profil: Transaktionsanzahl, Ø Rating, Antwortzeit (Median in Chat), Versandzeit (Median).
- Bewertungs-Tags zur schnellen Orientierung: "Schnelle Antwort", "Qualität wie beschrieben", "Pünktliche Lieferung", "Faire Verhandlung".

---

## B.2 UX-Prinzipien (verbindlich für Implementierung)

### B.2.1 Progressive Disclosure

Komplexität erst zeigen, wenn der User sie benötigt.
- Listing-Erstellung in Schritten (Wizard): Basisdaten → Technische Specs → Verpackung & Versand → Preis → Veröffentlichen.
- Erweiterte Filter im Suchformular standardmäßig eingeklappt.
- Admin-Funktionen pro Rolle separat erreichbar.

### B.2.2 Frontloading kritischer Informationen

Auf jeder Listing-Karte (Suchergebnis) müssen ohne Klick sichtbar sein:
- Produktname und Hersteller (oder OEM-Brand)
- ISO-VG / Kernspezifikation
- Verfügbare Menge
- Preis oder "auf Anfrage"
- Lagerregion
- Mindestabnahmemenge
- Versandkondition (Pickup / Lieferung / verhandelbar)
- Verkäufer-Pseudonym mit Trust-Badge und Sterne-Rating

### B.2.3 Performance-Anforderungen

- Suchergebnisse: ≤ 2 Sekunden Antwortzeit (P95)
- Skeleton-Loading-States überall, wo Daten asynchron geladen werden
- Bilder: WebP, lazy-loading, CDN-cached
- Mobile-App: Offline-Cache für letzte 100 angesehene Listings

### B.2.4 Mobile-Navigation

**Bottom-Bar mit 5 Tabs (in dieser Reihenfolge):**
1. **Suche** — Listings durchsuchen
2. **RFQ** — Anfragen erstellen / Angebote abgeben
3. **Chat** — Konversationen
4. **Mein Bestand** — eigene Listings, Verkäufe, Käufe
5. **Profil** — Account, Einstellungen, Trust-Status

Top-Bar pro Screen: Kontext-Titel + Such-Icon + Notification-Badge.

### B.2.5 Detail-Ansichten als Side-Panel

Auf Desktop: Klick auf Listing öffnet rechtes Side-Panel mit allen Details. Liste bleibt links sichtbar. Mobile: Vollbild-Ansicht mit Back-Geste.

Vorteil: Schnelles Browsen durch viele Listings, ohne Navigation neu aufzubauen.

### B.2.6 Inline-Editing

Reseller können auf eigenen Listings direkt aus der Listenansicht heraus folgende Felder editieren:
- Verfügbare Menge
- Preis
- Status (aktiv / pausiert / verkauft)

Kein Sprung in Edit-Seite nötig — Click-to-edit oder Stepper-Controls.

### B.2.7 Design-Konsistenz

- **Farbcodes** plattformweit konstant:
  - Rot: Fehler, kritische Warnungen, abgelehnte Aktionen
  - Grün: Erfolg, Verfügbarkeit, abgeschlossene Transaktion
  - Gelb/Orange: Warnung, niedriger Bestand, ablaufende Frist
  - Blau: Information, neue Mitteilung, Verified-Status
  - Gold: Premium-Status
- **Card-Pattern** identisch für Listings, RFQs und Reseller-Profile (gleiche Hierarchie, gleicher Whitespace).
- **Icons** durchgehend aus einer Library (vorzugsweise Lucide).

### B.2.8 Anticipatory Design

Die Startseite (Dashboard) zeigt nicht eine leere Suchmaske, sondern AI-priorisierten Inhalt:
- "Neue Listings, die zu deinem Bestand passen"
- "Offene RFQs in deiner Kategorie"
- "Scarcity-Alert: 3 Produkte aus deinem Portfolio sind aktuell stark nachgefragt"
- "Du hast eine ungelesene Nachricht von [Pseudonym]"

---

## B.3 Komponenten-Liste für UI-Library

Konkret zu bauende wiederverwendbare React-Komponenten:

| Komponente | Zweck |
|---|---|
| `ListingCard` | Listing-Vorschau mit Frontload-Infos |
| `RFQCard` | RFQ-Vorschau mit Status und Angebots-Counter |
| `TrustBadge` | Visualisiert Tier (Unverified / Verified / Trade-Assured / Premium) |
| `RatingDisplay` | Sterne + Transaktionsanzahl + Tag-Pills |
| `ProductSpecGrid` | Strukturierte Anzeige technischer Specs |
| `QuickEditField` | Inline-editierbares Feld mit Speichern-Indikator |
| `SkeletonLoader` | Platzhalter für ladende Daten |
| `BottomNavBar` | Mobile Hauptnavigation |
| `DetailSidePanel` | Desktop-Side-Panel für Detail-Views |
| `ChatBubble` | Chat-Nachricht mit AI-Filter-Markierung bei maskierten Inhalten |
| `ScarcityAlert` | Banner für Markt-Knappheits-Warnungen |
| `AlternativeSuggestion` | AI-Vorschlag eines alternativen Produkts mit Begründung |

---

## B.4 Erweiterte User-Flows

### B.4.1 RFQ-Flow

1. Reseller A öffnet App → Tab "RFQ" → "Neue Anfrage".
2. Wizard: Produkttyp → Spezifikation → Menge → Region → Frist → Sichtbarkeit (öffentlich / Verified+).
3. RFQ wird veröffentlicht, passende Reseller/OEMs erhalten Push-Notification.
4. Angebote treffen ein, Reseller A sieht Liste mit Trust-Badge, Rating, Preis, Lieferzeit.
5. Annahme eines Angebots → Stripe-Checkout → Split-Payment → Chat öffnet sich automatisch.

### B.4.2 Foto-Scan-Flow (Mobile)

1. Reseller im Lager → App → Kamera-Icon (FAB auf Suche-Tab).
2. Foto vom Fass-Etikett.
3. ML Kit erkennt Text/Logos lokal → Vorschlag "Shell Tellus S2 MA 32?" mit Confidence-Score.
4. Reseller bestätigt oder korrigiert.
5. Direkter Sprung zu: "Listing erstellen" (verkaufen) oder "Suchen" (kaufen).

### B.4.3 Anti-Leakage-Flow (Chat)

1. Reseller B schreibt: "Ruf mich an unter 0664..."
2. AI-Filter ersetzt Telefonnummer mit `[Kontaktdaten entfernt]` und zeigt beiden Parteien Hinweis.
3. Bei wiederholten Versuchen Eskalation: Warnung an User, Admin-Notification, mögliche Trust-Tier-Herabstufung.
4. Erst ab kumuliertem Umsatz ≥ 50.000 € (zwischen denselben zwei Parteien): Button "Direktkontakt freischalten" wird sichtbar.

---

## B.5 Akzeptanzkriterien für Prototyp

Diese Erweiterung gilt als implementiert, wenn:

- [ ] RFQ-Modul vollständig funktional (Erstellen, Angebote abgeben, Annehmen, Stripe-Abschluss)
- [ ] Trust-Tier-Berechnung läuft als Background-Job und zeigt sich in der UI
- [ ] Bottom-Bar-Navigation auf Mobile mit 5 Tabs
- [ ] Listing-Cards zeigen alle Frontload-Felder
- [ ] Side-Panel-Detail-View auf Desktop
- [ ] Inline-Edit auf eigenen Listings
- [ ] Skeleton-Loader bei allen asynchronen Datenladevorgängen
- [ ] AI-Filter im Chat blockiert Telefonnummern, E-Mails, URLs
- [ ] Dashboard zeigt anticipatory Inhalte statt leerer Suchmaske
- [ ] UI-Komponenten konsistent in Farbcodes und Iconographie

---

## B.6 Nicht-Ziele (bewusst NICHT in dieser Erweiterung)

- Livestream-Feature (Alibaba-Style Fabrik-Touren) — Phase 3 oder später
- Mehrsprachigkeit über DE/EN hinaus — Phase 3
- BNPL-Integration (Klarna o.ä.) — Phase 3
- Logistik-API für automatische Versandkostenschätzung — Phase 2
- Subscription-Tiers für Reseller — vorerst nicht
- Auktions-Modell (eBay-Style) — nicht im Scope

---

# Teil C — Erweiterung v0.3 (Stand 2026-06-22)

> Dieser Teil wird **laufend** mit jeder umgesetzten Funktion fortgeschrieben
> (Dauerauftrag) und zusammen mit dem Code nach GitHub gepusht.

## C.0 Kernfunktionen & Positionierung (verbindlich)

Drei Zielgruppen, die bei jeder Änderung berücksichtigt werden:

1. **Reseller** — verkaufen ↔ kaufen (Angebote/Anfragen, Anbieten/Suchen).
2. **Hersteller** — vergleichen und Rating durch Beiträge beeinflussen.
3. **Endkunden** — Alternativen suchen und Preisentwicklung sehen.

**Die Plattform bleibt nutzersichtbar neutral.** Bezahlte Einflussnahme auf das
Ranking ist ausschließlich intern und für Nutzer nicht erkennbar (siehe C.2).

## C.1 Startseite

- Zielgruppen-Header: „Für Reseller, Endkunden & Hersteller".
- „Anbieten"-Karte zeigt ein Ölfässer-Bild (`components/OilBarrels.tsx`) statt des
  früheren 📦-Emojis.
- Der nutzersichtbare Hinweis „10 % Plattform-Provision" wurde von der Startseite
  entfernt (Provisionslogik bleibt im Geschäftsmodell, wird aber nicht beworben).

## C.2 Internes Sichtbarkeits-Ranking (NUR Eigentümer/Superadmin)

- Feld `User.searchBoost` (Int 0–100, Default 0). Wird **nie** an öffentliche UI/API
  ausgegeben.
- Suche & Vorschläge (`/listings`, Startseiten-Vorschläge) sortieren primär nach
  `searchBoost` (absteigend), dann nach Datum.
- Steuerung über `/admin` (nur Rolle `ADMIN`, sonst 404). Admin-Link nur für ADMIN
  in der Navigation. Eigentümer-Konto: `jgosch@brisco.ch` (Rolle ADMIN).
- Vorbild: Booking.com (Preferred Partner) / Alibaba (Gold Supplier) — bezahlte Stufe
  hebt Sichtbarkeit, ohne einzelne Treffer als „Anzeige" zu markieren.
- **Compliance-Hinweis:** EU-P2B-Verordnung 2019/1150 verlangt Offenlegung, ob
  Bezahlung das Ranking beeinflusst; CH-UWG zu verdeckter Werbung beachten. Bei
  Bedarf späterer, unauffälliger AGB-/„So funktioniert die Reihenfolge"-Hinweis.

## C.3 KSS-Finder — Such-Erweiterungen für Endkunden

- **„Weiß nicht"-Option** bei Bearbeitungsverfahren, Werkstoffe, Kritische Punkte
  und Zertifizierungen (exklusiver Chip) sowie bei Produktionsart („Weiß nicht"-Radio).
  Viele Endkunden kennen ihre Bearbeitung/Werkstoffe/Freigaben nicht. Wirkt nicht als
  Filter, signalisiert der KI aber Unsicherheit (`unsureDimensions`).
- **Freitext-Feld** bei „Kritische Punkte": eigenes/spezielles Problem in Worten.
- **KI-Analyse & Alternativen** (`components/KssAiAnalysis.tsx`): wertet Freitext +
  Filter über `/api/kss-wizard` aus. Die KI analysiert die Schilderung **kritisch**
  (wahrscheinliche Ursachen, ehrlicher Hinweis wenn es kein KSS-Problem ist) und
  schlägt Alternativen aus dem Katalog vor; Heuristik-Fallback ohne API-Key.
- **Marktpreis-Schieber** (`components/PriceRangeSlider.tsx`): kompakter
  Doppel-Regler statt zweier Zahlenfelder → geringere Höhe. Voller Bereich
  (0 … 50 €) = kein Preisfilter.

---

*Dieses Dokument ist die initiale Grundlage. Es wird mit Fortschritt des Projekts weiter verfeinert.*
