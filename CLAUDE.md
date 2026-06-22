# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Hinweis: Diese Datei ist bewusst auf Deutsch gehalten — Repo, Docs, Schema-Kommentare
> und UI sind durchgängig deutsch. Nur der obige Standard-Header bleibt englisch.

## Projektkontext

Brisco Marketplace — ein B2B-Marktplatz-Prototyp für Reseller und OEM-Hersteller von
Industrieölen, Kühlschmierstoffen (KSS) und Schmierstoffen. Die vollständige
Spezifikation liegt in [FDS.md](FDS.md); aktueller Stand und offene Lücken stehen in
[README.md](README.md). Repo, Docs, Schema-Kommentare und UI sind durchgängig
**deutsch** — diese Sprache in nutzersichtbaren Strings, Code-Kommentaren und
Seed-Daten beibehalten. UI-Wording-Konvention: Angebote heißen "Anbieten" (blau),
Anfragen "Suchen" (amber) — niemals "Listings"/"RFQs" in nutzersichtbarem Text.

## Befehle

```bash
npm run dev          # Next.js Dev-Server → http://localhost:3000
npm run build        # Production-Build
npm run lint         # next lint
npm run db:push      # prisma/schema.prisma in die DB schieben (keine Migrationsdateien)
npm run db:seed      # tsx prisma/seed.ts — Test-User + Beispieldaten (für User idempotent)
npm run db:studio    # Prisma Studio → http://localhost:5555
npx prisma generate  # Prisma-Client nach Schema-Änderungen neu generieren
```

Es ist kein Test-Runner konfiguriert — die Verifikation läuft manuell (siehe den
Klick-Pfad in README.md und [MOBILE_TESTING.md](MOBILE_TESTING.md)).

### Container- / Session-Workflow

`bash scripts/start.sh` ist DER EINE Befehl nach jedem Container-Start/-Rebuild. Er
verkettet `scripts/init-postgres.sh` (startet Postgres aus dem `.postgres-data/`-
Bind-Mount), `scripts/bootstrap-app.sh` (Dependencies + Prisma-Client) und
`scripts/restore-session.sh` (stellt Claude-Chats/Memory/Login wieder her) und startet
dann `npm run dev`. Die Datenbank überlebt Rebuilds über den Bind-Mount; manuell
sichern mit `./scripts/backup.sh --commit --label X`. Details zum portablen Workspace
(alles — DB, Chats, Login — liegt im Ordner) in [PERSISTENCE.md](PERSISTENCE.md) und
[MIGRATION.md](MIGRATION.md).

## Architektur

Next.js 16 (App Router, TypeScript), PostgreSQL 16 + Prisma 6, NextAuth v4,
Tailwind 3. Der Pfad-Alias `@/*` zeigt auf den Repo-Root. Es gibt keine
`middleware.ts` — Auth wird pro Route durchgesetzt.

### Datenmodell (prisma/schema.prisma)

Das Schema ist das Herz des Projekts und deutlich umfangreicher als die UI-Oberfläche.
Zwei getrennte Konzept-Ebenen existieren nebeneinander:

- **Marktplatz-Transaktionen:** `User` → `Listing` (Angebote) / `Rfq` + `RfqOffer`
  (Anfragen) → das Annehmen eines Angebots öffnet einen `Conversation`/`Message`-Thread
  und erzeugt eine `Transaction`, die per `Review` bewertet werden kann. User tragen
  eine `role` (RESELLER/OEM/ADMIN) und einen `trustTier` (UNVERIFIED → DIAMOND), der die
  Sichtbarkeit steuert (z. B. `RfqVisibility.VERIFIED_ONLY`).
- **Wissensbasis:** `Manufacturer` → `Product`-Katalog, `SafetyDataSheet` (SDS) mit
  stark geparsten GHS-/REACH-/physikochemischen Feldern, `PriceObservation`
  (crowdsourced + aus Transaktionen abgeleitete Marktpreise), `ProductIssue` (reale
  Praxis-Probleme aus Foren/Hersteller) und eine Dichtungs-Verträglichkeitsmatrix
  (`Material` × `Ingredient` × `IngredientMaterialCompatibility`).

`Listing.manufacturer`/`SafetyDataSheet.manufacturer` sind veraltete Freitext-Felder;
stattdessen die `manufacturerId`-Relation verwenden. Mehrere Modelle haben ein
normalisiertes `searchTokens`-Feld (lowercase, Trennzeichen entfernt), damit Anfragen
wie `bcool755` auf `B-Cool 755` matchen — gepflegt über `lib/normalize-search.ts` beim
Seed/Backfill.

### Auth

NextAuth v4 mit Credentials-Provider und **JWT**-Sessions, konfiguriert in
`lib/auth.ts` und eingehängt unter `app/api/auth/[...nextauth]/route.ts`. Die
JWT-/Session-Callbacks reichern das Token mit `id`, `role` und `trustTier` an.
Server-Routen/-Pages lesen die Session über `getServerSession(authOptions)`; Passwörter
sind bcrypt-gehasht.

### Prisma-Client

Das geteilte Singleton aus `lib/prisma.ts` importieren (auf `globalThis` gecached, um
Connection-Erschöpfung im Dev zu vermeiden) — nirgends sonst `new PrismaClient()`
instanziieren.

### KI-Integration (KSS-Wizard)

Das Aushängeschild-Feature: ein mehrstufiger Wizard (`components/KssWizardDialog.tsx`),
der Käufer-Anforderungen über `app/api/kss-wizard/route.ts` an Claude übergibt. Die
Route bewertet Kandidaten-Produkte zunächst heuristisch vor und ruft dann das
Anthropic-SDK auf (`@anthropic-ai/sdk`, Modell `claude-haiku-4-5-20251001`), um die
Top 3 mit Begründung zu wählen. Ist `ANTHROPIC_API_KEY` nicht gesetzt oder schlägt der
Call fehl, **fällt sie auf rein heuristisches Ranking zurück** — beide Pfade
funktionsfähig halten. `ComparisonAnalysis` cached KI-Ergebnisse, gekeyt über einen
sha256 der verglichenen IDs (`source` = `anthropic-claude` | `heuristic-fallback`).
Vor jeder Änderung an Claude-/Anthropic-Modellcode die `claude-api`-Skill konsultieren,
statt sich bei Modell-IDs/Parametern auf das Gedächtnis zu verlassen.

### lib/-Utilities

`lib/auth.ts` (NextAuth-Config), `lib/prisma.ts` (Client-Singleton),
`lib/kss-knowledge.ts` (Filter-Vokabular: Anwendungsbereiche, Materialien, kritische
Issues, Zertifizierungen), `lib/price-aggregation.ts` (EUR/CHF/USD → EUR-Normalisierung
+ Median-Fenster), `lib/normalize-search.ts` (searchTokens),
`lib/seal-recommendations.ts` (leitet Inhaltsstoffe aus Produktfeldern ab →
Worst-Case-Materialverträglichkeit), dazu `lib/sds-parser.ts` /
`lib/sds-ingredients.ts` für die SDS-Textextraktion.

## Konventionen

- Nach Schema-Änderungen `npx prisma generate` ausführen; das Projekt nutzt `db push`
  (keine Migrationshistorie) — Schema-Änderungen werden direkt angewendet.
- Test-Accounts aus dem Seed: `alpha@example.com` (VERIFIED) und
  `beta@example.com` (TRADE_ASSURED), Passwort `test1234`.
- `NEXTAUTH_SECRET` und `DATABASE_URL` werden zur Laufzeit benötigt (bereits in `.env`).
