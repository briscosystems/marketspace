# Brisco Marketplace — Test auf dem Smartphone

Drei Wege, vom schnellsten zum aufwendigsten.

## 1) Schnellster Weg: WLAN + PWA (5 Minuten)

Voraussetzung: Smartphone und Devcontainer-Host (dein PC) sind im selben WLAN.

### Schritt 1 — Host-IP finden

**Auf dem Host-PC** (nicht im Container) im Terminal:

```bash
# macOS / Linux
ifconfig | grep "inet " | grep -v 127.0.0.1
# oder
ip addr show | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

Notiere dir die IP, die mit `192.168.x.x`, `10.x.x.x` oder `172.16-31.x.x` beginnt.
Beispiel: `192.168.1.42`.

### Schritt 2 — Dev-Server prüfen

Der Devcontainer forwarded Port 3000 schon (`forwardPorts: [3000, ...]` in
`.devcontainer/devcontainer.json`). Stelle sicher dass der Dev-Server läuft:

```bash
# im Container
npm run dev
```

Vom Host-Browser aus muss `http://localhost:3000` funktionieren.

### Schritt 3 — Smartphone-Browser

Öffne auf deinem Android-Phone (Chrome) oder iPhone (Safari):

```
http://192.168.1.42:3000     ← deine Host-IP
```

Du siehst die App. Im Browser-Menü:

- **Chrome (Android)**: `⋮` → "Zum Startbildschirm hinzufügen" / "App installieren"
- **Safari (iOS)**: Teilen-Symbol → "Zum Home-Bildschirm"

Das App-Icon erscheint auf dem Homescreen. Beim Tippen öffnet sich die App
ohne Browser-Adressleiste, im Vollbild — fühlt sich an wie eine native App.

### Wenn das nicht klappt

| Problem | Lösung |
|---|---|
| "Diese Seite kann nicht angezeigt werden" | Firewall auf dem Host blockiert Port 3000. Windows: ein­malig zulassen. macOS: Einstellungen → Netzwerk → Firewall → Optionen → Node erlauben. |
| Smartphone und PC sind verschiedene Subnetze (z. B. Gäste-WLAN) | Nicht via WLAN testbar — nimm Variante 2 (Tunnel). |
| Funktioniert via `localhost` aber nicht via LAN-IP | Devcontainer bindet auf `0.0.0.0` (Next.js Default mit Turbopack). Falls nicht, starte mit `npx next dev --hostname 0.0.0.0`. |

---

## 2) Cloud-Tunnel: Cloudflared (10 Minuten)

Wenn WLAN nicht geht oder du das Telefon aus dem Mobilfunknetz testen willst.

```bash
# Im Container
sudo apk add --no-cache cloudflared
cloudflared tunnel --url http://localhost:3000
```

Nach ein paar Sekunden zeigt cloudflared eine `*.trycloudflare.com` URL.
Diese auf dem Smartphone aufrufen — HTTPS ist automatisch dabei (sonst klappt
"Add to Home Screen" auf iOS nicht).

Die URL ist temporär und ändert sich bei jedem Tunnel-Neustart.

Alternative: `ngrok http 3000` (account-pflichtig, dafür stabile Subdomains).

---

## 3) Echte Android-APK (1–2 Stunden, separater Schritt)

Möglich, aber heute nicht aus dem Stand. Der Devcontainer hat kein Android SDK
und keinen Java-Signing-Keystore. Wenn du den Schritt gehen willst:

1. **PWABuilder** (https://www.pwabuilder.com/) — Du gibst die öffentlich
   erreichbare URL deiner App ein (über cloudflared tunnel), PWABuilder
   generiert eine `.apk` und einen Play-Store-bereiten Bundle. Kostenlos.

2. **Bubblewrap CLI** (Google) — gleicher Workflow lokal:
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest=https://<deine-app>/manifest.webmanifest
   bubblewrap build
   ```
   Erzeugt eine signierte APK. Erfordert Java JDK 17 + Android SDK (~2 GB).

3. **Capacitor** — wenn du später echte native Features brauchst (Kamera,
   NFC, Push), wickelt Capacitor die Next.js-App in einen WebView, der dann
   als richtige App gebaut wird:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Brisco Marketplace" ch.brisco.marketplace
   npx cap add android
   npx cap sync
   npx cap open android
   ```

Für den ersten Test reicht aber Variante 1 — die PWA hat denselben Look und
fühlt sich nach Installation wie eine native App an.

---

## Was du auf dem Smartphone konkret testen solltest

- [ ] **Homepage** — schlankes Layout, Brand-Header, Stats
- [ ] **Listings-Übersicht** — Card-Layout mit Fass-Bildern und Brand-Logos
- [ ] **Filter** — Suchformular ist mobil scrollbar
- [ ] **Listing-Detail** — Hero mit großem Produktbild, Brand-Color-Streifen
- [ ] **Cert-Plaketten** — Tap öffnet Modal mit Norm-Details
- [ ] **KI-Alternative** — Kriterien-Form ist mobil bedienbar (Werkstoff,
      KSS-Pain-Points, Pflicht-Zertifikate)
- [ ] **RFQ erstellen** — 4-stufiges Formular mit den neuen Pflicht-Cert- und
      Pain-Point-Sektionen
- [ ] **SDS-Bibliothek** — Volltextsuche, PDF-Download direkt im Smartphone-Browser
