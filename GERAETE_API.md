# Brisco Marketplace — Geräte-Schnittstelle (REST-API v1)

> Schnittstellen-Spezifikation für Maschinen, insbesondere den **eMix1500**
> IoT-Mischer. Eigenständiges Dokument — wer nur diese Schnittstelle bauen
> muss, braucht sonst nichts aus dem Repository zu lesen.

**Basis-URL:** `https://markt.brisco.ch`
**Version:** 1 (Pfad-Präfix `/api/v1/geraet/`)
**Stand:** 2026-09-22

## Zweck

Ein Mischer setzt einen wassermischbaren Kühlschmierstoff (KSS) mit
Wasser zu einer Emulsion an. Dazu misst er die Konzentration meist über ein
Refraktometer, das den **Brix-Wert** liefert — dieser muss mit einem
produktspezifischen **Faktor** in die tatsächliche Konzentration in Prozent
umgerechnet werden:

```
Konzentration (%) = Brix-Wert × Refraktometerfaktor
```

Diese Schnittstelle liefert genau diesen Faktor sowie die Soll-Konzentration,
pH-Vorgaben und Wasserhärte-Vorgaben zu einem KSS-Typ — recherchiert aus
Herstellerdatenblättern und in der Datenbank von Brisco Marketplace gepflegt.

## 1. Authentifizierung

Jeder Aufruf trägt einen Schlüssel im Header:

```
Authorization: Bearer brisco_<48 Hex-Zeichen>
```

- Schlüssel werden von einem Brisco-Konto unter **Mitgliedschaft →
  „Maschinen anbinden"** erzeugt, Art **„Geräte-Schlüssel"** (nicht
  „Plattform-Schlüssel" — die sind für etwas anderes, siehe Abschnitt 6).
- **Keine Marke-Stufe / kein Abo nötig.** Jedes Brisco-Konto kann
  Geräte-Schlüssel anlegen — der Mischer steht beim Kunden, nicht bei einem
  zahlenden Marke-Mitglied.
- Ein Schlüssel gilt bis er widerrufen wird. Empfehlung: **ein Schlüssel je
  physischem Gerät**, damit ein einzelnes Gerät ausgetauscht/gesperrt werden
  kann, ohne die anderen zu beeinträchtigen.
- Der Klartext wird beim Anlegen **genau einmal** angezeigt — danach nur noch
  ein Präfix. Verloren = neuen Schlüssel anlegen, alten widerrufen.
- Ein Geräte-Schlüssel funktioniert **ausschließlich** unter
  `/api/v1/geraet/…`. Andere Adressen antworten mit `403 wrong_key_kind`.

## 2. Grundsätze der Antworten

- Alle Antworten sind JSON, alle Texte deutsch.
- Fehler haben immer diese Form:
  ```json
  { "error": { "code": "…", "message": "…" } }
  ```
- **Es wird nicht geraten.** Passt der eingegebene KSS-Name nicht eindeutig
  zu genau einem Katalogprodukt, liefert die Erkennung `eindeutig: false`
  und eine Liste von Kandidaten statt einer Vermutung. Das Gerät muss den
  Bediener dann auswählen lassen.
- Fehlt zu einem Produkt der Refraktometerfaktor, ist das Feld
  `refraktometerFaktor` **`null`** und `faktorVorhanden` **`false`** — niemals
  ein angenommener Standardwert. Mit einem fehlenden Faktor kann nicht
  gerechnet werden; das Gerät muss den Wert manuell abfragen (z. B. vom
  Datenblatt) oder eine Fehlermeldung anzeigen.
- **Limit:** 60 Aufrufe pro Minute je Schlüssel. Wird das überschritten,
  antwortet der Server mit `429 rate_limited` und einem `Retry-After`-Header
  (Sekunden bis zum nächsten Fenster).

## 3. Empfohlener Ablauf am Gerät

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Inbetriebnahme: GET /geraet/status                        │
│    → prüft, ob der Schlüssel gültig ist                      │
│                                                                │
│ 2. Bediener wählt KSS-Typ am Gerät:                           │
│    a) Freitext-Eingabe/Barcode → GET /geraet/kss?typ=…       │
│       → meist direkt "eindeutig": true                       │
│    b) ODER Auswahlbox:                                       │
│       GET /geraet/hersteller  → Hersteller anzeigen           │
│       GET /geraet/produkte?hersteller=…  → Produkte anzeigen  │
│                                                                │
│ 3. Falls (a) "eindeutig": false zurückgibt:                   │
│    → Kandidatenliste dem Bediener zur Auswahl anzeigen        │
│                                                                │
│ 4. Ausgewähltes Produkt (id) im Gerät speichern.               │
│    Ab jetzt reicht: GET /geraet/kss/{id}                      │
│    (holt aktuelle Werte nach, falls sich am Katalog etwas     │
│    geändert hat — z. B. neu nachgepflegter Faktor)             │
└─────────────────────────────────────────────────────────────┘
```

## 4. Endpunkte

Alle Endpunkte: `GET`, Header `Authorization: Bearer brisco_…` Pflicht.

### 4.1 `GET /api/v1/geraet/status`

Verbindungstest für die Inbetriebnahme.

**Antwort 200:**
```json
{
  "ok": true,
  "version": "1",
  "serverZeit": "2026-09-22T17:15:49.256Z",
  "schluessel": { "name": "eMix1500 Halle 2", "geraet": "TEST-0001", "art": "GERAET" },
  "katalog": { "wassermischbareProdukte": 185, "davonMitRefraktometerFaktor": 146 },
  "grenzen": { "aufrufeProMinute": 60 }
}
```

### 4.2 `GET /api/v1/geraet/kss` — KSS-Typ erkennen (Hauptaufruf)

| Parameter | Pflicht | Beschreibung |
|---|---|---|
| `typ` | ja | KSS-Name, so wie er im Gerät/von der Steuerung kommt. Mindestens 2 Zeichen. Schreibweise, Leerzeichen und kleine Tippfehler werden toleriert. |
| `hersteller` | nein | Name oder Slug — grenzt stark ein, erhöht die Trefferquote deutlich |
| `alle` | nein | `1` = auch Produkte einbeziehen, die kein Mischer ansetzen kann (Standard: nur wassermischbare KSS) |

**Beispiel:**
```
GET /api/v1/geraet/kss?typ=bcool755&hersteller=blaser
```

**Antwort bei eindeutigem Treffer (200):**
```json
{
  "eindeutig": true,
  "treffer": {
    "id": "cmp…",
    "name": "B-Cool 755",
    "hersteller": "Blaser Swisslube",
    "herstellerId": "cmp…",
    "kategorie": "COOLANT_WATER_MIX",
    "chemie": "SEMI_SYNTHETIC",
    "refraktometerFaktor": 1.2,
    "faktorVorhanden": true,
    "sollKonzentrationMin": 6,
    "sollKonzentrationMax": 10,
    "phKonzentrat": null,
    "phEmulsionMin": 8.8,
    "phEmulsionMax": 9.4,
    "wasserhaerteMinDh": 5,
    "wasserhaerteMaxDh": 20,
    "wasserhaerteHinweis": null,
    "enthaeltBor": false,
    "enthaeltFormaldehydDepot": false,
    "datenblattUrl": "https://…",
    "produktseite": "https://markt.brisco.ch/products/blaser-swisslube/b-cool-755",
    "datenherkunft": "verifiziert",
    "trefferGuete": 100,
    "trefferArt": "exakt"
  },
  "kandidaten": [],
  "hinweis": null
}
```

**Antwort bei mehreren möglichen Treffern / keinem Treffer (200,
`eindeutig: false`):**
```json
{
  "eindeutig": false,
  "treffer": null,
  "kandidaten": [ { "...": "bis zu 10 Kandidaten, gleiche Feldform wie oben" } ],
  "herstellerTreffer": { "id": "cmp…", "name": "Blaser Swisslube", "slug": "blaser-swisslube" },
  "hinweis": "Mehrere Produkte passen ähnlich gut. Bitte am Gerät auswählen lassen — es wird bewusst nicht geraten."
}
```

`herstellerTreffer` ist nur gesetzt, wenn aus der Eingabe wenigstens ein
Hersteller erkannt werden konnte — dann kann das Gerät mit dessen Slug direkt
`/geraet/produkte?hersteller=…` aufrufen, statt in einer Sackgasse zu stehen.

### 4.3 `GET /api/v1/geraet/hersteller` — Hersteller für eine Auswahlbox

Liefert alle Hersteller, die mindestens einen wassermischbaren KSS im Katalog
haben. Ändert sich selten — darf im Gerät zwischengespeichert werden
(empfohlen: einmal täglich neu laden).

```json
{
  "hersteller": [
    { "id": "cmp…", "name": "Blaser Swisslube", "slug": "blaser-swisslube", "anzahlProdukte": 15 }
  ]
}
```

### 4.4 `GET /api/v1/geraet/produkte` — Produkte eines Herstellers

| Parameter | Pflicht | Beschreibung |
|---|---|---|
| `hersteller` | empfohlen | Slug oder Name — ohne wird die Liste sehr lang |
| `q` | nein | Textfilter auf den Produktnamen |
| `seite` | nein | 1-basiert, 100 Einträge je Seite |
| `alle` | nein | `1` = auch nicht wassermischbare Produkte |

```json
{
  "gesamt": 15,
  "seite": 1,
  "proSeite": 100,
  "weitereSeiten": false,
  "produkte": [ { "...": "gleiche Feldform wie treffer/kandidaten" } ]
}
```

### 4.5 `GET /api/v1/geraet/kss/{id}` — Werte zu einer gemerkten Kennung

Statt `id` wird auch der `slug` akzeptiert. Damit das Gerät sich nur eine
Kennung merken muss und bei Bedarf aktuelle Werte nachlädt (z. B. wenn ein
Faktor im Katalog nachträglich ergänzt wurde).

```json
{
  "produkt": { "...": "gleiche Feldform wie oben" },
  "hinweis": null
}
```

`404 not_found`, falls die Kennung nicht (mehr) existiert.

## 5. Feldreferenz

| Feld | Typ | Einheit / Werte |
|---|---|---|
| `refraktometerFaktor` | Zahl oder `null` | Multiplikator für Brix → % |
| `faktorVorhanden` | Boolean | `false` ⇒ Faktor fehlt, nicht raten |
| `sollKonzentrationMin` / `-Max` | Zahl oder `null` | Prozent (%) |
| `phKonzentrat` | Zahl oder `null` | pH-Wert des unverdünnten Konzentrats |
| `phEmulsionMin` / `-Max` | Zahl oder `null` | pH-Sollfenster der fertigen Emulsion |
| `wasserhaerteMinDh` / `-MaxDh` | Zahl oder `null` | °dH (deutsche Härtegrade) |
| `wasserhaerteHinweis` | Text oder `null` | Freitext-Zusatzhinweis |
| `enthaeltBor` | Boolean oder `null` | `null` = nicht bekannt |
| `enthaeltFormaldehydDepot` | Boolean oder `null` | `null` = nicht bekannt |
| `kategorie` | Text | z. B. `COOLANT_WATER_MIX` |
| `chemie` | Text oder `null` | z. B. `SEMI_SYNTHETIC`, `MINERAL`, `ESTER` |
| `datenherkunft` | Text oder `null` | z. B. `verifiziert`, `herstellerangabe` — Vertrauenswürdigkeit der Werte |
| `trefferGuete` | Zahl 0–100 | wie gut Eingabe und Katalogname zusammenpassen |
| `trefferArt` | Text | `exakt` \| `enthalten` \| `aehnlich` |

## 6. Fehler-Codes

| Code | HTTP | Bedeutung |
|---|---|---|
| `missing_key` | 401 | Header `Authorization` fehlt oder falsch geformt |
| `invalid_key` | 401 | Schlüssel unbekannt oder widerrufen |
| `account_blocked` | 403 | Das Konto hinter dem Schlüssel ist gesperrt |
| `tier_required` | 403 | Nur relevant, falls versehentlich ein **Plattform**-Schlüssel benutzt wurde (siehe Abschnitt 1) und dessen Konto keine aktive Marke-Stufe hat. Mit einem echten Geräte-Schlüssel kommt dieser Fehler nicht vor |
| `rate_limited` | 429 | Mehr als 60 Aufrufe/Minute — `Retry-After`-Header beachten |
| `missing_typ` | 400 | Parameter `typ` fehlt oder zu kurz (bei `/geraet/kss`) |
| `not_found` | 404 | Kennung existiert nicht (bei `/geraet/kss/{id}`) |

## 7. Beispiel — vollständiger curl-Ablauf

```bash
KEY="brisco_…"
BASIS="https://markt.brisco.ch"

# 1. Verbindung prüfen
curl -H "Authorization: Bearer $KEY" "$BASIS/api/v1/geraet/status"

# 2. KSS-Typ erkennen
curl -H "Authorization: Bearer $KEY" \
  "$BASIS/api/v1/geraet/kss?typ=bcool755&hersteller=blaser"

# 3. Falls uneindeutig: Hersteller und Produkte durchblättern
curl -H "Authorization: Bearer $KEY" "$BASIS/api/v1/geraet/hersteller"
curl -H "Authorization: Bearer $KEY" \
  "$BASIS/api/v1/geraet/produkte?hersteller=blaser-swisslube"

# 4. Später, mit gemerkter id:
curl -H "Authorization: Bearer $KEY" "$BASIS/api/v1/geraet/kss/cmp…"
```

## 8. Sicherheit — Hinweise für die Geräte-Firmware

- Schlüssel **nicht im Klartext im Gerätespeicher lassen**, wenn das Gerät
  physisch zugänglich ist — mindestens verschleiert ablegen. Ein
  ausgelesener Geräte-Schlüssel kann nur die hier beschriebenen,
  öffentlichen Katalogdaten lesen (kein Schreibzugriff, keine
  Kunden-/Geschäftsdaten) — der Schaden ist begrenzt, aber vermeidbar.
- Ausschließlich über **HTTPS** aufrufen.
- Bei `401`/`403` **nicht automatisch neu versuchen** — das sind dauerhafte
  Zustände (falscher/widerrufener Schlüssel), kein Netzwerkfehler.
- Bei `429` den `Retry-After`-Wert abwarten, dann erneut versuchen.
- Ergebnisse cachen, wenn sinnvoll (`/geraet/hersteller` z. B. täglich,
  `/geraet/kss/{id}` bei jedem Rezept-Aufruf neu — Katalogwerte können sich
  ändern).

---
*Rückfragen zu dieser Schnittstelle: info@brisco.ch — Kontext für den
Betreiber: [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md), Abschnitt „Geräte-
Schnittstelle für den eMix1500".*
