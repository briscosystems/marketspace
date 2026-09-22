/**
 * REST-API v1 — Geräte-Endpunkt: Herstellerliste für die Auswahlbox.
 *
 * Betreiber-Wunsch 2026-09-22: „Ev. wäre eine Auswahlbox wenn man den
 * Hersteller eingibt noch besser." Das Gerät holt sich hier einmalig die
 * Hersteller, zeigt sie am Display an, und fragt danach mit
 * /api/v1/geraet/produkte die Produkte des gewählten Herstellers ab.
 *
 *   GET /api/v1/geraet/hersteller
 *   Authorization: Bearer brisco_…
 *
 * Es kommen nur Hersteller zurück, die mindestens einen wassermischbaren
 * Kühlschmierstoff im Katalog haben — alles andere kann ein Mischer nicht
 * ansetzen. Die Liste ist klein genug, um sie im Gerät zwischenzuspeichern.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuthGeraet } from "@/lib/api-auth";
import { MISCHBARE_KATEGORIEN } from "@/lib/kss-geraet";

export async function GET(req: Request) {
  const auth = await apiAuthGeraet(req);
  if (!auth.ok) return auth.response;

  const alle = new URL(req.url).searchParams.get("alle") === "1";

  const gruppen = await prisma.product.groupBy({
    by: ["manufacturerId"],
    where: alle ? {} : { category: { in: [...MISCHBARE_KATEGORIEN] as never[] } },
    _count: { _all: true },
  });

  const ids = gruppen.map((g) => g.manufacturerId).filter((v): v is string => !!v);
  const hersteller = await prisma.manufacturer.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const anzahl = new Map(gruppen.map((g) => [g.manufacturerId, g._count._all]));

  return NextResponse.json({
    hersteller: hersteller.map((h) => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      anzahlProdukte: anzahl.get(h.id) ?? 0,
    })),
  });
}
