import { NextRequest, NextResponse } from "next/server";
import { findAlternatives, type MustHave } from "@/lib/alternatives";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Partial<MustHave>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const mustHave: MustHave = {
    sameProductType: body.sameProductType ?? true,
    sameChemistry: body.sameChemistry ?? true,
    sameViscosity: body.sameViscosity ?? false,
    sameApplicationArea: body.sameApplicationArea ?? false,
    samePackaging: body.samePackaging ?? false,
    requiredCertifications: Array.isArray(body.requiredCertifications)
      ? body.requiredCertifications.filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        )
      : [],
    avoidIssues: Array.isArray(body.avoidIssues)
      ? (body.avoidIssues.filter((x) => typeof x === "string") as MustHave["avoidIssues"])
      : [],
    workpieceMaterial:
      typeof body.workpieceMaterial === "string" && body.workpieceMaterial.trim()
        ? body.workpieceMaterial.trim()
        : undefined,
    minAutomationScore:
      typeof body.minAutomationScore === "number" && body.minAutomationScore > 0
        ? Math.min(5, Math.max(1, Math.round(body.minAutomationScore)))
        : undefined,
    requireGlycolFree: body.requireGlycolFree === true,
  };

  try {
    const result = await findAlternatives(id, mustHave);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
