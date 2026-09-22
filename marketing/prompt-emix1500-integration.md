# Prompt für die eMix1500-Firmware/App — Anbindung an Brisco Marketplace

> Zum Kopieren in den anderen Container/Chat, der die eMix1500-Software
> baut. Ersetze `<HIER…>`-Platzhalter, bevor du sendest.

---

Baue die Anbindung des eMix1500-Mischers an die REST-Schnittstelle von
Brisco Marketplace. Die vollständige Spezifikation ist hier:

https://github.com/briscosystems/marketspace/blob/main/GERAETE_API.md

(Falls kein Internetzugriff besteht: Ich lege dir den Inhalt dieser Datei
gleich im nächsten Schritt separat ab — frag danach.)

## Kurz zusammengefasst, worum es geht

Der eMix1500 setzt einen wassermischbaren Kühlschmierstoff (KSS) an. Ein
Refraktometer liefert einen Brix-Wert; um daraus die tatsächliche
Konzentration in Prozent zu berechnen, braucht es einen produktspezifischen
**Refraktometerfaktor**:

```
Konzentration (%) = Brix-Wert × Refraktometerfaktor
```

Dieser Faktor ist je nach KSS-Typ unterschiedlich und stand bisher nicht
digital zur Verfügung. Brisco Marketplace liefert ihn jetzt per REST-API,
zusammen mit Soll-Konzentration, pH-Vorgaben und Wasserhärte-Vorgaben.

## Was du bauen sollst

1. **Konfiguration:** Ein Feld für den API-Schlüssel (`brisco_…`, kommt vom
   Betreiber, wird am Gerät oder in der Inbetriebnahme-App hinterlegt).
   Basis-URL fest: `https://markt.brisco.ch`.

2. **Verbindungstest bei der Inbetriebnahme:**
   `GET /api/v1/geraet/status` mit Header
   `Authorization: Bearer <Schlüssel>`. Zeig dem Techniker eine
   Erfolgs-/Fehlermeldung (z. B. „Verbunden — 185 Kühlschmierstoffe
   bekannt" oder „Schlüssel ungültig").

3. **KSS-Typ zuordnen** (einmalig pro Rezept/Programm, danach gespeichert):
   - **Bevorzugt: Auswahlbox.** Erst `GET /api/v1/geraet/hersteller` laden
     (Liste, kann täglich zwischengespeichert werden), Hersteller antippen
     lassen, dann `GET /api/v1/geraet/produkte?hersteller=<slug>` laden und
     das Produkt antippen lassen.
   - **Alternativ: Freitext/Barcode.**
     `GET /api/v1/geraet/kss?typ=<eingabe>` — liefert entweder direkt einen
     eindeutigen Treffer (`eindeutig: true`) oder eine Kandidatenliste
     (`eindeutig: false`), aus der der Bediener auswählen muss. **Wichtig:
     Bei mehreren Kandidaten NICHT automatisch den bestplatzierten nehmen**
     — das Gerät muss den Bediener aktiv entscheiden lassen. Steht in der
     Antwort zusätzlich `herstellerTreffer`, kannst du direkt in dessen
     Produktliste springen statt eine Sackgasse zu zeigen.
   - Die zurückgegebene `id` des gewählten Produkts lokal speichern.

4. **Werte abrufen und verwenden:**
   `GET /api/v1/geraet/kss/{id}` (oder direkt aus Schritt 3) liefert unter
   anderem:
   - `refraktometerFaktor` (Zahl oder `null`) und `faktorVorhanden` (Boolean)
   - `sollKonzentrationMin` / `sollKonzentrationMax` (Prozent)
   - `phEmulsionMin` / `phEmulsionMax`
   - `wasserhaerteMinDh` / `wasserhaerteMaxDh` (°dH)

   **Zwingende Regel:** Ist `faktorVorhanden === false`
   (`refraktometerFaktor === null`), darf das Gerät **keinen** Faktor
   annehmen (insbesondere nicht 1,0) und muss stattdessen eine klare
   Meldung zeigen, z. B. „Kein Umrechnungsfaktor hinterlegt — bitte manuell
   aus dem Datenblatt eintragen." Ein falscher Faktor führt zu einer falsch
   angesetzten Emulsion (zu mager: Korrosion/Werkzeugverschleiss; zu fett:
   unnötige Kosten, Hautreizung).

5. **Fehlerbehandlung:**
   - `401`/`403` → Schlüssel-/Berechtigungsproblem, **nicht automatisch
     wiederholen**, dem Techniker anzeigen.
   - `429` → `Retry-After`-Header (Sekunden) auslesen und erst danach neu
     versuchen. Limit ist 60 Aufrufe/Minute je Schlüssel — im Normalbetrieb
     (ein paar Abfragen pro Rezeptwechsel) wird das nicht erreicht.
   - Netzwerkfehler → normaler Retry mit Backoff ist ok.

6. **Alles auf Deutsch:** Die API liefert deutsche Texte/Feldnamen
   (`refraktometerFaktor`, `sollKonzentrationMin`, …) — Feldnamen 1:1
   übernehmen, keine Übersetzung nötig, das UI-Wording am Gerät kannst du
   frei gestalten.

## Technische Eckdaten

- Alle Endpunkte: `GET`, JSON-Antworten, Header
  `Authorization: Bearer brisco_<48 Hex-Zeichen>` Pflicht.
- Nur HTTPS.
- Schlüssel möglichst nicht im Klartext im Gerätespeicher ablegen, falls das
  Gerät physisch zugänglich ist (verschleiert/im geschützten Speicher).

## Mein Kontext (für Rückfragen)

- Ich betreibe Brisco Marketplace (markt.brisco.ch) und den eMix1500.
- Sprich mich direkt an, wenn dir in der Spezifikation ein Feld, ein
  Fehlerfall oder ein Ablauf fehlt — ich kann die Schnittstelle bei Bedarf
  erweitern.
- Testdaten/Testschlüssel: <HIER Schlüssel oder Hinweis einfügen, falls für
  diesen Container ein Testzugang bereitsteht — sonst weglassen>.

---

Bitte fang mit Schritt 1 (Konfiguration + Verbindungstest) an und melde dich,
sobald das steht, bevor du mit der Typ-Auswahl weitermachst.
