# Brisco Marketplace — Technische Spezifikation (Bauanleitung)

> **Zweck dieses Dokuments.** Diese Spezifikation beschreibt das **tatsächlich implementierte**
> System so vollständig und präzise, dass ein anderes Team (oder eine KI) die Plattform allein
> anhand dieser Beschreibung **1:1 neu aufbauen** könnte — Datenmodell, Auth, alle Seiten und
> API-Routen, die KI-Features, Zahlungs-/Käuferschutz-Flow, Mehrsprachigkeit, Design und die
> Deploy-/Persistenz-Architektur.
>
> **Abgrenzung zu den anderen Dokumenten:**
> - `FDS.md` ist die *funktionale Vision* (enthält auch Nicht-Gebautes wie native Mobile-App,
>   Vektor-Embeddings, selbstlernenden Loop). Sie beschreibt das *Warum* und *Wohin*.
> - `README.md` ist Kurzstatus + Schnellstart, `CLAUDE.md` die Arbeitsanweisung für die KI.
> - **Dieses Dokument beschreibt das *Ist*** — die reale Codebasis. Bei Widerspruch zwischen
>   Vision und Code gilt hier immer der Code.

## Wie dieses Dokument zu lesen ist
Die Abschnitte sind so geschnitten, dass man sie in dieser Reihenfolge implementieren kann:
Fundament (Tech-Stack, Datenmodell, Auth) → Fachlogik (Marktplatz, Wissensbasis, KI) →
Oberfläche (Seiten, API, i18n, Design) → Betrieb (Infrastruktur/Deploy). Querverweise
(„→ siehe Abschnitt X") vermeiden Doppelungen.

## Inhaltsverzeichnis
1. Überblick, Zielgruppen & Technologie-Stack
2. Datenmodell (Prisma-Schema)
3. Authentifizierung, Rollen, Vertrauen, Mitgliedschaft, Trial, Credits
4. Marktplatz: Anbieten, Suchen, Chat, Transaktionen, Käuferschutz
5. Wissensbasis: Hersteller, Produkte, SDS, Preise, Praxis-Probleme, Materialien
6. KI-Features (Claude/Anthropic-Integration)
7. Seiten & Navigation (App-Router)
8. API-Routen
9. Mehrsprachigkeit (i18n: DE/EN/NL)
10. UI, Design-System & Komponenten
11. Infrastruktur, Deploy, Persistenz, E-Mail, Konfiguration

## Durchgängige Konventionen (gelten überall)
- **Sprache im Produkt:** Repo, UI, Schema-Kommentare und Seed-Daten sind durchgängig **deutsch**.
- **Wortlaut:** Angebote heißen im UI **„Anbieten"** (blau), Anfragen **„Suchen"** (amber) —
  niemals „Listings"/„RFQs" in nutzersichtbarem Text. Käuferschutz nie „Treuhand"/„Escrow".
  „Tank" statt „Sumpf" (Terminologie KSS).
- **Datenbank-Migrationen:** ausschließlich `prisma db push` — **keine** Migrationsdateien/-historie.
- **Daten-Änderungen für die Live-Umgebung** gehören idempotent in `prisma/deploy-tasks.ts`
  (Details → Abschnitt 11).
- **Pfad-Alias:** `@/*` zeigt auf den Repo-Root.
- **Vor Änderungen an Claude-/Anthropic-Modellcode** die `claude-api`-Skill konsultieren, statt
  sich bei Modell-IDs/Parametern auf das Gedächtnis zu verlassen (→ Abschnitt 6).

---

## 1. Überblick, Zielgruppen & Technologie-Stack

### 1.1 Zweck & Positionierung
Brisco Marketplace ist ein **neutraler B2B-Marktplatz** für Industrieöle, Kühlschmierstoffe (KSS)
und Schmierstoffe. Er verbindet Angebot und Nachfrage pseudonym und legt darüber eine
**Wissensbasis** (Herstellerkataloge, Sicherheitsdatenblätter, Praxis-Probleme, Werkstoff-
Verträglichkeit) plus **KI-Beratung**. Die Plattform ist bewusst **anbieterneutral** — sie
gehört keinem Hersteller und läuft daher unter eigener Adresse (markt.brisco.ch), nicht unter
der Domain eines Werbekunden.

### 1.2 Zielgruppen
| Gruppe | Rolle im System | Nutzen |
|---|---|---|
| **Reseller / Händler** | `role = RESELLER` | Restposten/Bestände anbieten, Bedarf decken |
| **Hersteller / OEM** | `role = OEM` | Marken-Schaufenster, Werbung, Absatz |
| **Endkunden / Einkäufer** | (Käuferseite) | Suchen, vergleichen, KI-Beratung, Käuferschutz |
| **Betreiber** | `role = ADMIN` | interne Konsole (Monetarisierung, Sichtbarkeit, KI-Kosten) |

Die Plattform bleibt in der Vermittlung **neutral**; Sichtbarkeit wird über Vertrauensstufen
(`trustTier`) und bezahlte Platzierungen gesteuert, nicht über Bevorzugung einzelner Marken.

### 1.3 Technologie-Stack (exakte Versionen aus `package.json`)
| Bereich | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | `^16.2.6` |
| UI-Runtime | React / React-DOM | `19.0.0` |
| Sprache | TypeScript | `^5.7.2` |
| Datenbank | PostgreSQL | 16 |
| ORM | Prisma / @prisma/client | `^6.1.0` |
| Auth | NextAuth | `^4.24.11` (JWT-Sessions) |
| Passwort-Hashing | bcryptjs | `^2.4.3` |
| KI | @anthropic-ai/sdk | `^0.96.0` |
| Zahlung | stripe | `^22.2.2` |
| E-Mail | nodemailer (SMTP lokal) + ZeptoMail-HTTPS (live) | `^7.0.13` |
| Styling | Tailwind CSS | `^3.4.17` |
| Icons | lucide-react | `^1.16.0` |
| Validierung | zod | `^3.24.1` |
| Script-Runner | tsx | `^4.19.2` |

Es ist **kein Test-Runner** konfiguriert — Verifikation läuft manuell (Klick-Pfad in `README.md`).
Es gibt **keine `middleware.ts`** — Auth wird pro Route/Seite durchgesetzt (→ Abschnitt 7/8).

### 1.4 Architektur in zwei Konzept-Ebenen
Das Schema (und damit die Fachlogik) trennt sauber zwei Welten, die über `User`, `Product` und
`Manufacturer` verbunden sind:

```
  ┌─────────────────────────── MARKTPLATZ-TRANSAKTIONEN ───────────────────────────┐
  │  User ──┬── Listing (Angebote/„Anbieten")                                       │
  │         └── Rfq (Anfragen/„Suchen") ── RfqOffer                                 │
  │                       │                                                          │
  │        Angebot annehmen → Conversation/Message (pseudonym) + Transaction        │
  │                       │                                                          │
  │                    Review (Bewertung)          Stripe (Käuferschutz)            │
  └─────────────────────────────────────────────────────────────────────────────────┘
                                     │  (Produktbezug)
  ┌──────────────────────────────── WISSENSBASIS ──────────────────────────────────┐
  │  Manufacturer ── Product-Katalog                                                │
  │        ├── SafetyDataSheet (SDS: GHS/REACH/physikochemisch)                     │
  │        ├── PriceObservation (indikative Richtwerte, Demo-Seed)                  │
  │        ├── ProductIssue (reale Praxis-Probleme aus Foren/Herstellern)           │
  │        └── Material × Ingredient × IngredientMaterialCompatibility (Matrix)     │
  └─────────────────────────────────────────────────────────────────────────────────┘
                Darüber: KI-Layer (KSS-Wizard, Berater, Vergleich, Alternativen)
```

Details je Ebene: → Abschnitt 4 (Marktplatz), → Abschnitt 5 (Wissensbasis), → Abschnitt 6 (KI).

### 1.5 Verzeichnisstruktur (Repo-Root)
| Pfad | Inhalt |
|---|---|
| `app/` | Next.js App-Router: Seiten (`**/page.tsx`, 41) + API-Routen (`api/**/route.ts`, 49) + `layout.tsx` |
| `components/` | ~80 React-Komponenten (Layout, Karten, Vergleich, KI-Dialoge, Charts, Badges …) |
| `lib/` | ~48 Utilities (auth, prisma, i18n, credits, price-aggregation, mailer, ai-usage, sds-parser …) |
| `prisma/` | `schema.prisma`, `seed.ts`, `deploy-tasks.ts`, Datenkorrektur-Skripte |
| `scripts/` | Container-/Session-Workflow (`start.sh` u.a.), Backup/Snapshot |
| `public/` | statische Assets (Logos, Bilder) |
| `types/` | TypeScript-Typ-Ergänzungen (u.a. NextAuth-Session) |

Der genaue Aufbau jeder Ebene folgt in den jeweiligen Abschnitten.

---

## 2. Datenmodell (Prisma-Schema)

Quelle: `prisma/schema.prisma` (~1332 Zeilen). Generator `prisma-client-js`, Datasource
`postgresql` über `env("DATABASE_URL")`. Alle IDs sind `String @id @default(cuid())`,
sofern nicht anders vermerkt. Migrationsstrategie: **`prisma db push` (KEINE
Migrationsdateien)** — Schema wird direkt in die DB geschoben (Details → Ende dieses
Abschnitts).

### 2.1 Zwei Konzept-Ebenen

Das Schema trägt zwei fachlich getrennte, über `User` und `Manufacturer`/`Product`
verbundene Ebenen:

1. **Marktplatz-Transaktionen (Handel).** `User` erstellt `Listing` (Angebote — UI-Wort
   „Anbieten", blau) oder `Rfq` (Anfragen — UI-Wort „Suchen", amber) mit `RfqOffer`
   (Geboten). Das Annehmen eines Angebots öffnet einen `Conversation`/`Message`-Thread
   und erzeugt eine `Transaction`, die per `Review` bewertbar ist. Optionaler
   **Käuferschutz** (bewusst NICHT „Treuhand"/„Escrow") hängt über `ProtectionStatus`
   und `stripeProtection*`-Felder an `Transaction`. Monetarisierung: `Payment`,
   `CreditTransaction`, `ReferralCode(+Redemption)`, `EmailLog`, `AppSetting`,
   `AdBanner`.

2. **Wissensbasis (Katalog & Chemie).** `Manufacturer` → `Product`-Katalog,
   `SafetyDataSheet` (SDS) mit stark geparsten GHS-/REACH-/physikochemischen Feldern,
   `PriceObservation` (crowdsourced + aus Transaktionen abgeleitete Marktpreise),
   `ProductIssue` (reale Praxis-Probleme), Werkstoff-Hinweise
   (`MaterialCompatibilityNote`) und die Dichtungs-/Kunststoff-Verträglichkeitsmatrix
   `Material` × `Ingredient` × `IngredientMaterialCompatibility`. `ComparisonAnalysis`
   cached KI-Vergleiche.

**Brücken zwischen den Ebenen:** `Listing.manufacturerId` → `Manufacturer`,
`Listing.sdsId` → `SafetyDataSheet`, `Product.safetyDataSheetId` → `SafetyDataSheet`,
`PriceObservation.transactionId` (leitet Preis aus abgeschlossener Transaktion ab),
`User.brandManufacturerId` (Marke-Stufe vertritt einen Hersteller).

### 2.2 Enums (vollständig)

| Enum | Werte | Verwendung |
|---|---|---|
| `UserRole` | `RESELLER`, `OEM`, `ENDKUNDE`, `ADMIN` | `User.role` (Default `RESELLER`) |
| `UserTrustTier` | `UNVERIFIED`, `VERIFIED`, `TRADE_ASSURED`, `PREMIUM`, `DIAMOND` | `User.trustTier` (Default `UNVERIFIED`); steuert Sichtbarkeit |
| `MembershipTier` | `BASIS`, `PRO`, `MARKE` | bezahlte Abo-Stufe; `User.membershipTier` (nullable). BASIS=Reseller-Einstieg, PRO=aktive Händler, MARKE=OEM/Schaufenster |
| `ListingStatus` | `ACTIVE`, `PAUSED`, `SOLD`, `ARCHIVED` | `Listing.status` (Default `ACTIVE`) |
| `RfqStatus` | `OPEN`, `ACCEPTED`, `EXPIRED`, `CANCELED` | `Rfq.status` (Default `OPEN`) |
| `RfqVisibility` | `PUBLIC`, `VERIFIED_ONLY` | `Rfq.visibility` (Default `PUBLIC`) |
| `RfqOfferStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `WITHDRAWN` | `RfqOffer.status` (Default `PENDING`) |
| `TransactionStatus` | `PENDING`, `SHIPPED`, `COMPLETED`, `CANCELED`, `DISPUTED` | `Transaction.status` (Default `PENDING`) |
| `ProtectionStatus` | `NONE`, `PENDING_PAYMENT`, `HELD`, `RELEASED`, `REFUNDED`, `DISPUTED` | Käuferschutz-Ablauf; `Transaction.protectionStatus` (Default `NONE`) |
| `ReviewTag` | `FAST_RESPONSE`, `QUALITY_AS_DESCRIBED`, `ON_TIME_DELIVERY`, `FAIR_NEGOTIATION` | `Review.tags[]` |
| `ChemistryBase` | `MINERAL`, `SYNTHETIC`, `SEMI_SYNTHETIC`, `ESTER`, `PAG`, `OTHER` | Öl-/KSS-Chemie; `Listing`, `Product`, `Rfq` |
| `ProductionType` | `CONTRACT_MANUFACTURING`, `SERIAL_PRODUCTION`, `MIXED` | `Product.productionType` (Lohnfertigung vs. Serie) |
| `CoolantConcentrateForm` | `CONVENTIONAL_EMULSION`, `SEMI_SYNTHETIC`, `FULL_SYNTHETIC`, `TWO_COMPONENT` | `Product.concentrateForm` (milchig vs. klar) |
| `PackagingForm` | `DRUM`, `IBC`, `TANK`, `CANISTER`, `BULK`, `OTHER` | Gebinde; `Listing`, `PriceObservation`. „TANK", nie „Sumpf" |
| `SdsCategory` | `WATER_MISCIBLE_COOLANT`, `NEAT_CUTTING_OIL`, `GRINDING_OIL`, `HYDRAULIC_OIL`, `GEAR_OIL`, `MOTOR_OIL`, `GREASE`, `OTHER` | `SafetyDataSheet.category` |
| `SdsLanguage` | `DE`, `EN`, `FR`, `IT`, `OTHER` | `SafetyDataSheet.language` (Default `DE`), `ProductIssue.language` |
| `ProductCategory` | `COOLANT_WATER_MIX`, `COOLANT_NEAT`, `GRINDING_OIL`, `EDM_FLUID`, `HYDRAULIC_OIL`, `GEAR_OIL`, `COMPRESSOR_OIL`, `SLIDEWAY_OIL`, `FORMING_OIL`, `CLEANER`, `CORROSION_PROTECTION`, `GREASE`, `SPECIALTY`, `ADDITIVE`, `OTHER` | `Product.category` |
| `MaterialCompatibility` | `RECOMMENDED`, `COMPATIBLE`, `CAUTION`, `UNSUITABLE` | Werkstoff-/Inhaltsstoff-Bewertung |
| `BusinessFocus` | `COOLANT`, `NEAT_OIL`, `LUBRICANT`, `GREASE`, `CLEANER`, `CORROSION_PROTECTION`, `CHEMICAL_SUPPLIER`, `ADDITIVE` | `Manufacturer.businessFocus[]` |
| `MaterialCategory` | `ELASTOMER`, `THERMOPLASTIC`, `THERMOSET`, `METAL`, `COATING` | `Material.category` |
| `IngredientCategory` | `AMINE`, `BIOCIDE`, `FORMALDEHYDE_RELEASER`, `BASE_OIL_MINERAL`, `BASE_OIL_ESTER`, `BASE_OIL_PAO`, `BASE_OIL_PAG`, `EMULSIFIER`, `EP_ADDITIVE_S`, `EP_ADDITIVE_P`, `EP_ADDITIVE_CL`, `CORROSION_INHIBITOR`, `BORATE`, `CHELATE`, `GLYCOL_ETHER`, `SOLVENT_AROMATIC`, `SOLVENT_POLAR`, `WATER`, `ACID`, `ALKALI`, `OTHER` | `Ingredient.category` |
| `EffectType` | `SWELLING`, `SHRINKAGE`, `HARDENING`, `EMBRITTLEMENT`, `EXTRACTION`, `ATTACK_NETWORK`, `NONE` | `IngredientMaterialCompatibility.effectType` |
| `PaymentKind` | `MEMBERSHIP`, `CREDITS` | `Payment.kind` (Default `MEMBERSHIP`) |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED` | `Payment.status` (Default `PENDING`) |
| `EmailKind` | `MEMBERSHIP_RENEWAL_REMINDER`, `MEMBERSHIP_RENEWED`, `PASSWORD_RESET` | `EmailLog.kind` |
| `CreditTxKind` | `WELCOME`, `PURCHASE`, `REFERRAL`, `CODE`, `USAGE`, `ADMIN_ADJUST` | `CreditTransaction.kind` |
| `PriceSource` | `USER_SUBMITTED`, `TRANSACTION`, `LIST_PRICE`, `DISTRIBUTOR_QUOTE`, `AGGREGATED`, `SEED_INDICATIVE` | `PriceObservation.source` |
| `PriceStatus` | `PENDING`, `VERIFIED`, `REJECTED` | `PriceObservation.status` (Default `PENDING`) |
| `PriceUnit` | `EUR_PER_L`, `EUR_PER_KG`, `EUR_PER_PIECE`, `CHF_PER_L`, `CHF_PER_KG`, `USD_PER_L`, `USD_PER_KG` | `PriceObservation.unit` (Default `EUR_PER_L`) |
| `IssueCategory` | `BIOLOGY`, `FOAM`, `CORROSION`, `TOOL_WEAR`, `OPERATOR_HEALTH`, `SEAL_DAMAGE`, `WORKPIECE_STAINS`, `RESIDUES`, `FILTRATION`, `STABILITY`, `PERFORMANCE`, `COMPATIBILITY`, `REGULATORY`, `SHELF_LIFE`, `OTHER` | `ProductIssue.category` |
| `IssueSeverity` | `LOW`, `MEDIUM`, `HIGH` | `ProductIssue.severity` (Default `MEDIUM`) |
| `IssueSourceType` | `FORUM`, `MANUFACTURER`, `DISTRIBUTOR`, `CASE_STUDY`, `REVIEW`, `REGULATORY`, `SDS`, `USER_REPORT`, `OTHER` | `ProductIssue.sourceType` |
| `IssueStatus` | `PENDING`, `VERIFIED`, `RESOLVED`, `REJECTED` | `ProductIssue.status` (Default `PENDING`) |
| `AdPlacement` | `HOME`, `STOREFRONT`, `LISTINGS` | `AdBanner.placements[]` |

### 2.3 Wissensbasis-Modelle

#### `Manufacturer`
Hersteller/Marke. Zentraler Katalog-Anker.

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `name` | String | P | Display-Name, **`@unique`** (z.B. „Blaser Swisslube") |
| `slug` | String | P | url-safe, **`@unique`** |
| `logoPath` | String | O | z.B. `/brand-logos/BlaserSwisslubeLogo.png` |
| `website` | String | O | |
| `headquartersCountry` | String | O | ISO-3166-1 alpha-2 oder Klartext |
| `headquartersCity` | String | O | |
| `foundedYear` | Int | O | |
| `businessFocus` | `BusinessFocus[]` | — | Default `[]` |
| `productFamilies` | String[] | — | Default `[]` (z.B. `["Blasocut","Vasco"]`) |
| `description` | String | O | |
| `knownForApplications` | String[] | — | Default `[]` (Wissens-Metadaten) |
| `notes` | String | O | Freitext, manuell |
| `createdAt`/`updatedAt` | DateTime | P | `@default(now())` / `@updatedAt` |

Relationen: `listings Listing[]`, `sds SafetyDataSheet[]`, `products Product[]`,
`brandReps User[] @relation("BrandRep")` (Konten mit Marke-Stufe),
`adBanners AdBanner[]`. Index: `@@index([slug])`.

#### `Product`
Katalogeintrag eines Herstellers. Reichhaltigstes Wissens-Modell.

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `manufacturerId` | String | P | → `Manufacturer`, `onDelete: Cascade` |
| `name` | String | P | z.B. „Blasocut 2000 CF" |
| `slug` | String | P | url-safe, eindeutig pro Hersteller |
| `productFamily` | String | O | z.B. „Blasocut" |
| `category` | `ProductCategory` | P | |
| `chemistry` | `ChemistryBase` | O | |
| `description` | String | O | |
| `applicationAreas` | String[] | — | Default `[]` (Drehen, Fräsen, …) |
| `suitableMaterials` | String[] | — | Default `[]` |
| `unsuitableMaterials` | String[] | — | Default `[]` |
| `productionType` | `ProductionType` | O | |
| `concentrateForm` | `CoolantConcentrateForm` | O | |
| `criticalIssuesAddressed` | String[] | — | Default `[]` (adressierte Praxisprobleme) |
| `criticalIssuesKnown` | String[] | — | Default `[]` (dokumentierte Schwachpunkte) |
| `refractometerFactor` | Float | O | Brix × Faktor = % Konzentration |
| `recommendedConcentrationMin/Max` | Float | O | % v/v |
| `typicalSumpLifeWeeks` | Int | O | Emulsions-Standzeit im **Tank** (Wochen) |
| `phConcentrate` | Float | O | |
| `phEmulsionMin/Max` | Float | O | bei Soll-Konzentration |
| `densityGcm3` | Float | O | bei 20 °C |
| `flashpointC` | Int | O | °C (nur Öle) |
| `viscosityIso` | String | O | ISO VG |
| `viscosityKv40` | Float | O | mm²/s bei 40 °C |
| `viscosityKv100` | Float | O | mm²/s bei 100 °C |
| `waterHardnessMinDh/MaxDh` | Int | O | °dH Ansetzwasser |
| `waterHardnessNotes` | String | O | |
| `certifications` | String[] | — | Default `[]` (FDA H1, DIN 51385, TRGS 611 …) |
| `containsBor` | Boolean | O | |
| `containsFormaldehydeDepot` | Boolean | O | |
| `containsMineralOil` | Boolean | O | |
| `containsChlorine` | Boolean | O | |
| `mineralOilContentPct` | Float | O | 0–100 % |
| `sourceUrl` | String | O | Produktseite Hersteller |
| `dataSheetUrl` | String | O | technisches Datenblatt (PDS) |
| `sdsUrl` | String | O | SDS-URL |
| `sourceConfidence` | String | O | „verifiziert" / „modelliert" / „geschätzt" |
| `notes` | String | O | |
| `safetyDataSheetId` | String | O | → `SafetyDataSheet`, `onDelete: SetNull` |
| `searchTokens` | String | O | normalisierter Suchindex (→ 2.6) |
| `createdAt`/`updatedAt` | DateTime | P | |

Relationen: `compatibilityNotes MaterialCompatibilityNote[]`,
`priceObservations PriceObservation[]`, `issues ProductIssue[]`.
Constraints: `@@unique([manufacturerId, slug])`. Indizes: `manufacturerId`,
`category`, `productFamily`, `safetyDataSheetId`, `searchTokens`.

#### `SafetyDataSheet` (SDS)
Sicherheitsdatenblatt mit geparsten Feldern.

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `manufacturer` | String | P | **Freitext, DEPRECATED** zugunsten `manufacturerId` (→ 2.6) |
| `manufacturerId` | String | O | → `Manufacturer`, `onDelete: SetNull` |
| `productName` | String | P | |
| `category` | `SdsCategory` | P | |
| `language` | `SdsLanguage` | P | Default `DE` |
| `version` | String | O | |
| `revisionDate` | DateTime | O | |
| `sourceUrl` | String | P | |
| `filePath` | String | P | |
| `fileSizeBytes` | Int | P | |
| `sha256` | String | P | **`@unique`** (Dedup) |
| `pageCount` | Int | O | |
| `extractedText` | String | O | Rohtext für Parser |
| `searchTokens` | String | O | normalisierter Suchindex (→ 2.6) |
| **GHS/CLP** | | | |
| `hStatements` | String[] | — | Default `[]` (z.B. „H226") |
| `pStatements` | String[] | — | Default `[]` |
| `ghsPictograms` | String[] | — | Default `[]` (z.B. „GHS02") |
| `signalWord` | String | O | „Gefahr"/„Achtung"/… |
| **Physikochemie (Sect. 9)** | | | |
| `physicalState` | String | O | „flüssig"/„fest"/… |
| `appearanceColor` | String | O | |
| `odor` | String | O | |
| `phValue` | Float | O | |
| `phContext` | String | O | „Konzentrat"/„5% Emulsion" |
| `flashpointC` | Float | O | °C |
| `densityGcm3` | Float | O | |
| `viscosityKv40` | Float | O | mm²/s bei 40 °C |
| `pourpointC` | Float | O | Stockpunkt |
| `boilingPointC` | Float | O | |
| `waterSolubility` | String | O | |
| `casNumbers` | String[] | — | Default `[]` (Sect. 3) |
| **REACH / Inhaltsstoff-Flags** | | | |
| `reachCompliant` | Boolean | O | null=unbekannt |
| `reachNotes` | String | O | |
| `svhcSubstances` | String[] | — | Default `[]` |
| `containsBoron` | Boolean | O | |
| `containsFormaldehydeReleaser` | Boolean | O | |
| `containsSecondaryAmines` | Boolean | O | Nitrosamin-Risiko |
| `containsChlorinatedParaffins` | Boolean | O | SCCP/MCCP |
| `containsMineralOil` | Boolean | O | |
| `containsPrimaryAromaticAmines` | Boolean | O | PAA |
| `hasBactericide` | Boolean | O | |
| `hasFungicide` | Boolean | O | |
| `biocidalActives` | String[] | — | Default `[]` |
| **Entsorgung/Transport** | | | |
| `wgkClass` | String | O | Wassergefährdungsklasse „nwg"/„1"/„2"/„3" |
| `avvCode` | String | O | Abfallschlüssel AVV |
| `adrClass` | String | O | |
| `unNumber` | String | O | |
| `transportClass` | String | O | |
| `supplierName`/`supplierAddress`/`emergencyPhone` | String | O | Sect. 1 |
| `parsedAt` | DateTime | O | Parser-Metadaten |
| `parsedVersion` | String | O | |
| `fetchedAt` | DateTime | P | `@default(now())` |

Relationen: `listings Listing[]`, `products Product[]`. Indizes: `manufacturer`,
`manufacturerId`, `category`, `productName`, `searchTokens`. Parser-Logik in
`lib/sds-parser.ts` / `lib/sds-ingredients.ts`.

#### `PriceObservation`
Historische Marktpreise (crowdsourced + aus Transaktionen). Aggregation
`lib/price-aggregation.ts` (Monats-Median).

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `productId` | String | P | → `Product`, `onDelete: Cascade` |
| `observedAt` | DateTime | P | Datum des Preises (ggf. historisch) |
| `pricePerUnit` | Float | P | |
| `unit` | `PriceUnit` | P | Default `EUR_PER_L` |
| `quantityMin`/`quantityMax` | Float | O | Mengenstaffel |
| `packagingForm` | `PackagingForm` | O | |
| `regionCode` | String | O | ISO-2 (DE, CH, AT …) |
| `source` | `PriceSource` | P | |
| `status` | `PriceStatus` | P | Default `PENDING` |
| `submittedByUserId` | String | O | → `User` „SubmittedPrices", `SetNull` |
| `submittedAt` | DateTime | P | `@default(now())` |
| `verifiedByUserId` | String | O | → `User` „VerifiedPrices", `SetNull` |
| `verifiedAt` | DateTime | O | |
| `rejectionReason` | String | O | |
| `sourceUrl`/`sourceLabel`/`notes` | String | O | Provenance |
| `transactionId` | String | O | **`@unique`** — wenn aus Transaction abgeleitet |
| `createdAt` | DateTime | P | |

Indizes: `productId`, `observedAt`, `status`, `source`,
`@@index([productId, status, observedAt])`.

#### `ProductIssue`
Praxis-Probleme aus Foren/Herstellern/Reviews.

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `productId` | String | P | → `Product`, `onDelete: Cascade` |
| `category` | `IssueCategory` | P | |
| `severity` | `IssueSeverity` | P | Default `MEDIUM` |
| `status` | `IssueStatus` | P | Default `PENDING` |
| `title` | String | P | |
| `description` | String | P | |
| `symptoms` | String[] | — | Default `[]` |
| `rootCause`/`workaround`/`preventiveMeasure` | String | O | |
| `affectedMaterials`/`affectedOperations` | String[] | — | Default `[]` |
| `reportedConcentration` | Float | O | % |
| `reportedPh` | Float | O | |
| `reportedWaterHardness` | Int | O | °dH |
| `sourceType` | `IssueSourceType` | P | |
| `sourceUrl`/`sourceTitle`/`sourceAuthor` | String | O | |
| `sourceDate` | DateTime | O | |
| `language` | `SdsLanguage` | P | Default `DE` |
| `submittedByUserId` | String | O | → `User` „ProductIssueSubmitted", `SetNull` |
| `verifiedByUserId` | String | O | → `User` „ProductIssueVerified", `SetNull` |
| `verifiedAt` | DateTime | O | |
| `isOfficial` | Boolean | P | Default `false` (Hersteller-Doku) |
| `reportCount` | Int | P | Default `1` (Merge ähnlicher Issues) |
| `createdAt`/`updatedAt` | DateTime | P | |

Indizes: `productId`, `category`, `severity`, `status`, `sourceType`.

#### `MaterialCompatibilityNote`
Werkstoff-Hinweis, produkt-spezifisch oder allgemein.

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `productId` | String | O | → `Product`, `onDelete: Cascade`; null = allgemeine Regel |
| `scope` | String | P | „product" oder „general" |
| `material` | String | P | „Aluminium", „Buntmetall", … |
| `compatibility` | `MaterialCompatibility` | P | |
| `condition` | String | O | z.B. „pH > 9.5" |
| `note` | String | P | Erklärung |
| `sourceUrl`/`sourceLabel` | String | O | |
| `createdAt`/`updatedAt` | DateTime | P | |

Indizes: `productId`, `material`.

#### `ComparisonAnalysis`
Cache für KI-/Heuristik-Vergleiche (KSS-Wizard/Produktvergleich).

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `cacheKey` | String | P | **`@unique`** — sha256 über sortierte ID-Liste |
| `scope` | String | P | „listings" oder „products" |
| `ids` | String[] | — | verglichene IDs (sortiert) |
| `result` | Json | P | `{ perItem, recommendation, model }` |
| `source` | String | P | „anthropic-claude" \| „heuristic-fallback" |
| `createdAt` | DateTime | P | |

Index: `@@index([scope, createdAt])`.

#### Dichtungs-/Kunststoff-Verträglichkeitsmatrix

**`Material`** (Werkstoff, z.B. Elastomer):

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `slug` | String | P | **`@unique`** („nbr", „fkm-bisphenol") |
| `name` | String | P | „NBR (Nitril-Butadien-Kautschuk)" |
| `shortName` | String | P | „NBR" |
| `category` | `MaterialCategory` | P | |
| `description` | String | O | |
| `typicalUseCases` | String[] | — | Default `[]` |
| `temperatureMinC`/`temperatureMaxC` | Int | O | |
| `isPolar` | Boolean | O | Polaritäts-Charakteristik |
| `parentSlug` | String | O | Verweis auf Eltern-Familie (Untertyp) |
| `sourceUrl`/`sourceLabel`/`notes` | String | O | |
| `createdAt`/`updatedAt` | DateTime | P | |

Relation: `compatibilities IngredientMaterialCompatibility[]`. Indizes: `category`, `slug`.

**`Ingredient`** (Inhaltsstoff/Wirkstoff):

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `slug` | String | P | **`@unique`** („monoethanolamine", „boric-acid") |
| `name` | String | P | „Monoethanolamin (MEA)" |
| `shortName` | String | O | |
| `category` | `IngredientCategory` | P | |
| `casNumbers` | String[] | — | Default `[]` |
| `functionInFluid` | String | O | |
| `typicalConcentrationPct` | Float | O | |
| `isSvhc` | Boolean | P | Default `false` |
| `description` | String | O | |
| `sourceUrl`/`sourceLabel` | String | O | |
| `createdAt`/`updatedAt` | DateTime | P | |

Relation: `compatibilities IngredientMaterialCompatibility[]`. Index: `category`.

**`IngredientMaterialCompatibility`** (n:m-Kreuzung mit Bewertung):

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `ingredientId` | String | P | → `Ingredient`, `onDelete: Cascade` |
| `materialId` | String | P | → `Material`, `onDelete: Cascade` |
| `rating` | `MaterialCompatibility` | P | RECOMMENDED/COMPATIBLE/CAUTION/UNSUITABLE |
| `effectType` | `EffectType` | O | |
| `swellPctMin`/`swellPctMax` | Float | O | erwartete Volumenquellung % |
| `conditionNote` | String | O | „bei T > 60°C", … |
| `note` | String | P | Mechanismus / Wirkung |
| `sourceUrl`/`sourceLabel` | String | O | |
| `confidence` | String | O | „verifiziert"/„indikativ"/„geschätzt" |
| `createdAt`/`updatedAt` | DateTime | P | |

Constraint: `@@unique([ingredientId, materialId])`. Indizes: `materialId`,
`ingredientId`, `rating`. Ableitung aus Produktfeldern via `lib/seal-recommendations.ts`.

### 2.4 Marktplatz-/Transaktions-Modelle

#### `User`
Zentrales Konto-Modell (Käufer, Verkäufer, Hersteller-Vertreter, Admin).

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `email` | String | P | **`@unique`** |
| `passwordHash` | String | P | bcrypt |
| `pseudonym` | String | P | **`@unique`** — öffentlicher Anzeigename |
| `role` | `UserRole` | P | Default `RESELLER` |
| `trustTier` | `UserTrustTier` | P | Default `UNVERIFIED` — steuert Sichtbarkeit |
| `searchBoost` | Int | P | Default `0` — **INTERN/nur Superadmin**, bezahlter Ranking-Boost, nie an UI/API |
| `stripeCustomerId` | String | O | |
| `stripeSubscriptionId` | String | O | aktives Abo |
| `membershipValidUntil` | DateTime | O | Abo aktiv solange in der Zukunft |
| `membershipTier` | `MembershipTier` | O | gebuchte Preisstufe (→ 2.6) |
| `membershipCancelAtPeriodEnd` | Boolean | P | Default `false` — gekündigt, läuft aus |
| `companyName` | String | O | KYC light (intern) |
| `vatId` | String | O | |
| `vatValidatedAt` | DateTime | O | letzte erfolgreiche VIES-Prüfung (`lib/vat-validation.ts`) |
| `vatValidatedName` | String | O | von VIES gemeldeter Firmenname |
| `country` | String | O | |
| `preferredCurrency` | String | O | sonst aus `country` abgeleitet (`lib/currency.ts`) |
| `stripeConnectAccountId` | String | O | Käuferschutz als Verkäufer (Stripe Connect Express) |
| `stripeConnectOnboarded` | Boolean | P | Default `false` — Prüfung abgeschlossen → Abzeichen |
| `about` | String | O | öffentlicher „Über uns"-Text |
| `brandManufacturerId` | String | O | → `Manufacturer` „BrandRep", `SetNull` (Marke-Stufe) |
| `storefrontHeadline` | String | O | Schaufenster-Claim |
| `creditBalance` | Int | P | Default `0` — KI-Credits (Historie zusätzlich in `CreditTransaction`) |
| `trialEndsAt` | DateTime | O | Kennenlernphase (Dauer via `AppSetting trialDays`) |
| `aiContactCheckAt` | DateTime | O | einmalige KI-Kontaktdaten-Prüfung (`lib/contact-filter.ts`) |
| `referredById` | String | O | → `User` „Referrals" (Werber), `SetNull` |
| `createdAt`/`updatedAt` | DateTime | P | |

Relationen (Auswahl): `payments`, `emailLogs`, `referralCodesCreated`,
`referralRedemptions`, `brandManufacturer`, `referredBy`/`referrals` (Self,
„Referrals"), `creditTransactions`, `adBanners` („AdOwner"), `listings`,
`buyerThreads`/`sellerThreads` (Conversation), `messages`, `rfqs`, `offers`,
`buyerTxns`/`sellerTxns` (Transaction), `reviewsGiven`/`reviewsReceived`,
`submittedPrices`/`verifiedPrices`, `submittedIssues`/`verifiedIssues`,
`passwordResetTokens`. Keine expliziten `@@index`.

#### `Listing` (Angebot — „Anbieten", blau)

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `sellerId` | String | P | → `User`, `onDelete: Cascade` |
| `status` | `ListingStatus` | P | Default `ACTIVE` |
| `productType` | String | P | „Hydrauliköl", „KSS-Emulsion", … |
| `manufacturer` | String | P | **Freitext, DEPRECATED** zugunsten `manufacturerId` |
| `manufacturerId` | String | O | → `Manufacturer` (`manufacturerRef`), `SetNull` |
| `productName` | String | P | z.B. „Tellus S2 M 46" |
| `isoViscosity` | String | O | ISO VG 32/46/68 |
| `chemistry` | `ChemistryBase` | P | Default `MINERAL` |
| `applicationArea` | String | P | CNC, Schleifen, Hydraulik |
| `quantity` | Float | P | verfügbare Menge |
| `quantityUnit` | String | P | Default `"L"` |
| `minOrderQty` | Float | O | |
| `locationRegion` | String | P | Region/Land (keine Adresse) |
| `packaging` | `PackagingForm` | P | Default `DRUM` |
| `productionDate`/`expiryDate` | DateTime | O | |
| `certificates` | String[] | — | OEM-Freigaben, ISO, DIN, TRGS 611 |
| `priceEur` | Float | O | null = „auf Anfrage" |
| `shippingTerms` | String | O | |
| `description` | String | O | |
| `machiningOperations` | String[] | — | Default `[]` |
| `mineralOilContent` | Float | O | 0–100 % |
| `containsGlycol` | Boolean | O | |
| `automationSuitability` | Int | O | 1–5 |
| `measurementMethods` | String[] | — | Default `[]` |
| `sdsId` | String | O | → `SafetyDataSheet`, `SetNull` |
| `createdAt`/`updatedAt` | DateTime | P | |

Relationen: `conversations Conversation[]`, `transactions Transaction[]`. Indizes:
`productType`, `manufacturer`, `manufacturerId`, `isoViscosity`, `status`, `sdsId`.
Basiert auf FDS 4.2 Datenmodell.

#### `Rfq` (Anfrage — „Suchen", amber)

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `buyerId` | String | P | → `User`, `onDelete: Cascade` |
| `status` | `RfqStatus` | P | Default `OPEN` |
| `visibility` | `RfqVisibility` | P | Default `PUBLIC` (`VERIFIED_ONLY` → nur verifizierte sehen) |
| `productType` | String | P | |
| `manufacturer` | String | O | Freitext |
| `isoViscosity` | String | O | |
| `chemistry` | `ChemistryBase` | O | |
| `applicationArea` | String | O | |
| `quantity` | Float | P | |
| `quantityUnit` | String | P | Default `"L"` |
| `locationRegion` | String | P | |
| `deadline` | DateTime | P | |
| `budgetMinEur`/`budgetMaxEur` | Float | O | |
| `notes` | String | O | |
| `requiredCertifications` | String[] | — | Default `[]` |
| `avoidIssues` | String[] | — | Default `[]` (Pain Points zu vermeiden) |
| `workpieceMaterial` | String | O | |
| `acceptedOfferId` | String | O | **`@unique`** |
| `createdAt`/`updatedAt` | DateTime | P | |

Relationen: `offers RfqOffer[]`, `transaction Transaction?`. Indizes: `status`,
`productType`, `locationRegion`.

#### `RfqOffer` (Gebot auf eine Anfrage)

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `rfqId` | String | P | → `Rfq`, `onDelete: Cascade` |
| `sellerId` | String | P | → `User`, `onDelete: Cascade` |
| `priceEur` | Float | P | |
| `quantity` | Float | P | |
| `quantityUnit` | String | P | Default `"L"` |
| `deliveryDays` | Int | P | |
| `notes` | String | O | |
| `alternativeProduct`/`alternativeReason` | String | O | Alternativvorschlag |
| `status` | `RfqOfferStatus` | P | Default `PENDING` |
| `createdAt`/`updatedAt` | DateTime | P | |

Constraint: `@@unique([rfqId, sellerId])` (ein Gebot pro Verkäufer/Anfrage). Indizes:
`rfqId`, `sellerId`.

#### `Conversation` / `Message`
Nachrichten-Thread zwischen Käufer und Verkäufer, optional an ein Listing gebunden.

`Conversation`: `id`; `buyerId`→User „BuyerThreads" (Cascade); `sellerId`→User
„SellerThreads" (Cascade); `listingId`→Listing? (SetNull); `createdAt`/`updatedAt`;
Relation `messages Message[]`. Constraint `@@unique([buyerId, sellerId, listingId])`
(ein Thread pro Konstellation). Indizes: `buyerId`, `sellerId`.

`Message`: `id`; `conversationId`→Conversation (Cascade); `senderId`→User (Cascade);
`body String`; `createdAt`. Index `@@index([conversationId, createdAt])`.

#### `Transaction`
Abschluss aus angenommener Anfrage oder Listing. Trägt Käuferschutz-Felder.

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `buyerId` | String | P | → `User` „BuyerTx", Cascade |
| `sellerId` | String | P | → `User` „SellerTx", Cascade |
| `rfqId` | String | O | **`@unique`** → `Rfq`, `SetNull` |
| `listingId` | String | O | → `Listing`, `SetNull` |
| `totalEur` | Float | P | |
| `quantity` | Float | P | |
| `quantityUnit` | String | P | Default `"L"` |
| `replacedProductName` | String | O | Vorgänger-Produkt (Einsparungs-Kennlinie) |
| `replacedPricePerUnit` | Float | O | Einsparung = `replacedPricePerUnit × quantity − totalEur` |
| `protectionStatus` | `ProtectionStatus` | P | Default `NONE` — **Käuferschutz** (nicht „Treuhand"/„Escrow") |
| `protectionFeeEur` | Float | O | Abwicklungsgebühr, trägt der Käufer; Plattform verdient nichts |
| `stripeProtectionSessionId` | String | O | Stripe Checkout-Session |
| `stripeProtectionPaymentIntentId` | String | O | |
| `stripeProtectionTransferId` | String | O | Transfer ans Verkäufer-Connect-Konto |
| `status` | `TransactionStatus` | P | Default `PENDING` |
| `shippedAt`/`completedAt`/`canceledAt` | DateTime | O | |
| `createdAt`/`updatedAt` | DateTime | P | |

Relationen: `buyer`, `seller`, `rfq?`, `listing?`, `reviews Review[]`. Indizes:
`buyerId`, `sellerId`, `status`. Käuferschutz-Geldfluss: Käufer zahlt an Plattform
(separate charges & transfers), Geld bleibt bei Stripe geparkt (`HELD`), erst nach
Lieferbestätigung (`RELEASED`) Transfer an den Verkäufer; Haltefrist max. 90 Tage.

#### `Review`

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `transactionId` | String | P | → `Transaction`, Cascade |
| `reviewerId` | String | P | → `User` „ReviewsGiven", Cascade |
| `revieweeId` | String | P | → `User` „ReviewsReceived", Cascade |
| `rating` | Int | P | 1–5 |
| `comment` | String | O | |
| `tags` | `ReviewTag[]` | — | |
| `createdAt` | DateTime | P | |

Constraint: `@@unique([transactionId, reviewerId])`. Index: `revieweeId`.

### 2.5 Monetarisierung, System & Werbung

#### `Payment`
Stripe-Zahlung (Mitgliedschaft oder Credits).

`id`; `userId`→User (Cascade); `kind PaymentKind` (Default `MEMBERSHIP`);
`status PaymentStatus` (Default `PENDING`); `amountEur Float`; `currency String`
(Default `"eur"`); `stripeSessionId String? @unique`; `stripePaymentIntentId String?`;
`stripeInvoiceId String?` (Abo-Verlängerung, Idempotenz per `findFirst` im Code, **kein**
DB-Unique); `periodStart`/`periodEnd DateTime?`; `createdAt`/`updatedAt`. Indizes:
`userId`, `status`, `stripeInvoiceId`.

#### `CreditTransaction`
KI-Credit-Historie. `id`; `userId`→User (Cascade); `amount Int` (positiv=Gutschrift,
negativ=Verbrauch); `kind CreditTxKind`; `note String?`; `createdAt`. Indizes:
`@@index([userId, createdAt])`, `kind`.

#### `ReferralCode` / `ReferralCodeRedemption`
Vom Superadmin generierte Codes.
`ReferralCode`: `id`; `code String @unique`; `credits Int`; `maxUses Int` (Default 1);
`usedCount Int` (Default 0); `active Boolean` (Default true); `expiresAt DateTime?`;
`note String?`; `createdById`→User „ReferralCodesCreatedBy" (Cascade);
`redemptions`; `createdAt`. Index: `active`.
`ReferralCodeRedemption`: `id`; `codeId`→ReferralCode (Cascade); `userId`→User (Cascade);
`credits Int`; `redeemedAt`. Constraint `@@unique([codeId, userId])` (ein Code je Nutzer
einmal).

#### `EmailLog`
Prototyp-Log statt echtem Versand (`lib/mailer.ts`). `id`; `userId`→User (Cascade);
`kind EmailKind`; `to`/`subject`/`body String`; `createdAt`. Indizes: `userId`, `kind`.
Abo-Kommunikation via `lib/membership-emails.ts`.

#### `PasswordResetToken`
„Passwort vergessen"-Flow. In der DB nur der sha256-Hash. `id`; `userId`→User (Cascade);
`tokenHash String @unique`; `expiresAt DateTime`; `usedAt DateTime?` (einmalig);
`createdAt`. Index: `userId`.

#### `AppSetting`
Globale Superadmin-Einstellungen. **`key String @id`** (kein cuid); `value String`;
`updatedAt`. Beispiele: `welcomeCredits`, `trialDays`, `referralCredits`,
`creditPriceRp`, `membershipPriceEur`.

#### `UsageEvent`
Datenschutzarme Web-Analytics (ohne IP/Cookies/Fingerprinting). `id`; `kind String`
(„pageview"/„search"/„ai_action"/…); `path String?`; `meta String?`; `userId String?`
(**bewusst ohne DB-Relation**); `createdAt`. Indizes: `@@index([kind, createdAt])`,
`createdAt`.

#### `AiTokenUsage`
Token-Verbrauch je Claude-Aufruf (fire-and-forget, darf nie werfen). `id`;
`feature String` („kss_wizard"/„concierge"/„comparison"/„contact_filter"/„alternatives"/
„alt_search"); `model String` (z.B. „claude-haiku-4-5-20251001"); `inputTokens`,
`outputTokens`, `cacheCreationTokens`, `cacheReadTokens Int` (je Default 0);
`userId String?`; `createdAt`. Indizes: `createdAt`, `@@index([feature, createdAt])`.

#### `AdBanner`
Werbeplattform — buchbare Banner von Marke-Mitgliedern (Auslieferung `lib/ads.ts`,
`components/AdSlot`).

| Feld | Typ | P/O | Bedeutung |
|---|---|---|---|
| `id` | String | P | cuid |
| `ownerId` | String | P | → `User` „AdOwner", Cascade |
| `manufacturerId` | String | O | → `Manufacturer`, `SetNull` (beworbene Marke) |
| `eyebrow` | String | O | kleine Zeile über der Schlagzeile |
| `headline` | String | P | |
| `chips` | String[] | — | Default `[]` (Vorteile als Pills) |
| `image` | String | P | ausgelieferter Pfad oder `data:`-URI |
| `ctaLabel` | String | P | Default `"Mehr erfahren"` |
| `ctaUrl` | String | P | |
| `origin` | String | O | z.B. „Made in Switzerland" |
| `placements` | `AdPlacement[]` | — | Default `[]` |
| `active` | Boolean | P | Default `false` |
| `startsAt`/`endsAt` | DateTime | O | Laufzeitfenster |
| `createdAt`/`updatedAt` | DateTime | P | |

Indizes: `active`, `ownerId`.

### 2.6 Wichtige Konventionen

- **Veraltete Freitext-Felder.** `Listing.manufacturer` (Pflicht-String) und
  `SafetyDataSheet.manufacturer` (Pflicht-String) sind **deprecated**; für die
  Hersteller-Zuordnung stattdessen die Relation `manufacturerId` → `Manufacturer`
  verwenden (`Listing.manufacturerRef`, `SafetyDataSheet.manufacturerRef`, beide
  `onDelete: SetNull`). Die Freitext-Felder bleiben aus Legacy-Gründen und für
  Import-Rohwerte erhalten und sind indexiert.
- **`searchTokens`.** `Product.searchTokens` und `SafetyDataSheet.searchTokens` sind
  normalisierte Suchindizes (lowercase, Trennzeichen — Bindestriche/Spaces/Punkte/
  Schrägstriche — entfernt), damit Anfragen wie `bcool755` auf „B-Cool 755" bzw.
  `hocut795mp` auf „Hocut 795 MP" matchen. Gepflegt via `lib/normalize-search.ts` beim
  Seed und Backfill; beide Felder sind indexiert. `Product.searchTokens` speist sich aus
  name + manufacturer + productFamily; `SafetyDataSheet.searchTokens` aus
  productName + manufacturer + version.
- **`role` / `trustTier` / `membershipTier` / `searchBoost`.** `role` (`UserRole`)
  trennt RESELLER/OEM/ENDKUNDE/ADMIN. `trustTier` (`UserTrustTier`, UNVERIFIED→DIAMOND)
  steuert die Sichtbarkeit (z.B. `RfqVisibility.VERIFIED_ONLY`). `membershipTier`
  (`MembershipTier`, nullable) ist die bezahlte Abo-Stufe und nur wirksam, solange
  `membershipValidUntil` in der Zukunft liegt. `searchBoost` (Int, Default 0) ist ein
  interner, nur über `/admin` steuerbarer Ranking-Boost und wird **nie** an normale
  UI/API ausgegeben.
- **Käuferschutz-/Transaktions-Felder.** An `Transaction` hängen `protectionStatus`
  (`ProtectionStatus`), `protectionFeeEur` und drei `stripeProtection*`-IDs. Bewusst
  **nicht** „Treuhand"/„Escrow" genannt (Stripe-Restricted-Businesses-Vorgabe). Ablauf:
  `NONE` → `PENDING_PAYMENT` → `HELD` (bezahlt, Geld bei Stripe geparkt) → `RELEASED`
  (Käufer bestätigt Lieferung → Transfer an Verkäufer-Connect-Konto), Sonderfälle
  `REFUNDED`/`DISPUTED`. Verkäuferseitig steuern `User.stripeConnectAccountId` /
  `stripeConnectOnboarded` die Verfügbarkeit („Käuferschutz verfügbar"-Abzeichen).
- **Terminologie.** „TANK" statt „Sumpf" (`PackagingForm.TANK`,
  `Product.typicalSumpLifeWeeks` bezeichnet die Standzeit im Tank).

### 2.7 Migrationsstrategie

Das Projekt nutzt **`prisma db push` — es gibt KEINE Migrationsdateien** (kein
`prisma/migrations/`-Verzeichnis, keine Migrationshistorie). Schema-Änderungen werden mit
`npm run db:push` direkt in die DB geschoben; danach `npx prisma generate` für den
Client. Für LIVE gehören Daten-/Backfill-Aufgaben idempotent in `prisma/deploy-tasks.ts`
(laufen bei jedem Deploy, dürfen nie werfen).

---

## 3. Authentifizierung, Rollen, Vertrauen, Mitgliedschaft, Trial, Credits

Dieser Abschnitt beschreibt Identität und Zugang: Login/Registrierung (NextAuth v4,
JWT, bcrypt), die drei Achsen der Berechtigung (**Rolle**, **Trust-Tier**,
**Mitgliedschaftsstufe**), den Zugangsmechanismus für KI-Funktionen (Trial ODER
aktives Abo ODER Credits) und den sicheren Passwort-Reset. Preise/Stripe-Fluss siehe
Abschnitt zur Monetarisierung/Zahlung; die reinen Datenmodelle stehen im Schema-Abschnitt.

### 3.1 NextAuth-Setup (`lib/auth.ts`)

NextAuth v4, **einziger** Provider ist `CredentialsProvider` (E-Mail + Passwort),
Sessions als **JWT** (kein DB-Session-Store).

- Eingehängt in `app/api/auth/[...nextauth]/route.ts`:
  `const handler = NextAuth(authOptions); export { handler as GET, handler as POST };`
- Konfiguration:
  - `session: { strategy: "jwt" }`
  - `pages: { signIn: "/login" }`
- `authorize(credentials)`:
  1. Ohne `email`/`password` → `null`.
  2. `prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } })`
     (E-Mail wird kleingeschrieben verglichen; Feld ist `@unique`).
  3. Kein User → `null`. Passwortvergleich `bcrypt.compare(password, user.passwordHash)`;
     falsch → `null`.
  4. Erfolg → gibt `{ id, email, name: user.pseudonym, role, trustTier }` zurück
     (der Anzeigename ist bewusst das **Pseudonym**, nicht Klarname/Firma).

Passwörter werden mit `bcryptjs` gehasht (`bcrypt.hash(password, 10)`), sowohl bei der
Registrierung (`app/api/register/route.ts`) als auch beim Reset
(`app/api/auth/reset-password/route.ts`). Es gibt keine `middleware.ts`; Auth wird pro
Route/Page durchgesetzt.

#### JWT-/Session-Callbacks (angereicherte Felder)

Beide Callbacks reichen dieselben drei Felder durch:

| Callback | Übernommene Felder | Quelle |
|----------|--------------------|--------|
| `jwt({ token, user })` | `token.id`, `token.role`, `token.trustTier` | nur beim ersten Login aus `user` |
| `session({ session, token })` | `session.user.id`, `.role`, `.trustTier` | aus dem Token |

Der TS-Typ in `types/next-auth.d.ts` augmentiert `Session.user` und `JWT` mit
`id`, `role: "RESELLER"|"OEM"|"ADMIN"`, `trustTier: "UNVERIFIED"|"VERIFIED"|"TRADE_ASSURED"|"PREMIUM"`.

> **Belegte Ungenauigkeit im Code:** Die TS-Typen in `lib/auth.ts` und
> `types/next-auth.d.ts` listen **nicht alle** DB-Enum-Werte auf. Das Prisma-Enum
> `UserRole` kennt zusätzlich `ENDKUNDE`, `UserTrustTier` zusätzlich `PREMIUM`/`DIAMOND`
> (Typ nennt `PREMIUM`, aber nicht `DIAMOND`). Rolle `ENDKUNDE` ist im
> Registrierungs-Formular wählbar, taucht aber im Session-Typ nicht auf. Beim Nachbau
> die Typen an die vollständigen Enums angleichen.

#### Session-Zugriff serverseitig

Server-Routen und -Pages lesen die Session über
`getServerSession(authOptions)` (aus `next-auth`), Import von `authOptions` aus
`@/lib/auth`. Verwendung an ~54 Stellen. Client-seitig `signIn("credentials", …)` /
`useSession` aus `next-auth/react`. Kein `middleware.ts` — jede geschützte Route prüft
selbst `if (!session) …`.

### 3.2 Registrierung & Login-Flow

**Registrierung:** UI `app/register/page.tsx` → POST `app/api/register/route.ts`.
Nach Erfolg meldet die Seite den Nutzer direkt per `signIn("credentials", …)` an und
leitet auf `/dashboard`.

Formularfelder (Zod-`registerSchema` in der Route):

| Feld | Regel |
|------|-------|
| `email` | `z.string().email()`, wird `.toLowerCase()` gespeichert, `@unique` |
| `password` | `min(8)`, im Client zusätzlich `passwordConfirm`-Abgleich |
| `pseudonym` | `min(3).max(40).regex(/^[A-Za-z0-9_-]+$/)`, `@unique` |
| `role` | `enum(["RESELLER","OEM","ENDKUNDE"]).default("RESELLER")` |
| `companyName` | `min(2)` (intern, "KYC light") |
| `vatId` | optional (USt-ID) |
| `country` | `length(2)`, wird `.toUpperCase()` gespeichert |
| `referralCode` | optional, = **Pseudonym des Werbers** (aus `/register?ref=…`) |

**Pseudonym-Schutz (Anti-Umgehung):** Das Pseudonym darf die Identität nicht verraten.
`findPseudonymLeak()` aus `lib/pseudonym.ts` prüft gegen `companyName`, `email`, `vatId`
und **alle Herstellernamen** (`prisma.manufacturer.findMany`). Treffer → HTTP 422 mit
Grund. Der Client prüft on-blur schon lokal und ersetzt ein unzulässiges Pseudonym
automatisch durch `generatePseudonym()` (neutraler Vorschlag). Zweck: der Marktplatz
bleibt anonym, damit Parteien ihn nicht per Klarname umgehen.

**Startguthaben / Trial bei Registrierung:**
- `settings = getAllSettings()` (Superadmin-Werte, s. 3.6/3.7).
- `trialEndsAt = jetzt + settings.trialDays * 24h`.
- User wird angelegt mit `trialEndsAt` und `referredById` (falls Werber gefunden).
- `welcomeCredits` (Default 20) werden per `grantCredits(user.id, …, "WELCOME", …)`
  gutgeschrieben. Ist ein Werber gesetzt, erhält dieser `referralCredits`
  (Default 10) per `grantCredits(referrer.id, …, "REFERRAL", …)`.
- Duplikat-Prüfung: `findFirst({ OR: [{ email }, { pseudonym }] })` → 409.

**Login:** UI `app/login/page.tsx`, `signIn("credentials", { email, password,
redirect:false })`, Fehler → generische Meldung `auth.wrongCredentials`, sonst Redirect
auf `callbackUrl` (Default `/dashboard`). Link „Passwort vergessen" → `/forgot-password`.

Test-Accounts aus dem Seed: `alpha@example.com` (VERIFIED),
`beta@example.com` (TRADE_ASSURED), Passwort `test1234`.

### 3.3 Rollen (`UserRole`)

Enum in `prisma/schema.prisma`: `RESELLER | OEM | ENDKUNDE | ADMIN`
(User-Default `@default(RESELLER)`). Registrierbar sind `RESELLER`, `OEM`, `ENDKUNDE`;
`ADMIN` wird nicht über die Registrierung vergeben.

- Steuert primär Zielgruppen-Wording und Admin-Zugang. `ADMIN` schaltet die
  Superadmin-Konsole `/admin` frei (Einstellungen, Nutzerliste, Credits-Vergabe,
  Referral-Codes, Nutzungs-Statistik, Export).
- `role` liegt im JWT/Session und wird u. a. in `/admin`, Export
  (`app/api/admin/export/route.ts`) genutzt.
- Die Rolle allein **schaltet keine KI/Sichtbarkeit** frei — das machen Trust-Tier
  (3.4) und Mitgliedschaft/Trial/Credits (3.5–3.7).

### 3.4 Trust-Tier (`UserTrustTier`) & Sichtbarkeit

Enum: `UNVERIFIED | VERIFIED | TRADE_ASSURED | PREMIUM | DIAMOND`
(User-Default `@default(UNVERIFIED)`). Angezeigt über `components/TrustBadge.tsx`.
Höherstufung passiert nicht über Self-Service, sondern administrativ (kein
Registrierungs-/Selbstverifizierungs-Flow im Code belegt).

**Wozu es steuert — Anfragen-Sichtbarkeit (`RfqVisibility`):** Enum
`PUBLIC | VERIFIED_ONLY`. Eine „Suchen"-Anfrage (Rfq) mit `visibility = VERIFIED_ONLY`
ist nur für nicht-`UNVERIFIED`-Nutzer sichtbar/bietbar. Durchsetzung an mehreren
Stellen (Regel überall identisch: `trustTier !== "UNVERIFIED"`):

| Ort | Logik |
|-----|-------|
| `app/rfqs/page.tsx:38-42` | Listenfilter: `VERIFIED_ONLY`-Anfragen nur einblenden, wenn `trustTier && trustTier !== "UNVERIFIED"` |
| `app/rfqs/[id]/page.tsx:44` | Detailzugriff/Angebotsrecht nur wenn Käufer selbst oder `trustTier !== "UNVERIFIED"` |
| `app/api/rfqs/[id]/offers/route.ts:55-60` | Angebot abgeben (POST): bei `VERIFIED_ONLY` wird `me.trustTier` geladen, `UNVERIFIED` → abgelehnt |

Auswahl `VERIFIED_ONLY` im Anlege-Formular `app/rfqs/new/page.tsx`; Zod in
`app/api/rfqs/route.ts` (`z.enum(["PUBLIC","VERIFIED_ONLY"]).default("PUBLIC")`).
Trust-Tier wird außerdem rein informativ neben Pseudonymen angezeigt (Angebote,
Transaktionen, Profile, Preisbeobachtungen).

**Nicht zu verwechseln:** `searchBoost` (Int, `@default(0)`, INTERN/nur Superadmin) ist
ein bezahlter Sichtbarkeits-Boost in Suchergebnissen und wird **nie** an die normale
UI/API ausgegeben — unabhängig vom Trust-Tier.

### 3.5 Mitgliedschaftsstufen (`MembershipTier`) — `lib/membership-tiers.ts`

Enum: `BASIS | PRO | MARKE` (Feld `membershipTier` am User, `null` = keine gebuchte
Stufe). Aktivität hängt an `membershipValidUntil` (DateTime?): aktiv, solange in der
Zukunft (`isMembershipActive(validUntil)` in `lib/membership.ts`). `activeTier(user)`
gibt die **wirksame** Stufe zurück — ohne aktives Abo `null`, auch wenn `membershipTier`
noch gesetzt ist. `TIER_ORDER = ["BASIS","PRO","MARKE"]`, `tierRank()` für Vergleiche.

| Stufe | Zielgruppe | Freischaltung (Funktion → Helper) |
|-------|-----------|-----------------------------------|
| BASIS | Reseller | Wissens-DB, Käuferschutz, Angebots-**Limit** (`listingLimitFor` → `basisListingLimit`, Default 10) |
| PRO | aktive Händler | wie Basis + **unbegrenzte** Angebote (`listingLimitFor` → `null`), bevorzugte Platzierung (`hasPriorityPlacement`), Analysen (`hasAnalytics`) |
| MARKE | OEM/Hersteller | wie Pro + eigenes **Marken-Schaufenster** und gesponserte KSS-Wizard-Platzierung (`hasStorefront`, nur MARKE) |

Freischalt-Helper (alle in `lib/membership-tiers.ts`):
`listingLimitFor(tier, basisLimit)` (`null` = unbegrenzt für PRO/MARKE),
`hasPriorityPlacement(tier)` (PRO|MARKE), `hasAnalytics(tier)` (PRO|MARKE),
`hasStorefront(tier)` (nur MARKE). Anzeige-Metadaten (Name, Zielgruppe, `featured`,
Feature-Liste) in `TIER_META`; Preise kommen **nicht** aus dem Code, sondern aus den
Superadmin-Einstellungen (`getTierPriceEur`/`getTierPrices` → `membershipPriceEur`,
`membershipPriceProEur`, `membershipPriceMarkeEur`; Defaults 290/990/3000 €).

**Marken-Schaufenster (MARKE):** Zusatzfelder am User `brandManufacturerId`
(Relation `BrandRep` → `Manufacturer`) und `storefrontHeadline` — nur mit aktiver
MARKE-Stufe wirksam; hebt die Produkte des vertretenen Herstellers als „gesponsert"
(gekennzeichnet) im KSS-Wizard hervor.

Abo-Lebenszyklus (Stripe-Subscription, echte automatische Verlängerung), Erst-/
Verlängerungserfüllung, Kündigung (`cancelMembership` → `cancel_at_period_end`,
`membershipCancelAtPeriodEnd`) und Reaktivierung stehen in `lib/membership.ts` — Details
im Zahlungs-Abschnitt.

### 3.6 Trial (Kennenlernphase)

- Dauer = Setting `trialDays` (Default **10**, in `SETTING_DEFAULTS`, `lib/credits.ts`),
  überschreibbar in `/admin` (Modell `AppSetting`).
- Bei Registrierung wird `user.trialEndsAt = jetzt + trialDays` gesetzt.
- `isTrialActive(trialEndsAt)` = `!!trialEndsAt && trialEndsAt.getTime() > Date.now()`.
- **`GET /api/trial-info`** (öffentlich, ohne Auth): liefert `{ days, credits }` aus
  `getSettingInt("trialDays")` und `getSettingInt("welcomeCredits")`. Zweck: Werbetexte
  auf Startseite/Login/Registrierung lesen die Zahlen **immer** live, damit die UI nie
  etwas anderes verspricht, als die Software gewährt (kein Hardcoding). Genutzt in
  `app/register/page.tsx` (Willkommens-Kasten).

**Gated vs. öffentlich:**
- **Öffentlich (kein Zugang/kein Login nötig):** Suche und Wissens-Datenbank
  (Produkte, SDS, Preise ansehen), sowie `/api/trial-info`.
- **Gated (Trial ODER aktives Abo, s. 3.7):** die KI-Funktionen. Kontaktaufnahme/
  Nachrichten und Zahlungs-/Käuferschutz-Abläufe setzen einen angemeldeten Nutzer
  voraus; der Erstkontakt durchläuft zusätzlich einen einmaligen KI-Kontaktdaten-Filter
  (`aiContactCheckAt`, `lib/contact-filter.ts`, Kosten trägt Brisco — siehe
  Nachrichten-/Käuferschutz-Abschnitt).

### 3.7 KI-Credits (`lib/credits.ts`)

Geschäftsmodell: **Abo = Plattform-Zugang, Credits = Bezahlung der KI-Funktionen.**
Guthaben liegt am User als `creditBalance` (Int, `@default(0)`) und wird zusätzlich als
Historie in `CreditTransaction` geführt.

**`CreditTransaction`** (`CreditTxKind`): `WELCOME | PURCHASE | REFERRAL | CODE | USAGE |
ADMIN_ADJUST`; `amount` positiv = Gutschrift, negativ = Verbrauch; `note` als Klartext.

**Kosten & Labels:**
```
AI_ACTION_COSTS = { concierge:1, kssWizard:1, alternatives:1, alternativesWeb:2 }
AI_ACTION_LABEL = { concierge:"Concierge-Frage", kssWizard:"KSS-Wizard-Analyse",
                    alternatives:"KI-Alternativen (SDS-Vergleich)",
                    alternativesWeb:"KI-Alternativsuche mit Web-Recherche" }
```

**Zugriffslogik (Kern):** `chargeForAiAction(userId, action)` bucht atomar ab, aber nur
nach doppeltem Gate:
1. **Zugang** = `isMembershipActive(membershipValidUntil) || isTrialActive(trialEndsAt)`.
   Fehlt beides → `{ ok:false, reason:"no_access" }` (Credits werden *nicht* geprüft,
   Guthaben allein reicht **nicht**).
2. **Guthaben:** `updateMany({ where:{ id, creditBalance:{ gte:cost } }, data:{
   decrement:cost } })` — bucht nur bei ausreichendem Saldo (kein negativer Saldo,
   race-sicher). `count===0` → `{ ok:false, reason:"no_credits" }`.
3. Erfolg → `CreditTransaction` mit `kind:"USAGE"` (negativ) + fire-and-forget
   `UsageEvent` (`kind:"ai_action"`, für `/admin` → Nutzung).

Effektiv: KI läuft nur, wenn **(Trial ODER Abo) UND Guthaben** vorhanden. (Trial/Abo
liefern den *Zugang*, Credits die *Bezahlung*; das Startguthaben deckt die ersten
KI-Aktionen in der Trial-Phase.)

**Erstattung:** `refundAiAction(userId, action)` schreibt die Kosten wieder gut
(`increment` + `CreditTransaction` „Erstattung: … fehlgeschlagen"), wenn ein Claude-Call
scheitert/abbricht.

**Aufrufer & Fallback-Verhalten:** `app/api/kss-wizard/route.ts`,
`app/api/concierge/route.ts`, `app/api/listings/[id]/alternatives/route.ts`. Muster:
zuerst `charge`, bei `ok` KI ausführen, bei Fehler `refundAiAction`. Ist kein Guthaben/
Zugang da, fällt die Route auf **heuristisches Ranking** zurück und zeigt einen Hinweis
(`no_credits` → „Credit-Guthaben aufgebraucht … Credits unter ‚Mitgliedschaft'";
`no_access` → „Kennenlernphase abgelaufen und kein aktives Abo …"). Die
Anthropic-Integration selbst siehe KI-Abschnitt.

**Gutschriften:** `grantCredits(userId, amount, kind, note?)` (atomar: User-`increment` +
`CreditTransaction`). Quellen: Registrierung (`WELCOME`), Stripe-Paketkauf (`PURCHASE`,
`CREDIT_PACKAGES` S/M/L = 50/200/500), Referral (`REFERRAL`), eingelöster Code (`CODE`),
Admin (`ADMIN_ADJUST`).

**Status-Helfer:** `getAccessStatus(userId)` liefert `{ memberActive, trialActive,
trialEndsAt, membershipValidUntil, creditBalance }` für UI-Anzeigen.

**Referral-/Gutschein-Codes:** Modelle `ReferralCode` (+ `ReferralCodeRedemption`,
`@@unique([codeId,userId])`). `generateReferralCodeString()` → z. B. `BRISCO-7K4Q-XM2P`
(Alphabet ohne verwechselbare Zeichen). `createReferralCode(...)` (Admin).
`redeemReferralCode(userId, rawCode)` prüft Existenz/`active`, `expiresAt`, `maxUses`
vs. `usedCount`, Doppel-Einlösung; bucht atomar via `updateMany` (verhindert
Überbuchung bei Race) und schreibt `CreditTransaction` `kind:"CODE"`. Ergebnisgründe:
`not_found | expired | exhausted | already_redeemed`.

**Einstellungen (`AppSetting`, `SETTING_DEFAULTS`):** `getSettingInt(key)`,
`getAllSettings()`, `setSetting(key,value)`. Relevante Keys/Defaults: `welcomeCredits`
20, `trialDays` 10, `referralCredits` 10, `creditPriceCt` 10, `membershipPriceEur` 290,
`membershipPriceProEur` 990, `membershipPriceMarkeEur` 3000, `basisListingLimit` 10,
`protectionFeeBp` 250, `protectionFeeFixedCt` 25. Alle in `/admin` überschreibbar.

### 3.8 Passwort-Reset (sicher, ohne Enumeration)

Zwei Routen + `lib/password-reset.ts` (Modell `PasswordResetToken`:
`tokenHash @unique`, `expiresAt`, `usedAt?`).

**`POST /api/auth/forgot-password`** (`app/api/auth/forgot-password/route.ts`):
- Eingabe `{ email }` (Zod). Antwort ist **immer** `{ ok: true }` — unabhängig davon, ob
  das Konto existiert oder ob der Mailversand klappt (keine User-Enumeration über den
  Antwort-Inhalt).
- Existiert der User: `generateResetToken()` = `randomBytes(32).toString("hex")`;
  gespeichert wird nur `hashResetToken(token)` = **sha256** (`createHash("sha256")`),
  plus `expiresAt = jetzt + RESET_TOKEN_TTL_MS` (**1 Stunde**). Der Klartext-Token geht
  **ausschließlich per E-Mail** als Link `${origin}${withBasePath("/reset-password")}
  ?token=…` raus (Modell speichert nie Klartext). Bis 2026-07-15 gab die Route den Link
  fälschlich in der HTTP-Antwort zurück — Lücke geschlossen.
- Mailversand **bewusst ohne `await`** (`void sendEmail(...)`): damit die Antwortzeit
  nicht verrät, ob ein Konto existiert (Timing-Enumeration) und die Seite nicht am
  Mailserver hängt.

**`POST /api/auth/reset-password`** (`app/api/auth/reset-password/route.ts`):
- Eingabe `{ token: min(10), password: min(8) }` (Zod).
- Sucht `passwordResetToken` per `hashResetToken(token)`. Unbekannt, bereits benutzt
  (`usedAt`) oder abgelaufen (`expiresAt < now`) → generische Ablehnung („Link ungültig
  oder abgelaufen").
- Sonst `bcrypt.hash(password, 10)`, dann **atomar** (`$transaction`): User-Passwort
  setzen, Token als `usedAt` markieren und **alle** weiteren offenen Tokens des Users
  entwerten (Token einmalig verwendbar). Antwort `{ ok: true }`.

Sicherheitsmerkmale zusammengefasst: identische Antwort in beiden Fällen, Link nur per
Mail, in der DB nur sha256-Hash, kurze TTL (1 h), Einmal-Verwendung, konstante
Antwortzeit.

---

## 4. Marktplatz: Anbieten, Suchen, Chat, Transaktionen, Käuferschutz

Der Marktplatz-Kern des Prototyps besteht aus zwei Einstiegen — **„Anbieten"**
(Angebote, im UI blau; Datenmodell `Listing`) und **„Suchen"** (Anfragen, im UI
amber; Datenmodell `Rfq` + `RfqOffer`). Aus dem Annehmen eines Angebots entsteht ein
pseudonymer Chat (`Conversation`/`Message`) und eine `Transaction`, die optional über
**Käuferschutz** (nie „Treuhand"/„Escrow", siehe 4.5) via Stripe bezahlt und nach
Abschluss über `Review` bewertet wird.

Wortlaut-Konvention: In nutzersichtbarem Text heißen die Objekte „Anbieten"/„Angebot"
bzw. „Suchen"/„Anfrage" — nicht „Listing"/„RFQ". Die technischen Bezeichner (Modelle,
Routen) verwenden weiterhin `Listing`, `Rfq`, `RfqOffer`.

### 4.1 Angebote „Anbieten" (`Listing`)

Modell `Listing` (`prisma/schema.prisma`, Z. 971–1029). Felder:

| Feld | Typ | Bemerkung |
|---|---|---|
| `sellerId` → `seller` | User | Ersteller (Verkäufer) |
| `status` | `ListingStatus` | `ACTIVE`/`PAUSED`/`SOLD`/`ARCHIVED`, default `ACTIVE` |
| `productType` | String | z.B. „Hydrauliköl", „KSS-Emulsion" |
| `manufacturer` | String | Freitext, **deprecated** zugunsten `manufacturerId` |
| `manufacturerId` → `manufacturerRef` | Manufacturer? | Relation auf den Herstellerkatalog (`onDelete: SetNull`) |
| `productName` | String | z.B. „Tellus S2 M 46" |
| `isoViscosity` | String? | „ISO VG 32/46/68…" |
| `chemistry` | `ChemistryBase` | `MINERAL`/`SYNTHETIC`/`SEMI_SYNTHETIC`/`ESTER`/`PAG`/`OTHER`, default `MINERAL` |
| `applicationArea` | String | „CNC", „Schleifen", „Hydraulik"… |
| `quantity` / `quantityUnit` | Float / String | verfügbare Menge, Einheit default „L" |
| `minOrderQty` | Float? | Mindestabnahme |
| `locationRegion` | String | Region/Land — **keine Adresse** (Pseudonymität) |
| `packaging` | `PackagingForm` | `DRUM`/`IBC`/`TANK`/`CANISTER`/`BULK`/`OTHER` („Gebinde"), default `DRUM`. **`TANK`, nicht „Sumpf"** |
| `productionDate` / `expiryDate` | DateTime? | Herstell-/Ablaufdatum |
| `certificates` | String[] | OEM-Freigaben, ISO, DIN, TRGS 611 |
| `priceEur` | Float? | optional — `null` = „auf Anfrage" |
| `shippingTerms` | String? | Selbstabholung / Lieferung / verhandelbar |
| `description` | String? | Freitext |
| `machiningOperations` | String[] | Bearbeitungsverfahren (Drehen, Fräsen, Bohren, Schleifen…) |
| `mineralOilContent` | Float? | 0–100 % |
| `containsGlycol` | Boolean? | Rezeptur-Info |
| `automationSuitability` | Int? | Automatisierungs-Eignung 1–5 |
| `measurementMethods` | String[] | vom Hersteller empfohlene Messverfahren |
| `sdsId` → `sds` | SafetyDataSheet? | verknüpftes Sicherheitsdatenblatt (`onDelete: SetNull`) |

**Erstellen:** `POST /api/listings` (`app/api/listings/route.ts`). Session-Pflicht
(`getServerSession(authOptions)`, sonst 401). Validierung per Zod (`listingSchema`) —
u.a. `chemistry`/`packaging` als Enum, `quantity` positiv, `machiningOperations`/
`measurementMethods`/`certificates` als String-Arrays, `automationSuitability` int
0–5. **Angebots-Limit je Mitgliedschaftsstufe:** über `activeTier(...)` und
`listingLimitFor(tier, getSettingInt("basisListingLimit"))` (`lib/membership-tiers.ts`)
— BASIS/ohne aktive Stufe darf nur begrenzt viele `status: ACTIVE` Angebote führen; bei
Überschreitung 422 mit `code: "LISTING_LIMIT_REACHED"`. Pro/Marke = unbegrenzt (Limit
`null`). Erfolg → 201 mit dem `Listing`.

**Bearbeiten:** `PATCH /api/listings/[id]` (`app/api/listings/[id]/route.ts`).
`assertOwner()` prüft `sellerId === session.user.id` (404 unbekannt, 403 fremd). Zod
`patchSchema` — alle Felder optional, zusätzlich `status`-Wechsel möglich.

**Löschen:** `DELETE /api/listings/[id]` → kein Hard-Delete, setzt `status: ARCHIVED`.

**UI:** `app/listings/new/page.tsx` (Formular inkl. `MachiningSelect`, Gebinde-Select
aus `["DRUM","IBC","TANK","CANISTER","BULK","OTHER"]`, Rezeptur- und Automations-
Felder), `app/listings/[id]/edit/page.tsx` (Bearbeiten), `app/listings/[id]/page.tsx`
(Detail), `app/listings/page.tsx` (Liste). `app/listings/[id]/alternatives/*` bietet
KI-gestützte Alternativvorschläge (→ siehe KSS-Wizard-Abschnitt). Eine Listen-/Detail-
Ausgabe erfolgt serverseitig direkt über Prisma; es gibt **kein** `GET /api/listings`.

### 4.2 Anfragen „Suchen" (`Rfq`) und Angebote darauf (`RfqOffer`)

Modell `Rfq` (Z. 876–914): `buyerId`, `status` (`RfqStatus`:
`OPEN`/`ACCEPTED`/`EXPIRED`/`CANCELED`, default `OPEN`), `visibility`
(`RfqVisibility`: `PUBLIC`/`VERIFIED_ONLY`, default `PUBLIC`), `productType`,
`manufacturer?`, `isoViscosity?`, `chemistry?`, `applicationArea?`, `quantity`/
`quantityUnit`, `locationRegion`, `deadline` (DateTime, Pflicht), `budgetMinEur?`/
`budgetMaxEur?`, `notes?`, Anforderungen `requiredCertifications` String[],
`avoidIssues` String[] (Pain Points/zu meidende Probleme), `workpieceMaterial?`,
`acceptedOfferId?` (unique). Relationen: `offers RfqOffer[]`, `transaction Transaction?`.

Modell `RfqOffer` (Z. 916–938): `rfqId`, `sellerId`, `priceEur`, `quantity`/
`quantityUnit`, `deliveryDays` (Int), `notes?`, `alternativeProduct?`,
`alternativeReason?` (Verkäufer darf ein abweichendes Ersatzprodukt vorschlagen),
`status` (`RfqOfferStatus`: `PENDING`/`ACCEPTED`/`DECLINED`/`WITHDRAWN`, default
`PENDING`). Constraint `@@unique([rfqId, sellerId])` — je Anfrage max. ein Angebot pro
Verkäufer.

**Anfrage erstellen:** `POST /api/rfqs` (`app/api/rfqs/route.ts`), Session-Pflicht,
Zod `rfqSchema`, `deadline` als ISO-Datetime. Es gibt **keine** `PATCH`/`DELETE`-Route
für `Rfq` — Stornieren/Ablaufen (`CANCELED`/`EXPIRED`) ist im Schema vorgesehen, hat
aber keine implementierte API/UI (Stub).

**Angebot auf Anfrage abgeben:** `POST /api/rfqs/[id]/offers`
(`app/api/rfqs/[id]/offers/route.ts`). Zod `offerSchema`. Ablehnungen: eigene Anfrage
(400), Anfrage nicht `OPEN` (409), Frist abgelaufen `rfq.deadline < now` (409).
**Sichtbarkeitsregel:** bei `visibility === VERIFIED_ONLY` dürfen nur Nutzer mit
`trustTier !== "UNVERIFIED"` bieten (sonst 403). Speicherung per `upsert` auf
`rfqId_sellerId` (Neuabgabe überschreibt, setzt Status zurück auf `PENDING`).

**Angebot annehmen → öffnet Chat + erzeugt Transaction:**
`POST /api/rfqs/[id]/offers/[offerId]/accept`
(`app/api/rfqs/[id]/offers/[offerId]/accept/route.ts`). Nur der `buyer` der Anfrage
(403 sonst), Anfrage muss `OPEN` sein (409). Ablauf:
1. Konversation finden/anlegen (`buyerId`, `sellerId`, `listingId: null`) — bewusst
   `findFirst`+`create` statt Upsert, da die Composite-Unique mit NULL-`listingId` in
   Postgres nicht greift.
2. In einer `prisma.$transaction([...])` atomar:
   - `Rfq` → `status: ACCEPTED`, `acceptedOfferId`
   - angenommenes `RfqOffer` → `status: ACCEPTED`
   - alle übrigen `PENDING`-Angebote der Anfrage → `status: DECLINED`
   - **`Transaction`** anlegen: `buyerId`, `sellerId`, `rfqId`,
     `totalEur = offer.priceEur * offer.quantity`, `quantity`, `quantityUnit`
   - System-`Message` in den Thread (Zusammenfassung des angenommenen Angebots)
3. Antwort: `{ conversationId, transactionId }`.

### 4.3 Pseudonymer Chat (`Conversation` / `Message`)

Modell `Conversation` (Z. 940–956): `buyerId`, `sellerId`, `listingId?`,
`@@unique([buyerId, sellerId, listingId])`. `Message` (Z. 958–969): `conversationId`,
`senderId`, `body`, `createdAt`. Nachrichten/Nutzer werden ausschließlich über
`pseudonym` dargestellt (siehe `select: { pseudonym, id }` in den Routen; Klarnamen/
Kontaktdaten bleiben verborgen). UI: `app/conversations/page.tsx` (Threadliste),
`app/conversations/[id]/page.tsx` (Thread).

**Thread starten:** `POST /api/conversations` (`app/api/conversations/route.ts`), Zod
`startSchema` (`sellerId`, optional `listingId`, optionale `initialMessage` ≤2000 —
genutzt von „Muster anfordern"/„Angebot anfragen"). Selbstkontakt verboten (400). Wenn
Thread existiert, wird er zurückgegeben (ggf. mit angehängter Erstnachricht).

**Nachrichten:** `GET`/`POST /api/conversations/[id]/messages`. `assertMember()` lässt
nur `buyer`/`seller` des Threads zu (404/403). `POST` Zod `sendSchema` (`body` 1–4000).
`POST` aktualisiert `conversation.updatedAt`.

### 4.4 Anti-Leakage: KI-Kontaktdatenfilter (`lib/contact-filter.ts`)

Jede gesendete Nachricht durchläuft einen zweistufigen Filter (FDS 4.5), der den
Austausch **direkter Kontaktdaten** unterbindet, um das Pseudonym-Modell zu schützen.
Blockierte Nachrichten werden nicht gespeichert — Antwort **422** mit deutschem Grund.

**Stufe 1 — Regex (`findContactData`), auf JEDER Nachricht, kostenlos.** Erkennt und
benennt (nutzerlesbar, deutsch):
- E-Mail (`EMAIL_RE`) → „eine E-Mail-Adresse"
- verschleierte E-Mail „max (at) firma (punkt) de" (`OBFUSCATED_EMAIL_RE`) →
  „eine (umschriebene) E-Mail-Adresse"
- URL `http(s)://` / `www.` (`URL_RE`) → „einen Link"
- nackte Domain gängiger TLDs `com|de|ch|at|net|org|eu|io|info|biz|shop` (`DOMAIN_RE`)
  → „eine Web-Adresse"
- Telefonnummern (`PHONE_CANDIDATE_RE`, Beginn `+`/`00`/`0`, danach ≥8 Ziffern nach
  Entfernen von Nicht-Ziffern) → „eine Telefonnummer". Die ≥8-Ziffern-Schwelle
  vermeidet Fehlalarme bei Mengen/Preisen („10 000 L").

**Stufe 2 — KI-Prüfung (`aiContactCheck`), EINMALIG pro neuem Account.** Fängt
raffiniert verschleierte Kontaktdaten, die der Regex nicht erkennt (ausgeschriebene
Ziffern, „Firmenname + Ort googeln", Social-Handles). Ausgelöst in der Messages-Route,
wenn `User.aiContactCheckAt === null`; der Zeitstempel wird **vor** dem Call gesetzt →
genau eine Prüfung pro Account, unabhängig vom Ergebnis. Bei `flagged` → 422.

- Modell: **`claude-haiku-4-5-20251001`** (Anthropic SDK, `@anthropic-ai/sdk`).
- System-Prompt fordert reines JSON `{"flagged": boolean, "reason": string|null}`;
  Produktnamen, Mengen, Preise, Normen (ISO VG) sind ausdrücklich **erlaubt**.
- Kostendeckel: **harte Obergrenze 20 Rappen / CHF 0,20 pro Prüfung**
  (`AI_CHECK_MAX_COST_CHF = 0.2`). Zwei Mechanismen: Input auf **4000 Zeichen** gekappt
  (`text.slice(0, 4000)`), Output auf **`max_tokens: 150`**. Realkosten ≈ 0,3 Rp
  (Haiku 4.5: $1/M Input, $5/M Output; `USD_TO_CHF = 0.9`). Überschreitung nur als
  `console.warn`, keine Blockade. Verbrauch wird via `recordAiUsage("contact_filter",
  …)` protokolliert.
- **Fail-open:** kein `ANTHROPIC_API_KEY` oder Fehler/Parsing-Problem → Rückgabe `null`
  → Nachricht wird **nicht** blockiert (Regex-Stufe bleibt als Schutz).

### 4.5 Käuferschutz-Flow (nie „Treuhand"/„Escrow")

**Wortlaut-Vorgabe (im Code dokumentiert, u.a. `lib/protection.ts`, Schema Z. 70–75):**
immer „Käuferschutz" bzw. „Zahlungsfreigabe nach Lieferbestätigung" — **niemals
„Treuhand"/„Escrow"** (Stripe-Restricted-Businesses-Vorgabe, laut Kommentar von Stripe-
Support als zulässig bestätigt, Haltefrist < 90 Tage). Geldfluss = **separate charges &
transfers**: Käufer zahlt an die Plattform, das Geld bleibt bei Stripe geparkt, erst
nach Lieferbestätigung Überweisung an das Connect-Konto des Verkäufers.

`Transaction`-Felder für den Käuferschutz (Z. 1049–1055): `protectionStatus`
(`ProtectionStatus`), `protectionFeeEur`, `stripeProtectionSessionId`,
`stripeProtectionPaymentIntentId`, `stripeProtectionTransferId`.

**`ProtectionStatus`-Zustände** (Enum Z. 76–83; Labels in `PROTECTION_STATUS_LABEL`):

| Status | Bedeutung |
|---|---|
| `NONE` | ohne Käuferschutz (Direktabwicklung) — default |
| `PENDING_PAYMENT` | Checkout gestartet, Zahlung offen |
| `HELD` | bezahlt — Geld bei Stripe geparkt bis Lieferbestätigung |
| `RELEASED` | Käufer hat Lieferung bestätigt, Geld an Verkäufer überwiesen |
| `REFUNDED` | Problemfall: Geld an Käufer zurückerstattet |
| `DISPUTED` | Problem gemeldet — Superadmin entscheidet |

**Gebühr** (`protectionFeeEur(totalEur, feeBp=250, fixedCt=25)`, `lib/protection.ts`):
Standard **2,5 % + 0,25 €** (`totalEur * 250/10000 + 0.25`, auf Cent gerundet). Satz
per Superadmin einstellbar über AppSettings `protectionFeeBp` / `protectionFeeFixedCt`
(Grenzen 0–2000 bp bzw. 0–10000 ct, `app/admin/actions.ts`). **Die Gebühr trägt der
Käufer** (transparent als eigene Checkout-Position); laut UI-Text verdient Brisco an der
Transaktion selbst nichts (die Gebühr deckt Zahlungsabwicklung + Käuferschutz-Service).

**Ablauf Schritt für Schritt** (UI: `components/ProtectionPanel.tsx`, eingebettet in
`app/transactions/[id]/page.tsx`):

1. **Voraussetzung Verkäufer:** muss Käuferschutz „anbieten", d.h. Stripe-Connect
   abgeschlossen haben (`seller.stripeConnectOnboarded`). Andernfalls zeigt das Panel
   „bietet (noch) keinen Käuferschutz an — Abwicklung direkt".
2. **Empfehlung:** beim ersten Geschäft zwischen den beiden Parteien (`priorDeals === 0`
   COMPLETED-Transaktionen) wird der Schutz visuell hervorgehoben/empfohlen.
3. **Zahlen (Käufer):** Button „Mit Käuferschutz bezahlen (Betrag+Gebühr €)" →
   `POST /api/transactions/[id]/protection/checkout`. Nur Käufer (403), Tx muss `PENDING`
   oder `SHIPPED` sein, `protectionStatus` `NONE`/`PENDING_PAYMENT`. Erstellt Stripe-
   **Checkout Session** (`mode: "payment"`) mit zwei Positionen: Warenwert
   (`unit_amount = totalEur*100`) + „Käuferschutz-Gebühr" (`fee*100`);
   `payment_intent_data.transfer_group = tx.id`; `metadata.kind = "PROTECTION"`,
   `transactionId`, `userId`; `success_url … ?protection=success&session_id={CHECKOUT_SESSION_ID}`,
   `cancel_url … ?protection=cancel`. Setzt Tx auf `PENDING_PAYMENT`, speichert
   `protectionFeeEur` und `stripeProtectionSessionId`. Antwort `{ url }` → Redirect.
4. **Zahlung bestätigen → `HELD`:** `confirmProtectionPayment(session)`
   (`lib/protection-flow.ts`) — idempotent, prüft `session.id` gegen
   `stripeProtectionSessionId` und Status `PENDING_PAYMENT`, setzt `HELD` und
   `stripeProtectionPaymentIntentId`. Wird ausgelöst **entweder** vom Webhook
   (`checkout.session.completed`, Produktion) **oder** vom Erfolgs-Redirect als Dev-
   Fallback: die Transaktionsseite ruft es bei `?protection=success` direkt auf; zudem
   `POST /api/transactions/[id]/protection/confirm { sessionId }`.
5. **Liefern (Verkäufer):** separat über die Transaktions-State-Machine (Button „Als
   versendet markieren" → `SHIPPED`, siehe 4.6); der Käuferschutz kennt keinen eigenen
   Versand-Schritt.
6. **Lieferung bestätigen / freigeben → `RELEASED`:**
   `POST /api/transactions/[id]/protection/release`. Nur Käufer (403), `protectionStatus`
   muss `HELD` sein. Ruft `releaseProtection(txId)`: `stripe.transfers.create` über
   `amount = totalEur*100` (nur Warenwert, **ohne** Gebühr) an
   `seller.stripeConnectAccountId`, `transfer_group = tx.id`; setzt `RELEASED` und
   `stripeProtectionTransferId` (idempotent). Anschließend wird die Transaktion
   abgeschlossen (`status: COMPLETED`, `completedAt`) und `recalcTrustTier` +
   `capturePriceFromTransaction` ausgelöst.
7. **Problem melden → `DISPUTED`:** `POST /api/transactions/[id]/protection/dispute`.
   Nur Käufer, aus `HELD`. Setzt `protectionStatus: DISPUTED` **und** `status: DISPUTED`;
   das Geld bleibt geparkt, der Superadmin entscheidet.
8. **Superadmin-Entscheidung** (`app/admin/actions.ts`, `revalidatePath("/admin")`):
   - `resolveProtectionRelease` → `releaseProtection` (Auszahlung an Verkäufer) + Tx
     `COMPLETED`.
   - `resolveProtectionRefund` → `refundProtection` (`lib/protection-flow.ts`:
     `stripe.refunds.create({ payment_intent })` **inkl. Gebühr** — Käufer soll keinen
     Verlust haben; setzt `REFUNDED`) + Tx `CANCELED`.

Ist Stripe nicht konfiguriert, geben die Käuferschutz-Routen eine klare 503-Meldung
zurück (kein Crash, `stripe === null`).

### 4.6 Transaktion (`Transaction`) und State-Machine

Modell `Transaction` (Z. 1031–1074): `buyerId`, `sellerId`, `rfqId?` (unique — 1:1 zur
Anfrage), `listingId?`, `totalEur`, `quantity`/`quantityUnit`, Käuferschutz-Felder
(4.5), Einsparungs-Felder `replacedProductName?`/`replacedPricePerUnit?` (4.7),
`status` (`TransactionStatus`), Zeitstempel `shippedAt`/`completedAt`/`canceledAt`,
`reviews Review[]`. Eine Transaktion entsteht heute nur über die RFQ-Annahme (4.2); ein
direkter Kauf aus einem `Listing` heraus existiert als Relation (`Listing.transactions`),
hat aber keine eigene Erzeugungs-Route.

**State-Machine** (`PATCH /api/transactions/[id]`, `patchSchema.action`:
`SHIP`/`COMPLETE`/`CANCEL`/`DISPUTE`; UI `components/TransactionActions.tsx`). Nur
Käufer/Verkäufer der Tx (403). `TransactionStatus`:
`PENDING`/`SHIPPED`/`COMPLETED`/`CANCELED`/`DISPUTED` (default `PENDING`).

| Aktion | erlaubt für | von-Status | nach-Status | Nebenwirkung |
|---|---|---|---|---|
| `SHIP` | Verkäufer | `PENDING` | `SHIPPED` | `shippedAt` |
| `COMPLETE` | Käufer | `PENDING`/`SHIPPED` | `COMPLETED` | `completedAt`; `recalcTrustTier`(beide) + `capturePriceFromTransaction` |
| `CANCEL` | Käufer/Verkäufer | `PENDING` | `CANCELED` | `canceledAt` |
| `DISPUTE` | Käufer/Verkäufer | ≠`COMPLETED`/`CANCELED` | `DISPUTED` | — (Admin schaut) |

Beim Übergang nach `COMPLETED` wird der Transaktionspreis zusätzlich als belegter
Marktpreis erfasst (`capturePriceFromTransaction`, `lib/transaction-price-capture.ts`)
und die Trust-Tiers beider Parteien neu berechnet.

### 4.7 Umsätze / Einsparung (`/umsaetze`)

`app/umsaetze/page.tsx` listet die Transaktionen des Nutzers und rechnet je Zeile die
**Einsparung durch Produktwechsel** = `replacedPricePerUnit * quantity - totalEur`
(erfasst über `POST /api/transactions/[id]/savings`, nur Käufer, beide Felder `null` =
entfernen). Summenanzeige in der aktuell gewählten Währung (`convertCurrency`).

### 4.8 Bewertungen (`Review`) und Ranking-Einfluss

Modell `Review` (Z. 1076–1092): `transactionId`, `reviewerId`, `revieweeId`,
`rating` (Int 1–5), `comment?`, `tags` (`ReviewTag[]`:
`FAST_RESPONSE`/`QUALITY_AS_DESCRIBED`/`ON_TIME_DELIVERY`/`FAIR_NEGOTIATION`),
`@@unique([transactionId, reviewerId])` — je Transaktion eine Bewertung pro Partei.

**Abgeben:** `POST /api/transactions/[id]/reviews` (`reviewSchema`). Nur nach
`status === COMPLETED` (409 sonst), nur Käufer/Verkäufer (403). `revieweeId` = jeweils
die Gegenpartei. `upsert` auf `transactionId_reviewerId` (Bearbeiten möglich).
Anschließend `recalcTrustTier(revieweeId)`. UI: `components/ReviewForm.tsx`, angezeigt
auf der Transaktionsseite.

**Ranking-Einfluss (`recalcTrustTier`, `lib/trust.ts`):** Reviews bestimmen den
`trustTier` des Bewerteten, der wiederum Sichtbarkeit steuert (z.B. Bieten auf
`VERIFIED_ONLY`-Anfragen). Schwellen (aus abgeschlossenen Transaktionen, Verkäufer-
umsatz, Ø-Rating und Mitgliedsdauer; `SIX_MONTHS_MS`-Einheit für „memberMonths"):

| Tier | Bedingung |
|---|---|
| `UNVERIFIED` | Start / keine abgeschlossene Transaktion |
| `VERIFIED` | ≥ 1 COMPLETED-Transaktion |
| `TRADE_ASSURED` | ≥ 10 COMPLETED, ≥ 3 Ratings, Ø ≥ 4,2 |
| `PREMIUM` | Verkäuferumsatz ≥ 50 000 €, ≥ 5 Ratings, Ø ≥ 4,5, `memberMonths ≥ 1` (= 6 Mon.) |
| `DIAMOND` | Verkäuferumsatz ≥ 200 000 €, ≥ 50 Ratings, Ø ≥ 4,7, `memberMonths ≥ 2` (= 12 Mon.) |

Hinweis: `memberMonths` teilt durch `SIX_MONTHS_MS`, `>= 1` entspricht also 6 Monaten.
Disputes fließen laut Code-Kommentar noch **nicht** in die Berechnung ein (offener
Punkt).

### 4.9 Stripe-Anbindung

- **Client (`lib/stripe.ts`):** Singleton `stripe = STRIPE_SECRET_KEY ? new Stripe(...)
  : null`; `isStripeConfigured()`; `appBaseUrl()` = `NEXTAUTH_URL ?? http://localhost:3000`.
  Ohne Key liefern die Routen 503 statt zu crashen (Test-/Nicht-konfiguriert-Modus).
- **Käuferschutz-Checkout:** Stripe **Checkout Sessions** (`mode: "payment"`, s. 4.5).
  Anmerkung: Der Checkout nutzt Stripe Checkout mit `line_items`/`price_data`; die
  Zahlungsart-Auswahl übernimmt Checkout automatisch. Ein expliziter
  `automatic_payment_methods`-Parameter kommt im Code **nicht** vor (im gesamten Repo
  kein Treffer).
- **Connect (Testmodus, `app/api/connect/onboard/route.ts`, `lib/connect.ts`):**
  `POST /api/connect/onboard` legt (einmalig) ein Stripe-**Connect-Express**-Konto an
  (`stripe.accounts.create({ type: "express", email, country?, metadata.userId })`,
  gespeichert in `User.stripeConnectAccountId`) und erzeugt einen
  `accountLinks.create({ type: "account_onboarding", refresh_url … /mitgliedschaft?connect=refresh,
  return_url … ?connect=return })`. Onboarding-Abgleich per `syncConnectStatus(userId)`
  (`lib/connect.ts`): `accounts.retrieve`, `stripeConnectOnboarded = charges_enabled &&
  payouts_enabled`; wird beim Laden von `/mitgliedschaft` gepollt (kein Connect-Webhook
  im Prototyp). Ist Connect im Stripe-Dashboard nicht aktiviert, gibt die Route eine
  erklärende 502-Meldung zurück.
- **Webhook (`app/api/billing/webhook/route.ts`), `runtime = "nodejs"`:** erwartet
  Header `stripe-signature`, verifiziert Roh-Body mit `stripe.webhooks.constructEvent`
  gegen **`STRIPE_WEBHOOK_SECRET`** (fehlt Secret/Client → 503, ungültige Signatur → 400).
  Verarbeitete Events (betreffen den **Mitgliedschafts-/Credit-Lebenszyklus**, nicht den
  Käuferschutz):
  - `checkout.session.completed` → `fulfillCheckoutSession` (Erstabschluss Abo/Credits)
  - `invoice.payment_succeeded` → `fulfillRenewalInvoice` (Abo-Verlängerung)
  - `customer.subscription.updated` / `.deleted` → `syncSubscriptionStatus`
  Der Käuferschutz-`HELD`-Übergang läuft hingegen über `confirmProtectionPayment` —
  produktiv müsste dieser Handler ein `checkout.session.completed` mit
  `metadata.kind === "PROTECTION"` ebenfalls bedienen; aktuell erfolgt die
  `HELD`-Markierung im Prototyp über den Erfolgs-Redirect/`/protection/confirm`
  (Dev-Fallback).
- **Relevante Env-Variablen:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXTAUTH_URL` (Redirect-Basis), `ANTHROPIC_API_KEY` (Kontaktfilter-KI).

---

## 5. Wissensbasis: Hersteller, Produkte, SDS, Preise, Praxis-Probleme, Materialien

Die Wissensbasis ist die zweite, von den Marktplatz-Transaktionen (→ siehe Abschnitte
zu Angeboten/Anfragen) getrennte Konzept-Ebene. Sie ist rein kuratiert/geparst und
großteils **read-only** in der UI. Einzige nutzerseitige Schreibpfade: Preis-Meldung
(`/api/prices/submit`) und deren Verifizierung (`/api/prices/verify`). Alle Modelle
liegen in `prisma/schema.prisma`; die Kernlogik in `lib/price-aggregation.ts`,
`lib/seal-recommendations.ts`, `lib/sds-parser.ts`, `lib/sds-ingredients.ts`,
`lib/normalize-search.ts`, `lib/kss-knowledge.ts`, `lib/compliance.ts`.

Stand der Seed-Daten (laut Projekt-Memory): 104 Hersteller, 920 Produkte, 3270 SDS.

### 5.1 Datenmodell-Übersicht

| Modell | Rolle | Wichtige Relationen |
|---|---|---|
| `Manufacturer` | Hersteller/Marke (Katalog-Wurzel) | → `Product[]`, `SafetyDataSheet[]`, `Listing[]`, `AdBanner[]`, `User[]` (BrandRep) |
| `Product` | Produkt-Katalogeintrag | → `Manufacturer`, opt. `SafetyDataSheet`, `PriceObservation[]`, `ProductIssue[]`, `MaterialCompatibilityNote[]` |
| `SafetyDataSheet` | Sicherheitsdatenblatt (SDS), geparst | → `Manufacturer?`, `Product[]`, `Listing[]` |
| `PriceObservation` | Einzelne Preis-Beobachtung | → `Product`, opt. submit/verify-`User` |
| `ProductIssue` | Praxis-Problem aus Foren/Herstellern | → `Product`, opt. submit/verify-`User` |
| `MaterialCompatibilityNote` | Freitext-Werkstoffhinweis (produkt- oder allgemein) | → `Product?` |
| `Material` | Dichtungs-/Kunststoffwerkstoff | → `IngredientMaterialCompatibility[]` |
| `Ingredient` | Chemischer Inhaltsstoff (Stoffklasse) | → `IngredientMaterialCompatibility[]` |
| `IngredientMaterialCompatibility` | Bewertete Paarung Ingredient × Material | → `Ingredient`, `Material` |
| `ComparisonAnalysis` | Cache für KI-Vergleiche (Products/Listings) | — |

### 5.2 Hersteller & Produktkatalog

#### Manufacturer (`schema.prisma:178`)

Felder: `id`, `name` (unique, Display, z.B. „Blaser Swisslube"), `slug` (unique,
url-safe), `logoPath` (z.B. `/brand-logos/BlaserSwisslubeLogo.png`), `website`,
`headquartersCountry`/`headquartersCity`/`foundedYear`, `businessFocus`
(`BusinessFocus[]`), `productFamilies` (`String[]`, z.B. `["Blasocut","Vasco"]`),
`description`, `knownForApplications` (`String[]`), `notes`.

`BusinessFocus`-Enum: `COOLANT`, `NEAT_OIL`, `LUBRICANT`, `GREASE`, `CLEANER`,
`CORROSION_PROTECTION`, `CHEMICAL_SUPPLIER`, `ADDITIVE`.

**Seiten:**
- `/manufacturers` (`app/manufacturers/page.tsx`): Grid aller Hersteller (alphabetisch),
  je Karte Logo (`ManufacturerLogo`), HQ, bis zu 3 `businessFocus`-Chips (Label-Map
  `FOCUS_LABEL`) und Counts (`_count` über `products`, `sds`, `listings`).
- `/manufacturers/[slug]` (`app/manufacturers/[slug]/page.tsx`): Herstellerdetail.
  Produkte werden nach `productFamily` gruppiert (Fallback-Key „Sonstige"); pro Produkt
  eine Karte mit `ProductImage`, `ComplianceBadges`, optional Preis-Chip
  (`getCurrentPricesBatch`) und Refraktometer-Chip (`Brix×{factor}`). Zeigt zusätzlich
  Blöcke `productFamilies` („Marken/Familien") und `knownForApplications`, sowie
  Sprungkarten zu `/sds?manufacturer=…` und `/listings?manufacturer=…`.

#### Marken-Schaufenster (Marke-Stufe)

Die Herstellerdetailseite wird zum **offiziellen, verifizierten Schaufenster**, wenn ein
`User` diesen Hersteller offiziell vertritt. Relation `Manufacturer.brandReps` ↔
`User.brandManufacturer` (`@relation("BrandRep")`). Abfrage in
`app/manufacturers/[slug]/page.tsx`:

```ts
const brandRep = await prisma.user.findFirst({
  where: { brandManufacturerId: m.id, membershipTier: "MARKE",
           membershipValidUntil: { gt: new Date() } },
  select: { pseudonym: true, storefrontHeadline: true, about: true },
  orderBy: { membershipValidUntil: "desc" },
});
```

Nur bei aktiver `MARKE`-Membership (Ablauf `membershipValidUntil > now`) erscheint der
Schaufenster-Header (`storefrontHeadline`, `about`), das Badge „Marke" und ein
STOREFRONT-Werbeslot (`AdSlot placement="STOREFRONT"`). Ohne aktiven brandRep ist die
Seite ein neutraler Katalogeintrag. `User.brandManufacturerId` steuert außerdem die
„gesponsert"-Hervorhebung im KSS-Wizard (→ siehe KI-Abschnitt).

#### Product (`schema.prisma:211`)

`@@unique([manufacturerId, slug])`. Felder (vollständig, gruppiert):

- **Identität/Klassifikation:** `name`, `slug`, `productFamily?`,
  `category` (`ProductCategory`, Pflicht), `chemistry` (`ChemistryBase?`), `description?`.
- **Anwendung:** `applicationAreas String[]`, `suitableMaterials String[]`,
  `unsuitableMaterials String[]`, `productionType` (`ProductionType?`),
  `concentrateForm` (`CoolantConcentrateForm?`).
- **Praxis-Bezug:** `criticalIssuesAddressed String[]`, `criticalIssuesKnown String[]`.
- **KSS-Kennwerte:** `refractometerFactor Float?` (Brix × Faktor = % Konz.),
  `recommendedConcentrationMin/Max Float?` (% v/v), `typicalSumpLifeWeeks Int?`
  (Standzeit im **Tank**), `phConcentrate`, `phEmulsionMin/Max`.
- **Physik:** `densityGcm3`, `flashpointC Int?`, `viscosityIso String?` (ISO VG),
  `viscosityKv40`, `viscosityKv100`.
- **Ansetzwasser:** `waterHardnessMinDh/MaxDh Int?`, `waterHardnessNotes`.
- **Freigaben:** `certifications String[]` (z.B. „FDA H1", „DIN 51385", „TRGS 611").
- **Markierungen (tri-state Boolean?):** `containsBor`, `containsFormaldehydeDepot`,
  `containsMineralOil`, `containsChlorine`, plus `mineralOilContentPct Float?`.
- **Quellen:** `sourceUrl`, `dataSheetUrl` (PDS), `sdsUrl`, `sourceConfidence`
  (Freitext: „verifiziert" | „modelliert" | „geschätzt" | „hersteller-doku").
- **Verknüpfung SDS:** `safetyDataSheetId?` + Relation `safetyDataSheet` (SetNull).
- **Suche:** `searchTokens String?` (→ 5.7).

`ProductCategory`-Enum (15 Werte): `COOLANT_WATER_MIX`, `COOLANT_NEAT`, `GRINDING_OIL`,
`EDM_FLUID`, `HYDRAULIC_OIL`, `GEAR_OIL`, `COMPRESSOR_OIL`, `SLIDEWAY_OIL`,
`FORMING_OIL`, `CLEANER`, `CORROSION_PROTECTION`, `GREASE`, `SPECIALTY`, `ADDITIVE`,
`OTHER`.
`ChemistryBase`: `MINERAL`, `SYNTHETIC`, `SEMI_SYNTHETIC`, `ESTER`, `PAG`, `OTHER`.
`ProductionType`: `CONTRACT_MANUFACTURING`, `SERIAL_PRODUCTION`, `MIXED`.
`CoolantConcentrateForm`: `CONVENTIONAL_EMULSION`, `SEMI_SYNTHETIC`, `FULL_SYNTHETIC`,
`TWO_COMPONENT`.

**Es gibt keine Produkt-Listenseite** (`/products` existiert nicht). Produkte werden nur
über `/products/[manufacturerSlug]/[productSlug]` (Detail) und über
`/products/[manufacturerSlug]/[productSlug]/tds` (TDS-Ansicht) erreicht; Einstiege sind
Herstellerseite, Preisliste, Wissensseite, SDS-Detail, Vergleich.

**Produktdetailseite** (`app/products/[manufacturerSlug]/[productSlug]/page.tsx`)
aggregiert nahezu die gesamte Wissensbasis für ein Produkt:
- Header mit `sourceConfidence`-Chip und `ComplianceBadges`; CTA „Alternative finden"
  (→ `/rfqs?alt=…`).
- **PriceBanner** (prominente Richtwert-Karte, → 5.4) + **PriceSection** (Chart + Historie).
- **TcoCalculator** (nur `COOLANT_WATER_MIX`): €/Jahr aus Preis × Konzentration × Standzeit.
- **SealCompatibilitySection** (berechnete Dichtungsempfehlung, → 5.6).
- **LinkedSdsCard** (verknüpftes SDS: Signalwort, GHS-Piktogramme, H-Sätze, Physik-Werte,
  Inhaltsstoff-Flags, → 5.3).
- **ProductIssuesSection** (Praxis-Probleme, → 5.5).
- Technische-Daten-`dl` (alle o.g. Kennwerte), Ansetzwasser-Block, allgemeine
  Werkstoff-Hinweise (`MaterialCompatibilityNote` scope=`general`), Quellen-Links, sowie
  `RefractometerCalculator` (rechte Spalte).

`ComparisonAnalysis` (`schema.prisma:312`) cached KI-Vergleichsergebnisse, `cacheKey` =
sha256 der sortierten IDs, `scope` = „listings" | „products", `source` =
„anthropic-claude" | „heuristic-fallback" (→ Detail im KI-Abschnitt).

### 5.3 SafetyDataSheet (SDS) — geparste Felder

#### Modell (`schema.prisma:1094`)

Stammdaten: `manufacturer` (Freitext, **deprecated**), `manufacturerId?` + Relation
`manufacturerRef` (SetNull), `productName`, `category` (`SdsCategory`), `language`
(`SdsLanguage`, default `DE`), `version?`, `revisionDate?`, `sourceUrl`, `filePath`,
`fileSizeBytes`, `sha256` (**unique**), `pageCount?`, `extractedText?` (pdftotext-Volltext),
`searchTokens?`, `fetchedAt`. `parsedAt?` + `parsedVersion?` als Parser-Metadaten.

`SdsCategory`: `WATER_MISCIBLE_COOLANT`, `NEAT_CUTTING_OIL`, `GRINDING_OIL`,
`HYDRAULIC_OIL`, `GEAR_OIL`, `MOTOR_OIL`, `GREASE`, `OTHER`.
`SdsLanguage`: `DE`, `EN`, `FR`, `IT`, `OTHER`.

Aus `extractedText` geparste Strukturfelder (befüllt via `lib/sds-parser.ts`):

| Bereich | Felder |
|---|---|
| GHS/CLP (Abschn. 2) | `hStatements String[]` (z.B. „H226"), `pStatements String[]` (z.B. „P305+P351+P338"), `ghsPictograms String[]` (`GHS01`–`GHS09`), `signalWord?` |
| Physikochemie (Abschn. 9) | `physicalState?`, `appearanceColor?`, `odor?`, `phValue Float?`, `phContext?`, `flashpointC Float?`, `densityGcm3 Float?`, `viscosityKv40 Float?`, `pourpointC Float?`, `boilingPointC Float?`, `waterSolubility?` |
| Inhaltsstoffe (Abschn. 3) | `casNumbers String[]` |
| REACH/SVHC | `reachCompliant Boolean?`, `reachNotes?`, `svhcSubstances String[]` |
| Inhaltsstoff-Flags (tri-state) | `containsBoron`, `containsFormaldehydeReleaser`, `containsSecondaryAmines`, `containsChlorinatedParaffins`, `containsMineralOil`, `containsPrimaryAromaticAmines` |
| Biozide | `hasBactericide Boolean?`, `hasFungicide Boolean?`, `biocidalActives String[]` |
| Entsorgung/Gewässer | `wgkClass?` (Wassergefährdungsklasse), `avvCode?` (Abfallschlüssel) |
| Transport (Abschn. 14) | `adrClass?`, `unNumber?`, `transportClass?` |
| Lieferant (Abschn. 1) | `supplierName?`, `supplierAddress?`, `emergencyPhone?` |

> Hinweis: `wgkClass` und `avvCode` sind im Schema definiert, werden vom aktuellen Parser
> (`lib/sds-parser.ts`) aber **nicht** befüllt und auf der SDS-Detailseite nicht angezeigt.
> `supplierName`/`supplierAddress` setzt der Parser bewusst auf `null` („schwer ohne
> Layout-Wissen").

#### Parser `lib/sds-parser.ts` (`PARSER_VERSION = "1.1"`)

`parseSdsText(text)` → `ParsedSds`. Rein heuristisch/regex-basiert auf der 16-Abschnitt-
Standardstruktur (DE+EN-tolerant), deckt laut Kommentar ~80 % der EU-Standard-SDS ab.
Kernfunktionen:
- `extractStatements` mit Regex `\bH\d{3}[A-Za-z]?\b`, `\bP\d{3}(?:\s*\+\s*P\d{3})*\b`,
  `\bGHS0[1-9]\b` (dedupliziert, Whitespace entfernt).
- `extractSignalWord`: „Signalwort: Gefahr/Achtung" bzw. „Signal word: Danger/Warning",
  Fallback Standalone in Section-2-Region.
- `extractPh`, `extractFlashpoint` (2–3-stellig, 0<v<1000), `extractDensity`
  (Plausibilität 0.5–2.5 g/cm³), `extractViscosity` (40 °C-Wert), `extractPourpoint`,
  `extractBoilingPoint`, `extractSolubility`.
- `extractCasNumbers`: Regex `\b\d{2,7}-\d{2}-\d\b` **plus CAS-Prüfziffer-Validierung**
  (`isValidCas`: gewichtete Quersumme mod 10 == Prüfziffer).
- `extractTransport`: UN-Nummer, ADR-Klasse; erkennt „kein Gefahrgut"/„Not regulated".
- `extractEmergencyPhone`.

#### Inhaltsstoff-/REACH-Heuristik `lib/sds-ingredients.ts`

`detectIngredientFlags(text, casNumbers)` → `IngredientFlags`. Kombiniert **CAS-Kataloge**
(zuverlässig) mit **Klartext-Mustern** (für < 1 % gelistete Stoffe) und **Negativ-Aussagen**
(„borfrei", „chlorfrei", …). Katalog-Konstanten enthalten u.a. `BORON_CAS` (z.B.
10043-35-3 Borsäure), `FORMALDEHYDE_RELEASER_CAS` (Bronopol, DMDM-Hydantoin, Grotan/Triazin),
`SECONDARY_AMINE_CAS` (DEA, Morpholin), `PAA_CAS`, `CHLORINATED_PARAFFIN_CAS` (SCCP/MCCP),
`MINERAL_OIL_CAS`, `BACTERICIDE_CAS` (MIT/BIT/CMIT…), `FUNGICIDE_CAS` (IPBC, Pyrithion),
`SVHC_CAS`.

Tri-state-Logik: Positiv-Treffer (CAS **oder** Text) ⇒ `true`; sonst explizite
„X-frei"-Aussage ⇒ `false`; sonst `null`. Positiv gewinnt bei Widerspruch.
`reachCompliant` = `true` bei REACH-Konform-Muster ohne Negativ-Muster, `false` bei
Negativ-Muster, sonst `null`. `reachNotes` fasst SVHC-Fund/„keine SVHC"/„manuell prüfen"
zusammen. `EMPTY_FLAGS` bei Text < 100 Zeichen.

#### SDS-Seiten & Routen

- `/sds` (`app/sds/page.tsx`): Bibliothek mit `FilterBar`. Filter: `manufacturer`
  (contains, insensitive), `category`, und **Tri-state-Chemie-Filter** (`triFilter`:
  ""→undefined, „yes"→true, „no"→false, „null"→null) für `reachCompliant`,
  `containsBoron`, `containsFormaldehydeReleaser`, `containsSecondaryAmines`,
  `containsChlorinatedParaffins`, `containsMineralOil`, `hasBactericide`, `hasFungicide`;
  SVHC via `svhcSubstances isEmpty`. Suche: `buildSearchWhere("searchTokens", q)` mit
  OR-Fallback auf `extractedText contains q` (ab 3 Zeichen). Trefferliste zeigt farbige
  `Pill`s je Flag. `take: 200`.
- `/sds/[id]` (`app/sds/[id]/page.tsx`): Detailansicht mit Sektionen REACH/Inhaltsstoffe,
  GHS/CLP (Piktogramme via `GhsPictogram`/`GHS_NAMES`, H-/P-Sätze), Physik/Chemie,
  CAS-Nummern (verlinkt zu commonchemistry.cas.org), Transport, Lieferant. Zeigt außerdem
  verknüpfte `products` und aktive `listings`. `hasParsedData`-Gate blendet Parser-Sektionen
  ein.
- `GET /api/sds/[id]/download` (`?inline=1` optional): liefert das PDF von `filePath`.
  **Path-Traversal-Schutz:** `abs` muss unter `data/sds/` liegen, sonst 400; fehlende
  Datei → 410. Content-Disposition attachment/inline.
- Es gibt **keine** eigene `/api/sds`-Listen-Route (nur `[id]/download`); Listen laufen
  serverseitig über Prisma in der Page.
- `GHS_NAMES` (`components/GhsPictogram.tsx`): Mapping `GHS01`–`GHS09` auf deutsche Namen
  („Explosiv", „Entzündbar", … „Umweltgefährlich"); Piktogramme sind Inline-SVG.

### 5.4 PriceObservation & Preis-Aggregation

#### Modell (`schema.prisma:829`)

`productId` (→ `Product`, Cascade), `observedAt` (Beobachtungsdatum, historisch möglich),
`pricePerUnit Float`, `unit` (`PriceUnit`, default `EUR_PER_L`), Mengenstaffel
`quantityMin/Max`, `packagingForm?`, `regionCode?` (ISO-2), `source` (`PriceSource`),
`status` (`PriceStatus`, default `PENDING`). Submission: `submittedByUserId?`,
`submittedAt`. Verifizierung: `verifiedByUserId?`, `verifiedAt?`, `rejectionReason?`.
Provenienz: `sourceUrl?`, `sourceLabel?`, `notes?`. `transactionId?` (unique, für aus
Transaktion abgeleitete Preise). Indizes u.a. `[productId, status, observedAt]`.

Enums:
- `PriceSource`: `USER_SUBMITTED`, `TRANSACTION`, `LIST_PRICE`, `DISTRIBUTOR_QUOTE`,
  `AGGREGATED`, `SEED_INDICATIVE`.
- `PriceStatus`: `PENDING`, `VERIFIED`, `REJECTED`.
- `PriceUnit`: `EUR_PER_L`, `EUR_PER_KG`, `EUR_PER_PIECE`, `CHF_PER_L`, `CHF_PER_KG`,
  `USD_PER_L`, `USD_PER_KG`.

#### WICHTIG: Alle aktuellen Preise sind Demo-Seed, nie „geprüft"

Der Seed (`prisma/seed-price-observations.ts`) erzeugt für die ersten 200 Produkte je 30
monatliche Datenpunkte über 5 Jahre mit reproduzierbarem `seededRandom` (Basis-Preis aus
Kategorie-`BANDS`, Trend +10..30 %, ±3 % Monatsrauschen). Diese Datensätze tragen
`source: "SEED_INDICATIVE"` **und** `status: "VERIFIED"` sowie `sourceLabel:
"Indikative Marktwerte (Brisco Demo)"`. Da die Aggregation ausschließlich nach
`status = "VERIFIED"` filtert, speisen sich alle angezeigten „Marktpreise" faktisch aus
diesen modellierten Demo-Daten.

Konsequenz für die UI-Sprache (durchgängig eingehalten): Preise heißen **„Indikative
Richtwerte"** / **„modelliert"**, nie „geprüft"/„verifiziert":
- `/prices` Seitentitel „Indikative Richtwerte" (`app/prices/page.tsx:41`,
  i18n `prc.title`), Warnbanner „modellierte Richtwerte" (`prc.explainStrong`).
- Produktdetail-PriceSection: „⚠ **Indikative Richtwerte** — modelliert, keine bestätigten
  Marktpreise." Header „Indikativer Richtwert & Verlauf".
- Herstellerseite Preis-Chip title „Indikativer Richtwert (modelliert)".
- Concierge-Systemprompt (`app/api/concierge/route.ts:160`) instruiert explizit, die Preise
  nie „geprüfte"/„verifizierte" zu nennen.

#### `lib/price-aggregation.ts`

FX-Normalisierung (`FX_TO_EUR`, „vereinfachte Raten für Demo"): `EUR 1.0`, `CHF 1.05`,
`USD 0.92`. `normalizeToEurPerL(price, unit)` splittet `unit` (`CUR_PER_BASE`), multipliziert
mit FX-Faktor und liefert `{ value, unitLabel }` mit `unitLabel` ∈ „EUR/L" | „EUR/kg" |
„EUR/Stk" (nur Währungsumrechnung; L↔kg wird **nicht** konvertiert). `median()` ist ein
klassischer Median (gerade Länge → Mittel der zwei mittleren).

Exportierte Aggregatoren (alle nur `status:"VERIFIED"`):
- `getMonthlyMedianHistory(productId, months=60)`: Zeitreihe, ein Punkt/Monat
  (`{ month:"2025-03", monthLabel:"Mär 25", medianEur, count, unitLabel }`), gruppiert per
  Jahr-Monat, deutsche Monatskürzel.
- `getCurrentMarketPrice(productId)`: **kaskadiertes Median-Fenster** — probiert 60 → 180
  → 365 Tage, nimmt das erste Fenster mit ≥ 1 Beobachtung. Liefert
  `{ median, unitLabel, observationCount, windowDays, min, max, confidence }`.
- `getCurrentPricesBatch(productIds)`: dieselbe 60/180/365-Logik, aber eine einzige Query
  (365-Tage-Fenster) + JS-Gruppierung; liefert `Map<productId, CurrentMarketPrice|null>`.

**Konfidenz** ist rein fenster-, nicht datenqualitätsbasiert:
`confidence = windowDays===60 ? "high" : windowDays===180 ? "medium" : "low"`.
D.h. „high" heißt nur „es gab Beobachtungen in den letzten 60 Tagen". UI zeigt sie als
Ampel-Badge (emerald/amber/red).

#### Preisseiten & Schreib-/Verifizier-Routen

- `/prices` (`app/prices/page.tsx`): Tabelle aller Produkte mit verifizierten
  Beobachtungen. Ermittelt zuerst `productIds` via
  `priceObservation.findMany({ where:{status:"VERIFIED"}, distinct:["productId"] })`, lädt
  Produkte (+Filter category/Suche), dann `getCurrentPricesBatch`. Filter: Suche
  (`buildSearchWhere`), `category`, Preis-Presets (`price=5-10`, `50-` = ab 50), Sort
  (price-asc/desc/name/manufacturer). **„Nur ähnliche Produkte"** (`similar`=CSV von IDs):
  Referenz-Produkte definieren Kategorie (Pflicht) + ISO-VG-Klasse + Chemie-Basis;
  ausgeschlossen wird nur, was **nachweislich** abweicht (Produkte ohne Angabe bleiben
  sichtbar). `extractVgClasses` liest ISO-VG nur aus `viscosityIso`, nie aus dem Namen.
  Ausgabe kappt bei 200 Zeilen.
- `POST /api/prices/submit` (`app/api/prices/submit/route.ts`): Login-pflichtig. Validiert
  `productId`/`pricePerUnit`/`unit`, Preis 0<x≤100000, Datum nicht Zukunft/nicht > 10 Jahre
  alt. Legt Beobachtung mit `source:"USER_SUBMITTED"`, `status:"PENDING"`,
  `submittedByUserId` an. UI-Einstieg: `PriceSubmitLauncher` auf der Produktseite.
- `POST /api/prices/verify` (`app/api/prices/verify/route.ts`): nur `role==="ADMIN"` **oder**
  `trustTier` ∈ {`TRADE_ASSURED`,`PREMIUM`}. `action:"approve"|"reject"` setzt Status
  `VERIFIED`/`REJECTED` + `verifiedByUserId`/`verifiedAt`; **eigene Meldung nicht selbst
  verifizierbar** (409); nur `PENDING` bearbeitbar.
- `/dashboard/prices` (`app/dashboard/prices/page.tsx`): Verifizierungs-Queue (gleiche
  Rechteprüfung), listet `PENDING`-Meldungen mit `PriceVerifyActions`, plus Zähler
  verifiziert/abgelehnt.

### 5.5 ProductIssue — reale Praxis-Probleme

#### Modell (`schema.prisma:1238`)

Zweck (Schema-Kommentar): „Praxis-Probleme aus Foren, Hersteller-Hinweisen, Distributoren,
Reviews" — was in Datenblättern fehlt. Felder: `productId` (→ `Product`, Cascade),
`category` (`IssueCategory`), `severity` (`IssueSeverity`, default `MEDIUM`), `status`
(`IssueStatus`, default `PENDING`), `title`, `description`, `symptoms String[]`,
`rootCause?`, `workaround?`, `preventiveMeasure?`; Kontext `affectedMaterials String[]`,
`affectedOperations String[]`, `reportedConcentration Float?`, `reportedPh Float?`,
`reportedWaterHardness Int?`; Provenienz `sourceType` (`IssueSourceType`), `sourceUrl?`,
`sourceTitle?`, `sourceAuthor?`, `sourceDate?`; `language` (`SdsLanguage`); Trust
`submittedByUserId?`, `verifiedByUserId?`, `verifiedAt?`, `isOfficial Boolean`
(Hersteller-Doku), `reportCount Int` (default 1, „similar issues merged").

Enums:
- `IssueCategory` (14): `BIOLOGY`, `FOAM`, `CORROSION`, `TOOL_WEAR`, `OPERATOR_HEALTH`,
  `SEAL_DAMAGE`, `WORKPIECE_STAINS`, `RESIDUES`, `FILTRATION`, `STABILITY`, `PERFORMANCE`,
  `COMPATIBILITY`, `REGULATORY`, `SHELF_LIFE`, `OTHER`.
- `IssueSeverity`: `LOW`, `MEDIUM`, `HIGH`.
- `IssueSourceType` (Herkunft): `FORUM` (industryarena, praktiker.com, cnczone,
  r/Machinists…), `MANUFACTURER`, `DISTRIBUTOR`, `CASE_STUDY`, `REVIEW`, `REGULATORY`
  (BAuA/ECHA/TRGS), `SDS`, `USER_REPORT`, `OTHER`.
- `IssueStatus`: `PENDING`, `VERIFIED`, `RESOLVED` (in neuerer Formulierung behoben),
  `REJECTED`.

#### Seite `/wissen` (`app/wissen/page.tsx`)

Zeigt alle Issues mit `status != REJECTED`. Filter: `category`-Chips (Label-Map
`CATEGORY_LABEL`, deutsch) und Volltextsuche über `title`/`description` (contains,
insensitive) + `symptoms has`. Sortierung `severity desc, reportCount desc, createdAt desc`,
`take: 80`. Karten zeigen Severity-Badge (`SEVERITY`: HIGH „Kritisch"/rose,
MEDIUM „Beachten"/amber, LOW „Hinweis"/slate), Kategorie, „Hersteller"-Badge bei
`isOfficial`, `reportCount`, verknüpftes Produkt, `symptoms`-Chips, `rootCause`-Box,
`workaround`/`preventiveMeasure`-Tipp, betroffene Materialien und Quelle
(`sourceUrl`/`sourceTitle`). Hero verlinkt auf `/wissen/gefahrensymbole` (GHS-Erklärseite).

Auf der Produktseite: `ProductIssuesSection` mit Issues `status ∈ {VERIFIED, PENDING}`,
sortiert `severity asc, isOfficial desc, reportCount desc`.

Es gibt **keine** UI-/API-Route zum Erfassen/Verifizieren von Issues — die Felder
`submittedBy/verifiedBy` existieren, werden aber nur per Seed befüllt (Schema-Ebene ohne UI).

### 5.6 Verträglichkeitsmatrix (Dichtungen/Kunststoffe)

#### Modelle (`schema.prisma:397–478`)

- `Material`: `slug` (unique), `name`, `shortName`, `category` (`MaterialCategory`),
  `description?`, `typicalUseCases String[]`, `temperatureMinC/MaxC`, `isPolar Boolean?`
  (similia similibus solvuntur), `parentSlug?` (Untertyp→Familie), `sourceUrl/Label`, `notes`.
  `MaterialCategory`: `ELASTOMER`, `THERMOPLASTIC`, `THERMOSET`, `METAL`, `COATING`.
- `Ingredient`: `slug` (unique), `name`, `shortName?`, `category` (`IngredientCategory`),
  `casNumbers String[]`, `functionInFluid?`, `typicalConcentrationPct?`,
  `isSvhc Boolean` (default false), `description?`, `sourceUrl/Label`.
  `IngredientCategory` (20): `AMINE`, `BIOCIDE`, `FORMALDEHYDE_RELEASER`,
  `BASE_OIL_MINERAL`, `BASE_OIL_ESTER`, `BASE_OIL_PAO`, `BASE_OIL_PAG`, `EMULSIFIER`,
  `EP_ADDITIVE_S`, `EP_ADDITIVE_P`, `EP_ADDITIVE_CL`, `CORROSION_INHIBITOR`, `BORATE`,
  `CHELATE`, `GLYCOL_ETHER`, `SOLVENT_AROMATIC`, `SOLVENT_POLAR`, `WATER`, `ACID`,
  `ALKALI`, `OTHER`.
- `IngredientMaterialCompatibility`: `@@unique([ingredientId, materialId])`. Felder:
  `rating` (`MaterialCompatibility`), `effectType?` (`EffectType`), `swellPctMin/Max Float?`
  (erwartete Volumenquellung %), `conditionNote?`, `note` (Mechanismus/Wirkung),
  `sourceUrl?`, `sourceLabel?` (z.B. „ISM Compatibility Chart"), `confidence?`
  („verifiziert"|„indikativ"|„geschätzt").
  `MaterialCompatibility`: `RECOMMENDED`, `COMPATIBLE`, `CAUTION`, `UNSUITABLE`.
  `EffectType`: `SWELLING`, `SHRINKAGE`, `HARDENING`, `EMBRITTLEMENT`, `EXTRACTION`,
  `ATTACK_NETWORK`, `NONE`.

Seed `prisma/seed-materials.ts` (idempotent per `slug`-upsert, Matrix delete-then-insert):
14 Materialien (Elastomere NBR/HNBR/EPDM/FKM/FKM-Peroxide/FFKM/Silicone-VMQ/FVMQ/PUR,
Thermoplaste PTFE/PA6/POM/PP/PE-HD) und 21 Inhaltsstoffe (Ethanolamine, Morpholin,
Bronopol, DMDM-Hydantoin, Triazin, MIT/BIT, Mineral-/Ester-/PAG-/Phosphatester-Öl,
Borsäure/Borat, Chlorparaffin, Schwefel-EP, Butylglykol, anion. Tensid, Heißwasser,
Carbonsäure, Tolyltriazol). Quellen: ISM Compatibility Chart, Trelleborg, Parker Praedifa,
O-Ring Prüflabor Richter.

#### Seiten `/materials`, `/materials/[slug]`

- `/materials` (`app/materials/page.tsx`): Tabs „nach Material" / „nach Inhaltsstoff",
  plus die **volle Matrix** (`CompatibilityMatrix`): Zeilen = Ingredients, Spalten =
  Materials, Zellen = `rating`-Icon farbcodiert (`RATING_STYLE`), Tooltip = `note`.
  Ingredient-Karten zeigen SVHC-Badge, `functionInFluid`, Kategorie, CAS, typ. Konz.
  Fußzeile nennt Quellen (i18n `mat.sources`): „Bewertungen indikativ — vor Auswahl
  Versuche bei Anwendungstemperatur durchführen."
- `/materials/[slug]` (`app/materials/[slug]/page.tsx`): Material + alle
  `compatibilities` (inkl. `ingredient`), gruppiert nach Rating
  (UNSUITABLE→CAUTION→COMPATIBLE→RECOMMENDED). Pro Eintrag: `note`, `effectType`
  (außer NONE), Quellbereich `swellPctMin/Max`, `conditionNote`, CAS, `sourceLabel`.

#### `lib/seal-recommendations.ts` — Worst-Case-Ableitung

Kern der berechneten Produktempfehlung. Da keine produktspezifische Rezeptur vorliegt, ist
das Ergebnis immer „modelliert".

`inferIngredients(p: ProductForRec)` leitet aus Produktfeldern (`chemistry`, `category`,
`containsBor/-FormaldehydeDepot/-MineralOil/-Chlorine`) die wahrscheinlichen
Ingredient-**Slugs** ab (passend zum Seed-Katalog) samt Begründung (`rationale`):
- `chemistry` MINERAL/SEMI_SYNTHETIC → `mineral-oil`; SYNTHETIC → `mineral-oil`
  (PAO verhält sich ggü. Dichtungen ähnlich); ESTER → `ester-oil`; PAG →
  `polyalkylene-glycol`; `containsMineralOil` → `mineral-oil`.
- `category` COOLANT_WATER_MIX → `water-hot` + `triethanolamine` + `anionic-surfactant`;
  CLEANER → `water-hot` + `anionic-surfactant`.
- Markierungen: `containsBor`→`boric-acid`, `containsFormaldehydeDepot`→`hexahydro-triazine`,
  `containsChlorine`→`chlorinated-paraffin`. Fallback (nichts erkannt) → `mineral-oil`.

`recommendMaterialsForProduct(p)`: lädt die abgeleiteten Ingredients inkl. deren
`compatibilities` + `material`, aggregiert **pro Material die schlechteste Bewertung** über
alle abgeleiteten Inhaltsstoffe (`RATING_ORDER` RECOMMENDED 1 … UNSUITABLE 4, „worst wins").
Berücksichtigt nur Materialkategorien `ELASTOMER` + `THERMOPLASTIC`. Sammelt „Treiber"
(Einträge mit Severität ≥ CAUTION). Liefert `{ recommendations: MaterialRec[],
inferredIngredients }`, sortiert best→schlecht. In der UI (`SealCompatibilitySection`,
Produktseite) als nach Severität gruppierte Werkstoff-Chips mit Begründung und
aufklappbarer „Angenommene Inhaltsstoffe"-Liste; Badge „modelliert".

#### MaterialCompatibilityNote (Freitext-Ebene, `schema.prisma:326`)

Separates, freitextliches Werkstoff-Wissen (nicht die Ingredient-Matrix). `productId?` +
`scope` („product" oder „general"). Bei `scope="general"`/`productId=null` = allgemeine
Regel (z.B. „Buntmetall + pH > 9.5 → Verfärbung"). Felder: `material` (Freitext-Werkstoff,
z.B. „Aluminium", „Buntmetall"), `compatibility` (`MaterialCompatibility`), `condition?`,
`note`, `sourceUrl/Label`. Wird auf der Produktseite als „Allgemeine Werkstoff-Hinweise"
gezeigt (Match über `suitableMaterials`+`unsuitableMaterials` bzw. „Ansetzwasser (Allgemein)").

### 5.7 searchTokens & `lib/normalize-search.ts`

Mehrere Modelle (`Product.searchTokens`, `SafetyDataSheet.searchTokens`) tragen einen
normalisierten Suchindex (lowercase, alle Trennzeichen entfernt), damit z.B. „bcool755" auf
„B-Cool 755" matcht. Gepflegt beim Seed/Backfill.

Funktionen in `lib/normalize-search.ts`:
- `normalizeForSearch(input)`: lowercase → NFD → Diakritika entfernen →
  `replace(/[^a-z0-9]/g, "")`. Wird beim Indexieren **und** beim Suchen angewandt, damit
  SQL-`contains` funktioniert.
- `buildSearchTokens({ productName, manufacturer, version })`: normalisiert die
  zusammengefügten Felder zu einem String.
- `tokenizeQuery(input)`: splittet an `[\s,;]+`, normalisiert je Token, verwirft Tokens
  < 2 Zeichen. „blaser bcool 755" → `["blaser","bcool","755"]`.
- `buildSearchWhere(field, query)`: baut Prisma-`{ AND: [...] }` — **jeder** Token muss per
  `contains` gegen das Feld matchen (Token-**AND**, Reihenfolge egal). Liefert `null` bei
  leerer Query (Caller überspringt Filter dann). Genutzt in `/prices` und `/sds` (dort mit
  OR-Fallback auf `extractedText`).

### 5.8 KSS-Vokabular `lib/kss-knowledge.ts`

Konstanten für Filter/Wizard (Quellen: helcotec-FAQ, Blaser, TRGS 611, DGUV 109-003,
VKIS/VSI DIN 51385): `APPLICATION_AREAS` (Drehen…Trockenbearbeitung), `MATERIALS`
(Werkstoffliste), `CRITICAL_ISSUES` (Verkeimung, Schaum, Fleckenbildung Buntmetall,
Nitrit > 20 mg/l …), `CERTIFICATIONS` (Code+Label: TRGS-611, NSF-H1/H2, WGK-1/2, diverse
OEM-Freigaben …), `PRODUCTION_TYPES`, `COOLANT_FORMS`, `WIZARD_QUESTIONS`
(Frageablauf des KSS-Wizards, → siehe KI-Abschnitt).

`lib/compliance.ts` (`complianceBadges`) leitet daraus die Chip-Siegel an
Produktkarten/-seiten ab: „borfrei"/„formaldehydfrei"/„chlorfrei"/„mineralölfrei" nur bei
Feld explizit `false`; „NSF/FDA H1" und „TRGS 611" aus `certifications`-Regex. Rendering in
`components/ComplianceBadges.tsx`.

---

## 6. KI-Features (Claude/Anthropic-Integration)

Die Plattform nutzt an sechs Stellen die Anthropic-Claude-API. **Jede** KI-Stelle
hat einen deterministischen **Nicht-KI-Fallback** (Heuristik/Regelwerk), der ohne
`ANTHROPIC_API_KEY`, ohne Anmeldung, ohne Credits oder bei jedem API-Fehler
einspringt — beide Pfade müssen bauzeitlich lauffähig bleiben. Aufgerufen wird das
SDK `@anthropic-ai/sdk` (lazy import in den Route-Handlern, direkter Top-Level-Import
in den lib-Modulen). Der Client wird mit dem Nullargument-Konstruktor `new Anthropic()`
erzeugt (liest `ANTHROPIC_API_KEY` aus `process.env`); in `lib/alternatives.ts` und
`lib/alternative-search.ts` wird der Key zusätzlich explizit übergeben
(`new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`).

> **Bau-Hinweis (verbindlich):** Vor jeder Änderung an Modell-IDs, `max_tokens`,
> Tool-Definitionen oder anderen Anthropic-Parametern die **`claude-api`-Skill**
> konsultieren, statt sich auf das Gedächtnis zu verlassen. Die im Code stehenden
> Modell-IDs (`claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, das Web-Such-Werkzeug
> `web_search_20260209`) sind unten als Ist-Zustand dokumentiert — sie sind die
> Referenz für den Nachbau, nicht als „sollte man aktualisieren“ zu verstehen.

### 6.0 Übersicht der sechs KI-Aufrufstellen

| # | Feature | Route/Modul | Modell (Ist) | max_tokens | Web-Suche | Credit-Aktion | `feature`-Key (Usage) | Cache |
|---|---------|-------------|--------------|-----------:|-----------|---------------|-----------------------|-------|
| 1 | KSS-Wizard | `app/api/kss-wizard/route.ts` | `claude-haiku-4-5-20251001` | 2500 | nein | `kssWizard` (1) | `kss_wizard` | – |
| 2 | KI-Concierge | `app/api/concierge/route.ts` | `claude-haiku-4-5-20251001` | 1000 | nein | `concierge` (1) | `concierge` | – |
| 3 | Vergleichs-Analyse | `lib/comparison-analysis.ts` | `claude-haiku-4-5-20251001` | 2000 | nein | **keine** | `comparison` | `ComparisonAnalysis` (sha256) |
| 4 | Alternativen (Angebote, SDS) | `lib/alternatives.ts` | `claude-haiku-4-5-20251001` | 2500 | nein | `alternatives` (1) | `alternatives` | – |
| 5 | Alternativen (Web-Recherche) | `lib/alternative-search.ts` | `claude-sonnet-4-6` | 1500 | **ja** (`web_search_20260209`, `max_uses: 4`) | `alternativesWeb` (2) | `alt_search` | – |
| 6 | Kontaktdaten-Filter (KI-Stufe) | `lib/contact-filter.ts` | `claude-haiku-4-5-20251001` | 150 | nein | **keine** (Brisco trägt Kosten) | `contact_filter` | – |

Alle sechs Stellen rufen nach erfolgreichem Claude-Aufruf `recordAiUsage(...)` auf
(→ Abschnitt 6.8). Vier Stellen buchen KI-Credits ab (→ Abschnitt 3 „KI-Credits“);
Vergleichs-Analyse und Kontaktfilter buchen **nicht** ab.

---

### 6.1 KSS-Wizard (Aushängeschild)

**Zweck:** Mehrstufiger geführter Dialog, der aus Käufer-Anforderungen die Top-3-
Kühlschmierstoff-Alternativen aus dem **eigenen Katalog** wählt und begründet.
**Auslöser:** Komponente `components/KssWizardDialog.tsx` (Titel „KSS-Berater
(KI-Wizard)“), 6 Schritte (`TOTAL_STEPS = 6`), Abschluss-Button „KI-Empfehlung holen“
→ `POST /api/kss-wizard`. Ein separater Tipp-Suchpfad
`GET /api/kss-wizard/search?q=…` liefert das aktuelle Produkt (Schritt 1).

**Dialog-Schritte (Client-State `WizardState`):**
1. Zufriedenheit (`satisfied`: true/false/null) + aktuelles Produkt (`currentProductId`,
   Typeahead, ab 2 Zeichen, 250 ms Debounce). Sprach-Eingabe in Schritt 2 via
   Browser-`SpeechRecognition` (`de-DE`, kein Server-Anteil).
2. Freitext-Problembeschreibung (`problemDescription`).
3. Bearbeitungsverfahren (`applicationAreas`, Mehrfach) — Optionen aus
   `APPLICATION_AREAS`.
4. Werkstoffe (`materials`) — aus `MATERIALS`.
5. Produktionsart (`productionType`) + KSS-Form (`concentrateForm`, Optionen
   `PRODUCTION_TYPES`/`COOLANT_FORMS`) + Wasserhärte (`waterHardness`, °dH).
6. Kritische Punkte (`criticalIssues`, aus `CRITICAL_ISSUES`) + Zertifizierungen
   (`certifications`, aus `CERTIFICATIONS`).

Alle Vokabulare liegen in `lib/kss-knowledge.ts` (→ Abschnitt 6.7).

**Eingabe (Body `WizardAnswers`):** die o.g. Felder plus optional `unsureDimensions`.
**Server-Verarbeitung `POST /api/kss-wizard`:**
1. Referenz-Produkt laden (falls `currentProductId`).
2. **Kandidaten-Pool:** alle Produkte mit `category ∈ {COOLANT_WATER_MIX,
   COOLANT_NEAT, GRINDING_OIL}`, ohne das aktuelle Produkt.
3. **Heuristisches Pre-Scoring** (`score`, Start 50): +8 gesponsert (aktive
   Marke-Stufe, `sponsoredManufacturerIds()` aus `lib/storefront`), +5/Verfahren,
   +5/Werkstoff, +10 Produktionsart, +15 KSS-Form, +7/kritischer Punkt,
   +8/Zertifizierung; Abzüge bei Nicht-Überlappung. Sortierung, `topCandidates =
   scored.slice(0, 12)`.
4. **KI-Pfad** nur wenn `hasKey && topCandidates.length > 0 && aiAllowed`.
   `aiAllowed` setzt eine erfolgreiche `chargeForAiAction(userId, "kssWizard")`
   voraus (1 Credit). Ohne Login/Credits/Zugang → `creditNotice` + Heuristik.
5. `callAnthropic(...)`: Modell `claude-haiku-4-5-20251001`, `max_tokens: 2500`,
   System-Prompt „erfahrener KSS-Berater“, fordert **ausschließlich JSON**
   `{recommendations:[{productId, reason, matchScore}], summary}`. Der Prompt
   verlangt kritische Analyse des Freitexts (z. B. „kippt nach 3 Wochen“ →
   Bakterien-/Pilzbefall), Ehrlichkeit wenn kein KSS-Problem, schwächere Gewichtung
   bei `unsureDimensions`. JSON wird per `text.match(/\{[\s\S]*\}/)` extrahiert.
6. Top-3 auf volle Produktdaten gemappt, je Empfehlung `computeSealWarning(prod)`
   über `recommendMaterialsForProduct` (`lib/seal-recommendations`) — Dichtungs-
   Warnung (UNSUITABLE/CAUTION).

**Fallback `heuristicFallback(topCandidates)`:** Top-3 des Pre-Scorings, `reason` =
zusammengefügte Heuristik-Gründe, `matchScore = min(100, score)`, plus dieselbe
Dichtungs-Warnung.

**Fehlerpfad:** wirft `callAnthropic`, wird `refundAiAction(userId, "kssWizard")`
aufgerufen und `creditNotice = "KI vorübergehend nicht verfügbar — dein Credit wurde
erstattet."`, dann Heuristik.

**Ausgabe:** `{recommendations, summary, source: "anthropic-claude" |
"heuristic-fallback", creditNotice, candidatePoolSize, consideredTop}`. Jede
Empfehlung: `productId, productSlug, manufacturerSlug, productName, manufacturer,
reason, matchScore (0–100), sealWarning?, sponsored?`. `sponsored` MUSS in der UI
gekennzeichnet werden (P2B-VO 2019/1150, Art. 5 — Badge „Gesponsert“ in `ResultView`).

---

### 6.2 KI-Concierge (digitaler Fachberater)

**Zweck:** Freitext-Chat-Berater, der aus der DB passende Produkte/Angebote/Praxis-
Wissen zusammensucht und Claude eine kurze, mit Markdown-Links versehene Antwort
formulieren lässt. **Auslöser:** schwebendes Widget `components/ConciergeWidget.tsx`
(unten rechts), sendet die letzten 12 Nachrichten an `POST /api/concierge`.

**Eingabe (zod-validiert):** `{messages: [{role: "user"|"assistant", content:
string(1–2000)}]}`, 1–20 Einträge. **Kontext-Sammlung `gatherContext(query)`:**
Stichwörter der letzten Nutzer-Nachricht (Füllwörter/Stoppwörter raus, max 8),
parallele Suche in `Product` (Token-Where via `buildSearchWhere("searchTokens", …)`
aus `lib/normalize-search`, `name`, `applicationAreas`, `suitableMaterials`; max 5),
aktive `Listing` (max 5), `ProductIssue` (max 4). `contextText(ctx)` serialisiert das
mit relativen Link-Pfaden.

**KI-Pfad `askClaude`:** nur wenn `process.env.ANTHROPIC_API_KEY && session?.user?.id`
**und** `chargeForAiAction(userId, "concierge")` (1 Credit) erfolgreich. Modell
`claude-haiku-4-5-20251001`, `max_tokens: 1000`, Request-`timeout: 25000` ms.
System-Prompt (`SYSTEM_PROMPT`): Deutsch, per Du, ≤ ~150 Wörter, nur Daten-Kontext +
Fachwissen, Markdown-Links mit relativem Pfad, verweist auf `/listings`, `/rfqs`,
`/kss-finder`, `/wissen`, `/prices` (Preise als **modellierte Richtwerte**, nie
„geprüfte Marktpreise“), `/sds`; **„Tank“ statt „Sumpf“**. Der Daten-Kontext wird an
die letzte Nutzer-Nachricht in `<daten-kontext>…</daten-kontext>` angehängt.

**Fallback `heuristicReply(ctx)`:** rein regelbasierte Antwort aus denselben Daten
(Produkte/Angebote/Issues als Markdown-Listen; wenn nichts gefunden: Hinweis auf
`/rfqs` + `/kss-finder`). Wird ergänzt um `notice`:
- kein Login → „Melde dich an…“
- `no_credits` → Hinweis auf `/mitgliedschaft`
- `no_access` (Trial abgelaufen, kein Abo) → „Abo lösen“
- Claude-Fehler → `refundAiAction(userId, "concierge")` + „Credit wurde erstattet“.

**Ausgabe:** `{reply, source: "anthropic-claude" | "heuristic-fallback",
creditBalance?}`. Das Widget rendert `[Text](/pfad)`-Links via `RichText` als
Next-`Link`.

---

### 6.3 Vergleichs-Analyse (KI-Bewertung, gecacht)

**Zweck:** Strukturierte Bewertung von 2–6 ausgewählten **Angeboten** (Listings):
Stärken/Schwächen je Angebot, Wirtschaftlichkeits-Score 1–5, Use-Case-Empfehlungen
(„Beste Wahl für …“), Gesamtfazit. **Auslöser:** `components/compare/AiAnalysisPanel.tsx`
(Button „Bewerten lassen“) auf `/compare`, ruft Server-Action `runComparisonAnalysis`
(`app/compare/actions.ts`). `app/compare/page.tsx` lädt bei `aiEligible` (≥ 2
Listings, gleicher `productType`) vorab `getCachedAnalysis(...)`.

**Regeln der Server-Action:** 2–6 IDs, alle Listings müssen existieren, alle **denselben
`productType`** haben (sonst Fehler, Panel bleibt `disabled`). **Keine Credit-Abbuchung**
— dieses Feature ist kostenlos; das Ergebnis wird gecacht.

**Caching `ComparisonAnalysis` (prisma/schema.prisma):**
- `cacheKey` = `sha256(sortierte IDs joined "|")`, gekürzt auf 32 Hex-Zeichen
  (`crypto.createHash("sha256")…slice(0,32)`), `@unique`.
- Felder: `id`, `cacheKey`, `scope` (hier `"listings"`), `ids String[]`, `result Json`,
  `source` (`"anthropic-claude" | "heuristic-fallback"`), `createdAt`.
- `analyzeListings`: erst Cache-Lookup (Treffer → sofort zurück), sonst Anthropic
  (mit Key) bzw. Heuristik, dann Cache-Write.

**KI-Pfad `analyzeWithAnthropic`:** Modell `claude-haiku-4-5-20251001`,
`max_tokens: 2000`, System-Prompt „erfahrener KSS-/Schmierstoff-Berater“, fordert
**JSON** `{perItem:[{id, productName, manufacturer, strengths[≤3], weaknesses[≤3],
valueScore 1..5, valueReason}], bestFor:[{useCase, recommendedListingId, reason}],
summary}`. JSON wird von ```json-Fences bereinigt und geparst. Ergebnis-Objekt trägt
`source`, `model` (aus `response.model`), `generatedAt`.

**Fallback `analyzeHeuristically`:** deterministische Bewertung aus Feldern
(Zertifikate-Anzahl, `priceEur` vorhanden, Anzahl `machiningOperations`, Menge,
`shippingTerms`, `minOrderQty`), Score-Basis 3 ±. `bestFor`: günstigstes Angebot,
meiste Zertifikate, größte Menge. Bei jedem Anthropic-Fehler wird auf diese Heuristik
zurückgefallen (try/catch), Ergebnis dennoch gecacht mit `source: "heuristic-fallback"`.

**Anzeige:** `AiAnalysisPanel` zeigt Quelle als Badge (`Claude · <model>` bzw.
„heuristisch (kein API-Key)“), Wirtschaftlichkeits-Score als 5-Punkte-Anzeige.
> Hinweis: In `AnalysisResult` heißt der Freitext `summary`; das JSON-Feld im
> `ComparisonAnalysis.result`-Kommentar nennt beispielhaft `recommendation` — der
> tatsächlich erzeugte Key ist `summary`.

---

### 6.4 Alternativen aus Angeboten (`lib/alternatives.ts`)

**Zweck:** Zu einem Quell-**Angebot** technisch geeignete Alternativ-Angebote finden
und ranken (Match-Index 0–100 %, `fit` excellent/good/fair/weak, pros/cons/warnings).
**Auslöser:** `POST /api/listings/[id]/alternatives` (`maxDuration = 60`). Eingabe:
`MustHave` (sameProductType/Chemistry/Viscosity/ApplicationArea/Packaging,
requiredCertifications[], avoidIssues[], workpieceMaterial?, minAutomationScore?,
requireGlycolFree?).

**Kandidaten:** dreistufig aufgefüllt bis `MAX_CANDIDATES = 12` (strikt gefiltert →
gleicher Produkttyp → übrige aktive). SDS je Kandidat via `findMatchingSds` (`lib/sds`).
Must-haves sind **Präferenzen, keine harten Filter**: verletzende Kandidaten bleiben
sichtbar, Score gedeckelt bei **49 %**.

**Credit/Zugang:** `POST`-Handler bucht `chargeForAiAction(userId, "alternatives")`
(1 Credit) und übergibt `allowAi` an `findAlternatives(id, mustHave, {allowAi})`.
KI-Pfad nur bei `allowAi && process.env.ANTHROPIC_API_KEY`. Kam die KI nicht zum Zug
(`result.modelUsed !== "claude"`) oder wirft sie → `refundAiAction(userId,
"alternatives")` + Hinweis.

**KI-Pfad `claudeRanking`:** Modell `claude-haiku-4-5-20251001`, `max_tokens: 2500`.
Besonderheit: System-Prompt als Block mit **`cache_control: {type: "ephemeral"}`**
(Prompt-Caching). Formatiert Quell-Produkt + bis zu 12 Kandidaten inkl. **SDS-Extrakt**
(bis `SDS_TEXT_CHARS = 6000` Zeichen), Must-haves, zu vermeidende KSS-Probleme
(`KSS_ISSUES` aus `lib/kss-issues`) und Automatisierungs-Anforderungen. Fordert JSON
`{alternatives:[{key:"KANDIDAT_n", score, fit, summary, pros[], cons[], warnings[]}]}`;
`key` wird zurück auf `listingId` gemappt. `warnings` sollen SDS-Indikatoren
aufgreifen (Borate/Amine → Hautreizung, niedriger Flammpunkt → Rauch, Al-Unverträglichkeit).

**Fallback `ruleBasedRanking`:** Punkte-System (gleiche Chemie +25, gleiche Viskosität
+25, Produkttyp +15, Verpackung +5, gemeinsame Freigaben +5/Stück, Preisnähe,
SDS-Keyword-Vorprüfung der `avoidIssues`, Automatisierungs-Eignung via
`estimateAutomation` aus `lib/kss-automation`, Glykol-Frei-Präferenz,
Werkstoff-Treffer im SDS). Must-have-Verstöße: −12/Stück + Deckel 49 %.
`modelUsed: "rule-based"`.

**Ausgabe `AlternativeResponse`:** `{source, candidatesConsidered, alternatives[],
modelUsed: "claude" | "rule-based", reasoning?}` + `credits: {charged, balance, notice}`.

---

### 6.5 Alternativen mit Web-Recherche (`lib/alternative-search.ts`)

**Zweck:** Zweistufige Alternativ-**Produkt**-Suche (Katalog): Stufe 1 sofortige
regelbasierte Suche; Stufe 2 zusätzliche **Claude-Web-Recherche** für reale
Erfahrungsberichte + Quellen. **Auslöser:** `POST /api/listings/alternatives-search`
mit `{mode: "product"|"requirements", query?, category?, chemistry?, isoViscosity?,
applicationArea?, requiredCertifications?, avoidIssues?, useWeb?}`.

**Stufe 1 `searchAlternatives`:** löst Quell-Produkt über `searchTokens`/Name auf
(`normalizeForSearch`), lädt Kandidaten (`CANDIDATE_LIMIT = 60`), Verfügbarkeits-Index
aus aktiven Angeboten + „schon gehandelt“-Signal (abgeschlossene Transaktionen),
Praxis-Probleme (`ProductIssue`, ohne `REJECTED`). `scoreCandidate` (gleiche
Produktart +25, Chemie +20, Viskosität +20, Anwendung +12, Freigaben ±,
`avoidIssues`-Abgleich gegen `criticalIssuesKnown`/`criticalIssuesAddressed`,
Vermeiden bekannter Quell-Probleme, Verfügbarkeit +15, schon gehandelt +6).
Ergebnis `RESULT_LIMIT = 12`, `modelUsed: "rule-based"`.

**Stufe 2 `searchAlternativesWeb`:** baut auf Stufe 1 auf. Nur bei
`process.env.ANTHROPIC_API_KEY`. Modell **`claude-sonnet-4-6`** (Haiku unterstützt die
dynamische Web-Suche laut Code-Kommentar nicht zuverlässig), `max_tokens: 1500`,
Request-`timeout: 55000` ms. **Web-Such-Werkzeug:**
`tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }]`.
Fordert JSON `{summary, ranking:[{n, verdict:"empfohlen"|"brauchbar"|"eher nicht",
note}]}`. `extractWebSources` liest `web_search_tool_result`-Blöcke (Titel+URL).
Verdict-Bonus auf den Basis-Score (`empfohlen +20, brauchbar +5, "eher nicht" -15`),
Neusortierung, `modelUsed: "claude-web"`, plus `webSources[]`, `webSummary`.
**Fallback:** ohne Key oder bei Fehler/Timeout → unverändertes Stufe-1-Ergebnis.

**Credit/Zugang (Route):** `useWeb` löst `chargeForAiAction(userId,
"alternativesWeb")` (**2 Credits** — teuerste Aktion) aus; `allowWeb` steuert, ob
`searchAlternativesWeb` statt `searchAlternatives` läuft. Kam Web nicht zum Zug
(`modelUsed !== "claude-web"`) oder Fehler → `refundAiAction` + `creditNotice`.
Leere Eingabe → sofort leeres Ergebnis ohne Abbuchung. `feature`-Key: `alt_search`.

---

### 6.6 Kontaktdaten-Filter — KI-Stufe (`lib/contact-filter.ts`)

**Zweck:** Verhindert Austausch direkter Kontaktdaten in Plattform-Nachrichten
(Pseudonym-Modell, FDS 4.5). **Zwei Stufen**, aufgerufen in
`app/api/conversations/[id]/messages/route.ts`:

- **Stufe 1 `findContactData(text)` (Regex, jede Nachricht, kostenlos):** erkennt
  E-Mail (`EMAIL_RE`), verschleierte E-Mail („max (at) firma (punkt) de“,
  `OBFUSCATED_EMAIL_RE`), URLs (`URL_RE`), nackte Domains (`DOMAIN_RE`), Telefon
  (`PHONE_CANDIDATE_RE`, ≥ 8 Ziffern). Treffer → HTTP **422** mit Grund, Nachricht
  wird nicht gespeichert.
- **Stufe 2 `aiContactCheck(text)` (KI, einmalig pro Account):** greift nur, wenn
  `sender.aiContactCheckAt === null` (erste Nachricht). Der Zeitstempel wird
  **unabhängig vom Ergebnis** gesetzt (`User.aiContactCheckAt`) → genau eine Prüfung
  pro Account. Modell `claude-haiku-4-5-20251001`, `max_tokens: 150`, Input auf **4000
  Zeichen gekappt** (`text.slice(0, 4000)`). Erkennt raffiniert verschleierte
  Kontaktdaten (ausgeschriebene Ziffern, „googel uns“, Social-Handles). System-Prompt
  fordert JSON `{flagged: boolean, reason: string|null}`; Produktnamen/Mengen/Preise/
  Normen sind erlaubt. Flag → HTTP 422.

**Kostendeckel:** `AI_CHECK_MAX_COST_CHF = 0.2` (20 Rp). Kostenschätzung nach dem Call
aus Tokens (Haiku: $1/M Input, $5/M Output, `USD_TO_CHF = 0.9`); real ≈ 0,3 Rp durch
Input-Kappung + `max_tokens: 150`. Überschreitung nur geloggt (soll durch Kappung nie
eintreten). **Keine Credit-Abbuchung** — Kosten trägt Brisco. Ausgabe
`{flagged, reason, costChf} | null`; **`null`** bei fehlendem Key oder Fehler →
Nachricht wird **nicht** blockiert (Regex-Stufe bleibt Schutz). `feature`-Key:
`contact_filter`.

---

### 6.7 Wissensbasis-Vokabulare (`lib/kss-knowledge.ts`, `lib/kss-automation.ts`)

**`lib/kss-knowledge.ts`** — reine Konstanten (Quellen: helcotec, Blaser, TRGS 611,
DGUV 109-003, VKIS/VSI/DIN 51385): `APPLICATION_AREAS` (Bearbeitungsverfahren),
`MATERIALS` (Werkstoffe), `CRITICAL_ISSUES` (Praxis-Probleme, z. B.
„Bakterienbefall / Verkeimung“, „Nitrit > 20 mg/l (TRGS 611)“), `CERTIFICATIONS`
(`{code, label}`, z. B. TRGS-611, NSF-H1, WGK-1, OEM-Freigaben), `PRODUCTION_TYPES`
(CONTRACT_MANUFACTURING/SERIAL_PRODUCTION/MIXED), `COOLANT_FORMS`
(CONVENTIONAL_EMULSION/SEMI_SYNTHETIC/FULL_SYNTHETIC/TWO_COMPONENT), `WIZARD_QUESTIONS`
(deklarative Frage-Reihenfolge). Diese Vokabulare speisen die KSS-Wizard-UI und das
Pre-Scoring (Abschnitt 6.1). **Kein KI-Aufruf** in dieser Datei.

**`lib/kss-automation.ts`** — Domänen-Wissen zur KSS-Vollautomation, **kein KI-Aufruf**:
`MACHINING_OPERATIONS`, `MEASUREMENT_METHODS` (Refraktometer/Titration/Konduktometrie/
Dosimetrix/Labor mit `automationLevel`, `glycolCompatible`, `trampOilTolerant`) und
`estimateAutomation(input)` → `AutomationProfile {score 1–5, fit, reasons, warnings,
recommendedMethods}`. Kernregel: glykolhaltige KSS bilden Filme auf Refraktometern →
Score-Abzug, Empfehlung Dosimetrix/Titration. Wird von `lib/alternatives.ts`
(Automatisierungs-Bewertung) genutzt.

---

### 6.8 Token-/Kostenerfassung (`lib/ai-usage.ts`) und Admin-Übersicht

**`recordAiUsage(feature, model, usage, userId?)`:** fire-and-forget, wirft nie,
kein `await` nötig. Schreibt einen Datensatz `AiTokenUsage` je Claude-Aufruf mit den
**rohen** Token-Zahlen aus `response.usage` (`input_tokens`, `output_tokens`,
`cache_creation_input_tokens`, `cache_read_input_tokens`; defensiv gelesen,
`Math.max(0, round(...))`). Fehler beim Schreiben werden verschluckt.

**Modell `AiTokenUsage` (prisma/schema.prisma):** `id, feature, model, inputTokens,
outputTokens, cacheCreationTokens, cacheReadTokens, userId?, createdAt`; Indizes auf
`createdAt` und `[feature, createdAt]`. `feature`-Werte: `kss_wizard`, `concierge`,
`comparison`, `contact_filter`, `alternatives`, `alt_search` (Labels in
`AI_FEATURE_LABEL`).

**Kostenberechnung (erst bei der Auswertung, eine Preisquelle):**
- Preis-Tabelle `PRICES` (USD je 1 Mio. Token, Präfix-Match, damit datierte IDs
  treffen): `claude-haiku-4-5`/`claude-haiku` → Input $1 / Output $5;
  `claude-sonnet` → $3 / $15; `claude-opus` → $5 / $25. `DEFAULT_PRICE` = $3 / $15.
- **Cache-Faktoren:** Cache-Read ≈ **0,1×** Input-Preis, Cache-Write (5-Min-TTL) ≈
  **1,25×** Input-Preis (in `costUsd` angewandt).
- `costUsd(model, t)` summiert Input (inkl. Cache-Read/Write-Faktoren) + Output;
  `costEur(model, t) = costUsd * EUR_PER_USD` mit **`EUR_PER_USD = 0.92`**.

**Admin-Übersicht (`app/admin/page.tsx`):** liest `AiTokenUsage` (letzte 100 Roh-
Datensätze, `groupBy model`, `count`), zeigt „KI-Aufrufe gesamt“, Summe Tokens,
Kosten in EUR je Modell (`costEur`) und je Funktion (`AI_FEATURE_LABEL`, gruppiert),
sowie im 30-Tage-Nutzungsblock die KI-Funktionsverteilung. Zusätzlich zeichnet
`chargeForAiAction` je erfolgreiche Abbuchung ein `UsageEvent {kind: "ai_action",
meta: <action>}` (→ Abschnitt „Nutzung/Analytics“).

---

### 6.9 KI-Credits-Abbuchung je Aktion (Verweis → Abschnitt 3)

Kosten und Logik liegen in `lib/credits.ts`. Kosten je Aktion in **Credits**
(`AI_ACTION_COSTS`): `concierge: 1`, `kssWizard: 1`, `alternatives: 1`,
`alternativesWeb: 2`. `chargeForAiAction(userId, action)` prüft Zugang
(`isMembershipActive` **ODER** `isTrialActive`) und bucht **atomar** nur bei
ausreichendem Saldo ab (`updateMany … creditBalance: { gte: cost }`), schreibt eine
`CreditTransaction {kind: USAGE, amount: -cost}` und ein `UsageEvent`. Ergebnis
`ChargeResult`: `{ok:true, cost, balance}` oder `{ok:false, reason: "no_credits" |
"no_access"}`. `refundAiAction` erstattet bei fehlgeschlagenem/ausgefallenem
KI-Aufruf (`CreditTransaction {amount: +cost, note: "Erstattung: …"}`).

**Nicht abgebucht:** Vergleichs-Analyse (6.3, kostenlos + gecacht) und
Kontaktdaten-Filter (6.6, Kosten trägt Brisco). Details zu Credits, Trial,
Referral-Codes und Preis-Einstellungen (`AppSetting`) → siehe Abschnitt 3.

---

## 7. Seiten & Navigation (App-Router)

Alle Seiten liegen unter `app/**/page.tsx` (41 Route-Segmente) plus das gemeinsame
Root-Layout `app/layout.tsx`. Next.js 16 App-Router: **Server-Komponenten sind der
Standard** (async, laden direkt über das Prisma-Singleton `@/lib/prisma` und lesen die
Session über `getServerSession(authOptions)`); Client-Komponenten sind mit `"use client"`
markiert und holen Daten per `fetch` über interne `/api/*`-Routen. Der Pfad-Alias `@/*`
zeigt auf den Repo-Root.

Detail-Logik zu den geladenen Daten/Abläufen ist bewusst **nicht** hier dupliziert:
→ siehe Abschnitt 4 (Marktplatz: Listing/Rfq/Offer/Conversation/Transaction/Review),
Abschnitt 5 (Wissensbasis: Product/SafetyDataSheet/Material/PriceObservation/ProductIssue),
Abschnitt 6 (KI: KSS-Wizard, Vergleich, Alternativen, Concierge).

### 7.1 Kein `middleware.ts` — Auth pro Route

Es existiert **keine** `middleware.ts`. Zugriffsschutz wird in jeder Seite/Route einzeln
durchgesetzt, mit vier wiederkehrenden Mustern:

| Muster | Umsetzung | Beispiel-Seiten |
|---|---|---|
| Server-Redirect bei fehlender Session | `const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login?callbackUrl=…")` | `dashboard`, `conversations`, `conversations/[id]`, `transactions/[id]`, `dashboard/prices`, `listings/[id]/edit` |
| Inline-Hinweis statt Redirect | Rendert eine „bitte einloggen"-Karte, kein Redirect | `umsaetze`, `mitgliedschaft`, `werbung` |
| Client-Redirect via Session-Status | `useSession()` + `useEffect(… if status==="unauthenticated" router.replace("/login?callbackUrl=…"))` | `listings/new`, `rfqs/new` |
| ADMIN-only → `notFound()` | `if (session?.user?.role !== "ADMIN") notFound()` — Existenz wird verschleiert (404 statt 403) | `admin` |
| Feature-Gate nach `trustTier`/`membershipTier` | Rollen-/Stufen-Check rendert Sperr-Karte statt Inhalt | `dashboard/prices` (ADMIN/TRADE_ASSURED/PREMIUM), `umsaetze`-Chart (Pro/Marke), `werbung` (MARKE/ADMIN) |

Ressourcen-Besitz wird zusätzlich pro Seite geprüft (z. B. `listing.sellerId !== session.user.id`
→ Redirect; `conversation.buyerId/sellerId` → Redirect; `transaction` buyer/seller → Redirect).

Öffentlich (kein Login nötig) sind u. a.: Startseite, gesamte Wissensbasis, Listings-/RFQ-
Übersicht + Detail, Profile, Vergleich, KSS-Finder, alle Rechtstexte. Aktionen auf diesen
Seiten (Kontakt aufnehmen, bieten, anlegen) sind aber an eine Session gebunden.

### 7.2 Root-Layout (`app/layout.tsx`)

Async **Server-Komponente**. Setzt `metadata` (Titel, PWA-`manifest.webmanifest`, Apple-
Web-App, Icons) und `viewport` (`themeColor #abd91a`). Ablauf:

1. **Serverseitiges Locale aus Cookie:** `const store = await cookies(); const locale =
   toLocale(store.get(LOCALE_COOKIE)?.value)` → `<html lang={locale}>`; lokale
   Übersetzungsfunktion `t = (key) => translate(locale, key)`. So kommt die Seite bereits
   in der richtigen Sprache vom Server (kein Deutsch-Aufblitzen). Cookie/Helfer:
   `lib/i18n.ts` (`LOCALE_COOKIE`, `DEFAULT_LOCALE`, `toLocale`, `translate`, `fill`),
   für Server-Komponenten `lib/i18n-server.ts` (`getLocale()`, `getT()`).
2. **Gate-Mechanik (Zugangssperre):** `if (gateEnabled())` prüft `isGateTokenValid(
   store.get(GATE_COOKIE)?.value)`; bei ungültigem Token wird **nur** `<GateLogin />` in
   einem minimalen `<html><body>` gerendert (der Rest der App bleibt unerreichbar).
   `lib/gate.ts`: `GATE_COOKIE = "mp_gate"`; `gateEnabled()` = true nur in Produktion
   (`NODE_ENV==="production"`), per `GATE_ENABLED=true|false` erzwingbar; Cookie enthält
   ein HMAC-SHA256-Token (`gateToken()`), Passwort aus `GATE_PASSWORD` (fail-closed ohne
   Env-Wert), Secret aus `GATE_SECRET`/`NEXTAUTH_SECRET`. Gate ≠ NextAuth-Login (getrennte
   Ebene, kein Serverzustand).
3. **Session:** `session = await getServerSession(authOptions)` → an `HeaderNav`
   durchgereicht (`{ name, isAdmin: role === "ADMIN" }`).
4. Rendert `<Providers locale={locale}>` (LocaleProvider + NextAuth-SessionProvider,
   `app/providers.tsx`), `ServiceWorkerRegistration`, `CompareBar`, `ConciergeWidget`
   (KI-Fachberater, schwebend auf jeder Seite → Abschnitt 6) und `AnalyticsTracker`
   (in `<Suspense>`; datenschutzarme Messung → `/api/track`, Auswertung in `/admin`).

**Zweizeilige Kopfzeile** (`<header>`, sticky, `backdrop-blur`):
- **Zeile 1:** links Brisco-Systems-Logo (`public/brisco-systems-logo.svg`, Link `/`) +
  Trenner „Marketplace"; rechts `<HeaderNav>` (`components/HeaderNav.tsx`, Client) mit
  **Sprachumschalter** (`LanguageSwitcher`, auch für Abgemeldete erreichbar) und entweder
  `AccountMenu` (eingeloggt) oder „Anmelden"-Link → `/login`.
- **Zeile 2:** eine `<form action="/listings" method="get" role="search">` mit
  Freitext-Feld `name="q"` (die tägliche **Suche** → landet auf der Listings-Übersicht) +
  `<SecondaryNav>`: **Merkliste** (Herz-Icon → `/compare`) und **Anbieten** (Plus → `/listings/new`).

**Vertrauens-Leiste:** schlanke Zeile unter dem Header mit drei eingelösten Versprechen
(`trust.reviews`, `trust.handling`, `trust.data`).

**`<main>`** rendert `children` (max-w-6xl).

**Fußzeile:** „Brisco Systems GmbH" + Links `/vertrauen`, `/agb`, `/impressum`,
`/datenschutz`. Ist das aktive Locale ≠ `DEFAULT_LOCALE`, erscheint ein Hinweis
(`footer.legalNote`), dass die Rechtstexte bewusst deutsch bleiben.

`withBasePath()` (`lib/base-path.ts`) präfixt alle nicht-`<Link>`-URLs (Form-Actions,
`<a href>`, `fetch`) für den Betrieb unter einem Base-Path.

---

### 7.3 Öffentlich / Startseite

| Route | Datei | Komp. | Zweck / Daten | Schutz |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Server | **Zwei Modi.** Ohne Session → `PublicLanding`: Hero, Anbieten-/Suchen-Kacheln, Kennzahlen (`listing.count ACTIVE`, `user.count`, `sds.count`, `manufacturer.count`), 4 frischeste Listings, Trial-Zahlen aus `getSettingInt("trialDays"/"welcomeCredits")`, `AdSlot placement="HOME"`. Mit Session → `PersonalDashboard`: letzte Konversationen, offene fremde RFQs (evtl. passend), neue Listings (searchBoost zuerst), Anzahl eingegangener offener Angebote. | öffentlich |

Wortlaut-Konvention durchgängig: **Anbieten** (Angebote, blau) / **Suchen** (Anfragen, amber).

### 7.4 Konto & Auth

Alle vier Auth-Seiten sind **Client-Komponenten** (`"use client"`), nutzen `useLocale()`
und `components/PasswordInput`.

| Route | Datei | Zweck / Ablauf | Schutz |
|---|---|---|---|
| `/login` | `app/login/page.tsx` | `signIn("credentials", { redirect:false })`; bei Erfolg `router.push(callbackUrl ?? "/dashboard")`. Link zu `/forgot-password` und `/register`. | öffentlich |
| `/register` | `app/register/page.tsx` | Formular (E-Mail, Passwort+Bestätigung, Pseudonym, `role` RESELLER/OEM/ENDKUNDE, Land aus `EUROPE_COUNTRIES`, Firma, UID, Referral). Pseudonym-Prüfung client (`lib/pseudonym`: `generatePseudonym`, `findPseudonymLeak` — verhindert Identitäts-Leak) + serverseitig; Trial-Info aus `/api/trial-info`; `?ref=` übernimmt Referral-Code. POST `/api/register`, danach automatischer `signIn` → `/dashboard`. | öffentlich |
| `/forgot-password` | `app/forgot-password/page.tsx` | POST `/api/auth/forgot-password`; Antwort bewusst ignoriert → **immer gleiche** Erfolgsmeldung (keine Konto-Enumeration). | öffentlich |
| `/reset-password` | `app/reset-password/page.tsx` | Liest `?token`; POST `/api/auth/reset-password`; ohne Token Hinweis auf Neuanforderung; nach Erfolg Redirect `/login`. | öffentlich (Token-basiert) |

### 7.5 Marktplatz — Anbieten (Listings) & Suchen (RFQs)

→ Datenmodell & Aktionslogik (Kontaktaufnahme, Angebot annehmen, Transaktion, Käuferschutz): Abschnitt 4.

| Route | Datei | Komp. | Zweck / Daten | Schutz |
|---|---|---|---|---|
| `/listings` | `app/listings/page.tsx` | Server | Angebots-Übersicht. Facetten-Filter (Hersteller/Anwendung/Chemie/Gebinde/Region/Zertifikat, pipe-separiert, Zähler serverseitig) über `lib/application-facets`; Volltext `q` gegen mehrere Felder; Sortierung: Priority-Placement (`lib/membership-tiers`) → `searchBoost` → Datum; zusätzlich Produktkatalog-Treffer via `buildSearchWhere("searchTokens", q)`. `ConceptBrowseGrid`, `AdSlot placement="LISTINGS"`. | öffentlich |
| `/listings/new` | `app/listings/new/page.tsx` | **Client** | Mehrteiliges Anbieten-Formular (Produkt, Fertigung/`MachiningSelect`, Rezeptur, Automatisierungs-Vorschau `estimateAutomation` bei KSS, Verfügbarkeit, Zertifikate, Beschreibung). Auto-Erkennung von Marke/Typ (`lib/products-knowledge`), Hersteller aus `/api/manufacturers/names`. POST `/api/listings` → `/listings/[id]`. | eingeloggt (Client-Redirect `?callbackUrl=/listings/new`) |
| `/listings/[id]` | `app/listings/[id]/page.tsx` | Server | Angebots-Detail: Hero mit Markenfarbe (`lib/branding`), Verkäufer+`TrustBadge`, Preis, Specs, Bearbeitungsverfahren, Rezeptur, Automatisierungs-Eignung, Zertifikate, Beschreibung, passende SDS (`findMatchingSds`). Eigen → „Bearbeiten"; fremd+eingeloggt → `ContactSellerButton`+`InquiryButtons`+„KI: Alternative finden"; abgemeldet → Registrieren-CTA mit Trial-Hinweis. | öffentlich (Aktionen: eingeloggt) |
| `/listings/[id]/edit` | `app/listings/[id]/edit/page.tsx` | Server | Lädt Listing, rendert `ListingEditForm`. Redirect `/login` ohne Session; Redirect `/listings/[id]` wenn `sellerId !== user.id`. | Eigentümer |
| `/listings/[id]/alternatives` | `app/listings/[id]/alternatives/page.tsx` | Server (+ `AlternativesClient`) | Lädt Quell-Listing, übergibt Eigenschaften an KI-Alternativsuche → Abschnitt 6. | öffentlich |
| `/rfqs` | `app/rfqs/page.tsx` | Server | Anfragen-Übersicht („Ich suche", amber). **Sichtbarkeit** je `visibility`: `PUBLIC` immer; `VERIFIED_ONLY` nur für `trustTier !== UNVERIFIED`; eigene RFQs immer. Filter Typ/ISO/Region/Status; Ansicht kompakt/erweitert (`?view`); `AlternativeSearchPanel` (`?alt=`). | öffentlich (bieten: eingeloggt) |
| `/rfqs/new` | `app/rfqs/new/page.tsx` | **Client** | Bedarf-Formular (Produkttyp, Hersteller, ISO, Chemie, Anwendung, Werkstoff, Menge, Region, Frist, Budget, Sichtbarkeit PUBLIC/VERIFIED_ONLY, Pflicht-Zertifikate, zu vermeidende KSS-Probleme `KssIssueSelect` scope-abhängig). POST `/api/rfqs` → `/rfqs/[id]`. | eingeloggt (Client-Redirect) |
| `/rfqs/[id]` | `app/rfqs/[id]/page.tsx` | Server | Anfrage-Detail + Angebotsliste (`RfqOffer`). Käufer sieht `AcceptOfferButton`; berechtigte Nicht-Käufer (`canOffer`: eingeloggt, OPEN, vor Frist, Sichtbarkeit erfüllt) sehen `SubmitOfferForm`. | öffentlich (bieten: `canOffer`) |
| `/conversations` | `app/conversations/page.tsx` | Server | Alle Threads des Users (`Conversation` mit `OR buyerId/sellerId`), letzte Nachricht je Thread. | eingeloggt (Redirect) |
| `/conversations/[id]` | `app/conversations/[id]/page.tsx` | Server (+ `MessageThread`) | Ein Thread; Redirect `/conversations` wenn User weder buyer noch seller. Pseudonymitäts-Hinweis. | eingeloggt + Teilnehmer |
| `/transactions/[id]` | `app/transactions/[id]/page.tsx` | Server | Transaktions-Detail: Beteiligte, Status, Zeitstempel, `TransactionActions`, `ProtectionPanel` (Käuferschutz via Stripe — nie „Treuhand/Escrow"; `lib/protection`, `lib/protection-flow`), `ReviewForm` nach `COMPLETED`. Verifiziert bei Rückkehr `?protection=success&session_id` die Stripe-Checkout-Session (Dev-Fallback ohne Webhook). Redirect `/dashboard` wenn nicht Beteiligter. | eingeloggt + Beteiligter |

### 7.6 Wissensbasis

→ Datenmodell (Product, SafetyDataSheet, Material/Ingredient/Matrix, PriceObservation, ProductIssue) und Aggregations-Logik: Abschnitt 5. Alle **Server-Komponenten**.

| Route | Datei | Zweck / Daten | Schutz |
|---|---|---|---|
| `/manufacturers` | `app/manufacturers/page.tsx` | Hersteller-Kachelgrid mit Logos (`ManufacturerLogo`) + `_count { products, listings, sds }`, Geschäftsschwerpunkt. | öffentlich |
| `/manufacturers/[slug]` | `app/manufacturers/[slug]/page.tsx` | Hersteller-Detail: Kopf, Produktkatalog nach `productFamily` gruppiert, Marktpreise (`getCurrentPricesBatch`), Compliance-Badges, `CompareToggle`. Aktiver **Marke**-Vertreter (`brandManufacturerId` + Tier MARKE) macht die Seite zum verifizierten Schaufenster; `AdSlot placement="STOREFRONT"`. Links zu `/sds` und `/listings` gefiltert. | öffentlich |
| `/marke/[slug]` | `app/marke/[slug]/page.tsx` | Nur `redirect("/manufacturers/[slug]")` — kurze, teilbare Marken-URL. | öffentlich |
| `/products/[manufacturerSlug]/[productSlug]` | `app/products/…/page.tsx` | Produkt-Detail: Header + Compliance, prominenter Preis-Richtwert (`getCurrentMarketPrice`), TCO-Rechner (nur KSS wassermischbar), Anwendung/Werkstoffe, berechnete Dichtungs-Empfehlung (`recommendMaterialsForProduct`, `lib/seal-recommendations`), verlinktes SDS, Praxis-Probleme (`ProductIssuesSection`), Preishistorie (`getMonthlyMedianHistory`, 60 M.) + `PriceSubmitLauncher`, technische Daten, Ansetzwasser, allg. Werkstoff-Hinweise, Refraktometer-Rechner (rechte Spalte), Quellen. | öffentlich |
| `/products/[manufacturerSlug]/[productSlug]/tds` | `app/products/…/tds/page.tsx` | Automatisch aus Produktfeldern erzeugtes **technisches Datenblatt** (druckfreundlich, `PrintButton`, `print:`-Styles) — Gegenstück zum SDS. | öffentlich |
| `/sds` | `app/sds/page.tsx` | SDS-Bibliothek. Filter: Hersteller, Kategorie, REACH, SVHC, 3-State-Inhaltsstoff-Flags (Bor/Formaldehyd/Amine/Chlorparaffine/Mineralöl/Bakterizid/Fungizid). Volltextsuche `searchTokens` + Fallback `extractedText`. | öffentlich |
| `/sds/[id]` | `app/sds/[id]/page.tsx` | SDS-Detail: Meta+Download (`/api/sds/[id]/download`), geparste REACH-/SVHC-/Inhaltsstoff-Flags, GHS/CLP (Piktogramme, H-/P-Sätze), Physik/Chemie, CAS-Nummern (Links zu CAS Common Chemistry), Transport, Lieferant; verknüpfte Produkte + aktive Listings. | öffentlich |
| `/materials` | `app/materials/page.tsx` | Werkstoff- & Inhaltsstoff-Verträglichkeit. Tabs Material-/Inhaltsstoff-Sicht (`?view`), volle `IngredientMaterialCompatibility`-Matrix. | öffentlich |
| `/materials/[slug]` | `app/materials/[slug]/page.tsx` | Material-Detail: Eigenschaften + Inhaltsstoffe nach Verträglichkeit gruppiert (UNSUITABLE/CAUTION/COMPATIBLE/RECOMMENDED) mit Quellenangabe. | öffentlich |
| `/prices` | `app/prices/page.tsx` | Indikative Richtwerte (Produkte mit `PriceObservation status=VERIFIED`). Filter Kategorie/Preisspanne, Sortierung, „nur ähnliche" (`?similar=` Referenz-IDs → Kategorie/ISO-VG/Chemie), Tabelle mit Konfidenz + `CompareToggle`. | öffentlich |
| `/wissen` | `app/wissen/page.tsx` | Praxis-Wissensbasis (`ProductIssue`, Status ≠ REJECTED). Kategorie-Chips, Suche (Titel/Beschreibung/Symptome), Karten mit Schweregrad/Ursache/Abhilfe, je Produkt verlinkt. | öffentlich |
| `/wissen/gefahrensymbole` | `app/wissen/gefahrensymbole/page.tsx` | Die 9 GHS/CLP-Piktogramme erklärt (statische Liste `SYMBOLS`), plus Häufigkeit im SDS-Bestand. | öffentlich |
| `/compare` | `app/compare/page.tsx` | Vergleich. `?listings=` und `?products=`/`?ids=`. Listings-Tabelle + KI-Bewertung (`AiAnalysisPanel`, ≥2 gleicher Typ, Cache `getCachedAnalysis` → Abschnitt 6); Produkte-Tabelle + Mehr-Produkt-Preischart + TCO-Vergleich (KSS). Ist zugleich die „Merkliste" (Herz-Icon im Header). | öffentlich |
| `/kss-finder` | `app/kss-finder/page.tsx` | Geführte KSS-Suche über Katalog (`COOLANT_WATER_MIX`/`COOLANT_NEAT`/`GRINDING_OIL`). Facetten (Bearbeitung, Form, Werkstoffe, Produktionsart, kritische Punkte, Zertifikate, Inhaltsstoffe/Wasserhärte, Preis; „Weiß nicht"-Sentinel), Live-Filter (`LiveFilterForm`), `KssWizardLauncher` (KI-Wizard) + `KssAiAnalysis` → Abschnitt 6. | öffentlich |

### 7.7 Dashboard, Konto & Umsätze

| Route | Datei | Komp. | Zweck / Daten | Schutz |
|---|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Server | Persönliche Übersicht: eigene Angebote (+`QuickStatusToggle`), eigene Anfragen, abgegebene Angebote, Transaktionen, Konversations-Zähler; „für dich" passende fremde Listings/RFQs. | eingeloggt (Redirect `?callbackUrl=/dashboard`) |
| `/dashboard/prices` | `app/dashboard/prices/page.tsx` | Server | **Preis-Verifizierung**: offene `PriceObservation status=PENDING` mit `PriceVerifyActions`. | eingeloggt **und** `role==="ADMIN"` \|\| `trustTier` TRADE_ASSURED/PREMIUM (sonst Sperr-Karte) |
| `/profile/[pseudonym]` | `app/profile/[pseudonym]/page.tsx` | Server | Öffentliches Schaufenster: Rolle, `TrustBadge`, UID-/Käuferschutz-Abzeichen, Kennzahlen, aktive Angebote, offene öffentliche Anfragen, Bewertungen. **Eigenprofil** zusätzlich: privater Umsatz, `CurrencyEditor`, `VatValidationBox`, `PasswordChangeEditor`, `AboutEditor`. | öffentlich; private Teile nur Inhaber |
| `/umsaetze` | `app/umsaetze/page.tsx` | Server | „Meine Umsätze": alle Transaktionen des Users, Summen (Verkäufe/Käufe/Einsparung), CSV-Export (`/api/umsaetze/export`), Chart. **Chart nur Stufe Pro/Marke** (`hasAnalytics`), sonst Upsell-Karte. | eingeloggt (Inline-Hinweis) |
| `/mitgliedschaft` | `app/mitgliedschaft/page.tsx` | Server | Abo-Stufen (BASIS/PRO/MARKE, `lib/membership-tiers`, Stripe), KI-Credits (`CREDIT_PACKAGES`, `AI_ACTION_COSTS`), Käuferschutz-Onboarding (`ConnectOnboardingBox`, `syncConnectStatus`), Code einlösen, Referral-Link, Marken-Schaufenster (nur MARKE, `StorefrontManager`). | eingeloggt (Inline-Hinweis) |
| `/werbung` | `app/werbung/page.tsx` | Server | Werbebanner-Verwaltung (`AdBanner`, `AdManager`, Platzierungen `AD_PLACEMENT_LABEL`). | eingeloggt **und** Stufe MARKE (`hasStorefront`) \|\| ADMIN (sonst Sperr-Karte) |

### 7.8 Rechtstexte (öffentlich)

Bewusst überwiegend **deutsch** (acht Sprachfassungen wären acht rechtsverbindliche
Dokumente). Betreiber: **Brisco Systems GmbH**, CH-8335 Hittnau; schweizerisches Recht,
Gerichtsstand Zürich.

| Route | Datei | Komp. | Inhalt |
|---|---|---|---|
| `/agb` | `app/agb/page.tsx` | Server (statisch) | AGB, B2B-Vermittlermodell; §7 Käuferschutz via Stripe (2,5 % + 0,25 €, keine Treuhand-/Bankdienstleistung), §8 KI/Finder ohne Gewähr, §9 Haftung. |
| `/impressum` | `app/impressum/page.tsx` | Server | Impressum (übersetzte Beschriftungen via `getT`, Firmendaten konstant); Geschäftsführung Jürgen Gosch. |
| `/datenschutz` | `app/datenschutz/page.tsx` | Server (statisch) | DSGVO/DSG; Auftragsverarbeiter Stripe, Anthropic, Railway, Zoho/ZeptoMail. |
| `/vertrauen` | `app/vertrauen/page.tsx` | Server | Vertrauens-/Verifizierungsstufen (`TIER_STYLES`), verifizierte Bewertungen, Pseudonymität, Käuferschutz-Ablauf (Wortlaut-Pflicht: nie „Treuhand/Escrow"). |

### 7.9 Admin (interne Eigentümer-Konsole)

| Route | Datei | Komp. | Zweck | Schutz |
|---|---|---|---|---|
| `/admin` | `app/admin/page.tsx` | Server | Eine große Konsole mit Server-Actions aus `app/admin/actions.ts`: **Monetarisierung** (Start-Credits, Trial-Dauer, Referral-Prämie, Credit-Preis, Abo-Preise, Käuferschutz-Gebühr, Basis-Limit; `updateMonetizationSettings`), **Referral-/Gutschein-Codes** (erstellen/deaktivieren/löschen), **Käuferschutz** (geparkte/DISPUTED-Zahlungen freigeben/erstatten), **Nutzung** (UsageEvent-Analytics 30 T.), **KI-Kosten & Token-Verbrauch** (`AiTokenUsage`, `costEur`, Tages-Chart), **System-E-Mails** (`EmailLog`, `checkMailStatus`, Test-Mail), **Sichtbarkeits-Steuerung** (`searchBoost` je Reseller — für niemanden sonst sichtbar), Credits/Trial je Nutzer setzen, CSV-Export `/api/admin/export`. | **ADMIN**; sonst `notFound()` (404 verschleiert Existenz) |

---

## 8. API-Routen

Alle Server-Endpunkte liegen unter `app/api/**/route.ts` (App Router, jede Datei
exportiert benannte HTTP-Handler `GET`/`POST`/`PATCH`/`DELETE`). Insgesamt **49
Route-Dateien**. Es gibt **keine `middleware.ts`** — Auth wird pro Route über
`getServerSession(authOptions)` (aus `lib/auth.ts`) durchgesetzt. Eingaben werden fast
überall mit **zod** (`safeParse`) validiert; Fehlformat → `400` mit
`{ error, issues? }`. Der geteilte Prisma-Client kommt aus `lib/prisma.ts`
(→ siehe Abschnitt Datenmodell/Architektur).

### 8.0 Konventionen (gelten routenübergreifend)

- **Auth-Muster:** `const session = await getServerSession(authOptions); if
  (!session?.user?.id) return 401`. Session trägt `id`, `role`
  (`RESELLER`/`OEM`/`ENDKUNDE`/`ADMIN`) und `trustTier`
  (`UNVERIFIED`→…→`TRADE_ASSURED`/`PREMIUM`).
- **Rollen-/Ownership-Prüfung** erfolgt manuell in der jeweiligen Route
  (z. B. `assertOwner`, `assertMember`, `tx.buyerId === session.user.id`).
- **Body-Parsing:** durchweg `await req.json().catch(() => null)` + zod; dynamische
  Segmente über `ctx.params` sind **Promises** (Next 16): `const { id } = await ctx.params`.
- **KI-Credits:** KI-Aktionen buchen Credits über `chargeForAiAction(userId, action)`
  aus `lib/credits.ts` und erstatten bei Ausfall via `refundAiAction`. Kosten in
  `AI_ACTION_COSTS`. Ohne Login/Credits/aktives Abo läuft der regelbasierte Fallback.
- **Stripe:** Client aus `lib/stripe.ts` (`stripe`, `isStripeConfigured()`,
  `appBaseUrl()`); fehlt der Key → `503`.
- **Mail:** `sendEmail(...)` aus `lib/mailer.ts`, protokolliert in `EmailLog`.

### 8.1 Auth & Registrierung

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | — | NextAuth-Handler (Credentials-Provider, JWT-Sessions), Login/Session/CSRF | Session-Cookie |
| `/api/register` | POST | öffentlich | Neuregistrierung | `User.create`, ggf. `grantCredits` (Welcome + Referral) |
| `/api/auth/forgot-password` | POST | öffentlich | Passwort-Reset anfordern | `PasswordResetToken.create`, `sendEmail` (PASSWORD_RESET) |
| `/api/auth/reset-password` | POST | Token | neues Passwort per Token setzen | `User.update` + Token entwerten |
| `/api/profile/password` | POST | eingeloggt | Passwort im eingeloggten Zustand ändern | `User.update` (passwordHash) |
| `/api/gate` | POST | Gate-Credentials | HTTP-Basic-artiges Zugangs-Gate (Cookie) | setzt `GATE_COOKIE` (30 Tage) |

**`/api/register`** (zod `registerSchema`): Body `email`, `password` (min 8),
`pseudonym` (3–40, `^[A-Za-z0-9_-]+$`), `role` (`RESELLER`/`OEM`/`ENDKUNDE`, Default
RESELLER), `companyName`, optional `vatId`, `country` (2-stellig), optional
`referralCode`. Prüft mit `findPseudonymLeak` (`lib/pseudonym.ts`), dass das Pseudonym
nicht Firma/E-Mail/USt-ID/Herstellernamen verrät → `422`. Duplikat E-Mail/Pseudonym →
`409`. Setzt `trialEndsAt` aus Superadmin-Settings (`getAllSettings`), vergibt
`welcomeCredits` und (bei Werber-Match über Pseudonym) `referralCredits`. Passwort
bcrypt-gehasht (10 Runden). Antwort `201 { id, pseudonym, role }`.

**`/api/auth/forgot-password`** (zod `{ email }`): **Bewusst keine User-Enumeration** —
Antwort ist **immer** `{ ok: true }`, unabhängig davon, ob das Konto existiert. Bei
existierendem User: `PasswordResetToken.create` (Hash via `hashResetToken`, TTL
`RESET_TOKEN_TTL_MS`), Reset-Link geht **ausschließlich per E-Mail** raus (bis
2026-07-15 gab die Route ihn zusätzlich in der Antwort zurück — Übernahme-Lücke,
geschlossen). Mailversand **ohne `await`** (`void sendEmail(...)`), damit die
Antwortzeit nicht verrät, ob das Konto existiert (Timing-Enumeration).

**`/api/auth/reset-password`** (zod `{ token(min10), password(min8) }`): schlägt Token
per `hashResetToken` nach; unbekannt/benutzt/abgelaufen → generisches `400`. Atomar via
`$transaction`: setzt neues bcrypt-Passwort, markiert Token `usedAt` und entwertet
**alle** weiteren offenen Tokens des Users.

**`/api/gate`** (`lib/gate.ts`, `lib/base-path.ts`): vergleicht `{ user, password }`
gegen `gateCredentials()`; bei Erfolg httpOnly-Cookie `GATE_COOKIE` mit `gateToken()`,
`secure` in Production, 30 Tage. Hinweis: Live läuft ohne Gate (Session-Handoff).

### 8.2 Profil

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/profile/about` | POST | eingeloggt | Schaufenster-Text „Über uns" speichern (max 1500) | `User.update(about)` |
| `/api/profile/currency` | POST | eingeloggt | bevorzugte Anzeige-/Abrechnungswährung setzen | `User.update(preferredCurrency)` |
| `/api/profile/validate-vat` | POST | eingeloggt | USt-ID gegen EU-VIES prüfen | `User.update(vatValidatedAt/Name)` |
| `/api/account/redeem-code` | POST | eingeloggt | Gutschein-/Referral-Code einlösen | `redeemReferralCode` → Credits |

**`/api/profile/validate-vat`** (zod optional `vatId` 4–20): nutzt gespeicherte oder
mitgeschickte USt-ID, ruft `validateVatId` (`lib/vat-validation.ts`, VIES). Nicht
prüfbar → `422 { reason }`; ungültig → `422` und setzt vorigen Erfolg zurück
(`vatValidatedAt/Name = null`); gültig → speichert `vatValidatedAt` + `vatValidatedName`.

**`/api/account/redeem-code`** (zod `{ code }` 3–60): delegiert an
`redeemReferralCode(userId, code)` (`lib/credits.ts`). Reason-Codes werden auf deutsche
Meldungen gemappt (`not_found`/`expired`/`exhausted`/`already_redeemed`). Erfolg
`{ ok, credits, balance }`. Ein Code je Nutzer nur einmal einlösbar.

### 8.3 Marktplatz — Anbieten (Angebote/Listings)

Wortlaut: Angebote = **„Anbieten"** (blau). Modell `Listing`.

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/listings` | POST | eingeloggt | neues Angebot anlegen | `Listing.create`, Stufen-Limit |
| `/api/listings/[id]` | PATCH | Eigentümer | Angebot bearbeiten / Status ändern | `Listing.update` |
| `/api/listings/[id]` | DELETE | Eigentümer | Angebot „löschen" | Soft-Delete → `status: ARCHIVED` |
| `/api/listings/lookup` | GET | öffentlich | Angebote per `?ids=a,b,c` (max 50) laden | — (Read) |
| `/api/listings/[id]/alternatives` | POST | optional | KI-Alternativen zu einem Angebot | 1 Credit (KI) |
| `/api/listings/alternatives-search` | POST | optional | freie Alternativsuche (Produkt/Anforderungen, optional Web) | 1–2 Credits (KI) |

**`/api/listings` POST** (zod `listingSchema`): u. a. `productType`, `manufacturer`,
`productName`, `chemistry` (Enum MINERAL/SYNTHETIC/SEMI_SYNTHETIC/ESTER/PAG/OTHER),
`applicationArea`, `quantity`, `packaging` (DRUM/IBC/**TANK**/CANISTER/BULK/OTHER),
`certificates[]`, optional Preis/Datumsfelder/Fertigungsfelder
(`machiningOperations[]`, `mineralOilContent`, `containsGlycol`,
`automationSuitability`). **Angebots-Limit:** ermittelt aktive Stufe via `activeTier`
(`lib/membership-tiers.ts`); BASIS/ohne aktive Stufe hat Limit
(`listingLimitFor`/`getSettingInt("basisListingLimit")`) — bei Erreichen `422`
`{ code: "LISTING_LIMIT_REACHED" }`. Pro/Marke unbegrenzt. Antwort `201`.

**`/api/listings/[id]`**: `assertOwner` (nicht gefunden → 404, fremd → 403). PATCH
mit Teil-Schema inkl. `status` (ACTIVE/PAUSED/SOLD/ARCHIVED). DELETE archiviert nur.

**`/api/listings/[id]/alternatives` POST** (`maxDuration = 60`): Body = `MustHave`-Flags
(`sameProductType`, `sameChemistry`, `sameViscosity`, `requiredCertifications[]`,
`avoidIssues[]`, `workpieceMaterial`, `minAutomationScore`, `requireGlycolFree`).
Eingeloggt → `chargeForAiAction(..., "alternatives")` (1 Credit); ohne Credits/Login →
regelbasiert mit Hinweis. Ruft `findAlternatives` (`lib/alternatives.ts`). Kam KI nicht
zum Zug (`modelUsed !== "claude"`) → `refundAiAction`. Antwort inkl. `credits`-Objekt.

**`/api/listings/alternatives-search` POST** (zod): `mode` (`product`/`requirements`),
Filterfelder, `useWeb`. Web-Recherche (`searchAlternativesWeb`, Sonnet + Websuche) =
teuerste Aktion, `chargeForAiAction(..., "alternativesWeb")` (2 Credits); sonst
`searchAlternatives`. Ohne Eingabe → leeres Ergebnis. Refund wenn `modelUsed !==
"claude-web"`.

### 8.4 Marktplatz — Suchen (Anfragen/RFQ) & Angebote darauf

Wortlaut: Anfragen = **„Suchen"** (amber). Modelle `Rfq`, `RfqOffer`.

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/rfqs` | POST | eingeloggt | neue Anfrage („Suchen") anlegen | `Rfq.create` |
| `/api/rfqs/[id]/offers` | POST | eingeloggt | Angebot auf eine Anfrage abgeben | `RfqOffer.upsert` |
| `/api/rfqs/[id]/offers/[offerId]/accept` | POST | Käufer (RFQ-Ersteller) | Angebot annehmen | `$transaction`: RFQ+Offer-Status, `Transaction.create`, Konversation + Nachricht |

**`/api/rfqs` POST** (zod `rfqSchema`): u. a. `productType`, `quantity`, `deadline`
(datetime), `visibility` (`PUBLIC`/`VERIFIED_ONLY`, Default PUBLIC),
`requiredCertifications[]`, `avoidIssues[]`, `workpieceMaterial`. `buyerId` = Session.

**`/api/rfqs/[id]/offers` POST** (zod `offerSchema`: `priceEur`, `quantity`,
`deliveryDays`, optional Alternativ-Vorschlag): verweigert Eigenangebot (400), nicht
offene RFQ (409), abgelaufene Frist (409). Bei `VERIFIED_ONLY` müssen Bieter
`trustTier !== UNVERIFIED` sein (403). `RfqOffer.upsert` über unique
`rfqId_sellerId` → erneutes Bieten aktualisiert (Status zurück auf PENDING).

**`/api/rfqs/[id]/offers/[offerId]/accept` POST:** nur RFQ-Käufer (403 sonst), RFQ
muss OFFEN sein (409). Findet/erstellt `Conversation` (buyer/seller, `listingId: null`
— Composite-Unique mit NULL greift in Postgres nicht, daher manuelles find/create).
Atomar in `$transaction`: RFQ → `ACCEPTED` + `acceptedOfferId`, Offer → `ACCEPTED`,
übrige PENDING-Offers → `DECLINED`, `Transaction.create` (`totalEur = priceEur ×
quantity`), Systemnachricht in den Thread. Antwort `{ conversationId, transactionId }`.

### 8.5 Chat / Nachrichten

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/conversations` | POST | eingeloggt | Konversation starten (find-or-create) | `Conversation.create`, optionale Erstnachricht |
| `/api/conversations/[id]/messages` | GET | Teilnehmer | Nachrichten eines Threads laden | — (Read) |
| `/api/conversations/[id]/messages` | POST | Teilnehmer | Nachricht senden | `Message.create`, Kontaktdaten-Filter |

**`/api/conversations` POST** (zod `{ sellerId, listingId?, initialMessage? }`):
Selbstkontakt verboten (400). Existiert Thread (buyer/seller/listingId) → wird
wiederverwendet; optionale `initialMessage` (genutzt von „Muster anfordern"/„Angebot
anfragen") wird angehängt. Sonst `Conversation.create` (+ Erstnachricht).

**`/api/conversations/[id]/messages` POST** (zod `{ body }` 1–4000): `assertMember`
(nur buyer/seller). **Kontaktdaten-Filter** (`lib/contact-filter.ts`): Stufe 1 (Regex,
jede Nachricht) blockt E-Mail/Telefon/Links → `422`. Stufe 2 (KI `aiContactCheck`,
**einmalig pro Account**, Zeitstempel `User.aiContactCheckAt`) prüft die erste
Nachricht auf verschleierte Kontaktdaten → bei Fund `422`. Schützt das
Pseudonym-Modell. Bei Erfolg `Message.create` + `Conversation.updatedAt` bump.

### 8.6 Transaktionen & Käuferschutz

Wortlaut-Konvention: **„Käuferschutz"** — nie „Treuhand"/„Escrow". Modell
`Transaction` (`status`, `protectionStatus`). Umsetzung „separate charges & transfers":
Zahlung parkt bei der Plattform, Überweisung an den Verkäufer (Stripe Connect) erst
nach Lieferbestätigung.

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/transactions/[id]` | PATCH | Käufer/Verkäufer | Status-Statemachine (SHIP/COMPLETE/CANCEL/DISPUTE) | `Transaction.update`; bei COMPLETED: `recalcTrustTier`, `capturePriceFromTransaction` |
| `/api/transactions/[id]/reviews` | POST | Käufer/Verkäufer | Bewertung abgeben (1–5, Tags) | `Review.upsert`, `recalcTrustTier` |
| `/api/transactions/[id]/savings` | POST | Käufer | Einsparung durch Produktwechsel erfassen | `Transaction.update(replaced…)` |
| `/api/transactions/[id]/protection/checkout` | POST | Käufer | Zahlung mit Käuferschutz starten | Stripe-Checkout, `protectionStatus: PENDING_PAYMENT` |
| `/api/transactions/[id]/protection/confirm` | POST | Käufer | Dev-Fallback: Zahlung als geparkt bestätigen | `confirmProtectionPayment` → HELD |
| `/api/transactions/[id]/protection/release` | POST | Käufer | Lieferung bestätigen → Geld freigeben | `releaseProtection` (Stripe-Transfer), COMPLETED |
| `/api/transactions/[id]/protection/dispute` | POST | Käufer | Problem melden | `protectionStatus/status: DISPUTED` |

**`/api/transactions/[id]` PATCH** (zod `action` ∈ SHIP/COMPLETE/CANCEL/DISPUTE):
Statemachine `PENDING → {SHIPPED, CANCELED, DISPUTED}`, `SHIPPED → {COMPLETED,
DISPUTED}`. Rollenprüfung: SHIP nur Verkäufer, COMPLETE/CANCEL/… je nach Aktion; falsche
Übergänge → 409/403. Bei COMPLETED: `recalcTrustTier(buyer, seller)` +
`capturePriceFromTransaction` (Transaktionspreis wird belegter Marktpreis).

**`/api/transactions/[id]/protection/checkout` POST:** Stripe nötig (503 sonst). Nur
Käufer; Transaktion offen (PENDING/SHIPPED); Verkäufer muss Stripe-Connect
onboarded sein (sonst 422 „bietet keinen Käuferschutz"). Gebühr via `protectionFeeEur`
(`protectionFeeBp` + `protectionFeeFixedCt` aus Settings), **trägt der Käufer** als
eigene Checkout-Position. Zwei Line-Items (Warenbetrag + Gebühr),
`payment_intent_data.transfer_group = tx.id`, `metadata.kind = "PROTECTION"`. Speichert
`protectionStatus: PENDING_PAYMENT`, `protectionFeeEur`, `stripeProtectionSessionId`.
Antwort `{ url }`.

**`/api/transactions/[id]/protection/confirm`** (zod `{ sessionId }`): Dev-Fallback ohne
Webhook — verifiziert Checkout-Session bei Stripe (Session muss zur Transaktion passen),
`confirmProtectionPayment` (idempotent, → HELD).

**`/api/transactions/[id]/protection/release`:** nur Käufer, `protectionStatus` muss
`HELD` sein (409 sonst). `releaseProtection(id)` (`lib/protection-flow.ts`, Stripe-
Transfer an Verkäufer; Fehler → 502). Setzt Transaktion COMPLETED + `completedAt`,
`recalcTrustTier`, `capturePriceFromTransaction`.

**`/api/transactions/[id]/protection/dispute`:** nur Käufer, nur bei HELD → setzt beide
Status auf DISPUTED (geparktes Geld bleibt stehen; Superadmin entscheidet unter `/admin`).

**`/api/transactions/[id]/reviews`** (zod `rating` 1–5, `comment?`, `tags[]` ∈
FAST_RESPONSE/QUALITY_AS_DESCRIBED/ON_TIME_DELIVERY/FAIR_NEGOTIATION): nur nach
COMPLETED (409), nur Beteiligte. `Review.upsert` (unique `transactionId_reviewerId`),
danach `recalcTrustTier(revieweeId)`.

**`/api/transactions/[id]/savings`** (zod `{ replacedProductName, replacedPricePerUnit
}`, beide nullable): nur Käufer; setzt/entfernt die Einsparungs-Referenz (beide null =
entfernen).

### 8.7 Billing / Mitgliedschaft / Stripe

Client `lib/stripe.ts`; Fulfillment-/Kündigungslogik in `lib/membership.ts`. Fehlt
Stripe-Config → `503`.

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/billing/checkout` | POST | eingeloggt | Jahres-Abo (Auto-Renew) starten | Stripe Subscription-Checkout, `Payment.create(PENDING)` |
| `/api/billing/checkout-credits` | POST | eingeloggt | KI-Credit-Paket (S/M/L) kaufen | Stripe payment-Checkout, `Payment.create(PENDING)` |
| `/api/billing/confirm` | GET | eingeloggt | Dev-Fallback: Abo nach Redirect freischalten | `fulfillCheckoutSession` |
| `/api/billing/cancel` | POST | eingeloggt | Abo zum Periodenende kündigen (§ 312k BGB) | `cancelMembership` |
| `/api/billing/reactivate` | POST | eingeloggt | Kündigung widerrufen | `reactivateMembership` |
| `/api/billing/webhook` | POST | Stripe-Signatur | Abo-Lebenszyklus (Erstkauf, Renewal, Kündigung) | Fulfillment/Sync |
| `/api/connect/onboard` | POST | eingeloggt | Verkäufer schaltet Käuferschutz frei (Stripe Connect) | `Account.create` (express) + Onboarding-Link |

**`/api/billing/checkout` POST:** Body optional `{ tier }` (∈ `TIER_ORDER`, Default
BASIS). Ablehnung bei bereits aktivem Abo (409). Stripe-Customer wird einmalig angelegt
(`stripeCustomerId` gecached). Erzeugt **echtes** Abo (`mode: "subscription"`, inline
`price_data` mit `recurring.interval: "year"`, `unit_amount = getTierPriceEur(tier)×100`,
Produktname via `tierProduct`). `metadata { userId, kind: "MEMBERSHIP", tier }`. Success/
Cancel → `/mitgliedschaft?status=…`. Legt `Payment(PENDING, MEMBERSHIP)` an. Antwort `{ url }`.

**`/api/billing/checkout-credits` POST** (zod `{ packageId: S|M|L }`): Paket aus
`CREDIT_PACKAGES`; Preis `packagePriceEur(credits, getSettingInt("creditPriceCt"))`
(Standard 10 Ct/Credit). Abrechnung in Wunsch-/Landeswährung des Nutzers
(`billingCurrencyForUser`/`convertCurrency`/`toStripeAmount`, `lib/currency.ts`).
`mode: "payment"`, `metadata.kind = "CREDITS"`. `Payment.create` (Feld `amountEur`
enthält historisch den Betrag in `currency`).

**`/api/billing/confirm` GET** (`?session_id=`): Dev-Fallback **ohne** konfigurierten
Webhook — die Mitgliedschaftsseite ruft nach dem Erfolgs-Redirect diese Route auf, die
die Checkout-Session bei Stripe nachschlägt (metadata.userId muss = Session sein, sonst
403) und `fulfillCheckoutSession` ausführt. Deckt **keine** späteren automatischen
Verlängerungen ab — dafür braucht es den Webhook.

**`/api/billing/webhook` POST** (`runtime = "nodejs"`, roher Body für Signaturprüfung):
verlangt `STRIPE_WEBHOOK_SECRET` (503 sonst) und Header `stripe-signature`; verifiziert
mit `stripe.webhooks.constructEvent` (ungültig → 400). Verarbeitet:
`checkout.session.completed` → `fulfillCheckoutSession` (Erstabschluss Abo **oder**
Credit-Kauf); `invoice.payment_succeeded` → `fulfillRenewalInvoice` (verlängert
`membershipValidUntil` bei jeder Auto-Renewal); `customer.subscription.updated/deleted`
→ `syncSubscriptionStatus` (hält `membershipCancelAtPeriodEnd` synchron, auch bei
Kündigung direkt im Stripe-Kundenportal). Der **zuverlässige** Weg in Produktion.
Antwort `{ received: true }`.

**`/api/connect/onboard` POST:** legt (einmalig) ein Stripe-Connect-**Express**-Konto an
(`stripeConnectAccountId`), erzeugt `accountLinks` (`account_onboarding`, refresh/return
→ `/mitgliedschaft?connect=…`). Fehlt Connect im Stripe-Dashboard → freundliche 502-
Meldung. Voraussetzung, damit ein Verkäufer Käuferschutz anbieten kann.

### 8.8 KI (Wizard, Concierge, Alternativen)

Modell durchgehend `claude-haiku-4-5-20251001` (Web-Recherche: Sonnet). KI-Nutzung wird
über `recordAiUsage` (`lib/ai-usage.ts`) protokolliert. Fallback ohne
`ANTHROPIC_API_KEY`/Credits ist immer regelbasiert.

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/kss-wizard` | POST | optional | KSS-Alternativempfehlung (Top 3 + Begründung) | 1 Credit (`kssWizard`), Anthropic |
| `/api/kss-wizard/search` | GET | öffentlich | Autocomplete „Welchen KSS hast du?" (`?q=`) | — (Read) |
| `/api/concierge` | POST | optional | KI-Fachberater-Chat mit DB-Kontext | 1 Credit (`concierge`), Anthropic |
| `/api/listings/[id]/alternatives`, `/api/listings/alternatives-search` | POST | optional | → siehe Abschnitt 8.3 | KI-Credits |

**`/api/kss-wizard` POST:** Body = `WizardAnswers` (`satisfied`, `currentProductId`,
`problemDescription`, `applicationAreas[]`, `materials[]`, `productionType`,
`concentrateForm`, `criticalIssues[]`, `certifications[]`, `waterHardness`,
`unsureDimensions[]`). Ablauf: (1) optional Referenz-Produkt laden; (2)
Kandidaten-Pool = alle KSS-Produkte (Kategorien COOLANT_WATER_MIX/COOLANT_NEAT/
GRINDING_OIL); (3) **heuristisches Pre-Scoring** (Startwert 50, Boni/Mali auf
Anwendungen/Materialien/Form/kritische Punkte/Zertifikate; gesponserte Hersteller via
`sponsoredManufacturerIds()` +8, in der UI gekennzeichnet — P2B-VO 2019/1150 Art. 5) →
Top 12; (4) mit `ANTHROPIC_API_KEY` + Credit: `callAnthropic` (System-Prompt = KSS-
Berater, JSON-Antwort Top 3 mit `reason`/`matchScore`, `max_tokens: 2500`), Ergebnisse
zurückgemappt inkl. `sealWarning` (`recommendMaterialsForProduct`,
`lib/seal-recommendations.ts`). Bei Fehler → `refundAiAction` + Heuristik-Fallback.
Antwort `{ recommendations, summary, source ("anthropic-claude"|"heuristic-fallback"),
creditNotice, candidatePoolSize, consideredTop }`.

**`/api/concierge` POST** (zod `{ messages: [{role,content}] }`, 1–20, je ≤2000):
extrahiert Keywords aus der letzten Nutzer-Nachricht (Stopwort-Filter + `searchTokens`
via `buildSearchWhere`), sammelt DB-Kontext (bis 5 Produkte, 5 aktive Angebote, 4
`ProductIssue`). Mit Key + Login + Credit: `askClaude` (System-Prompt „Brisco-
Concierge", relative Markdown-Links, „Tank" statt „Sumpf", `max_tokens: 1000`, Timeout
25 s). Fehler → `refundAiAction`. Ohne Anmeldung/Credits: `heuristicReply` aus denselben
Daten + Hinweistext. Antwort `{ reply, source, creditBalance? }`.

### 8.9 Werbung (Anzeigen)

Modell `AdBanner`. Zugriff nur mit aktiver **Marke**-Stufe **oder** Admin
(`requireAdManager` in `app/api/ads/route.ts`, geprüft `activeTier`/`hasStorefront`).

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/ads` | POST | Marke/Admin | neue Anzeige anlegen | `AdBanner.create` |
| `/api/ads/[id]` | PATCH | Eigentümer/Admin | Anzeige ändern | `AdBanner.update` |
| `/api/ads/[id]` | DELETE | Eigentümer/Admin | Anzeige löschen (hart) | `AdBanner.delete` |
| `/api/marke/storefront` | POST | Marke | vertretenen Hersteller + Schaufenster-Text festlegen | `User.update(brandManufacturerId, storefrontHeadline, about)` |

**`/api/ads`** (zod `adSchema`): `headline`, `chips[]` (≤4), `image` (data:-URI oder
`/`-Pfad, max ~1,4 MB), `ctaUrl` (URL), `placements[]` ∈ HOME/STOREFRONT/LISTINGS,
`active`, optionale Zeitfenster. Anzeige wird mit der eigenen Marke
(`brandManufacturerId`) verknüpft. PATCH nutzt `adSchema.partial()`. `requireAdManager`
wird aus `route.ts` in `[id]/route.ts` **re-exportiert** und dort wiederverwendet.

**`/api/marke/storefront`** (zod `{ manufacturerId(nullable), headline?, about? }`): nur
mit `hasStorefront(tier)` (403 sonst). Setzt bei gültigem Hersteller
`brandManufacturerId` + Schaufenster-Felder (schaltet `/manufacturers/[slug]` und die
gekennzeichnete Wizard-Hervorhebung frei); `manufacturerId: null` deaktiviert das
Schaufenster.

### 8.10 Preise (crowdsourced Marktpreise)

Modell `PriceObservation`.

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/prices/submit` | POST | eingeloggt | beobachteten Preis melden | `PriceObservation.create(PENDING)` |
| `/api/prices/verify` | POST | Admin/Trade-Assured+ | Meldung freigeben/ablehnen | `PriceObservation.update(VERIFIED/REJECTED)` |

**`/api/prices/submit`** (manuelle Validierung, kein zod): Pflicht `productId`,
`pricePerUnit` (>0, ≤100000), `unit` (EUR/CHF/USD pro L/KG/PIECE); Produkt muss
existieren (404); `observedAt` Plausibilität (nicht Zukunft, ≤10 Jahre alt). Legt
Beobachtung `source: USER_SUBMITTED`, `status: PENDING` an. **`/api/prices/verify`:**
nur `role === ADMIN` **oder** `trustTier ∈ {TRADE_ASSURED, PREMIUM}` (403 sonst); nicht
PENDING → 409; **Eigen-Meldung** nicht selbst verifizierbar (409); setzt Status +
`verifiedByUserId`/`verifiedAt`, bei Ablehnung `rejectionReason`.

### 8.11 Admin / Export

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/admin/export` | GET | Admin | CSV-Export der Admin-Listen (`?list=`) | — (Read) |
| `/api/umsaetze/export` | GET | eingeloggt | eigene Transaktionen als CSV | — (Read) |

**`/api/admin/export` GET** (`?list=users|referrals|protection|emails`): nur
`role === ADMIN`, sonst bewusst **404** (Existenz nicht verraten). Baut CSV via
`lib/csv.ts` (`toCsv`/`csvResponse`). `users` = alle Kunden mit Pseudonym/E-Mail/Firma/
USt-ID/Rolle/Trust/Boost/Credits/Abo/Trial/Angebotszahl; `referrals` = alle
`ReferralCode`; `protection` = alle `Transaction` (Käufer/Verkäufer/Produkt/Betrag/
Status/Käuferschutz); `emails` = alle `EmailLog`. Dateiname mit Datumsstempel.
**`/api/umsaetze/export`:** eigene Käufe+Verkäufe, deutsches CSV (Semikolon, UTF-8-BOM
für Excel-Umlaute), inkl. berechneter Einsparung (`replacedPricePerUnit×quantity −
totalEur`) für Käufe.

### 8.12 Tracking / Analytics / Cron / sonstige

| Route | Methode | Auth | Zweck | Effekte |
|---|---|---|---|---|
| `/api/track` | POST | optional | Nutzungs-Ereignis (`pageview`/`search`) | `UsageEvent.create` (fehlertolerant) |
| `/api/cron/membership-reminders` | GET | Bearer `CRON_SECRET` | tägl. Erinnerung ~30 Tage vor Auto-Renewal | `sendEmail` (MEMBERSHIP_RENEWAL_REMINDER) |
| `/api/trial-info` | GET | öffentlich | aktuelle Trial-Konditionen (Tage + Startguthaben) | — (Read) |
| `/api/manufacturers/names` | GET | öffentlich | alle Herstellernamen (alphabetisch) für Autocomplete | — (Read) |
| `/api/sds/[id]/download` | GET | öffentlich | Sicherheitsdatenblatt-PDF ausliefern (`?inline=1`) | Datei-Read |

**`/api/track`** (zod `{ kind, path?, meta? }`): datenschutzarm — keine IP, keine
Cookies; nur Pfad/Begriff + optionale User-ID. Fehler werden bewusst verschluckt
(`try/catch`, still) — Tracking darf die Seite nie stören.

**`/api/cron/membership-reminders` GET:** wenn `CRON_SECRET` gesetzt, muss Header
`Authorization: Bearer <CRON_SECRET>` passen (401 sonst) — für externen Scheduler
(Railway/Vercel Cron). Findet Nutzer, deren `membershipValidUntil` im Zielfenster
(`MEMBERSHIP_REMINDER_DAYS_BEFORE` ~30 Tage) liegt, die **nicht** gekündigt haben
(`membershipCancelAtPeriodEnd: false`) und aktives Abo (`stripeSubscriptionId`) haben.
**Idempotent:** überspringt, wer für dieses Fenster bereits einen `EmailLog`
(`MEMBERSHIP_RENEWAL_REMINDER`) hat. Verschickt `renewalReminderEmail`
(`lib/membership-emails.ts`). Antwort `{ ok, candidates, sent }`.

**`/api/sds/[id]/download` GET:** lädt `SafetyDataSheet`, liest die PDF von Platte;
**Path-Traversal-Schutz** — absoluter Pfad muss unter `data/sds` liegen (400 sonst),
fehlende Datei → 410. Liefert `application/pdf`, `Content-Disposition` inline
(`?inline=1`) oder attachment, `Cache-Control: private, max-age=300`. **Kein
Auth-Check** — SDS sind öffentlich.

### 8.13 Zusammenfassung Auth-Schutz

- **Öffentlich (kein Login):** `auth/[...nextauth]`, `register`, `forgot-password`,
  `reset-password`, `gate`, `trial-info`, `manufacturers/names`, `kss-wizard/search`,
  `sds/[id]/download`, `listings/lookup`. KI-Routen (`kss-wizard`, `concierge`,
  `listings/[id]/alternatives`, `alternatives-search`, `track`) sind **ohne Login
  aufrufbar**, laufen dann aber ohne KI (regelbasierter Fallback bzw. anonymes Tracking).
- **Login erforderlich:** der Großteil (Listings/RFQ/Offers/Conversations/Transactions/
  Profile/Billing/Prices-submit/Connect/Marke/Ads/Umsätze-Export).
- **Rollen/Tier-gebunden:** `admin/export` (ADMIN, sonst 404), `prices/verify`
  (ADMIN oder TRADE_ASSURED/PREMIUM), `ads`/`marke/storefront` (Marke-Stufe oder Admin),
  RFQ-Bieten bei `VERIFIED_ONLY` (Trust ≠ UNVERIFIED).
- **Signatur/Secret:** `billing/webhook` (Stripe-Signatur), `cron/membership-reminders`
  (Bearer `CRON_SECRET`), `gate` (Gate-Credentials).
- **Ownership:** `listings/[id]`, `ads/[id]`, `conversations/*` (Teilnehmer),
  `transactions/*` (Käufer/Verkäufer je Aktion).

---

## 9. Mehrsprachigkeit (i18n: DE/EN/NL)

Die App ist ein eigenständiges, minimalistisches i18n-System ohne Fremdbibliothek
(kein `next-intl`, kein `i18next`). Kern ist ein statisches Wörterbuch in
`lib/i18n.ts` plus zwei dünne Helfer für Server- (`lib/i18n-server.ts`) und
Client-Kontext (`components/LocaleProvider.tsx`). Die Sprachwahl liegt in einem
Cookie und wird im Root-Layout **serverseitig** gelesen — dadurch rendert der
Server bereits in der Zielsprache (kein Hydration-Mismatch, kein Aufblitzen von
Deutsch).

### 9.1 Unterstützte Sprachen & Konstanten (`lib/i18n.ts`)

| Bezeichner | Wert | Zweck |
|---|---|---|
| `type Locale` | `"de" \| "en" \| "nl"` | Union der gültigen Sprachcodes |
| `LOCALES` | Array `{ code, label, flag }` | de → „Deutsch" 🇩🇪, en → „English" 🇬🇧, nl → „Nederlands" 🇳🇱 |
| `DEFAULT_LOCALE` | `"de"` | Hauptsprache & Fallback |
| `LOCALE_COOKIE` | `"NEXT_LOCALE"` | Cookie-Name, den **Server und Browser** lesen |

- **Deutsch ist Primärsprache**: Seed-Daten, Schema-Kommentare, Rechtstexte und der
  Fallback jeder Übersetzung sind deutsch.
- `toLocale(value: string | undefined | null): Locale` — validiert einen beliebigen
  Cookie-/Query-Wert gegen `LOCALES` und liefert bei Ungültigkeit `DEFAULT_LOCALE`.
  Wird an jeder Eintrittsstelle (Layout, Server-Helfer) genutzt, damit nie ein
  ungültiger Code durchrutscht.

### 9.2 Wörterbuch & Kernfunktionen

- `type Dict = Record<string, string>` — flache Key→Text-Map, **Punkt-getrennte
  Namespaces** als Schlüssel (z. B. `"header.searchButton"`, `"cat.GREASE"`).
- `export const MESSAGES: Record<Locale, Dict>` — ein Objekt mit den drei Blöcken
  `de`, `en`, `nl`. Jeder Block enthält denselben Schlüsselsatz.
- **Umfang: exakt 1028 Schlüssel je Sprache** (de = en = nl = 1028), also 3084
  Einträge insgesamt; die Datei ist 3217 Zeilen lang. Blockgrenzen:
  `de:` ab Zeile 45, `en:` ab 1102, `nl:` ab 2149.

```ts
export function translate(locale: Locale, key: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
}
```

Fallback-Kette: **Zielsprache → Deutsch → der Schlüssel selbst.** Fehlt eine
Übersetzung, bleibt die Seite benutzbar (deutscher Text statt Leerstelle); fehlt der
Schlüssel ganz, erscheint der Schlüsselstring — nützlich zum Auffinden von Lücken.

```ts
export function fill(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(String(v)), text);
}
```

`fill` ersetzt Platzhalter der Form `{name}` in einem bereits übersetzten Text.
Konvention: **Zahlen/dynamische Werte stehen NICHT fest im Übersetzungstext**,
sondern werden zur Laufzeit eingesetzt (z. B. Trial-Tage/Credits aus
Superadmin-Einstellungen, Trefferzahlen). Beispiele im Code:
`fill(t("prc.productsWithGuide"), { n: … })`,
`fill(t(count === 1 ? "ghs.countSingular" : "ghs.countPlural"), { count })`,
`fill(t("home.ctaRegisterHint"), { c: … })`. Singular/Plural wird über die
Schlüsselwahl vor `fill` gelöst (`…Singular`/`…Plural`, `…one`/`…other`), nicht über
eine Pluralisierungs-Engine.

### 9.3 Serverseitiges Lesen im Root-Layout (`app/layout.tsx`)

Das Root-Layout ist eine async Server-Komponente. Ablauf:

1. `const store = await cookies();`
2. `const locale = toLocale(store.get(LOCALE_COOKIE)?.value);`
3. `const t = (key: string) => translate(locale, key);` — lokaler Übersetzer für die
   im Layout selbst gerenderten Texte (Suchleiste, Vertrauens-Leiste, Fußzeile).
4. `<html lang={locale}>` setzt das HTML-`lang`-Attribut korrekt.
5. `<Providers locale={locale}>` reicht die Sprache an den Client weiter.

`app/providers.tsx` (Client) rendert `<LocaleProvider initialLocale={locale}>`
innerhalb des NextAuth-`SessionProvider`. Dadurch startet der Client mit exakt der
serverseitig gewählten Sprache.

### 9.4 Server-Helfer (`lib/i18n-server.ts`)

Bewusst eigene Datei, weil `next/headers` (Cookies) **nicht** in `lib/i18n.ts`
stehen darf — letzteres wird auch von Client-Komponenten importiert.

| Funktion | Signatur | Zweck |
|---|---|---|
| `getLocale()` | `async (): Promise<Locale>` | liest `LOCALE_COOKIE`, `toLocale`-validiert |
| `getT()` | `async (): Promise<(key: string) => string>` | liefert gebundenen Übersetzer für die aktuelle Sprache |

Verwendung in Server-Seiten: `const t = await getT();` dann `t("home.title")`.

### 9.5 Client-Kontext (`components/LocaleProvider.tsx`)

`"use client"`. Stellt einen React-Context bereit:

```ts
type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};
```

- `LocaleProvider({ initialLocale = DEFAULT_LOCALE, children })` hält `locale` als
  State (Startwert = serverseitig gelesenes Cookie → kein Flackern).
- `t = useCallback((key) => translate(locale, key), [locale])`.
- `setLocale(l)` **setzt das Cookie clientseitig** und lädt die Seite neu:
  `document.cookie = "NEXT_LOCALE=…;path=/;max-age=31536000;samesite=lax"`, dann
  `window.location.reload()`. Der Reload ist nötig, damit auch die
  **Server-gerenderten** Texte (Kopfzeile, Seiteninhalte) in der neuen Sprache
  kommen — ein reines State-Update erreicht diese nicht.
- `useLocale(): LocaleCtx` — Hook für Client-Komponenten:
  `const { t, locale, setLocale } = useLocale();`.

**Sprachumschalter** `components/LanguageSwitcher.tsx` (Client): Dropdown aus
`LOCALES` (Flagge + Label), ruft `setLocale(code)`. Zeigt aktuelle Flagge + Code
in der Kopfzeile.

### 9.6 Konvention für Helfer-Komponenten & Modul-Ebene-Arrays

Da `t` in Server- und Client-Komponenten unterschiedlich beschafft wird
(`getT()` vs. `useLocale()`), gilt für wiederverwendbare Helfer und für auf
**Modul-Ebene** definierte Konfigurations-Arrays folgende Regel:

- **`t` wird als Argument/Prop durchgereicht**, nicht im Helfer selbst beschafft.
- **Modul-Ebene-Arrays speichern den Schlüssel-String** im `label`, nicht den
  fertigen Text (zur Modulzeit gibt es noch keine Sprache). Übersetzt wird erst
  beim Rendern mit `t(row.label)`.

Referenz `app/compare/page.tsx` (Vergleichstabellen):

```ts
type ListingRow = { label: string; render: (l, t?) => ReactNode };
const LISTING_ROWS: ListingRow[] = [
  { label: "cmp.rowManufacturer", render: (l) => l.manufacturer },
  { label: "cmp.rowPackaging",    render: (l, t) => t(`pkg.${l.packaging}`) },
  …
];
// beim Rendern:  {t(row.label)}   und   {row.render(l, t)}
```

Beachte auch das Muster `t(\`pkg.${l.packaging}\`)` bzw. `t(\`cat.${p.category}\`)`:
**dynamische Schlüssel aus Enum-Werten** — siehe nächster Abschnitt.

### 9.7 Enum-Namespaces (wiederverwendbare Schlüssel-Familien)

Prisma-Enum-Werte werden übersetzt, indem der Enum-Wert an ein Namespace-Präfix
gehängt wird: `t(\`<namespace>.<ENUM_VALUE>\`)`. Diese Familien sind über die ganze
App wiederverwendbar (Filter, Karten, Vergleich, Detailseiten). Wichtige
Namespaces:

| Namespace | Bezug (Enum/Feld) | Beispiel-Schlüssel |
|---|---|---|
| `cat.` | Produkt-`category` | `cat.GREASE` → „Fett", `cat.HYDRAULIC_OIL` |
| `chem.` | Chemie-Basis | `chem.SYNTHETIC` → „Vollsynthetisch", `chem.PAG` |
| `focus.` | Hersteller-/Produkt-Fokus | `focus.COOLANT` → „Kühlschmierstoffe" |
| `compat.` | Verträglichkeits-Stufe | `compat.RECOMMENDED`, `compat.UNSUITABLE` |
| `matcat.` | Material-Kategorie | `matcat.ELASTOMER`, `matcat.METAL` |
| `ingcat.` | Inhaltsstoff-Kategorie | `ingcat.BIOCIDE`, `ingcat.BASE_OIL_ESTER` |
| `effect.` | Materialschaden-Effekt | `effect.SWELLING` → „Quellung", `effect.NONE` |
| `pkg.` | Gebinde/Packaging | `pkg.<ENUM>` |
| `ghs.` | GHS-Piktogramme/-Sätze | `ghs.countSingular`, `ghs.countPlural` |

Größte Namespaces nach Schlüsselzahl (über alle Sprachen): `sdsd.` (SDS-Detail),
`alt.` (Alternativen), `lnew.`/`rnew.` (neues Angebot/Anfrage-Formular), `prc.`
(Preise), `trust.`, `cmp.` (Vergleich), `tds.`, `ghs.`, `dash.` (Dashboard), sowie
`rev.`, `reg.`, `mem.`, `kss.`, `home.`, `prof.`, `mat.`, `txn.` u. a. Kleine
UI-Namespaces: `nav.`, `header.`, `footer.`, `account.`, `filter.`, `auth.`,
`trial.`, `common.`.

### 9.8 Feste Regeln (nicht übersetzen / Rechtstexte)

1. **Produktdaten & technische Werte werden NICHT übersetzt.** Produktnamen,
   Markennamen, ISO-VG-Werte, physikochemische Kennzahlen, Freigaben usw. sind
   international identisch und bleiben in Originalform. Nur allgemeine Fachwörter
   (z. B. Anwendungen wie „Fräsen"/`app.fraesen`) sind übersetzbar. Der
   Dateikopf von `lib/i18n.ts` hält dies ausdrücklich fest.
2. **Rechtstexte nur Deutsch.** AGB (`/agb`), Impressum (`/impressum`),
   Datenschutz (`/datenschutz`) existieren ausschließlich auf Deutsch —
   „maßgeblich ist die deutsche Fassung" (Entscheidung 2026-07-15: mehrere
   Sprachfassungen wären mehrere rechtsverbindliche Dokumente). Die **Fußzeile
   zeigt bei EN/NL einen Vorrang-Hinweis** auf die deutsche Fassung; in
   `app/layout.tsx`:

   ```tsx
   {locale !== DEFAULT_LOCALE && (
     <div>…{t("footer.legalNote")}</div>   // „Rechtstexte ausschließlich auf
   )}                                       //  Deutsch — maßgeblich ist die
                                            //  deutsche Fassung."
   ```

3. **Wortlaut-Konvention.** In allen Sprachen bleibt die Anbieten/Suchen-Logik
   erhalten: Angebote = „Anbieten" (blau, `header.offer`, `listings.*`), Anfragen
   = „Suchen" (amber, `nav.rfqs`, `rfqs.*`). Käuferschutz nie „Treuhand"/„Escrow";
   „Tank" statt „Sumpf". Die englischen/niederländischen Übersetzungen halten die
   Bedeutung „anbieten/suchen" bei.

### 9.9 Neue Schlüssel anlegen

1. Schlüssel in **allen drei** Blöcken (`de`, `en`, `nl`) von `MESSAGES` ergänzen;
   passenden Namespace wählen bzw. für Enums die bestehende `<namespace>.<ENUM>`-
   Familie erweitern. (Fehlt ein Schlüssel in einer Sprache, greift automatisch
   Deutsch — die Datei sollte aber pro Sprache 1028 Schlüssel gleich halten.)
2. Im Code über `t("namespace.key")` verwenden — `useLocale().t(…)` (Client) bzw.
   `(await getT())(…)` / `translate(locale, …)` (Server).
3. Dynamische Werte über `fill(t("key"), { name: wert })` einsetzen; feste
   Platzhalter im Text als `{name}` schreiben.
4. Bei Helfern/Modul-Arrays den **Schlüssel-String** speichern und `t`
   durchreichen (→ Abschnitt 9.6).

---

## 10. UI, Design-System & Komponenten

Frontend-Stack: Next.js 16 App Router, React Server- und Client-Components, Tailwind CSS 3,
Icons ausschließlich aus `lucide-react`. Kein UI-Framework (kein MUI/shadcn), keine
Chart-Library — Diagramme sind handgeschriebenes SVG/CSS (→ Abschnitt 10.7). Der Pfad-Alias
`@/*` zeigt auf den Repo-Root; alle Komponenten liegen flach unter `components/` (plus
Unterordner `components/compare/`).

### 10.1 Design-Sprache & Farbschema

Konfiguriert in `tailwind.config.ts` (`theme.extend`). Content-Globs: `./app/**/*.{ts,tsx}`,
`./components/**/*.{ts,tsx}`.

**Eigene Farbpaletten (`colors`):**

| Palette | Bedeutung | Signaturfarbe |
|---|---|---|
| `brand` (50–900) | Brisco-Lime-Grün, Primärfarbe. Kommentar: „offizielles Lime-Grün #abd91a (Signatur = 400)", dunklere Töne ab 500 für Buttons/Links mit weißer Schrift | `brand-400 #abd91a`, Buttons `brand-600 #74980f` |
| `graphite` (50–900) | Brisco-Grau aus dem Logo (#4f4c4d), neutrale Sekundärfarbe | `graphite-600 #4f4c4d` |
| `accent` (50–700) | Warmes Orange, für `btn-accent` | `accent-500 #e88a14` |

Wichtig: Für **neutrale Textfarben immer `slate`** verwenden (nicht `graphite` mischen —
so die verbindliche Vorgabe im globals.css-Kommentar zur Typo-Skala).

**Eigene Schatten (`boxShadow`):** `soft` (leichte Karten-Elevation) und `lift`
(Hover-Elevation) — beide mit graphite-getöntem RGBA. Keine weiteren Theme-Erweiterungen
(keine eigenen Fonts, keine Breakpoint-Overrides).

**Semantische Farbcodierung (durchgängige Konvention, per Tailwind-Standardfarben):**

| Zweck | Farbe | Beispiel |
|---|---|---|
| „Anbieten" / Angebote | **blau** bzw. `brand`-grün | Badge „Bietet an" (`bg-blue-100`/`bg-brand-100`) |
| „Suchen" / Anfragen | **amber** | RfqCard-Streifen `from-amber-400 to-amber-600`, Badge „Sucht" |
| Käuferschutz, positiv/verträglich, aktiv/offen | **emerald** | ProtectionPanel, Status „aktiv"/„offen" |
| Warnung/gesponsert/pausiert | **amber** | „Gesponsert"-Label, Status „pausiert" |
| Ungeeignet, Fehler, Preisanstieg, „Problem melden" | **rot** (`red-*`) | Preistrend ↗, Fehlermeldungen |
| KI-Features (Wizard, Concierge, Analyse) | **violett→blau-Gradient** | `from-purple-600 to-blue-600` |
| Anzeige-Kennzeichnung (P2B-VO) | `slate-400` Eyebrow „Anzeige" | AdSlot |

**Body-Hintergrund** (globals.css): `bg-gradient-to-b from-slate-50 to-slate-100`,
`text-slate-900`, `min-height: 100vh`.

### 10.2 Wiederkehrende Utility-Klassen (`app/globals.css`)

Definiert über `@layer`-freie `@apply`-Regeln direkt nach den drei `@tailwind`-Direktiven.
Diese Klassen sind verbindlich statt Ad-hoc-Utility-Ketten:

| Klasse | Zweck / Definition |
|---|---|
| `.btn` | Basis-Button: `inline-flex … rounded-md px-4 py-2 text-sm font-medium transition-all` |
| `.btn-primary` | `.btn` + `bg-brand-600 font-semibold text-white shadow-soft hover:bg-brand-700 hover:shadow-lift` |
| `.btn-secondary` | `.btn` + `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50` |
| `.btn-accent` | `.btn` + `bg-accent-500 text-white shadow-soft hover:bg-accent-600` |
| `.input` | Formularfeld: `w-full rounded-md border border-slate-300 … focus:border-brand-500 focus:ring-1 focus:ring-brand-500` |
| `.label` | `mb-1 block text-sm font-medium text-slate-700` |
| `.card` | `rounded-xl border border-slate-200 bg-white p-5 shadow-soft` |
| `.chip` | `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium` (Farbe kommt extern dazu) |

**Verbindliche Typo-Skala** (nur diese vier Klassen statt gemischter `text-2xl/3xl` +
`semibold/bold`; Textfarbe immer slate):

| Klasse | Definition |
|---|---|
| `.page-title` | `text-2xl font-bold tracking-tight text-slate-900` (h1) |
| `.section-title` | `text-lg font-semibold text-slate-900` (h2) |
| `.eyebrow` | `text-xs font-semibold uppercase tracking-wide text-slate-500` |
| `.stat-value` | `text-3xl font-bold text-slate-900` (Dashboard-Kennzahl) |

### 10.3 Wortlaut-Konvention (verbindlich)

Durchgängig eingehalten in nutzersichtbarem Text, Code-Kommentaren und Seed-Daten:

- **Angebote heißen „Anbieten" / „Bietet an" (blau/`brand`)** — nie „Listings".
  Die interne Route/Modell heißt zwar `listings`/`Listing`, im UI erscheint aber nur
  „Anbieten"/„Bietet an" (siehe `ListingCard` Badge „Bietet an").
- **Anfragen heißen „Suchen" / „Sucht" (amber)** — nie „RFQs". Route/Modell `rfqs`/`Rfq`,
  UI-Badge „Sucht" mit `Search`-Icon und amber-Streifen (`RfqCard`).
- **Käuferschutz** nie „Treuhand"/„Escrow" (siehe `ProtectionPanel`, `ConnectOnboardingBox`:
  Wording „Käuferschutz").
- **„Tank"** statt „Sumpf" für Packaging/Behälter (`Packaging.TANK`).

### 10.4 TrustBadge (`components/TrustBadge.tsx`)

Zentrale Vertrauens-Kennzeichnung. Exportiert `TIER_STYLES` (Record über 5 Tiers),
`TrustBadge` und `TierProgress`. Tier-Typ:
`"UNVERIFIED" | "VERIFIED" | "TRADE_ASSURED" | "PREMIUM" | "DIAMOND"`.

| Enum-Wert | level | label (UI) | short | Icon (lucide) | Farbwelt / iconColor | title (Tooltip = Aufstiegskriterien) |
|---|---|---|---|---|---|---|
| `UNVERIFIED` | 1 | Neuling | Neu | `Sparkles` | slate (`bg-slate-100 text-slate-700 ring-slate-200`) | „Neuer Reseller — noch keine abgeschlossene Transaktion" |
| `VERIFIED` | 2 | Bronze-Partner | Bronze | `Medal` | amber→orange-Gradient, `text-orange-600` | „Verifiziert · mind. 1 abgeschlossene Transaktion" |
| `TRADE_ASSURED` | 3 | Silber-Partner | Silber | `Award` | slate-Gradient, `text-slate-500` | „≥ 10 Transaktionen · Rating ≥ 4,2 · keine offenen Beschwerden" |
| `PREMIUM` | 4 | Gold-Partner | Gold | `Crown` | yellow→amber-Gradient, `text-amber-600` | „≥ 50 000 € Umsatz · Rating ≥ 4,5 · seit ≥ 6 Monaten aktiv" |
| `DIAMOND` | 5 | Diamant-Partner | Diamant | `Gem` | cyan→sky→violet-Gradient, `text-violet-500` | „≥ 200 000 € Umsatz · Rating ≥ 4,7 · ≥ 50 Bewertungen · ≥ 12 Monate aktiv" |

`TrustBadge`-Props: `tier`, `size` (`"xs" | "sm" | "md"`, Default `sm` — steuert Padding,
Textgröße, Icon-px), `showLabel` (Default true). Rendert einen `rounded-full`-Pill mit Icon
(`strokeWidth 2.25`) + Label. `TierProgress`: zeigt alle 5 Tier-Icons nebeneinander, die bis
zum aktuellen Level in Farbe, darüber `text-slate-200` (Fortschrittsanzeige „Tier X von 5").

Die Label-Namen (Bronze/Silber/Gold/Diamant) sind eine reine Präsentations-Ebene über den
Prisma-`trustTier`-Enumwerten (→ siehe Abschnitt Datenmodell).

### 10.5 Komponenten-Inventar (~80 Komponenten, thematisch gruppiert)

Alle unter `components/` (bzw. `components/compare/`). Je Komponente eine Zeile Zweck.

**Layout / Navigation / Locale**
- `HeaderNav.tsx` — Kopfzeile Zeile 1 (Sprache + Konto/Anmelden); zweizeiliger Header, `"use client"`.
- `AccountMenu.tsx` — Konto-Dropdown mit Navigations-Links (i18n-`labelKey`), Rollen-/Admin-abhängig.
- `LanguageSwitcher.tsx` — Sprachumschalter (Flagge + Kürzel), schreibt Locale-Cookie; nutzt `lib/i18n` `LOCALES`.
- `LocaleProvider.tsx` — React-Context (`useLocale`) mit `t()`-Übersetzungsfunktion, Client-seitig.
- `SignOutButton.tsx` — einfacher Abmelden-Button (`signOut`).
- `AccountMenu`/`SecondaryNav` (Anbieten + Merkliste) — Header Zeile 2 laut Kommentar (in `app/layout.tsx` gemountet).
- `AnalyticsTracker.tsx` — erfasst datenschutzarm Seitenaufrufe/Suchbegriffe (kein Cookie/IP), im RootLayout gemountet.
- `ServiceWorkerRegistration.tsx` — registriert Service-Worker (PWA-Installierbarkeit), im Dev übersprungen.
- `Skeleton.tsx` — Lade-Platzhalter (`Skeleton`, `SkeletonCard`), `animate-pulse`.
- `Collapsible.tsx` — auf-/zuklappbarer Abschnitt mit Titel/Untertitel/Badge-Count.
- `GateLogin.tsx` — vorgeschaltete Passwort-Gate-Login-Seite (Stub-Zugangsschutz), vom RootLayout gerendert solange kein Gate-Cookie. Hinweis: laut Memory ist markt.brisco.ch aktuell **ohne Gate** live.

**Angebote / Anfragen / Karten**
- `ListingCard.tsx` — Angebots-Karte, Varianten `compact` (schmale Zeile) + `extended` (Bildkarte); Badge „Bietet an", Sponsored-Label, TrustBadge, CompareToggle. → siehe 10.6.
- `RfqCard.tsx` — Anfrage-Karte („Sucht", amber-Streifen), Varianten `compact`/`extended`; Status-Meta OPEN/ACCEPTED/EXPIRED/CANCELED.
- `ConceptBrowseGrid.tsx` — Client-Browse-Grid für Angebote mit Merkliste-Herz, Filterung im Konzept-Stil.
- `QuickStatusToggle.tsx` — Angebots-Status schnell umschalten (Aktiv/Pausiert/Verkauft/Archiviert).
- `ListingEditForm.tsx` — Formular zum Bearbeiten eines Angebots (Chemistry/Packaging/Status-Enums).
- `SubmitOfferForm.tsx` — Angebot auf eine Anfrage abgeben (Preis, Menge, Lieferzeit, Alternativprodukt).
- `AcceptOfferButton.tsx` — Angebot annehmen (öffnet Conversation + Transaction).
- `InquiryButtons.tsx` — „Muster anfordern" / „Angebot anfragen", öffnet pseudonymen Chat mit strukturierter Erstnachricht.
- `ContactSellerButton.tsx` — „Verkäufer kontaktieren", startet/öffnet Conversation-Thread.
- `ApplicationEntry.tsx` — Server-Komponente: Anwendungs-Facetten-Kachel (aus `lib/application-facets`).

**Vergleich (`components/compare/`)**
- `CompareStore.tsx` — localStorage-Store (`useCompareList`) für ausgewählte `listings`/`products`, max 6, Custom-Event-Sync.
- `CompareToggle.tsx` — Auswahl-Umschalter in 3 Varianten (`checkbox`/`icon`/`button`).
- `CompareBar.tsx` — Sticky-Bar unten, erscheint bei ≥1 Auswahl, Link → `/compare?listings=…&products=…`.
- `AiAnalysisPanel.tsx` — KI-Vergleichsanalyse auf `/compare`, ruft Server-Action `runComparisonAnalysis`; nutzt `AnalysisResult`.
- `SimilarToggle.tsx` — „Nur ähnliche Produkte"-Schalter (Marktpreise), schreibt Auswahl-IDs in URL `?similar=`.

**Produkt / SDS / Hersteller / Wissen**
- `ProductImage.tsx` — generiertes Produktbild (SVG-Fass/IBC/Kanister je Packaging + Markenfarbe), Größen xs–xl; Server-tauglich.
- `BrandLogo.tsx` — Marken-Wordmark: lädt `/brand-logos/<slug>.svg|png`, Fallback stilisiertes Wordmark; Client (Preload).
- `ManufacturerLogo.tsx` — Hersteller-Logo aus explizitem DB-`logoPath` (robuster als BrandLogo).
- `CategoryGlyph.tsx` — wählt lucide-Icon anhand Produkttyp (`categoryIcon()` + `CategoryGlyph`).
- `GhsPictogram.tsx` — GHS/CLP-Gefahrenpiktogramme als eigenständige SVG-Warnrauten (`GHS_NAMES`, Codes GHS01–09).
- `OilBarrels.tsx` — dekoratives Ölfässer-SVG für die Startseite.
- `ProductIssuesSection.tsx` — reale Praxis-Probleme (`ProductIssue`) mit Severity/Symptome/Workaround.
- `RefractometerCalculator.tsx` — Brix→Konzentration-Rechner (Direktmodus mit Faktor oder 3-Punkt-Kalibrierung).
- `TcoCalculator.tsx` — Gesamtkosten-Rechner KSS (`TcoCalculator` Einzelprodukt, `TcoComparePanel` Mehrprodukt/`/compare`).
- `ProductImage`/Kategorie-Glyphen bilden zusammen die bildlose Katalog-Darstellung.

**KI-Dialoge (KSS-Finder / Concierge)**
- `KssWizardDialog.tsx` — mehrstufiger Kaufberatungs-Wizard (Anwendung, Material, Issues, Zertifikate); ruft `/api/kss-wizard`. Aushängeschild-Feature.
- `KssWizardLauncher.tsx` — Start-Button (violett→blau-Gradient) öffnet den Wizard.
- `KssAiAnalysis.tsx` — zeigt KI-Empfehlungen (Top-3 mit Begründung, matchScore, sealWarning).
- `KssIssueSelect.tsx` — Mehrfachauswahl kritischer KSS-Probleme (`lib/kss-issues`), Scope-gefiltert.
- `ConciergeWidget.tsx` — schwebender KI-Chat-Assistent (Frage→Antwort mit klickbaren Markdown-Links).
- `AlternativeSearchPanel.tsx` — KI-gestützte Alternativensuche (Verfügbarkeit, Web, Wissensbasis) mit Daumen-Feedback.

**Werbung / Monetarisierung / Mitgliedschaft**
- `AdBannerView.tsx` — datengetriebene Anzeige-Ansicht (Banner: Eyebrow, Headline, Chips, Bild, CTA); eigenes `.adb-*`-Styling.
- `AdSlot.tsx` — Server-Slot lädt live-Anzeige je `AdPlacement` (HOME/STOREFRONT/LISTINGS), kennzeichnet als „Anzeige" (P2B-VO); rendert nichts, wenn keine Anzeige.
- `AdManager.tsx` — Admin-CRUD für Anzeigen (Platzierung, Zeitraum, aktiv/pausiert, Bild-Upload).
- `MembershipActions.tsx` — Mitgliedschaftsstufen BASIS/PRO/MARKE buchen (Stripe-Checkout).
- `CreditActions.tsx` — Credit-Pakete kaufen (Stripe-Checkout).
- `StorefrontManager.tsx` — Marken-Schaufenster verwalten (nur Stufe MARKE): Hersteller wählen, Texte pflegen.
- `ConnectOnboardingBox.tsx` — Verkäufer-Käuferschutz: Stripe-Connect-Onboarding freischalten.
- `RedeemCodeBox.tsx` — Referral-/Gutschein-Code einlösen.
- `ReferralLinkBox.tsx` — Empfehlungslink (Kopieren + Mail via eigenem Client, BGH-konform kein Server-Versand).

**Formulare / Editoren / Eingabehilfen**
- `Autocomplete.tsx` — wiederverwendbares Freitext-Autocomplete (normalisiert; `name` für FormData).
- `SuggestInput.tsx` — Vorschlags-Eingabefeld mit Live-Validierung (`Suggestion`, Check/Warn-Icons).
- `SearchInput.tsx` — Live-Volltextsuche als Pillen-Input, debounced in URL-Param (erhält andere Filter).
- `SearchSection.tsx` — farbige Abschnitts-Umrandung für Sucheingaben (Varianten `emerald`/`slate`/`brand`/`amber`).
- `FilterBar.tsx` — einheitliche Filterleiste (Ergebnis-Anzahl, Suchfeld, Pillen-Dropdowns, Toolbar), Galaxus-Stil.
- `FilterDropdown.tsx` — Pillen-Dropdown-Filter, schreibt direkt URL-Params (single/`multiple`).
- `ChipButtonClient.tsx` — Multi-Select-Chip, togglet Wert in pipe-separiertem URL-Param.
- `LiveFilterForm.tsx` — Formular-Wrapper, das Änderungen debounced in die URL überträgt.
- `PriceRangeSlider.tsx` — Doppel-Schieber für Preisfilter (min/maxPrice, voller Bereich = kein Filter).
- `CertInput.tsx` / `CertBadge.tsx` — Zertifikat-Eingabe (Suche/Freitext) bzw. Zertifikat-Anzeige-Badge mit Icon + Detail-Popover (`lib/certifications`).
- `MachiningSelect.tsx` — Auswahl Zerspanungs-Operationen, gruppiert (spanend/abrasiv/trennend/umformend/sonstige).
- `MeasurementMethodSelect.tsx` — Messmethoden-Auswahl mit Glycol-Warnhinweisen.
- `CurrencyEditor.tsx` — Anzeige-/Abrechnungswährung im Profil wählen (`CURRENCY_OPTIONS`).
- `AboutEditor.tsx` — „Über uns"-Text des eigenen Schaufensters bearbeiten.
- `SavingsEditor.tsx` — Einsparung durch Produktwechsel erfassen (Käufer, in Umsätze-Tabelle).
- `PasswordInput.tsx` — Passwortfeld mit Ein-/Ausblenden-Auge.
- `PasswordChangeEditor.tsx` — Passwort im Profil ändern (mit aktuellem Passwort).
- `VatValidationBox.tsx` — USt-ID gegen EU-VIES prüfen → „USt-ID geprüft"-Abzeichen.
- `ReviewForm.tsx` — Bewertung abgeben (Sterne + Tag-Chips wie „Schnelle Antwort").
- `PriceSubmitDialog.tsx` / `PriceSubmitLauncher.tsx` — Marktpreis melden (Dialog + Start-Button).
- `PriceVerifyActions.tsx` — Admin: gemeldete Preisbeobachtung freigeben/ablehnen.
- `MessageThread.tsx` — Chat-Thread einer Conversation (Nachrichten laden/senden).
- `PrintButton.tsx` — „Drucken / als PDF sichern" (`window.print()`).
- `TransactionActions.tsx` — Transaktions-Status-Aktionen (PENDING/SHIPPED/COMPLETED/CANCELED/DISPUTED), rollenabhängig.
- `ProtectionPanel.tsx` — Käuferschutz auf Transaktionsseite (bezahlen→parken→freigeben/Problem melden).

**Badges / Compliance / Bewertung**
- `TrustBadge.tsx` — Vertrauensstufen-Badge + `TierProgress` (→ 10.4).
- `ComplianceBadges.tsx` — Compliance-Siegel („borfrei", „NSF/FDA H1" …) als Chip-Reihe (Tones emerald/sky/violet/amber), Server-tauglich (`lib/compliance`).
- `AutomationBadge.tsx` — Automatisierungs-Eignung Score X/5 mit Fit-Farbe + Warn-Dreieck (`lib/kss-automation`).
- `CertBadge.tsx` — einzelnes Zertifikat/Freigabe-Badge (Icon-Map din/iso/reach/food/…).
- `RatingDisplay.tsx` — Sternebewertung (★, gefüllt/ausgegraut) + Schnitt + Anzahl.

**Charts (ohne Library)** → siehe 10.7
- `PriceHistoryChart.tsx`, `MultiPriceHistoryChart.tsx`, `UmsatzChart.tsx`.

### 10.6 Karten-Layout-Konvention

`ListingCard`/`RfqCard` haben je zwei Varianten (Prop `variant`):
- **`compact`** — schmale, horizontale Listenzeile: kleines `ProductImage` (`size="sm"`),
  Badge, Titel, Meta-Zeile mit `·`-Separatoren, Preis rechtsbündig. Ideal für dichtes Browsing.
- **`extended`** — Bildkarte (`ListingCard` Default): Bildbereich mit Gradient
  (`from-brand-50 to-white`), Marken-Pill unten links, Badge „Bietet an", Merkmals-Chips
  (ISO VG, Chemie, Anwendung), Anbieter + TrustBadge + Preis in der Fußzeile.
  `RfqCard.extended` hat einen amber Kopfstreifen (`h-1.5 … from-amber-400 to-amber-600`).

**Grid-Konvention (Angebotskarten kompakt, bis 4 pro Reihe):** die Karten-Grids nutzen
durchgängig `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (z.B. `app/page.tsx`,
`app/profile/[pseudonym]/page.tsx`) — also 1 Spalte mobil, 2 ab `sm`, 3 ab `lg`, **4 ab `xl`**.
Statistik-/Dashboard-Kacheln nutzen `sm:grid-cols-2 lg:grid-cols-4`.

Interaktionsmuster der Karten: umschließender `Link`, Hover-Elevation
(`hover:-translate-y-0.5|1 hover:shadow-lift`), Ring-/Border-Wechsel beim Hover
(Angebote → `slate-300`, Anfragen → `amber-300`). Das `CompareToggle`-Häkchen liegt als
absolut positioniertes Overlay (`absolute right-3 top-3`) über der Karte mit eigenem
Klickbereich, damit es den Karten-Link nicht auslöst.

### 10.7 Charts ohne externe Bibliothek

Bewusst keine Chart-Library — alle Diagramme sind handgeschrieben:

- **`PriceHistoryChart.tsx`** — Einzel-Preisverlauf als **SVG-Linienchart**, Server-rendered.
  Selbst berechnete Y-Skala (min·0.95 / max·1.05), Grid-Linien (`stroke #e2e8f0` gestrichelt),
  4 Y-Ticks, 3–5 X-Ticks, Fläche unter der Linie via `linearGradient` (Brand-Oliv `#74980f`),
  Datenpunkte als `<circle>` mit `<title>`-Tooltip. `viewBox` + `width="100%"` (responsiv).
  Trend-Indikator oben rechts: rot bei Anstieg (↗), emerald bei Rückgang (↘). Leerzustand:
  gestrichelte Box „Noch keine Preisdaten."
- **`MultiPriceHistoryChart.tsx`** — mehrere Zeitreihen in **einem SVG** (bis 6 Linien =
  Vergleichs-Limit), eigene 6er-Farbpalette (`SERIES_COLORS`, erste = Brand-Oliv `#74980f`),
  X-Achse = Vereinigung aller Monate, jede Linie nur über eigene Punkte; Legende.
- **`UmsatzChart.tsx`** — Umsatz-Balkendiagramm **rein per CSS** (`div`-Höhen in %,
  `flex items-end`), Client-Component mit Zeitraum-Buttons (3/6/12 Monate/Alles), zwei Balken
  je Monat (Verkauf/Kauf) plus ein kleines SVG für die Einspar-Linie; nutzt `formatCurrency`.

### 10.8 Icons & Bild-Assets

- Icons ausschließlich aus **`lucide-react`** (Beispiele: `Tag`, `Search`, `MapPin`,
  `ShieldCheck`, `Sparkles`, `Loader2`, `AlertTriangle`, Trust-Icons `Medal/Award/Crown/Gem`).
- **Produkt-/Hersteller-Bilder werden generiert oder aus `/public/brand-logos/` geladen**,
  nicht aus externen Quellen: `ProductImage` zeichnet Behälter als SVG in der aus
  `lib/branding` abgeleiteten Markenfarbe; `BrandLogo`/`ManufacturerLogo` laden lokale
  Logo-Dateien mit Wordmark-Fallback. `GhsPictogram` und `OilBarrels` sind ebenfalls
  reine Inline-SVGs — die Plattform kommt ohne externe Bild-CDNs aus.
- Pfade laufen über `withBasePath()` / `BASE_PATH` (`lib/base-path`), damit Deployment unter
  einem Unterpfad funktioniert.

---

## 11. Infrastruktur, Deploy, Persistenz, E-Mail, Konfiguration

Dieser Abschnitt beschreibt Betrieb und Konfiguration der Plattform: die npm-Befehle,
den Container-/Session-Workflow, die automatische Deploy-Pipeline auf Railway, den
E-Mail-Versand, geteilte Infrastruktur-Utilities (Prisma-Singleton, CSV, Basispfad)
sowie die vollständige Liste aller Umgebungsvariablen.

### 11.1 npm-Befehle (`package.json` → `scripts`)

Projektname `marketplace`, `version 0.1.0`, `private: true`.

| Befehl | Definition | Zweck |
|---|---|---|
| `npm run dev` | `next dev` | Next.js Dev-Server → http://localhost:3000 |
| `npm run build` | `next build` | Production-Build |
| `npm run start` | `prisma db push --skip-generate && npm run deploy:tasks && next start` | **Produktions-Start** (Railway) — Schema angleichen, Daten angleichen, App starten (→ 11.3) |
| `npm run lint` | `next lint` | Linting |
| `npm run db:push` | `prisma db push` | Schema aus `prisma/schema.prisma` in die DB schieben (**keine** Migrationsdateien) |
| `npm run db:seed` | `tsx prisma/seed.ts` | Test-User + Beispieldaten (pro User idempotent) |
| `npm run db:studio` | `prisma studio` | Prisma Studio → http://localhost:5555 |
| `npm run deploy:tasks` | `tsx prisma/deploy-tasks.ts` | Daten-Migrationsaufgaben (→ 11.3) |
| `postinstall` | `prisma generate` | Prisma-Client nach jedem `npm install` neu generieren |

Es gibt **keinen Test-Runner** — Verifikation erfolgt manuell. Nach Schema-Änderungen
zusätzlich `npx prisma generate` ausführen. Das Projekt nutzt durchgängig `db push`
(keine Migrationshistorie); Schema-Änderungen werden direkt angewendet.

Laufzeit-Stack der `dependencies`: `next ^16.2.6`, `react`/`react-dom 19.0.0`,
`@prisma/client`/`prisma ^6.1.0`, `next-auth ^4.24.11`, `@anthropic-ai/sdk ^0.96.0`,
`stripe ^22.2.2`, `nodemailer ^7.0.13`, `bcryptjs ^2.4.3`, `zod ^3.24.1`,
`lucide-react ^1.16.0`, `tsx ^4.19.2`. Dev: TypeScript `^5.7.2`, Tailwind `^3.4.17`,
PostCSS, Autoprefixer.

### 11.2 Container-/Session-Workflow (lokale Entwicklung)

`bash scripts/start.sh` ist **DER EINE Befehl** nach jedem Container-Start/-Rebuild.
Er ist idempotent und beliebig oft ausführbar (`set -e`, `cd /workspace`) und verkettet
vier Schritte:

1. **`scripts/init-postgres.sh`** — startet Postgres aus dem Bind-Mount
   `/var/lib/postgresql/data`. Prüft die Cluster-Existenz robust mit `sudo test -f
   $DATA_DIR/PG_VERSION` (der `node`-User darf nicht in das `0700`-Verzeichnis schauen —
   ein naives `[ -f ]` löste sonst ein zerstörerisches `initdb` aus). Bei leerem
   Verzeichnis: `initdb -E UTF8 --locale=C`, schreibt `pg_hba.conf` (lokal `trust`,
   Netzwerk `md5`) und `listen_addresses = '*'`. Entfernt stale `postmaster.pid`, startet
   Postgres via `pg_ctl`, legt Rolle **`marketplace`** (Passwort `marketplace`, SUPERUSER)
   und DB **`marketplace`** an, wenn nicht vorhanden. Abschließender Smoke-Test per `psql`.
2. **`scripts/bootstrap-app.sh`** — `npm install --no-audit --no-fund`, dann
   `npx prisma generate` (native Query-Engine für **diesen** Container) und
   `npx prisma db push --skip-generate` (additiver Schema-Abgleich, kein Datenverlust).
   Grund: `node_modules` ist gitignored und plattformabhängig; nach einem Rechnerwechsel
   müssen die nativen Binaries neu gebaut werden.
3. **`scripts/restore-session.sh`** — spielt Claude-Chats/Memory/Login aus
   `/workspace/.claude-state` nach `~/.claude` zurück (Chats+Memory in `projects/`,
   Login `credentials.json` → `~/.claude/.credentials.json`, `chmod 600`). Erkennt den
   Live-Mount per Inode-Vergleich und macht dann nichts (No-Op). Im `start.sh` mit
   `|| echo "(übersprungen)"` abgesichert.
4. **`npm run dev`** — Dev-Server auf http://localhost:3000.

Die **Datenbank überlebt Rebuilds** über den `.postgres-data/`-Bind-Mount (im Container
gemountet als `/var/lib/postgresql/data`). Details in `PERSISTENCE.md`/`MIGRATION.md`.

Schnellbefehl-Konvention (aus `CLAUDE.md`): Schreibt der Nutzer sinngemäß „starte
server", wird sofort `bash scripts/start.sh` im Hintergrund ausgeführt.

### 11.3 Deploy-Automatik (Railway)

Programm **und** Datenbank laufen bei **Railway** (GitHub-Konto `briscosystems`).
Railway erkennt Next.js automatisch. Ein `git push` bringt nur den **Code** nach
Railway, **nicht die Daten** — deshalb die zweistufige Start-Kette in `package.json`:

```
"start": "prisma db push --skip-generate && npm run deploy:tasks && next start"
          └─ Schema angleichen ──┘         └─ Daten angleichen ─┘   └─ App ─┘
```

- **Schema** wird bei jedem Deploy per `prisma db push --skip-generate` automatisch
  gegen die Live-DB gezogen (additiv).
- **Daten** werden durch `prisma/deploy-tasks.ts` angeglichen (`tsx`). Der Prisma-Client
  ist zur Laufzeit schon generiert (`postinstall` → `prisma generate`).

**`prisma/deploy-tasks.ts`** — läuft bei **jedem** App-Start. Eine `TASKS`-Liste vom Typ
`{ name: string; run: () => Promise<string> }`. `main()` iteriert, fängt Fehler pro
Aufgabe ab und loggt am Ende `product.count`. Verbindlicher **Regelkanon** für neue
Aufgaben (im Dateikopf dokumentiert):

1. **IDEMPOTENT** — läuft bei jedem Start erneut; muss prüfen, ob schon erledigt, und
   dann nichts tun.
2. **NIE WERFEN** — eine fehlgeschlagene Aufgabe darf den Start nicht blockieren (sonst
   ist die Seite offline). Fehler werden geloggt (`[Deploy-Aufgaben] ✗ …`), der Start
   läuft weiter. Auch ein Totalausfall (DB nicht erreichbar) wird in `main().catch()`
   abgefangen; `finally` ruft `prisma.$disconnect()`.
3. **BELEG DAZU** — jede Aufgabe bekommt einen Kommentar, warum sie existiert.

Erledigte Aufgaben dürfen stehen bleiben (kosten nur eine schnelle Prüfabfrage,
dokumentieren die Historie). Aktuell zwei Aufgaben: Datenqualität 2026-07-15
(löscht Fantasieprodukte/`ProductIssue`s, korrigiert Viskositäten; Daten in
`prisma/fix-datenqualitaet-2026-07-15.ts` als `PRODUCT_DELETIONS`, `ISSUE_DELETIONS`,
`PRODUCT_PATCHES`) und Datenqualität 2026-07-18 (`applyCorrections2026_07_18()` aus
`prisma/fix-datenqualitaet-2026-07-18.ts`). **Merksatz:** DB-Änderung für LIVE nötig?
→ hier als idempotente Aufgabe eintragen → pushen → fertig.

### 11.4 Hosting: `markt.brisco.ch`

Seit **2026-07-15** läuft die Plattform live unter der eigenen Subdomain
**`https://markt.brisco.ch`** (Railway). Der frühere Plan
`dosimetrix.eu/marketplace2026` (Netlify-Weiterleitung + Unterpfad) ist verworfen; die
`DEPLOY_MARKETPLACE2026.md` ist überholt, maßgeblich ist `GO-LIVE.md`. Gründe:

- **Neutralität:** Dosimetrix ist inzwischen zahlender Werbekunde — ein neutraler
  Marktplatz darf nicht unter der Domain eines seiner Werbekunden laufen.
- **Technik:** Die eigene Subdomain macht sowohl die Netlify-Weiche als auch den
  Basispfad überflüssig.

Damit entfällt `NEXT_PUBLIC_BASE_PATH` (in Railway löschen und **neu bauen** — es ist
eine Build-Zeit-Variable, → 11.6), `NEXTAUTH_URL` wird auf `https://markt.brisco.ch`
gesetzt, und Webhook-URLs verlieren das `/marketplace2026`-Präfix (z.B. Stripe-Webhook
`https://markt.brisco.ch/api/billing/webhook`). Der Basispfad-Mechanismus bleibt im Code
erhalten (→ 11.7 `lib/base-path.ts`), ist aber unbenutzt (leer).

**Passwort-Gate:** `lib/gate.ts` implementiert eine vorgeschaltete Zugangssperre (weiße
Login-Seite, Cookie `mp_gate` mit HMAC-SHA256-Token, kein Serverzustand). `gateEnabled()`
ist standardmäßig nur in Produktion aktiv (`NODE_ENV === "production"`), per
`GATE_ENABLED=true|false` erzwingbar. Für den echten Verkauf ist das Gate **ausgeschaltet**
(`GATE_ENABLED=false`) — sonst käme kein Kunde herein. `gateCredentials()` liest
`GATE_USER` (Default `admin`) und `GATE_PASSWORD` (fail-closed-Platzhalter, wenn nicht
gesetzt); `secret()` nutzt `GATE_SECRET` → sonst `NEXTAUTH_SECRET`.

### 11.5 E-Mail-Versand (`lib/mailer.ts`, `lib/mail-status.ts`)

`sendEmail({ userId, kind, to, subject, body })` (mit `kind: EmailKind`) wählt den
Versandweg **automatisch** über `mailProvider()`:

1. **ZeptoMail (HTTPS/443)** — aktiv, sobald `ZEPTOMAIL_TOKEN` gesetzt ist. Der
   **Live-Weg**, weil Railway ausgehende **SMTP-Ports sperrt**; ZeptoMail läuft über
   Port 443. POST an `ZEPTOMAIL_API` (Default `https://api.zeptomail.eu/v1.1/email`),
   `Authorization`-Header = der Token **exakt so** (enthält bereits das Präfix
   `Zoho-enczapikey …`), `textbody`, `AbortSignal.timeout(15_000)`.
2. **SMTP (lokal)** — aktiv, wenn `SMTP_HOST`+`SMTP_USER`+`SMTP_PASS` gesetzt sind (und
   kein ZeptoMail-Token). Nodemailer-Transporter (`secure` bei Port 465), diverse
   Timeouts. Für die lokale Entwicklung (Zoho-Postfach).
3. **Nur-Log** — wenn nichts konfiguriert ist (`mailProvider() === "none"`): es wird
   nichts verschickt, nur geloggt.

In **allen** Fällen wird bei gesetztem `userId` ein `EmailLog`-Eintrag geschrieben
(sichtbar für den Superadmin unter `/admin`). `sendEmail` **wirft nie** — ein
Mailproblem darf den Aufrufer (z.B. Passwort-Reset) nicht scheitern lassen (verriete
sonst die Existenz eines Kontos). Absender aus `MAIL_FROM` (Format
`Brisco Marketplace <noreply@brisco.ch>`, Fallback `SMTP_USER` → `noreply@brisco.ch`),
per `parseFrom()` in Name/Adresse zerlegt.

**Admin-Diagnose** (`lib/mail-status.ts`, `checkMailStatus()`): benennt den aktiven Weg
und den konkreten Fehler für den `/admin`-Bereich. ZeptoMail hat keinen Verify-Endpunkt
→ prüft nur Konfiguration (Live-Beweis per Test-Knopf/„Passwort vergessen"). SMTP wird
per `transporter.verify()` real getestet; erkennt u.a. `EAUTH`/535 (falsches Passwort)
und `ETIMEDOUT`/`ECONNECTION`/`ESOCKET` (Hoster sperrt SMTP → auf Railway ZeptoMail nötig).

### 11.6 Umgebungsvariablen (vollständig)

Ermittelt per `grep -rn process.env` über `.ts`/`.tsx`. Zur Laufzeit **zwingend**
benötigt: `DATABASE_URL`, `NEXTAUTH_SECRET` (beide bereits in `.env`).

| Variable | Zweck | Wo genutzt | Pflicht |
|---|---|---|---|
| `DATABASE_URL` | Postgres-Verbindung | Prisma (implizit) | **Ja** |
| `NEXTAUTH_SECRET` | JWT-Signatur (NextAuth) + Fallback für Gate-Secret | `lib/auth.ts`, `lib/gate.ts` | **Ja** |
| `NEXTAUTH_URL` | Basis-URL für Auth-Callbacks + Stripe-Redirects (`appBaseUrl()`, Default `http://localhost:3000`) | `lib/stripe.ts` (Auth-intern) | Prod |
| `NODE_ENV` | Umschaltung dev/prod (Prisma-Logging, Gate-Default, Prisma-Singleton) | `lib/prisma.ts`, `lib/gate.ts` | automatisch |
| `ANTHROPIC_API_KEY` | KI-Funktionen (KSS-Wizard etc.); fehlt er → heuristischer Fallback | Anthropic-SDK-Routen | Nein (Fallback) |
| `NEXT_PUBLIC_BASE_PATH` | Betrieb unter Unterpfad (Build-Zeit); **leer** seit Subdomain | `next.config.ts`, `lib/base-path.ts` | Nein |
| `STRIPE_SECRET_KEY` | Stripe-Client; fehlt er → `stripe = null`, Billing gibt „nicht konfiguriert" zurück | `lib/stripe.ts` | Nein |
| `STRIPE_WEBHOOK_SECRET` | Signaturprüfung `stripe.webhooks.constructEvent` | `app/api/billing/webhook/route.ts` | Nur für Webhook |
| `ZEPTOMAIL_TOKEN` | Live-Mail (HTTPS); Wert inkl. Präfix `Zoho-enczapikey ` | `lib/mailer.ts` | Live-Mail |
| `ZEPTOMAIL_API` | ZeptoMail-Endpunkt, Default `https://api.zeptomail.eu/v1.1/email` | `lib/mailer.ts` | Nein |
| `MAIL_FROM` | Absenderadresse | `lib/mailer.ts`, `lib/mail-status.ts` | Nein |
| `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` | Lokaler SMTP-Versand | `lib/mailer.ts`, `lib/mail-status.ts` | Lokal |
| `SMTP_PORT` | SMTP-Port, Default `587` (secure bei 465) | `lib/mailer.ts`, `lib/mail-status.ts` | Nein |
| `GATE_ENABLED` | Passwort-Gate an/aus (`"true"`/`"false"`; sonst = Prod) | `lib/gate.ts` | Nein |
| `GATE_USER` | Gate-Benutzername, Default `admin` | `lib/gate.ts` | Nein |
| `GATE_PASSWORD` | Gate-Passwort (fail-closed ohne) | `lib/gate.ts` | Wenn Gate an |
| `GATE_SECRET` | HMAC-Secret des Gates (Fallback `NEXTAUTH_SECRET`) | `lib/gate.ts` | Nein |
| `CRON_SECRET` | Bearer-Token-Schutz für Cron-Route (bei gesetztem Wert erzwungen) | `app/api/cron/membership-reminders/route.ts` | Nein |
| `KLUEBER_USERNAME`/`KLUEBER_PASSWORD` | Login des SDS-Crawlers (Klüber-Portal) | `scripts/crawl-sds.ts` | Nur Crawler |

**Nicht** Umgebungsvariablen, sondern DB-gesteuerte **Superadmin-Einstellungen**
(`AppSetting`-Tabelle, Key/Value, änderbar in `/admin`; Defaults in `lib/credits.ts`
`SETTING_DEFAULTS`, gelesen über `getSettingInt`/`getAllSettings`): `trialDays` (10),
`welcomeCredits` (20), `referralCredits` (10), `creditPriceCt` (10),
`membershipPriceEur` (290), `membershipPriceProEur` (990), `membershipPriceMarkeEur`
(3000), `protectionFeeBp` (250), `protectionFeeFixedCt` (25), `basisListingLimit` (10).
Werbetexte (Startseite/Login/Registrierung) lesen `trialDays` immer aus diesem Wert.
`AI_ACTION_COSTS` (Credit-Kosten je KI-Aktion) stehen fest im Code.

### 11.7 Geteilte Infrastruktur-Utilities

- **`lib/prisma.ts`** — Prisma-Client-**Singleton** auf `globalThis` gecacht (verhindert
  Connection-Erschöpfung im Dev). Logging: dev `["error","warn"]`, sonst `["error"]`.
  **Nirgends sonst** `new PrismaClient()` instanziieren.
- **`lib/base-path.ts`** — `BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""` und
  `withBasePath(path)`. Next.js prefixt `<Link>`/`next/image`/`router.push`/`redirect`
  automatisch; für rohe `fetch("/api/…")`, `<a href>`, `<img src>` diesen Helfer nutzen.
  In `next.config.ts` wird `basePath` nur gesetzt, wenn die Variable nicht leer ist
  (aktuell leer). `next.config.ts` setzt außerdem `reactStrictMode: true` und
  `allowedDevOrigins` (`*.devtunnels.ms`, `*.trycloudflare.com`, `*.ngrok-free.app`,
  `*.ngrok.io`) für den Handy-Test über Tunnel.
- **`lib/csv.ts`** — CSV-Export-Helfer: `csvField()`, `toCsv(header, rows)` und
  `csvResponse(filename, csv)`. Trennzeichen **Strichpunkt** (`;`, öffnet direkt in
  Excel DE/CH), Zeilenende `\r\n`, vorangestelltes **UTF-8-BOM** (`﻿`) für korrekte
  Umlaute in Excel; Content-Type `text/csv; charset=utf-8` als Attachment-Download.
- **`lib/stripe.ts`** — Stripe-Singleton (`null` ohne `STRIPE_SECRET_KEY`),
  `isStripeConfigured()`, `appBaseUrl()` (aus `NEXTAUTH_URL`).

### 11.8 Backup & Portabilität

- **`scripts/backup.sh`** — erzeugt (1) einen `pg_dump` nach
  `backups/<timestamp>[-label].sql.gz` (`--clean --if-exists --no-owner --no-privileges`,
  `gzip -9`) und (2) einen Git-Tag `backup/<timestamp>[-label]`. Flags: `--commit`
  (zusätzlich Working-Tree-Commit `backup: <ts>`), `--label <name>`. Wiederherstellung:
  `git checkout <tag>` für Code, `gunzip -c … | psql` für die DB.
- **Persistenz:** Die lokale DB überlebt Rebuilds über den **`.postgres-data/`**-Bind-Mount.
- **Portabler Workspace:** Alles (DB, Claude-Chats, Memory, Login) liegt im Workspace-
  Ordner. Vor einem Umzug `scripts/snapshot-session.sh` (spiegelt `~/.claude` →
  `/workspace/.claude-state`, No-Op bei aktivem Live-Mount, per Inode-Vergleich erkannt);
  nach dem Umzug stellt `scripts/restore-session.sh` (Teil von `start.sh`) den Zustand
  wieder her. Details in `PERSISTENCE.md`/`MIGRATION.md`.
