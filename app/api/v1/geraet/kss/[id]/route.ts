/**
 * REST-API v1 — Geräte-Endpunkt: ein Kühlschmierstoff im Detail.
 *
 * Das Gerät merkt sich nach der einmaligen Auswahl nur noch die `id` und holt
 * sich hier bei Bedarf die aktuellen Werte — insbesondere den
 * Refraktometer-Faktor, falls er im Katalog nachgepflegt wurde.
 *
 *   GET /api/v1/geraet/kss/{id}
 *   Authorization: Bearer brisco_…
 *
 * Statt der id wird auch der Slug akzeptiert, damit eine fest im Gerät
 * hinterlegte Zuordnung nicht an einer neu vergebenen id scheitert.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuthGeraet } from "@/lib/api-auth";
import { GERAET_AUSWAHL, fuerGeraet } from "@/lib/kss-geraet";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await apiAuthGeraet(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const produkt = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: GERAET_AUSWAHL,
  });
  if (!produkt) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Kein Produkt mit dieser Kennung." } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    produkt: fuerGeraet(produkt),
    hinweis:
      produkt.refractometerFactor == null
        ? "Für dieses Produkt ist kein Refraktometer-Faktor hinterlegt. Bitte den Faktor aus dem Datenblatt des Herstellers verwenden — die Plattform rät keinen."
        : null,
  });
}
