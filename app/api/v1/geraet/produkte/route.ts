/**
 * REST-API v1 — Geräte-Endpunkt: Produkte eines Herstellers durchblättern.
 *
 * Zweiter Schritt der Auswahlbox am eMix1500: Hersteller ist gewählt, jetzt
 * die Liste seiner Kühlschmierstoffe. Anders als /api/v1/geraet/kss wird hier
 * nichts erraten — es ist eine schlichte Liste zum Anzeigen und Antippen.
 *
 *   GET /api/v1/geraet/produkte?hersteller=blaser-swisslube&q=blaso&seite=1
 *   Authorization: Bearer brisco_…
 *
 * Parameter:
 *   hersteller  Slug oder Name (freiwillig, aber ohne ihn wird die Liste lang)
 *   q           freiwilliger Textfilter auf den Produktnamen
 *   seite       1-basiert, 100 Einträge je Seite
 *   alle        "1" = auch nicht wassermischbare Produkte
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuthGeraet } from "@/lib/api-auth";
import { normalizeForSearch } from "@/lib/normalize-search";
import { GERAET_AUSWAHL, fuerGeraet, MISCHBARE_KATEGORIEN } from "@/lib/kss-geraet";

const PRO_SEITE = 100;

export async function GET(req: Request) {
  const auth = await apiAuthGeraet(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const hersteller = (url.searchParams.get("hersteller") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();
  const alle = url.searchParams.get("alle") === "1";
  const seite = Math.max(1, Number(url.searchParams.get("seite") ?? "1") || 1);

  const where = {
    ...(alle ? {} : { category: { in: [...MISCHBARE_KATEGORIEN] as never[] } }),
    ...(hersteller
      ? {
          manufacturer: {
            OR: [
              { slug: { equals: hersteller, mode: "insensitive" as const } },
              { name: { contains: hersteller, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(q.length >= 2 ? { searchTokens: { contains: normalizeForSearch(q) } } : {}),
  };

  const [gesamt, produkte] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: GERAET_AUSWAHL,
      orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
      skip: (seite - 1) * PRO_SEITE,
      take: PRO_SEITE,
    }),
  ]);

  return NextResponse.json({
    gesamt,
    seite,
    proSeite: PRO_SEITE,
    weitereSeiten: seite * PRO_SEITE < gesamt,
    produkte: produkte.map(fuerGeraet),
  });
}
