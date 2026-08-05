/**
 * REST-API v1 — Sicherheitsdatenblatt: ausgewertete Felder (GHS, H-/P-Sätze,
 * Kennwerte, Inhaltsstoffe). Das PDF selbst über die pdfUrl abrufen.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuth } from "@/lib/api-auth";
import { siteUrl } from "@/lib/site-url";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const sds = await prisma.safetyDataSheet.findUnique({
    where: { id },
    select: {
      id: true,
      manufacturer: true,
      productName: true,
      category: true,
      language: true,
      version: true,
      revisionDate: true,
      signalWord: true,
      ghsPictograms: true,
      hStatements: true,
      pStatements: true,
      physicalState: true,
      phValue: true,
      phContext: true,
      flashpointC: true,
      densityGcm3: true,
      viscosityKv40: true,
      casNumbers: true,
      adrClass: true,
      unNumber: true,
      containsBoron: true,
      containsFormaldehydeReleaser: true,
      containsSecondaryAmines: true,
      containsChlorinatedParaffins: true,
      containsMineralOil: true,
    },
  });
  if (!sds) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Datenblatt nicht gefunden." } },
      { status: 404 },
    );
  }
  return NextResponse.json({
    datenblatt: { ...sds, pdfUrl: `${siteUrl()}/api/sds/${sds.id}/download` },
  });
}
