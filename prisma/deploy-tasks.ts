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
