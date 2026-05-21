#!/usr/bin/env -S npx tsx
/**
 * SDS Crawler-Skelett — automatisiert das Abgreifen von SDS-PDFs aus
 * JS-gateten Hersteller-Portalen mit Playwright.
 *
 * Status: Skelett — die portalspezifischen Adapter (Blaser, Fuchs, Klüber)
 * müssen pro Portal noch implementiert werden. Pattern ist einheitlich:
 *   1. Browser starten
 *   2. Such-Portal aufrufen
 *   3. Produktname/Artikelnummer eingeben
 *   4. PDF-Link extrahieren (oft via /download-Klick, dann Download-Event abfangen)
 *   5. PDF-Datei in /tmp/sds-crawl/{slug}.pdf legen
 *   6. Entry in `sds-sources.ts` Format ausgeben — manuell prüfen, dann committen
 *
 * Voraussetzungen:
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * Aufruf:
 *   npx tsx scripts/crawl-sds.ts --portal blaser --query "B-Cool 755"
 *   npx tsx scripts/crawl-sds.ts --portal klueber --query "Klüberoil 4 UH1"
 *
 * Output: Schreibt PDFs in /tmp/sds-crawl/ und SdsSource-TypeScript-Snippets
 * nach stdout (in sds-sources.ts kopieren, dann `npx tsx prisma/seed-sds.ts`).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Playwright wird zur Laufzeit dynamisch importiert — sonst Build-Fehler wenn
// das Package nicht installiert ist.
type Browser = any;
type Page = any;

const OUT_DIR = "/tmp/sds-crawl";

type CrawlResult = {
  manufacturer: string;
  productName: string;
  category: string;
  language: string;
  sourceUrl: string;
  localPath: string;
};

type PortalAdapter = {
  name: string;
  baseUrl: string;
  manufacturer: string;
  crawl(page: Page, query: string): Promise<CrawlResult[]>;
};

// ----------------------------------------------------------------------------
// Adapter-Beispiele — bitte vor Erstgebrauch testen + Selektoren anpassen.
// ----------------------------------------------------------------------------

const BLASER_ADAPTER: PortalAdapter = {
  name: "blaser",
  baseUrl: "https://blaser.com/safety-data-sheets/",
  manufacturer: "Blaser Swisslube",
  async crawl(page, query) {
    await page.goto(this.baseUrl, { waitUntil: "networkidle" });
    // Blaser SDS-Portal liefert einen iframe oder ein dynamisch gerendertes
    // Suchformular. Selektoren sind portalspezifisch — anpassen nach Inspect.
    const searchSelector = 'input[type="search"], input[name="product"], input[placeholder*="search" i]';
    await page.waitForSelector(searchSelector, { timeout: 15000 });
    await page.fill(searchSelector, query);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);

    // Treffer-Links extrahieren — meist PDFs mit Klassen wie "download-link"
    const links = await page.$$eval(
      'a[href$=".pdf"], a[download], button[data-pdf]',
      (els: any[]) =>
        els.map((e: any) => ({
          href: e.getAttribute("href") || e.getAttribute("data-pdf") || "",
          text: e.textContent?.trim() || "",
        })),
    );

    const results: CrawlResult[] = [];
    for (const link of links) {
      if (!link.href) continue;
      const url = new URL(link.href, this.baseUrl).toString();
      const lower = link.text.toLowerCase();
      if (!lower.includes(query.toLowerCase()) && !url.toLowerCase().includes(query.toLowerCase().replace(/\s/g, "")))
        continue;

      const buf = await downloadPdf(page, url);
      const sha8 = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
      const localPath = path.join(OUT_DIR, `${slug(this.manufacturer)}-${slug(query)}-${sha8}.pdf`);
      await fs.writeFile(localPath, buf);

      results.push({
        manufacturer: this.manufacturer,
        productName: query,
        category: "WATER_MISCIBLE_COOLANT", // user override empfohlen
        language: "DE",
        sourceUrl: url,
        localPath,
      });
    }
    return results;
  },
};

const KLUEBER_ADAPTER: PortalAdapter = {
  name: "klueber",
  baseUrl: "https://www.klueber.com/eu/de/services/safety-data-sheets/",
  manufacturer: "Klüber Lubrication",
  async crawl(page, query) {
    await page.goto(this.baseUrl, { waitUntil: "networkidle" });
    // Klüber verlangt Login — falls credentials gesetzt, einloggen:
    const username = process.env.KLUEBER_USERNAME;
    const password = process.env.KLUEBER_PASSWORD;
    if (username && password) {
      const loginBtn = await page.$('a[href*="login"], button:has-text("Anmelden")');
      if (loginBtn) {
        await loginBtn.click();
        await page.fill('input[name="username"], input[type="email"]', username);
        await page.fill('input[name="password"], input[type="password"]', password);
        await page.click('button[type="submit"], input[type="submit"]');
        await page.waitForLoadState("networkidle");
      }
    }
    // Such-Implementierung folgt dem gleichen Muster wie Blaser
    return [];
  },
};

const FUCHS_ADAPTER: PortalAdapter = {
  name: "fuchs",
  baseUrl: "https://www.fuchs.com/de/de/service-und-support/sicherheitsdatenblaetter-sds/",
  manufacturer: "Fuchs",
  async crawl(_page, _query) {
    // Fuchs nutzt SAP-System mit POST-API. Selektoren ändern sich oft.
    // TODO: Implementieren nach manueller Portal-Inspektion.
    return [];
  },
};

const ADAPTERS: Record<string, PortalAdapter> = {
  blaser: BLASER_ADAPTER,
  klueber: KLUEBER_ADAPTER,
  fuchs: FUCHS_ADAPTER,
};

// ----------------------------------------------------------------------------
// Hilfsfunktionen
// ----------------------------------------------------------------------------

async function downloadPdf(page: Page, url: string): Promise<Buffer> {
  const res = await page.request.get(url);
  if (!res.ok()) throw new Error(`HTTP ${res.status()} ${res.statusText()}`);
  const buf = Buffer.from(await res.body());
  if (buf.length < 1000) throw new Error(`Too small: ${buf.length} bytes`);
  if (buf.subarray(0, 5).toString("ascii") !== "%PDF-")
    throw new Error("Not a PDF");
  return buf;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function printSdsSourceSnippet(r: CrawlResult): void {
  console.log(`  {
    manufacturer: ${JSON.stringify(r.manufacturer)},
    productName: ${JSON.stringify(r.productName)},
    category: ${JSON.stringify(r.category)},
    language: ${JSON.stringify(r.language)},
    sourceUrl: ${JSON.stringify(r.sourceUrl)},
  },`);
}

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const portalArg = args[args.indexOf("--portal") + 1];
  const queryArg = args[args.indexOf("--query") + 1];

  if (!portalArg || !queryArg) {
    console.error("Usage: crawl-sds.ts --portal <name> --query <product>");
    console.error("Portals:", Object.keys(ADAPTERS).join(", "));
    process.exit(1);
  }

  const adapter = ADAPTERS[portalArg];
  if (!adapter) {
    console.error(`Unbekanntes Portal: ${portalArg}`);
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  let chromium: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ chromium } = require("playwright"));
  } catch {
    console.error(
      "Playwright nicht installiert. Bitte:\n" +
        "  npm install -D playwright\n" +
        "  npx playwright install chromium",
    );
    process.exit(1);
  }

  const browser: Browser = await chromium.launch({ headless: true });
  try {
    const page: Page = await browser.newPage();
    const results = await adapter.crawl(page, queryArg);

    if (results.length === 0) {
      console.error(`Keine Treffer für "${queryArg}" auf ${adapter.name}.`);
      console.error(
        "Tipp: Portal in echtem Browser öffnen, Selektoren via DevTools inspizieren,\n" +
          "      dann Adapter in scripts/crawl-sds.ts anpassen.",
      );
      process.exit(2);
    }

    console.log(`# Gefundene SDS für "${queryArg}" auf ${adapter.name}:`);
    console.log(`# Lokale Dateien: ${OUT_DIR}/`);
    console.log(`#`);
    console.log(`# Folgende Einträge in prisma/sds-sources.ts einfügen:`);
    for (const r of results) {
      printSdsSourceSnippet(r);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
