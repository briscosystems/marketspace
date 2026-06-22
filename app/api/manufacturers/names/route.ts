import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liefert alle Hersteller-Namen (alphabetisch) für die Echtzeit-Vorschläge
 * im Autocomplete-Feld. Klein genug (wenige Dutzend), um komplett ausgeliefert
 * und clientseitig gefiltert zu werden.
 */
export async function GET() {
  const manufacturers = await prisma.manufacturer.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(manufacturers.map((m) => m.name));
}
