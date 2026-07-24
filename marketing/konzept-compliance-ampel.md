# Umsetzungskonzept: Compliance-/SDB-Ampel

> Stand: 2026-07-21. Konkretes Feature-Konzept, abgeleitet aus [marktanalyse-2026.md](marktanalyse-2026.md).
> Kernidee: Jedes Angebot/Produkt bekommt eine **Ampel (grün/gelb/rot/unbekannt)** plus Klartext-Hinweise zu
> regulatorisch kritischen Inhaltsstoffen — und bei rot/gelb einen Vorschlag **konformer Alternativen**.

## In einem Satz
Brisco warnt automatisch vor Produkten mit kritischen Stoffen (freie Borsäure, Formaldehyd-Abspalter, bestimmte
Amine, SVHC …) und zeigt sofort saubere Alternativen — etwas, das ein normaler Webshop nicht kann.

## Warum jetzt
Der Umstieg wird **regulatorisch erzwungen** (am besten belegter Trend der Marktanalyse): freie Borsäure ist seit
17.12.2022 ab 0,3 % als reproduktionstoxisch (H360) einzustufen, Formaldehyd-Abspalter als karzinogen 1B; alle
DACH-Hersteller haben bereits bor-/formaldehydfreie Linien. Einkäufer *müssen* prüfen — Brisco nimmt ihnen das ab.

---

## 1. Die Daten sind schon da (kein Sammelaufwand)

Mapping „Regel → vorhandenes Feld" (Felder existieren in `prisma/schema.prisma`, geparst via `lib/sds-parser.ts` /
`lib/sds-ingredients.ts`):

| Regulatorisches Thema | Vorhandenes Feld (SafetyDataSheet) | Zusätzlich (Product) |
|---|---|---|
| Freie Borsäure / Borate (H360) | `containsBoron` | `containsBor` |
| Formaldehyd-Abspalter (Biozid) | `containsFormaldehydeReleaser`, `biocidalActives` | `containsFormaldehydeDepot` |
| Sekundäre Amine (Nitrosamin/TRGS 611) | `containsSecondaryAmines` | — |
| Chlorparaffine (REACH Anhang XVII) | `containsChlorinatedParaffins` | `containsChlorine` |
| Primäre aromatische Amine | `containsPrimaryAromaticAmines` | — |
| SVHC / REACH | `svhcSubstances`, `reachCompliant`, `reachNotes` | — |
| Einstufung/Gefahr (CMR) | `hStatements` (z. B. H360/H350/H340), `signalWord`, `ghsPictograms` | — |
| Wassergefährdung | `wgkClass` | — |
| Biozid-Wirkstoffe | `hasBactericide`, `hasFungicide`, `biocidalActives` | — |
| Mineralöl-Anteil | `containsMineralOil` | `containsMineralOil`, `mineralOilContentPct` |

Verknüpfung zum Angebot: `Listing.sdsId → SafetyDataSheet`; zum Katalog: `Product.safetyDataSheetId → SafetyDataSheet`.
Chemie-Typ (für Ester-Erkennung) steckt in `Listing.chemistry` / `Product.chemistry` (`ChemistryBase`).

---

## 2. Ampel-Logik (Regelwerk)

Reine Funktion, kein neuer Datenbestand nötig. Wichtig: **die harte Einstufung (H-Satz/SVHC) schlägt die
Heuristik-Flags** — so bleibt die Ampel ehrlich.

**🔴 ROT (nachweislich kritisch)** — wenn mindestens eines zutrifft:
- `hStatements` enthält einen CMR-Satz: **H360**, H360F/FD/D, **H350**, H350i, **H340** (reprotox/karzinogen/mutagen)
- `svhcSubstances` nicht leer
- `containsChlorinatedParaffins == true` (Anhang XVII)
- `signalWord == "Gefahr"/"Danger"` **und** ein Gesundheits-Piktogramm (GHS08) vorhanden

**🟡 GELB (prüfen / einschränkend)** — wenn (kein Rot, aber):
- `containsBoron == true` **ohne** belegtes H360 (→ „enthält Bor — prüfen, ob > 0,3 %/H360")
- `containsFormaldehydeReleaser == true` oder Formaldehyd-Donator in `biocidalActives`
- `containsSecondaryAmines == true` (Nitrosamin-Risiko, TRGS 611)
- `containsPrimaryAromaticAmines == true`
- `reachCompliant == false`
- `wgkClass == "3"` (stark wassergefährdend)

**🟢 GRÜN (unauffällig)** — alle kritischen Flags ausdrücklich `false`, keine CMR-H-Sätze, `reachCompliant != false`.

**⚪ UNBEKANNT (ehrlich!)** — kein SDB verknüpft oder relevante Flags `null`. Anzeige: „Keine Angabe — Sicherheits­daten­blatt
fehlt/unvollständig." Niemals fälschlich grün.

Pseudocode (`lib/compliance.ts`):
```ts
type Level = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
export function computeCompliance(sds?: Sds, product?: Product): { level: Level; flags: Flag[] } {
  if (!sds && !product) return { level: "UNKNOWN", flags: [] };
  const flags: Flag[] = [];
  const H = sds?.hStatements ?? [];
  const cmr = ["H360","H360F","H360D","H360FD","H350","H350i","H340"];

  if (H.some(h => cmr.includes(h)))      flags.push({ sev:"RED", code:"CMR", text:"CMR-Einstufung (H-Satz)" });
  if ((sds?.svhcSubstances?.length ?? 0) > 0) flags.push({ sev:"RED", code:"SVHC", text:"SVHC enthalten" });
  if (sds?.containsChlorinatedParaffins || product?.containsChlorine)
                                          flags.push({ sev:"RED", code:"CP", text:"Chlorparaffine (Anhang XVII)" });

  if (sds?.containsBoron || product?.containsBor)
                                          flags.push({ sev:"YELLOW", code:"BORON", text:"Enthält Bor — > 0,3 %/H360 prüfen" });
  if (sds?.containsFormaldehydeReleaser || product?.containsFormaldehydeDepot)
                                          flags.push({ sev:"YELLOW", code:"FORM", text:"Formaldehyd-Abspalter" });
  if (sds?.containsSecondaryAmines)       flags.push({ sev:"YELLOW", code:"AMINE", text:"Sekundäre Amine (TRGS 611)" });
  if (sds?.reachCompliant === false)      flags.push({ sev:"YELLOW", code:"REACH", text:"REACH nicht bestätigt" });

  if (flags.some(f => f.sev === "RED"))    return { level:"RED", flags };
  if (flags.some(f => f.sev === "YELLOW")) return { level:"YELLOW", flags };
  // grün nur wenn Flags aktiv als false bekannt sind, sonst unknown
  const known = sds && sds.containsBoron !== null && sds.containsFormaldehydeReleaser !== null;
  return { level: known ? "GREEN" : "UNKNOWN", flags };
}
```

---

## 3. Wo im UI

- **Angebots-/Produkt-Detailseite:** Ampel-Badge oben; darunter ausklappbar die Klartext-Hinweise + Quelle
  (`SafetyDataSheet.version` / `revisionDate`) + Disclaimer „Hinweis, keine Rechtsberatung; SDB des Herstellers maßgeblich."
- **Trefferliste/Karten:** kleines Ampel-Icon (nutzt die Karten-Konvention „kompakt, 4 pro Reihe").
- **Filter in der Suche:** „nur unauffällig (grün)", „borfrei", „formaldehydfrei", „REACH-konform".
- **Verkäufer-Ansicht:** beim Einstellen automatisch aus verknüpftem SDB berechnet und angezeigt (Anreiz, ein SDB zu hinterlegen).

---

## 4. Verknüpfung zum Alternativ-Finder (Feature #3)

Bei 🔴/🟡 direkt „**Konforme Alternativen**" einblenden: gleiche `ProductCategory` + überlappende `applicationAreas`
(+ passende `chemistry`), gefiltert auf Ampel = 🟢, gerankt. Nutzt die vorhandene Logik in `lib/alternatives.ts` /
`lib/alternative-search.ts` — nur ein Compliance-Filter davor. Optional Dichtungs-Check (Feature #4) über die
Verträglichkeitsmatrix, falls die Alternative esterbasiert ist.

---

## 5. Schema-Änderungen — minimal

**v1 (empfohlen): keine neuen Persistenzfelder.** Ampel zur Laufzeit aus vorhandenen Feldern berechnen. Sofort lauffähig.

**v2 (optional, nur wenn DB-Filter/Performance nötig):** denormalisierte Felder an `Product` und `Listing`:
```prisma
enum ComplianceLevel { GREEN YELLOW RED UNKNOWN }
// in Product & Listing:
complianceLevel ComplianceLevel @default(UNKNOWN)
complianceFlags String[]        @default([])   // z.B. ["BORON","FORM"]
```
Anwenden via `db push`; **idempotenter Backfill in `prisma/deploy-tasks.ts`** (läuft bei jedem Deploy, wirft nie),
der `computeCompliance()` über alle Produkte/Angebote laufen lässt. Damit sind Filter serverseitig möglich.

---

## 6. Umsetzungsschritte

1. `lib/compliance.ts` — reine Funktion + Regeltabelle (oben), inkl. Unit-Testfällen.
2. UI: `ComplianceBadge` (Icon) + `ComplianceDetails` (Aufklappliste, deutsch).
3. Einbau Detailseite + Karten.
4. (v2) Schema-Felder + Backfill in `deploy-tasks.ts`.
5. Filter in der Suche.
6. „Konforme Alternativen" via `lib/alternatives.ts` mit Compliance-Filter.

## 7. Aufwand (grob)
- **v1** (Laufzeit-Ampel + Badge + Detailseite): ~1–2 Tage.
- **v2** (Denormalisierung + Filter + Backfill): +~1 Tag.
- **Alternativvorschlag**: +~1 Tag.

## 8. Testfälle (für die reine Funktion)
| Eingabe | Erwartete Ampel |
|---|---|
| SDB mit `hStatements` = ["H360FD"] | 🔴 ROT |
| `containsChlorinatedParaffins = true` | 🔴 ROT |
| `containsFormaldehydeReleaser = true`, sonst frei | 🟡 GELB |
| `containsBoron = true`, kein H360 | 🟡 GELB („> 0,3 % prüfen") |
| alle Flags `false`, keine CMR-H-Sätze | 🟢 GRÜN |
| kein SDB verknüpft / Flags `null` | ⚪ UNBEKANNT |

## 9. Ehrlichkeits-Regeln (wichtig)
- Nie „grün" ohne Datengrundlage — fehlende Daten = **⚪ unbekannt**.
- Immer Quelle + Datum des SDB nennen; Disclaimer „keine Rechtsberatung".
- Heuristik-Flags (`lib/sds-ingredients.ts`) sind Parser-Schätzungen → GELB heißt „prüfen", nicht „verboten".
