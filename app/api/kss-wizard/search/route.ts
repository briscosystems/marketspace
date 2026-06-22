// Schnelle Autocomplete-Suche für den Wizard-Step "Welchen KSS hast du aktuell?"
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ products: [] });

  const results = await prisma.product.findMany({
    where: {
      category: { in: ["COOLANT_WATER_MIX", "COOLANT_NEAT", "GRINDING_OIL"] },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { productFamily: { contains: q, mode: "insensitive" } },
        { manufacturer: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      manufacturer: { select: { name: true } },
    },
    orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
    take: 8,
  });

  return NextResponse.json({
    products: results.map((p) => ({
      id: p.id,
      name: p.name,
      manufacturer: p.manufacturer.name,
    })),
  });
}
