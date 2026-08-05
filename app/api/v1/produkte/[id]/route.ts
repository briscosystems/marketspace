/** REST-API v1 — einzelnes Produkt mit Datenblatt-Verweis. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const produkt = await prisma.product.findUnique({
    where: { id },
    include: {
      manufacturer: { select: { id: true, name: true, slug: true, website: true } },
      safetyDataSheet: {
        select: { id: true, productName: true, revisionDate: true, language: true },
      },
    },
  });
  if (!produkt) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Produkt nicht gefunden." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ produkt });
}
