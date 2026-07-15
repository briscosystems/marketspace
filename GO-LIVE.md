# Live-Schaltung mit Kreditkartenzahlung — Vorbereitung

**Stand:** 2026-07-15 · Ergänzt [DEPLOY_MARKETPLACE2026.md](DEPLOY_MARKETPLACE2026.md) (dort steht
der reine Technik-Aufbau; hier steht, was für den **echten Zahlungsbetrieb** dazukommt).

> Kurzfassung: Der Code ist fertig — Abo, automatische Verlängerung, Kündigung, Käuferschutz und
> Webhook sind vollständig implementiert und gegen die Stripe-Test-API geprüft. Es fehlen
> **keine Programmierarbeiten**, sondern **vier Entscheidungen** und **Zugänge, die nur der
> Betreiber setzen kann**.

---

## Teil 1 — Stopp-Schilder: erst klären, dann live

### 1.1 Marktpreise → „Indikative Richtwerte" ✅ ERLEDIGT (2026-07-15)
**Befund war:** Alle **5850** Preisdatensätze haben `source = SEED_INDICATIVE`; aus echten
Nutzer-Meldungen oder Transaktionen stammen **0**. Die Oberfläche behauptete aber
*„Alle Datenpunkte sind verifiziert"* und *„197 Produkte mit verifizierten Preisen"*.

**Umgesetzt:** Nutzersichtbar heißt es jetzt durchgängig **„Indikativer Richtwert"** statt
„Marktpreis", und die Falschbehauptungen sind ersetzt:
- `/prices`: Titel „Indikative Richtwerte" + gelber Hinweiskasten („modellierte Richtwerte, keine
  bestätigten Marktpreise … sobald Nutzer eigene Preise melden, fließen echte Werte ein").
  Spalte „Marktpreis" → „Richtwert".
- Produktseite: „Aktueller Richtwert", „Indikativer Richtwert & Verlauf", ehrlicher Fußtext.
- Startseite: Kachel sagte „aus Meldungen und Transaktionen" (beides existiert nicht) →
  jetzt „indikativ — zum Vergleichen".
- Menü, KSS-Finder-Filter, Preis-Schieber, Gesamtkostenrechner, Herstellerseite mitgezogen.
- **KI-Concierge** (`app/api/concierge/route.ts`): bekommt jetzt die ausdrückliche Anweisung, die
  Werte nie „geprüfte"/„verifizierte" Marktpreise zu nennen.

Geprüft im laufenden Server: „Alle Datenpunkte sind verifiziert" kommt auf keiner Seite mehr vor.

**Offen (klein):** Der DB-Feldwert `status = VERIFIED` der Seed-Daten ist technisch noch da — er
steuert die Aggregation (`lib/price-aggregation.ts` zählt nur `VERIFIED`). Nutzersichtbar hat er
keine Wirkung mehr. Sauberer wäre ein eigener Status `INDICATIVE`; das ist eine Schema-Änderung
und kann warten, bis echte Nutzerpreise dazukommen.

### 1.2 Anwaltsprüfung — von den AGB selbst gefordert 🔴
Die AGB tragen einen sichtbaren Warnkasten: *„Vor dem Live-Betrieb muss er von einer bzw. einem in
der Schweiz zugelassenen Rechtsanwält:in geprüft werden."* Das ist **die** von euch selbst gesetzte
Bedingung für den Live-Gang. Zusätzlich empfiehlt [FDS.md](FDS.md) C.10 eine **DE-Prüfung**
(Reichweite deutschen Verbraucherrechts auf eine Schweizer Anbieterin mit deutschsprachigem
Angebot, Art. 6 Rom-I-VO „Ausrichtung").

Zu prüfen sind mindestens:
- Haftungs-/Gewährleistungsklauseln, AGB-Inhaltskontrolle (Art. 8 UWG)
- B2B-Beschränkung (s. 1.3)
- Automatische Abo-Verlängerung (FDS C.10 hat die Recherche vorbereitet)
- Käuferschutz-Wortlaut — **nie „Treuhand"/„Escrow"** (Stripe-Support-Bestätigung liegt vor)

### 1.3 B2B-Beschränkung ist stimmig — aber nirgends erzwungen 🟡
Geprüft und **in Ordnung**: AGB §1 und Impressum sagen beide „ausschließlich an Unternehmer".
Die Rolle `ENDKUNDE` meint laut AGB **gewerbliche Endabnehmer**, keine Verbraucher. Die
Registrierung verlangt zwingend `companyName`. Das ist konsistent.

Zwei Restpunkte:
- Der `companyName` wird **nicht geprüft** — eine Privatperson kann irgendetwas eintragen. Solange
  B2B gilt, ist die USt-ID-Prüfung (VIES, bereits eingebaut) der einzige echte Nachweis.
  → Anwaltsfrage: Reicht die AGB-Erklärung, oder braucht es eine aktive Bestätigung beim Registrieren?
- Falls die Prüfung ergibt, dass **doch** Verbraucherrecht greift, wird **§ 356a BGB
  „Widerrufsbutton"** relevant (laut FDS C.10 seit **19.06.2026** in Kraft — Datum ist bereits
  verstrichen). Der Kündigungsbutton (§ 312k) **existiert** bereits, ein Widerrufsbutton **nicht**.
  → Bei reinem B2B kein Thema. Bei B2C: Nachbau nötig.

### 1.4 Widerspruch im Impressum 🟡
- [FDS.md](FDS.md) Kopf nennt als Owner **„Klaus Gosch"**, das
  [Impressum](app/impressum/page.tsx) nennt als Geschäftsführung **„Jürgen Gosch"**.
  Einer der beiden ist falsch — das Impressum ist ein Rechtsdokument. **Bitte klären.**
- Das Impressum sagt „ausschließlich an Unternehmer (B2B)", die Startseite wirbt „Für Reseller,
  **Endkunden** & Hersteller". Kein echter Widerspruch (s. 1.3), aber das Impressum sollte den
  AGB-Wortlaut „**gewerbliche** Endabnehmer" übernehmen, damit es zusammenpasst.

---

## Teil 2 — Was nur du tun kannst: Stripe scharf schalten

> ⚠️ **Schlüssel niemals in den Chat schreiben.** Sie gehören ausschließlich in die
> Railway-Variablen. (Ein Schlüssel im Gesprächsverlauf hat am 14.07. den Push blockiert.)

1. ~~**Stripe-Konto aktivieren** (live): dashboard.stripe.com → „Aktivieren", Firmendaten,
   Bankverbindung, wirtschaftlich Berechtigte.~~ ✅ **erledigt (2026-07-15, lt. Betreiber)**
2. **Live-Schlüssel holen**: Dashboard auf **Live-Modus** umschalten → Entwickler → API-Schlüssel →
   „Geheimer Schlüssel" (beginnt mit `sk_live_`).
3. **Webhook anlegen** (im **Live**-Modus, nicht Test!): Entwickler → Webhooks → Endpunkt hinzufügen
   - **URL**: `https://markt.brisco.ch/api/billing/webhook`
     *(kein `/marketplace2026` mehr — siehe 3.3, die Subdomain macht den Unterpfad überflüssig)*
   - **Events** — genau diese vier, mehr braucht der Code nicht:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Danach das **Signing Secret** kopieren (beginnt mit `whsec_`).
4. **Stripe Connect live** (nur nötig, wenn der Käuferschutz live gehen soll):
   dashboard.stripe.com/connect → im Live-Modus aktivieren. Im Test-Modus ist Connect bereits aktiv
   (am 13.07. geprüft) — **das gilt nicht automatisch für Live**.

**Gut zu wissen:** Der Code legt Preise **inline** an (`price_data`) — es müssen **keine**
Produkte/Preise im Stripe-Dashboard angelegt werden. Die Jahresgebühren kommen aus `/admin`.

---

## Teil 3 — Was nur du tun kannst: Railway & Netlify

### 3.1 Railway-Variablen (Projekt → App-Dienst → Variables)
| Variable | Wert | Status heute |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` | ⚠️ lokal noch **Test**-Schlüssel |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` aus Schritt 2.3 | 🔴 **leer** — ohne das kommt **keine Verlängerung** an |
| `CRON_SECRET` | selbst gewähltes langes Zufallswort | 🔴 fehlt in der Deploy-Doku |
| `SMTP_HOST` · `SMTP_USER` · `SMTP_PASS` | Zugangsdaten des Postfachs | 🔴 **Pflicht** — ohne das kommt keine Passwort-Reset-Mail an (s. 3.4) |
| `SMTP_PORT` | `587` (STARTTLS) oder `465` (TLS) | Standard 587 |
| `MAIL_FROM` | z.B. `Brisco Marketplace <noreply@brisco.ch>` | Standard: `SMTP_USER` |
| `NEXTAUTH_URL` | `https://markt.brisco.ch` | ⚠️ **ändern** (war `…/marketplace2026`) |
| `NEXTAUTH_SECRET` | echtes Zufalls-Secret | ⚠️ README: „in Production ersetzen" |
| `NEXT_PUBLIC_BASE_PATH` | **löschen** | ⚠️ entfällt mit der Subdomain — danach **neu bauen** (Build-Zeit-Variable!) |
| `GATE_ENABLED` / `GATE_USER` / `GATE_PASSWORD` / `GATE_SECRET` | Passwort-Gate | **Entscheidung:** bei echtem Verkauf ausschalten (`GATE_ENABLED=false`) — sonst kommt kein Kunde rein |
| `DATABASE_URL` | von Railway gestellt | |
| `ANTHROPIC_API_KEY` | für die KI-Funktionen | |

> `STRIPE_WEBHOOK_SECRET` und `CRON_SECRET` **fehlen in DEPLOY_MARKETPLACE2026.md** — dort ergänzen.

### 3.2 Tages-Cron für Abo-Erinnerungen
`GET /api/cron/membership-reminders` täglich aufrufen, Header
`Authorization: Bearer <CRON_SECRET>`. Schickt die 30-Tage-Vorabinfo vor jeder automatischen
Verlängerung — bei automatischer Verlängerung rechtlich wichtig, nicht optional.

### 3.4 E-Mail-Versand (SMTP) — Pflicht vor dem Live-Gang 🔴

**Was am 2026-07-15 behoben wurde:** Die Seite „Passwort vergessen" zeigte den
Zurücksetzen-Link **direkt im Browser an** („Prototyp-Hinweis: E-Mail-Versand noch nicht
aktiv"), weil kein Mailversand existierte. Damit hätte nach dem Abschalten des Gates
**jeder Fremde ein beliebiges Konto übernehmen können** — E-Mail-Adresse eintippen, Link
anklicken, neues Passwort setzen. Der Link geht jetzt ausschließlich per E-Mail raus.

**Der Versand ist implementiert** (`lib/mailer.ts`, SMTP über nodemailer) und deckt alles
ab, was Mails schickt: Passwort-Reset, Abo-Erinnerung, Verlängerungsbestätigung.
Bewusst SMTP statt Anbieter-SDK — damit läuft jeder Dienst ohne Code-Änderung.

**Ohne SMTP-Zugangsdaten wird nichts verschickt**, sondern nur ins Server-Log geschrieben
(dieselbe Fallback-Logik wie beim KI-Schlüssel). Für die Entwicklung ist das richtig —
**live bedeutet es: niemand kann sein Passwort zurücksetzen.**

Zu setzen sind `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (+ optional `SMTP_PORT`, `MAIL_FROM`).
Möglich ist das bestehende brisco.ch-Postfach oder ein Versanddienst (Postmark, Resend, SES).

> **Zustellbarkeit:** Für `noreply@brisco.ch` sollten **SPF** und **DKIM** im DNS stehen,
> sonst landen die Mails im Spam. Das ist derselbe DNS-Bereich bei Swizzonic, in dem der
> `markt`-Eintrag angelegt wurde — die MX-Einträge dabei **nicht** anfassen.

**Test nach dem Setzen:** Auf `/forgot-password` die eigene Adresse eintragen → Mail muss
ankommen. Gegenprobe in `/admin`: Der Versand steht im EmailLog.

### 3.3 Eigene Adresse: `markt.brisco.ch` (entschieden am 2026-07-15)

**Der alte Plan (`dosimetrix.eu/marketplace2026`) ist damit vom Tisch** — aus zwei Gründen:
1. **Neutralität:** Dosimetrix ist inzwischen zahlender Werbekunde der Plattform. Ein neutraler
   Marktplatz unter der Domain eines seiner Werbekunden widerlegt genau die Neutralität, für die
   Mitglieder 290–3000 €/Jahr zahlen (und die der KSS-Wizard nach P2B-VO eigens kennzeichnet).
2. **Technik:** Eine eigene Subdomain macht die Netlify-Weiche **und** den Basispfad überflüssig.

**Vorarbeit geprüft (2026-07-15):** `/marketplace2026` ist **nirgends fest verdrahtet** — der
Basispfad kommt ausschließlich aus `NEXT_PUBLIC_BASE_PATH` (`next.config.ts` + `lib/base-path.ts`,
41 Dateien nutzen den Helfer `withBasePath`). Mit leerem Basispfad läuft die App exakt so wie im
lokalen Dev-Betrieb — das ist der am besten getestete Zustand überhaupt.

**Schritte:**
1. **Railway** → App-Dienst → *Settings → Networking → Custom Domain* → `markt.brisco.ch` eintragen.
   Railway nennt daraufhin ein CNAME-Ziel und stellt das TLS-Zertifikat automatisch aus.
2. **DNS beim brisco.ch-Registrar**: neuen Eintrag anlegen
   `markt` → **CNAME** → `<das von Railway genannte Ziel>`. Verbreitung dauert Minuten bis ~1 h.
3. **Railway-Variablen anpassen:**
   - `NEXT_PUBLIC_BASE_PATH` → **löschen** (nicht auf „/" setzen — ganz weg oder leer)
   - `NEXTAUTH_URL` → `https://markt.brisco.ch`
4. ⚠️ **Neu bauen lassen.** `NEXT_PUBLIC_*`-Variablen werden **zur Build-Zeit** in den Code
   eingebacken — ein bloßer Neustart genügt nicht. Railway stößt beim Ändern einer Variablen
   normalerweise ein neues Deployment an; falls nicht, „Redeploy" von Hand auslösen.
5. **Netlify**: nichts zu tun. Die Weiche auf dosimetrix.eu wird nicht mehr gebraucht (eine
   bereits eingetragene Regel kann später entfernt werden).

**Stripe-Webhook-URL lautet damit** (ohne Unterpfad, ohne Proxy):
```
https://markt.brisco.ch/api/billing/webhook
```

**Gegenprobe nach der Umstellung:** `https://markt.brisco.ch/` lädt · Login funktioniert
(NEXTAUTH_URL richtig) · ein Bild/CSS lädt (Basispfad wirklich leer) · Stripe-Webhook-Test
liefert 200.

---

## Teil 4 — Was bereits geprüft und fertig ist ✅

- **Zahlungscode vollständig**: Abo-Checkout (`mode: "subscription"`, Jahresintervall),
  automatische Verlängerung, Kündigen/Reaktivieren, Credits, Käuferschutz. Alles End-to-End gegen
  die echte Stripe-Test-API verifiziert, inklusive Idempotenz-Test des Verlängerungs-Webhooks.
- **Das Passwort-Gate blockiert den Webhook NICHT.** Geprüft: Das Gate sitzt in `app/layout.tsx`,
  und Layouts umschließen in Next.js nur Seiten, keine API-Routen; eine `middleware.ts` existiert
  nicht. Der Webhook antwortet unabhängig vom Gate.
- **Kündigungsbutton (§ 312k)** vorhanden, dauerhaft sichtbar, Kündigung ohne Vorlauffrist.
- **Offenlegungstext** direkt bei der Abo-Aktion (§ 312j) vorhanden.
- **Käuferschutz-Gebühr** 2,5 % + 0,25 €, Wortlaut ehrlich korrigiert (deckt Abwicklung **und**
  Service, ein Teil bleibt bei Brisco).
- **Impressum** vollständig mit echten Handelsregisterdaten.
- **Preise inline** — kein Pflegeaufwand im Stripe-Dashboard.

---

## Teil 5 — Testplan nach dem Scharfschalten

Mit einer **echten** Karte (Stripe-Testkarten funktionieren im Live-Modus nicht):

1. **Abo abschließen** → Zugang frei? `membershipValidUntil` gesetzt? `Payment`-Zeile da?
2. **Stripe-Dashboard → Webhooks → Versuche**: alle vier Events grün (200)? Der häufigste Fehler
   ist ein falsches `whsec_` → Signaturfehler 400.
3. **Kündigen** → bleibt der Zugang bis Periodenende? Steht die Kündigung auch in Stripe?
4. **Reaktivieren** → wieder aktiv?
5. **Cron einmal von Hand** aufrufen → kommt die Erinnerungs-Mail?
6. **Käuferschutz** (falls live): kleine Testtransaktion, Freigabe **und** Erstattung testen.
7. Danach **sofort** eine Testzahlung erstatten und prüfen, ob der Zugang korrekt endet.

---

## Reihenfolge (Vorschlag)

1. **Entscheiden**: Marktpreis-Wortlaut (1.1) · Gate an/aus · Namensfrage (1.4)
2. **Anwaltsprüfung** anstoßen (1.2) — läuft parallel, dauert am längsten
3. **Stripe-Konto aktivieren** (Teil 2.1) — dauert 1–3 Tage, früh starten
4. Netlify-Weiche + Railway-Variablen (Teil 3)
5. Webhook anlegen, `whsec_` eintragen
6. Testplan (Teil 5)
7. Gate aus → live
