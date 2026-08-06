/**
 * Deploy-Aufgaben — laufen AUTOMATISCH bei jedem Start der Anwendung.
 *
 * Warum es das gibt (2026-07-15):
 * Ein `git push` bringt nur den CODE nach Railway, nicht die Daten. Änderungen an
 * der Datenbank mussten deshalb von Hand in der Railway-Konsole nachgezogen werden
 * — fehleranfällig und nicht zumutbar. Seitdem gilt:
 *
 *   Datenbank-Änderung nötig?  →  hier als Aufgabe eintragen  →  pushen  →  fertig.
 *
 * Eingehängt in package.json:
 *   "start": "prisma db push --skip-generate && npm run deploy:tasks && next start"
 *            └─ Schema angleichen ─┘           └─ Daten angleichen ─┘
 *
 * REGELN für neue Aufgaben:
 *  1. IDEMPOTENT. Die Aufgabe läuft bei JEDEM Start erneut. Sie muss also prüfen,
 *     ob sie schon erledigt ist, und dann nichts tun.
 *  2. NIE WERFEN. Eine fehlgeschlagene Aufgabe darf die Anwendung nicht am Starten
 *     hindern — sonst ist die Seite offline. Fehler werden protokolliert, der Start
 *     läuft weiter.
 *  3. BELEG DAZU. Jede Aufgabe bekommt einen Kommentar, warum sie existiert.
 *
 * Erledigte Aufgaben dürfen hier stehen bleiben: Sie kosten beim Start nur eine
 * schnelle Prüfabfrage und dokumentieren die Historie.
 */
import { prisma } from "@/lib/prisma";
import { PRODUCT_DELETIONS, ISSUE_DELETIONS, PRODUCT_PATCHES } from "./fix-datenqualitaet-2026-07-15";
import { applyCorrections2026_07_18 } from "./fix-datenqualitaet-2026-07-18";
import { applyProduktErweiterung2026_08_02 } from "./add-produkte-2026-08-02";
import { applyReklassifizierung2026_08_02 } from "./reclass-produktarten-2026-08-02";
import { applyProduktErweiterung2026_08_02b } from "./add-produkte-2026-08-02b";
import { importCastrolSds2026_08_03 } from "./import-sds-castrol-2026-08-03";
import { applyRegionen2026_08_03 } from "./fix-regionen-2026-08-03";
import { applyKssSollwerte2026_08_05 } from "./add-kss-sollwerte-2026-08-05";
import { fixMetacorin833_2026_08_05 } from "./fix-metacorin-833-2026-08-05";
import { fixPhantomprodukte2026_08_05 } from "./fix-phantomprodukte-2026-08-05";
import { fixGepruefteProdukte2026_08_05 } from "./fix-gepruefte-produkte-2026-08-05";
import { applyDatenblaetter2026_08_05 } from "./add-datenblaetter-2026-08-05";

type Task = {
  name: string;
  run: () => Promise<string>;
};

const TASKS: Task[] = [
  {
    // Ergebnis des Datenqualitäts-Durchgangs vom 2026-07-15 (12 Prüfläufe gegen
    // Original-Herstellerkataloge). Lokal bereits angewendet; diese Aufgabe zieht
    // die Live-Datenbank nach. Belege je Eintrag im importierten Skript.
    name: "Datenqualität 2026-07-15 (Fantasieprodukte, falsche Viskositäten, falsche Quellen)",
    run: async () => {
      let issues = 0;
      for (const e of ISSUE_DELETIONS) {
        const r = await prisma.productIssue.deleteMany({ where: { id: e.id } });
        issues += r.count;
      }
      const prod = await prisma.product.deleteMany({
        where: { id: { in: PRODUCT_DELETIONS.map((p) => p.id) } },
      });
      let patched = 0;
      for (const p of PRODUCT_PATCHES) {
        const r = await prisma.product.updateMany({
          where: { id: p.id, NOT: { viscosityIso: p.data.viscosityIso as string } },
          data: p.data,
        });
        patched += r.count;
      }
      return issues + prod.count + patched === 0
        ? "nichts zu tun (bereits angewendet)"
        : `${issues} Praxis-Probleme + ${prod.count} Produkte gelöscht, ${patched} Viskositäten korrigiert`;
    },
  },
  {
    // Folge-Durchgang 2026-07-18: die inhaltlichen Korrekturen aus demselben
    // belegten Prüfbericht (vertauschte Zink-Beschreibungen Castrol HLP-Z/ZZ,
    // Vactra↔Velocite, Caloris als Fett, Eni OTE als Turbinenöl, Klüber-Öle/
    // -Chemie, falsche Marken Macron→Quaker Houghton & Tribol→Castrol, Renep
    // Compound als historisch markiert). Idempotent (setzt absolute Zielwerte).
    name: "Datenqualität 2026-07-18 (Kategorien, Chemie, Beschreibungen, Marken)",
    run: async () => applyCorrections2026_07_18(),
  },
  {
    // Dosimetrix-Demo-Anzeige: die Eyebrow-Zeile bildete die Wortmarke
    // „DOSIMETRIX® hybrid" im generischen grauen Großbuchstaben-Stil nach und
    // entsprach damit nicht dem offiziellen Logo (das korrekt im Produktbild
    // steckt). Nur korrigieren, wenn noch der alte Wert dort steht — so werden
    // spätere manuelle Bearbeitungen unter /werbung nicht überschrieben.
    name: "Dosimetrix-Anzeige: falsch gestylten Wortmarken-Eyebrow entfernen",
    run: async () => {
      const r = await prisma.adBanner.updateMany({
        where: { id: "demo-dosimetrix-ad", eyebrow: "DOSIMETRIX® hybrid" },
        data: { eyebrow: "Automatisiertes KSS-Management" },
      });
      return r.count ? "Eyebrow korrigiert" : "nichts zu tun (bereits korrekt/bearbeitet)";
    },
  },
  {
    // Tester-Fund 2026-08-02: Das Demo-Angebot „Renolin MR 520" war als
    // „Kühlschmierstoff (Emulsion, wassermischbar)" etikettiert — RENOLIN MR
    // ist aber ein detergierendes Mehrbereichs-/Hydrauliköl (HLPD). Wer das
    // in den Gleitbahn-/Hydraulikkontext gießt, braucht korrekte Angaben.
    name: "Angebots-Korrektur: Renolin MR 520 ist Hydrauliköl, keine Emulsion",
    run: async () => {
      const r = await prisma.listing.updateMany({
        where: {
          productName: { contains: "Renolin MR 520", mode: "insensitive" },
          productType: { contains: "Emulsion", mode: "insensitive" },
        },
        data: { productType: "Hydrauliköl (HLPD, detergierend)" },
      });
      return r.count ? `${r.count} Angebot(e) korrigiert` : "nichts zu tun (bereits korrekt)";
    },
  },
  {
    // 43 verifizierte Produkte für unterversorgte Gruppen: Gleitbahnöle,
    // Umform-/Drahtziehprodukte, Additive/Systempflege (Recherche 2026-08-02).
    // Upsert über (manufacturerId, slug) — idempotent, überschreibt nichts.
    name: "Produkt-Erweiterung 2026-08-02 (Gleitbahn, Umform/Drahtzieh, Additive)",
    run: () => applyProduktErweiterung2026_08_02(),
  },
  {
    // Die Produktarten wurden am 2026-08-02 um 10 eigenständige Arten erweitert
    // (Turbinen-, Wärmeträger-, Härte-, Isolier-, Ketten-, Kälte-, Vakuum-,
    // Spindelöl, Drahtzieh-Schmierstoff, Trennmittel). Produkte, die vorher
    // mangels Schublade unter „Spezial"/„Sonstiges" lagen, hängen wir nach.
    name: "Nach-Einordnung 2026-08-02 (neue Produktarten)",
    run: () => applyReklassifizierung2026_08_02(),
  },
  {
    // 136 recherchierte Produkte für die bisher unterversorgten und die neu
    // aufgenommenen Produktarten: Erodier-Dielektrika, Industriereiniger,
    // Schleiföle, Korrosionsschutz, Kompressoren-, Ketten-, Spindel-, Kälte-,
    // Wärmeträger- und Härteöle, Drahtzieh-Schmierstoffe, Trennmittel.
    // Legt fehlende Hersteller an (Condat, Bitzer, Sika, Cortec, Eastman …).
    name: "Produkt-Erweiterung 2026-08-02b (Lückenkategorien + neue Produktarten)",
    run: () => applyProduktErweiterung2026_08_02b(),
  },
  {
    // 99 Castrol-Sicherheitsdatenblätter, die der Betreiber am 2026-08-03 aus
    // dem Castrol-Dokumentenportal heruntergeladen hat. Die PDFs liegen im
    // Repo unter data/sds/castrol/ und werden hier eingelesen; erkannt wird
    // über den sha256, ein zweiter Lauf legt also nichts doppelt an.
    name: "Castrol-Datenblätter 2026-08-03 (manueller Download)",
    run: () => importCastrolSds2026_08_03(),
  },
  {
    // Die Lagerregionen waren faktisch auf Deutschland zugeschnitten (nur neun
    // deutsche Bundesländer einzeln, Schweiz/Österreich nur als ganzes Land,
    // Platzhalter „DE-BW"). Die neue Liste deckt Kantone, Bundesländer und
    // Europa ab; diese Aufgabe bringt bestehende Einträge auf die neue
    // Schreibweise.
    name: "Lagerregionen vereinheitlichen 2026-08-03 (DACH statt nur Deutschland)",
    run: () => applyRegionen2026_08_03(),
  },
  {
    // Daten-Sprint 2026-08-05 Richtung CoolantGuide: Pflege-Sollwerte
    // (Refraktometer-Faktor, Konzentrations-/pH-Fenster, Wasserhärte) für die
    // wassermischbaren KSS aus Hersteller-TDS recherchiert. Füllt nur NULL-
    // Felder, überschreibt nie vorhandene Werte. Belege je Produkt in
    // data/kss-sollwerte-2026-08-05.json ("quelle").
    name: "KSS-Pflege-Sollwerte 2026-08-05 (Refraktometer, Konzentration, pH, Wasserhärte)",
    run: () => applyKssSollwerte2026_08_05(),
  },
  {
    // Falschzuordnung aus dem automatischen SDS-Aufbau, aufgefallen beim
    // Sollwerte-Sprint: AVILUB METACORIN 833 stand als wassermischbarer KSS
    // in der Datenbank, ist laut Original-Datenblatt aber ein gebrauchsfertiges
    // Korrosionsschutzmittel. Belege im Dateikopf des importierten Skripts.
    name: "Korrektur Avilub Metacorin 833 (Korrosionsschutz statt KSS)",
    run: () => fixMetacorin833_2026_08_05(),
  },
  {
    // Sechs erfundene Produkte aus der früheren automatischen Anreicherung
    // (3× „Hebro Cut HC …", 3× „Aquamet ECO/MD/Premium") raus, dafür 23 belegte
    // Produkte derselben Hersteller rein. Belege im Dateikopf des Skripts.
    name: "Phantom-Produkte 2026-08-05 (erfundene Bezeichnungen ersetzt)",
    run: () => fixPhantomprodukte2026_08_05(),
  },
  {
    // Ergebnis der Namenspruefung vom 2026-08-05 (147 Eintraege gegen die
    // Herstellerkataloge geprueft): nicht belegbare Bezeichnungen entfernen,
    // falsch geschriebene auf den echten Namen bringen. Belege je Einzelfall
    // in data/pruefung-a…f.json, Sicherheitsnetz im importierten Skript.
    name: "Produktnamen-Pruefung 2026-08-05 (nicht belegbare raus, falsche umbenannt)",
    run: () => fixGepruefteProdukte2026_08_05(),
  },
  {
    // Datenblatt-Nachtrag 2026-08-05: technische Datenblaetter und
    // Sicherheitsdatenblaetter fuer Produkte ausserhalb der Kuehlschmierstoffe
    // (Hydraulik, Getriebe, Umform, Ketten, Kaelte, Fette, Reiniger, Additive).
    // Jeder Link wurde vor der Aufnahme aufgerufen; fuellt nur leere Felder.
    name: "Datenblaetter 2026-08-05 (TDS/SDS ausserhalb der KSS)",
    run: () => applyDatenblaetter2026_08_05(),
  },
];

async function main() {
  console.log(`[Deploy-Aufgaben] ${TASKS.length} Aufgabe(n) werden geprüft …`);
  for (const task of TASKS) {
    try {
      const ergebnis = await task.run();
      console.log(`[Deploy-Aufgaben] ✓ ${task.name}: ${ergebnis}`);
    } catch (e) {
      // Regel 2: niemals den Start blockieren.
      console.error(`[Deploy-Aufgaben] ✗ ${task.name} fehlgeschlagen (Start läuft weiter):`, e);
    }
  }
  const produkte = await prisma.product.count().catch(() => -1);
  console.log(`[Deploy-Aufgaben] fertig — Produkte in der Datenbank: ${produkte}`);
}

main()
  .catch((e) => {
    // Auch ein Totalausfall (z.B. DB nicht erreichbar) darf den Start nicht killen.
    console.error("[Deploy-Aufgaben] unerwarteter Fehler (Start läuft weiter):", e);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
