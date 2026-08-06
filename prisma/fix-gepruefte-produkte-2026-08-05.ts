/**
 * Bereinigung nach der Produktnamen-Prüfung vom 2026-08-05.
 *
 * Warum: Eine frühere automatische Anreicherung („Auto-generiert aus
 * Hersteller-Produktreihen-Template", 507 Produkte) hat Bezeichnungen erzeugt,
 * die es bei den Herstellern nicht gibt. Geprüft wurden die 150 riskantesten
 * Einträge (weder Sicherheitsdatenblatt noch Datenblatt-Link hinterlegt);
 * 147 Urteile liegen vor:
 *
 *   belegt                  69  → bleiben unverändert
 *   falsch geschrieben      25  → werden auf den echten Namen umbenannt
 *   nicht belegbar          53  → werden entfernt
 *
 * Muster der Falschtreffer: teils ganze Marken erfunden („Jokisol" bei Jokisch,
 * „Renogear" bei Fuchs, „Divinol Bohröl" statt der echten Marke Zubora,
 * „Isohyd"/„Ferrocoat" bei Petrofer), teils eine Viskositäts- oder
 * Nummernvariante ergänzt, die es in der Reihe nicht gibt.
 *
 * Erfundene Produktseiten sind für eine Plattform, die Vertrauen verkauft, das
 * schwerste Datenproblem: Wer sie findet, hält sie für belegt.
 *
 * Belege je Einzelfall (Urteil, Quelle, Bemerkung) liegen daneben in
 * data/pruefung-a.json … pruefung-f.json.
 *
 * SICHERHEITSNETZ: Gelöscht wird nur, woran KEINE Nutzerdaten hängen (keine
 * Preisbeobachtungen, keine Problemmeldungen, keine Erfahrungsberichte, kein
 * Sicherheitsdatenblatt). Alles andere bleibt stehen und wird gemeldet.
 *
 * IDEMPOTENT: Was schon weg oder schon umbenannt ist, wird übersprungen.
 */
import { prisma } from "../lib/prisma";
import { buildSearchTokens } from "../lib/normalize-search";
import PRUEF_A from "./data/pruefung-a.json";
import PRUEF_B from "./data/pruefung-b.json";
import PRUEF_C from "./data/pruefung-c.json";
import PRUEF_D from "./data/pruefung-d.json";
import PRUEF_E from "./data/pruefung-e.json";
import PRUEF_F from "./data/pruefung-f.json";

type Urteil = {
  id: string;
  hersteller: string;
  name: string;
  urteil: "belegt" | "falsch_geschrieben" | "nicht_belegt";
  korrektName: string | null;
  quelle: string | null;
  bemerkung: string | null;
};

const ALLE: Urteil[] = [
  ...(PRUEF_A as Urteil[]),
  ...(PRUEF_B as Urteil[]),
  ...(PRUEF_C as Urteil[]),
  ...(PRUEF_D as Urteil[]),
  ...(PRUEF_E as Urteil[]),
  ...(PRUEF_F as Urteil[]),
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fixGepruefteProdukte2026_08_05(): Promise<string> {
  let geloescht = 0;
  let geschuetzt = 0;
  let umbenannt = 0;

  for (const u of ALLE) {
    if (u.urteil === "belegt") continue;

    const p = await prisma.product.findUnique({
      where: { id: u.id },
      select: {
        id: true,
        name: true,
        manufacturerId: true,
        safetyDataSheetId: true,
        _count: {
          select: { priceObservations: true, issues: true, experienceReports: true },
        },
      },
    });
    if (!p) continue; // schon erledigt oder auf dieser Instanz nie vorhanden

    if (u.urteil === "nicht_belegt") {
      const { priceObservations, issues, experienceReports } = p._count;
      if (priceObservations + issues + experienceReports > 0 || p.safetyDataSheetId) {
        // Daran hängen echte Daten — nicht anfassen, nur melden.
        geschuetzt++;
        continue;
      }
      await prisma.product.delete({ where: { id: p.id } });
      geloescht++;
      continue;
    }

    // falsch_geschrieben → auf den belegten Namen umbenennen.
    // Die Recherche liefert den Namen oft mitsamt Hersteller ("Shell Rimula
    // R6 LME 5W-30"). Im Katalog steht der Hersteller separat davor, sonst
    // stünde er doppelt da — deshalb ein führendes Herstellerwort abschneiden.
    if (!u.korrektName) continue;
    const kurz = u.hersteller.split(" ")[0];
    const korrekt = u.korrektName
      .replace(new RegExp(`^(${u.hersteller}|${kurz})\\s+`, "i"), "")
      .trim();
    if (!korrekt || korrekt === p.name) continue;
    const neuerSlug = slugify(korrekt);
    // Kollision heißt: Das Produkt gibt es unter dem richtigen Namen bereits —
    // der falsch geschriebene Eintrag war also ein Duplikat. Dann wird er
    // entfernt statt umbenannt (mit demselben Sicherheitsnetz wie oben).
    const kollision = await prisma.product.findFirst({
      where: { manufacturerId: p.manufacturerId, slug: neuerSlug, NOT: { id: p.id } },
      select: { id: true },
    });
    if (kollision) {
      const { priceObservations, issues, experienceReports } = p._count;
      if (priceObservations + issues + experienceReports > 0 || p.safetyDataSheetId) {
        geschuetzt++;
        continue;
      }
      await prisma.product.delete({ where: { id: p.id } });
      geloescht++;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        name: korrekt,
        slug: neuerSlug,
        searchTokens: buildSearchTokens({ productName: korrekt, manufacturer: u.hersteller }),
        sourceUrl: u.quelle ?? undefined,
        notes: `Name korrigiert 2026-08-05 nach Herstellerunterlage (vorher „${p.name}“).${u.bemerkung ? " " + u.bemerkung : ""}`,
      },
    });
    umbenannt++;
  }

  if (!geloescht && !umbenannt) {
    return `nichts zu tun (bereits bereinigt)${geschuetzt ? `, ${geschuetzt} geschützt` : ""}`;
  }
  return `${geloescht} nicht belegbare entfernt, ${umbenannt} umbenannt${geschuetzt ? `, ${geschuetzt} geschützt (Daten vorhanden)` : ""}`;
}
