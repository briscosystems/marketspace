/**
 * REST-API v1 — Produktkatalog.
 * GET /api/v1/produkte?q=…&kategorie=…&seite=1
 * Nur für Konten mit aktiver Marke-Stufe (siehe lib/api-auth.ts).
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/api-auth";
import { buildSearchWhere } from "@/lib/normalize-search";

const PRO_SEITE = 50;

export async function GET(req: Request) {
  const auth = await apiAuth(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const kategorie = url.searchParams.get("kategorie");
  const seite = Math.max(1, parseInt(url.searchParams.get("seite") ?? "1", 10) || 1);

  const where = {
    ...(buildSearchWhere("searchTokens", q) ?? {}),
    ...(kategorie ? { category: kategorie as never } : {}),
  };

  const [gesamt, produkte] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        chemistry: true,
        viscosityIso: true,
        viscosityKv40: true,
        densityGcm3: true,
        flashpointC: true,
        description: true,
        applicationAreas: true,
        certifications: true,
        sourceConfidence: true,
        manufacturer: { select: { id: true, name: true, slug: true } },
        safetyDataSheetId: true,
      },
      orderBy: { name: "asc" },
      skip: (seite - 1) * PRO_SEITE,
      take: PRO_SEITE,
    }),
  ]);

  return NextResponse.json({
    seite,
    proSeite: PRO_SEITE,
    gesamt,
    produkte,
  });
}
