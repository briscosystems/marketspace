// POST /api/prices/submit — User meldet beobachteten Preis.
// Status → PENDING, wartet auf Verifizierung durch Admin/Trade-Assured-User.
//
// Body:
//   { productId, pricePerUnit, unit, observedAt, quantityMin?, packagingForm?,
//     regionCode?, sourceLabel?, sourceUrl?, notes? }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = {
  productId: string;
  pricePerUnit: number;
  unit: "EUR_PER_L" | "EUR_PER_KG" | "EUR_PER_PIECE" | "CHF_PER_L" | "CHF_PER_KG" | "USD_PER_L" | "USD_PER_KG";
  observedAt?: string; // ISO date; default heute
  quantityMin?: number;
  quantityMax?: number;
  packagingForm?: "DRUM" | "IBC" | "TANK" | "CANISTER" | "BULK" | "OTHER";
  regionCode?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  notes?: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Body>;

  // Validierung
  if (!body.productId || typeof body.pricePerUnit !== "number" || !body.unit) {
    return NextResponse.json(
      { error: "productId, pricePerUnit, unit erforderlich" },
      { status: 400 },
    );
  }
  if (body.pricePerUnit <= 0 || body.pricePerUnit > 100000) {
    return NextResponse.json({ error: "Preis unrealistisch" }, { status: 400 });
  }

  // Produkt-Existenz prüfen
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!product) {
    return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });
  }

  const observedAt = body.observedAt ? new Date(body.observedAt) : new Date();
  // Datum-Sanity: nicht in der Zukunft, nicht älter als 10 Jahre
  const now = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  if (observedAt > now || observedAt < tenYearsAgo) {
    return NextResponse.json({ error: "Beobachtungsdatum unplausibel" }, { status: 400 });
  }

  const obs = await prisma.priceObservation.create({
    data: {
      productId: body.productId,
      observedAt,
      pricePerUnit: body.pricePerUnit,
      unit: body.unit,
      quantityMin: body.quantityMin,
      quantityMax: body.quantityMax,
      packagingForm: body.packagingForm,
      regionCode: body.regionCode,
      source: "USER_SUBMITTED",
      status: "PENDING", // wartet auf Verifizierung
      submittedByUserId: session.user.id,
      sourceLabel: body.sourceLabel,
      sourceUrl: body.sourceUrl,
      notes: body.notes,
    },
  });

  return NextResponse.json({
    ok: true,
    observation: { id: obs.id, status: obs.status },
    message: "Preis-Meldung eingegangen — wartet auf Verifizierung",
  });
}
