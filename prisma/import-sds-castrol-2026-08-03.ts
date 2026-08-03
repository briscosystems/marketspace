/**
 * Import der von Hand heruntergeladenen Castrol-Sicherheitsdatenblätter
 * (Ordner „data/neue downloads", eingespielt am 2026-08-03).
 *
 * Ablauf je PDF:
 *   1. Text mit `pdftotext` auslesen (wie beim bestehenden Crawler).
 *   2. Produktname, SDS-Nummer, Produktcode, Sprache und Revisionsdatum aus
 *      Abschnitt 1 bzw. 16 des Datenblatts ziehen.
 *   3. Datei mit sprechendem Namen nach data/sds/castrol/ legen.
 *   4. Datensatz anlegen und — wenn möglich — mit dem Produkt im Katalog
 *      und dem Hersteller verknüpfen.
 *
 * IDEMPOTENT über den sha256 der Datei: ein bereits importiertes Datenblatt
 * wird übersprungen, nichts wird überschrieben.
 *
 * Aufruf: npx tsx prisma/import-sds-castrol-2026-08-03.ts
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { prisma } from "../lib/prisma";
import { buildSearchTokens, normalizeForSearch } from "../lib/normalize-search";
import type { SdsCategory, SdsLanguage } from "@prisma/client";

// Gelesen wird aus dem Ablage-Ordner des Betreibers UND aus dem Repo-Ordner:
// lokal liegen die frischen Downloads im ersten, auf dem Server (Railway) gibt
// es nur den zweiten. Doppelte Dateien fängt der sha256-Abgleich ab.
const QUELLEN = [
  path.join(process.cwd(), "data", "neue downloads"),
  path.join(process.cwd(), "data", "sds", "castrol"),
];
const ZIEL = path.join(process.cwd(), "data", "sds", "castrol");
const HERSTELLER = "Castrol";

/**
 * Produktart bestimmen. WICHTIG: nur aus Abschnitt 1.2 (Verwendungszweck) plus
 * Produktname — das Wort "grease" steht sonst auch in Abschnitten ueber
 * Entsorgung oder Unvertraeglichkeit und machte aus einem Getriebeoel ein Fett.
 */
function kategorie(text: string, name: string): SdsCategory {
  const abschnitt =
    text.match(/1\.2\s*Relevant identified uses[\s\S]{0,600}/i)?.[0] ??
    text.match(/1\.2\s*Relevante identifizierte Verwendungen[\s\S]{0,600}/i)?.[0] ??
    "";
  const t = (name + " " + abschnitt).toLowerCase();
  if (/water[- ]?mix|emulsifiable|soluble|semi-?synthetic (cutting|metalworking)/.test(t))
    return "WATER_MISCIBLE_COOLANT";
  if (/grinding/.test(t)) return "GRINDING_OIL";
  if (/neat cutting|straight (cutting )?oil|honing|broaching|metalworking fluid/.test(t))
    return "NEAT_CUTTING_OIL";
  if (/hydraulic/.test(t)) return "HYDRAULIC_OIL";
  if (/gear (oil|lubricant)|getriebe|worm gear/.test(t)) return "GEAR_OIL";
  if (/engine oil|motor oil|crankcase/.test(t)) return "MOTOR_OIL";
  if (/\bgrease\b|schmierfett|nlgi/.test(t)) return "GREASE";
  return "OTHER";
}

function sprache(text: string): SdsLanguage {
  const t = text.slice(0, 3000);
  if (/SICHERHEITSDATENBLATT|Sicherheitsdatenblatt/.test(t)) return "DE";
  if (/FICHE DE DONNÉES|FICHE DE DONNEES/i.test(t)) return "FR";
  if (/SCHEDA DI DATI/i.test(t)) return "IT";
  if (/SAFETY DATA SHEET/i.test(t)) return "EN";
  return "OTHER";
}

/** „Product name … Optigear 320" steht direkt hinter der Beschriftung. */
function produktname(text: string): string | null {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim());
  const marker = zeilen.findIndex((z) => /^(Product name|Produktname|Handelsname)\b/i.test(z));
  if (marker === -1) return null;
  // Nach der Beschriftung folgen ggf. weitere Beschriftungen (UFI, Product code),
  // erst danach die Werte in gleicher Reihenfolge. Erster brauchbarer Wert gewinnt.
  const verboten =
    /^(UFI|Product code|Produktcode|SDS( #|\sno\.?)|Product type|Produktart|:|1\.\d)/i;
  for (let i = marker + 1; i < Math.min(marker + 8, zeilen.length); i++) {
    const z = zeilen[i];
    if (!z || verboten.test(z)) continue;
    if (z.length > 90) continue;
    return z.replace(/\s+/g, " ").trim();
  }
  return null;
}

function feld(text: string, label: RegExp): string | null {
  const m = text.match(label);
  return m?.[1]?.trim() || null;
}

const MONATE: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6,
  august: 7, september: 8, october: 9, november: 10, december: 11,
  januar: 0, februar: 1, maerz: 2, mai: 4, juni: 5, juli: 6,
  oktober: 9, dezember: 11,
};

/** Castrol schreibt "Date of issue 11 September 2023". */
function revisionsdatum(text: string): Date | null {
  const wort = text.match(
    /(?:Date of issue|Ausgabedatum|Ueberarbeitet am)[^\n]*?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i,
  );
  if (wort) {
    const monat = MONATE[wort[2].toLowerCase()];
    if (monat !== undefined) {
      const d = new Date(Date.UTC(+wort[3], monat, +wort[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }
  const zahl = text.match(
    /(?:Date of issue|Ausgabedatum)[^\n]*?(\d{1,2})[./](\d{1,2})[./](\d{4})/i,
  );
  if (zahl) {
    const d = new Date(Date.UTC(+zahl[3], +zahl[2] - 1, +zahl[1]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function importCastrolSds2026_08_03(): Promise<string> {
  const dateien: string[] = [];
  for (const ordner of QUELLEN) {
    if (!fs.existsSync(ordner)) continue;
    for (const f of fs.readdirSync(ordner)) {
      if (f.toLowerCase().endsWith(".pdf")) dateien.push(path.join(ordner, f));
    }
  }
  if (dateien.length === 0) return "keine PDFs gefunden";
  fs.mkdirSync(ZIEL, { recursive: true });

  const hersteller = await prisma.manufacturer.findFirst({
    where: { name: HERSTELLER },
    select: { id: true },
  });

  let neu = 0, schonDa = 0, ohneName = 0, verknuepft = 0;
  const namen: string[] = [];

  for (const quellPfad of dateien) {
    const buffer = fs.readFileSync(quellPfad);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    const vorhanden = await prisma.safetyDataSheet.findUnique({
      where: { sha256 },
      select: { id: true },
    });
    if (vorhanden) { schonDa++; continue; }

    let text = "";
    try {
      text = execFileSync("pdftotext", ["-q", quellPfad, "-"], { maxBuffer: 32 * 1024 * 1024 }).toString();
    } catch {
      // Ohne Text kein verwertbarer Datensatz — lieber überspringen als leer anlegen.
      ohneName++;
      continue;
    }

    const name = produktname(text);
    if (!name) { ohneName++; continue; }

    const sdsNr = feld(text, /SDS\s*(?:#|no\.?)\s*\n?\s*([0-9]{4,10})/i);
    const produktcode = feld(text, /Product code\s*\n?\s*([A-Z0-9-]{4,20})/i);
    const blattVersion = feld(text, /^Version\s+([0-9]+(?:\.[0-9]+)?)/im);
    const seiten = (text.match(/\f/g)?.length ?? 0) + 1;

    const zielName = `${slugify(name)}-${sha256.slice(0, 8)}.pdf`;
    const zielPfad = path.join(ZIEL, zielName);
    if (!fs.existsSync(zielPfad)) fs.copyFileSync(quellPfad, zielPfad);

    const sds = await prisma.safetyDataSheet.create({
      data: {
        manufacturer: HERSTELLER,
        manufacturerId: hersteller?.id ?? null,
        productName: name,
        category: kategorie(text, name),
        language: sprache(text),
        version: [sdsNr, blattVersion ? `v${blattVersion}` : null].filter(Boolean).join(' ') || produktcode,
        revisionDate: revisionsdatum(text),
        // Herkunft: vom Nutzer aus dem Castrol-Dokumentenportal heruntergeladen.
        sourceUrl: "https://msdspds.castrol.com/ (manueller Download 2026-08-03)",
        filePath: path.relative(process.cwd(), zielPfad),
        fileSizeBytes: buffer.length,
        sha256,
        pageCount: seiten,
        extractedText: text,
        searchTokens: buildSearchTokens({
          productName: name,
          manufacturer: HERSTELLER,
          version: sdsNr,
        }),
      },
      select: { id: true },
    });
    neu++;
    namen.push(name);

    // Passendes Katalogprodukt finden und das Datenblatt dort hinterlegen.
    if (hersteller) {
      const token = normalizeForSearch(name);
      const produkt = await prisma.product.findFirst({
        where: { manufacturerId: hersteller.id, searchTokens: token },
        select: { id: true, sdsUrl: true },
      });
      if (produkt && !produkt.sdsUrl) {
        await prisma.product.update({
          where: { id: produkt.id },
          data: { sdsUrl: `/api/sds/${sds.id}/download` },
        });
        verknuepft++;
      }
    }
  }

  if (neu === 0) return `nichts zu tun (${schonDa} bereits importiert)`;
  return `${neu} Datenblätter importiert, ${verknuepft} direkt mit Produkten verknüpft, ${schonDa} schon vorhanden, ${ohneName} ohne lesbaren Produktnamen`;
}

if (process.argv[1]?.includes("import-sds-castrol-2026-08-03")) {
  importCastrolSds2026_08_03()
    .then((r) => { console.log("Ergebnis:", r); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
