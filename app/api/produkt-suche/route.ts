/**
 * Produktsuche für Eingabefelder — liefert echte Katalogprodukte.
 *
 * Warum: Beim Einstellen eines Angebots schlug das Feld bisher nur
 * Produkt*familien* aus einer festen Liste vor („Tellus", „Renolin"). Wer ein
 * konkretes Produkt anbietet, will es aber auswählen können — mit Hersteller,
 * Produktart und Chemie, damit er die Angaben nicht abtippen muss.
 *
 * Öffentlich: Der Katalog ist öffentlich, die Suche gibt nichts preis, was auf
 * den Produktseiten nicht ohnehin steht.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeForSearch } from "@/lib/normalize-search";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ treffer: [] });

  const tokens = normalizeForSearch(q);

  const produkte = await prisma.product.findMany({
    where: {
      OR: [
        { searchTokens: { contains: tokens } },
        { name: { contains: q, mode: "insensitive" } },
        { manufacturer: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      category: true,
      chemistry: true,
      viscosityIso: true,
      manufacturer: { select: { name: true } },
    },
    orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
    take: 10,
  });

  return NextResponse.json({
    treffer: produkte.map((p) => ({
      id: p.id,
      name: p.name,
      hersteller: p.manufacturer.name,
      kategorie: p.category,
      chemie: p.chemistry,
      iso: p.viscosityIso,
    })),
  });
}
