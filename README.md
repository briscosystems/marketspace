# Brisco Marketplace — Industrial Oil Trading

B2B-Marktplatz-Prototyp für Reseller und OEM-Hersteller von Industrieölen, KSS
und Schmierstoffen. Spezifikation: [FDS.md](FDS.md).

> **Status: Phase 1 / v0.3** — Web-MVP mit Auth, Listings, Filtersuche, Chat,
> Trust-Tier-Badges, Listing-Edit und vollständigem **RFQ-Modul** (Anfragen
> mit Angebots-Abgabe, Annahme öffnet Chat). Stripe-Checkout, AI-Match und
> AI-Chat-Filter, Mobile-App folgen in eigenen Iterationen.

## Tech-Stack (aktuell)

- Next.js 16 (App Router, TypeScript)
- PostgreSQL 16 + Prisma 6
- NextAuth.js v4 (Credentials Provider, JWT-Sessions)
- Tailwind CSS 3
- bcryptjs, zod

## Voraussetzungen

| Was | Wofür | Status |
|---|---|---|
| Node 20+ | Build & dev | im devcontainer enthalten |
| PostgreSQL 16 | Datenbank | im devcontainer; durch `post-create.sh` initialisiert |
| `.env` mit `DATABASE_URL`, `NEXTAUTH_SECRET` | Runtime-Konfig | bereits angelegt |

## Lokal starten

```bash
# Postgres starten (falls nicht schon gestartet durch post-create.sh)
sudo -u postgres pg_ctl -D /var/lib/postgresql/data -l /tmp/pg.log start

# Dependencies & DB
npm install
npx prisma generate
npx prisma db push        # Schema in die DB schieben
npm run db:seed           # 2 Test-Reseller + 3 FDS-Listings

# Dev-Server
npm run dev               # → http://localhost:3000
```

## Test-Accounts (aus dem Seed)

| Email | Passwort | Pseudonym | Land |
|---|---|---|---|
| `alpha@example.com` | `test1234` | `Alpha-Trader` | DE |
| `beta@example.com`  | `test1234` | `Beta-Trader`  | AT |

Drei vorgefüllte Listings: Shell Tellus S2 M 46, Fuchs Renolin MR 520, Mobil DTE 25 Ultra.

## Test-Accounts und Trust-Tiers (aus dem Seed)

| Email | Pseudonym | Trust-Tier |
|---|---|---|
| `alpha@example.com` | Alpha-Trader | VERIFIED (blaues Badge) |
| `beta@example.com` | Beta-Trader | TRADE_ASSURED (grünes Badge) |

Passwort für beide: `test1234`. Neu registrierte Accounts starten als UNVERIFIED
(kein Badge sichtbar).

## Erste Tests — Klick-Pfad

1. **`/`** öffnen → Landing zeigt User-/Listing-Counts.
2. **`/listings`** → 3 Seed-Listings mit TrustBadge der Verkäufer. Filter:
   `?manufacturer=Shell`, `?q=Hydraulik`, `?isoViscosity=46`.
3. **`/rfqs`** → vorgeseedete Anfrage von Beta für KSS-Emulsion (4 000 L).
4. **`/login`** → `alpha@example.com / test1234`.
5. **`/rfqs/<seed-id>`** öffnen → „Angebot abgeben" mit Preis, Menge,
   Lieferzeit und optionalem Alternativvorschlag.
6. **Abmelden**, als `beta@example.com` einloggen → eigene RFQ öffnen → das
   Angebot mit „Annehmen" akzeptieren → wird automatisch in den Chat geleitet,
   System-Nachricht über die Annahme ist drin.
7. **Listing-Edit:** im Dashboard auf eigenem Listing den Status per Inline-
   Toggle auf PAUSED setzen → Listing verschwindet aus der öffentlichen
   `/listings`. „Bearbeiten" öffnet die volle Edit-Seite (auch Archivieren).
8. **Chat:** `/conversations` → vorgeseedete Konversation mit Beta zum
   Mobil-Hydrauliköl. Nachricht schreiben, in zweitem Browser als Beta
   einloggen → Nachricht erscheint innerhalb von 5 s (Polling).
9. **Verified-Only-RFQ:** neue Anfrage mit Sichtbarkeit „Nur Verified+"
   anlegen → in Inkognito-Fenster als frisch registrierter Nutzer
   (UNVERIFIED) wirst du sie auf `/rfqs` nicht sehen und Gebote werden 403.

## Was noch fehlt (FDS-Mapping)

| FDS-Abschnitt | Status |
|---|---|
| 4.1 Registrierung & Onboarding | ✅ ohne Email-Verifikation / Stripe-Karte |
| 4.2 Produkt-Listings | ✅ vollständiges Datenmodell |
| 4.3 Such- und Match-Engine | ⚠️ Volltext + Filter ✅, AI/Vektor noch nicht |
| 4.4 Mobile App (Expo) | ❌ noch nicht |
| 4.5 Pseudonyme Kommunikation | ⚠️ Chat ✅ (Polling), AI-Kontaktdaten-Filter noch nicht |
| 4.7 Bewertungs- und Ranking-System | ⚠️ Trust-Tier ✅ (statisch), 5-Sterne-Rating noch nicht |
| B.1.1 RFQ-Modul | ✅ vollständig (ohne Stripe-Checkout am Schluss) |
| B.1.2 Trust-Tier-System | ⚠️ Schema + Badge ✅, automatische Tier-Berechnung noch manuell |
| B.2.2 Frontload-ListingCard | ✅ |
| B.2.6 Inline-Edit | ⚠️ Status-Toggle ✅, Quantity/Preis-Inline noch nicht |
| B.2.3 Skeleton-Loader | ⚠️ Komponente vorhanden, Einsatz folgt mit Streaming-Routes |
| 4.6 Stripe Split-Payment | ❌ folgt mit Stripe-Account |
| 4.7 Bewertungs-/Ranking | ❌ Phase 2 |
| 4.8 Predictive Recommendation | ❌ Phase 2 |
| 4.9 Market Scarcity Detection | ❌ Phase 3 |

## Was du für die nächsten Iterationen brauchst

| Iteration | Benötigte Accounts / Keys |
|---|---|
| AI-Matching (Claude) | `ANTHROPIC_API_KEY` aus console.anthropic.com |
| pgvector-Embeddings | nur DB-Migration, kein neuer Account |
| Stripe Split-Payment | Stripe-Test-Mode-Account + `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` |
| Email-Verifikation | SMTP-Provider (Resend/Postmark) oder Mailtrap für Tests |
| Mobile App (Expo) | Expo-Account, Expo Go auf zwei realen Smartphones |
| Foto-Erkennung (Etikett) | Google ML Kit (on-device, kein Cloud-Key) oder Cloud-Vision-Key |
| Produktion-Hosting | Vercel/Netlify + Neon/Supabase (Postgres mit pgvector) |

## Datenbank-Tools

```bash
npm run db:studio   # Prisma Studio → http://localhost:5555
npm run db:seed     # Seed erneut laufen lassen (idempotent für User, löscht/erstellt Listings neu)
```

## Bekannte Lücken / nächste Schritte

- Edit/Delete für Listings (aktuell nur Create + Read).
- Bilder-Upload für Listings (vermutlich S3-kompatibler Storage).
- Email-Verifikation aktivieren, sobald SMTP eingerichtet ist.
- Rate-Limiting auf `/api/register` und `/api/listings`.
- `NEXTAUTH_SECRET` aus `.env` in Production durch einen echten Wert ersetzen.
- 3 moderate `npm audit`-Warnungen in transitiven Dev-Deps — vor Production prüfen.
