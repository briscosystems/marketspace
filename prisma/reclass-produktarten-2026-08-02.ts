/**
 * Nach-Einordnung 2026-08-02: Produkte, die vor der Kategorie-Erweiterung
 * mangels passender Schublade unter SPECIALTY/OTHER lagen, in ihre echte
 * Produktart umhängen (Turbinenöl, Wärmeträgeröl, Isolieröl, Kältemaschinenöl,
 * Härteöl, Spindelöl, Vakuumpumpenöl …).
 *
 * VORSICHTIG: Umgehängt wird nur, wenn die Stichwort-Erkennung GENAU EINE der
 * NEUEN Produktarten liefert — also z. B. „Mobiltherm 605 … Wärmeträgeröl".
 * Mehrdeutige Treffer bleiben unangetastet. Bestehende, bereits korrekt
 * eingeordnete Produkte (Hydrauliköl, KSS …) werden nicht angefasst; einzige
 * Ausnahme sind Produkte, deren NAME die neue Art ausdrücklich nennt
 * (z. B. „Hyspin Spindle Oil 22", das als Hydrauliköl geführt war).
 *
 * IDEMPOTENT: Nach dem Umhängen stimmt die Kategorie bereits — der zweite Lauf
 * ändert nichts mehr.
 */
import { prisma } from "../lib/prisma";
import { detectCategoriesFromText, type DetectedCategory } from "../lib/product-category-detect";
import type { ProductCategory } from "@prisma/client";

/** Nur diese Arten sind neu — in alte Arten wird nie umgehängt. */
const NEUE_ARTEN: DetectedCategory[] = [
  "SPINDLE_OIL",
  "TURBINE_OIL",
  "CHAIN_OIL",
  "REFRIGERATION_OIL",
  "VACUUM_PUMP_OIL",
  "WIRE_DRAWING",
  "RELEASE_AGENT",
  "HEAT_TRANSFER_OIL",
  "QUENCHING_OIL",
  "TRANSFORMER_OIL",
];

function eindeutigNeu(text: string): ProductCategory | null {
  const cats = detectCategoriesFromText(text);
  if (cats.length !== 1) return null;
  const c = cats[0];
  return NEUE_ARTEN.includes(c) ? (c as ProductCategory) : null;
}

export async function applyReklassifizierung2026_08_02(): Promise<string> {
  let umgehaengt = 0;

  // 1) Sammelkategorien: Name + Familie + Beschreibung dürfen entscheiden.
  const unsortiert = await prisma.product.findMany({
    where: { category: { in: ["SPECIALTY", "OTHER"] } },
    select: { id: true, name: true, productFamily: true, description: true },
  });
  for (const p of unsortiert) {
    const ziel = eindeutigNeu([p.name, p.productFamily, p.description].filter(Boolean).join(" "));
    if (!ziel) continue;
    await prisma.product.update({ where: { id: p.id }, data: { category: ziel } });
    umgehaengt++;
  }

  // 2) Bereits eingeordnete Produkte: nur wenn der NAME selbst die Art nennt
  //    (die Beschreibung reicht hier bewusst nicht — zu viele Querverweise).
  const eingeordnet = await prisma.product.findMany({
    where: { category: { notIn: ["SPECIALTY", "OTHER", ...NEUE_ARTEN] as ProductCategory[] } },
    select: { id: true, name: true, productFamily: true },
  });
  for (const p of eingeordnet) {
    const ziel = eindeutigNeu([p.name, p.productFamily].filter(Boolean).join(" "));
    if (!ziel) continue;
    await prisma.product.update({ where: { id: p.id }, data: { category: ziel } });
    umgehaengt++;
  }

  return umgehaengt === 0
    ? "nichts zu tun (bereits eingeordnet)"
    : `${umgehaengt} Produkt(e) in die passende Produktart umgehängt`;
}

// Standalone: npx tsx prisma/reclass-produktarten-2026-08-02.ts
if (process.argv[1]?.includes("reclass-produktarten-2026-08-02")) {
  applyReklassifizierung2026_08_02()
    .then((r) => {
      console.log("Ergebnis:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
