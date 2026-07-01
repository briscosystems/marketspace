# Live-Schaltung: dosimetrix.eu/marketplace2026

Ziel: Den Marktplatz unter `https://dosimetrix.eu/marketplace2026` erreichbar machen,
zunächst durch eine **weiße Login-Seite** geschützt (nur gezielte Personen).

Der Aufbau besteht aus **drei Bausteinen**:

1. **Programm + Datenbank** laufen bei **Railway** (Rundum-sorglos-Dienst).
2. Die App läuft dort unter der Unteradresse `/marketplace2026` (bereits im Code eingebaut).
3. Die bestehende **Netlify-Seite** (dosimetrix.eu) leitet `/marketplace2026` an Railway weiter.

---

## Baustein 1 & 2 — Railway (Programm + Datenbank)

### A. Konto & Projekt anlegen
1. Auf https://railway.app mit GitHub anmelden (das Konto `briscosystems` verwenden,
   wo das Repo liegt).
2. **New Project → Deploy from GitHub repo** → das Marktplatz-Repo auswählen.
3. Railway erkennt Next.js automatisch und startet einen ersten Build.

### B. Datenbank hinzufügen
4. Im Projekt **New → Database → Add PostgreSQL**. Railway legt eine Postgres-Datenbank
   an und stellt automatisch die Variable `DATABASE_URL` bereit.

### C. Umgebungsvariablen setzen
Beim App-Dienst unter **Variables** genau diese Werte eintragen
(die Schlüssel sind bereits fertig erzeugt):

```
NEXT_PUBLIC_BASE_PATH = /marketplace2026
NEXTAUTH_URL          = https://dosimetrix.eu/marketplace2026
GATE_ENABLED          = true
GATE_USER             = admin
NEXTAUTH_SECRET       = <geheim — siehe separate Übergabe, NICHT im Repo>
GATE_SECRET           = <geheim — siehe separate Übergabe, NICHT im Repo>
GATE_PASSWORD         = <geheim — siehe separate Übergabe, NICHT im Repo>
DATABASE_URL          = (von der Railway-Postgres übernehmen, meist per "Reference")
```

> **Sicherheit:** Die drei geheimen Werte (`NEXTAUTH_SECRET`, `GATE_SECRET`,
> `GATE_PASSWORD`) stehen bewusst **nicht** in dieser Datei / im Repo. Sie werden dir
> separat übergeben und ausschließlich in den Railway-Variablen eingetragen. Neue
> Zufallsschlüssel bei Bedarf: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Optional (nur falls die KI-Funktion / Zahlung live sein sollen — sonst weglassen,
die App fällt sauber auf Heuristik zurück):

```
ANTHROPIC_API_KEY     = (dein Anthropic-Schlüssel)
STRIPE_SECRET_KEY     = (dein Stripe-Schlüssel, Testmodus)
```

### D. Datenbank füllen
Nach dem ersten erfolgreichen Deploy muss das Schema in die Railway-Datenbank und die
echten Daten (101 Hersteller, 1003 Produkte, 3084 SDS, 6001 Preise) eingespielt werden.
**Das übernehme ich (Claude) für dich**, sobald du mir die **öffentliche** `DATABASE_URL`
der Railway-Postgres gibst (in Railway bei der Postgres unter *Connect → Public Network*).
Ablauf dann:
- `npx prisma db push` gegen die Railway-DB (Schema anlegen)
- Einspielen der Sicherungskopie `marketplace-dump.sql`

### E. Öffentliche Adresse
Unter **Settings → Networking → Generate Domain** erzeugt Railway eine Adresse wie
`marketplace-production-xxxx.up.railway.app`. Diese Adresse brauchen wir für Baustein 3.

---

## Baustein 3 — Netlify-Weiche (du bist bei Netlify eingeloggt)

Damit `dosimetrix.eu/marketplace2026` auf die Railway-App zeigt, wird auf der
dosimetrix.eu-Seite **eine Weiterleitung** ergänzt. Zwei Wege:

**Weg 1 (wenn dosimetrix.eu aus einem Git-Repo deployt):** eine Datei `netlify.toml`
(oder `_redirects`) im Repo ergänzen:

```toml
[[redirects]]
  from = "/marketplace2026/*"
  to = "https://DEINE-RAILWAY-ADRESSE.up.railway.app/marketplace2026/:splat"
  status = 200
  force = true
```

**Weg 2 (direkt im Netlify-Dashboard):** unter der Site → *Redirects* dieselbe Regel
eintragen (from/to/200/force).

> Wichtig: In `to` muss `/marketplace2026` enthalten sein, weil die App selbst unter
> dieser Unteradresse läuft. `status = 200` bedeutet „durchreichen" (Proxy), nicht
> „woanders hinschicken".

---

## Ergebnis
- `https://dosimetrix.eu/marketplace2026` zeigt zuerst die **weiße Login-Seite**.
- Login mit **admin** + dem in Railway gesetzten `GATE_PASSWORD` öffnet den Marktplatz.
- Die Seite ist **nirgends verlinkt** — nur wer die Adresse kennt, findet sie, und ohne
  Passwort kommt niemand rein.
