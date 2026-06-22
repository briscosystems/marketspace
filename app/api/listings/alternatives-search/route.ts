import { NextResponse } from "next/server";
import { z } from "zod";
import { searchAlternatives, searchAlternativesWeb } from "@/lib/alternative-search";

const schema = z.object({
  mode: z.enum(["product", "requirements"]).default("product"),
  query: z.string().optional(),
  category: z.string().optional(),
  chemistry: z.string().optional(),
  isoViscosity: z.string().optional(),
  applicationArea: z.string().optional(),
  requiredCertifications: z.array(z.string()).optional(),
  avoidIssues: z.array(z.string()).optional(),
  useWeb: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }
  const { useWeb, ...input } = parsed.data;

  // Nichts eingegeben → leeres Ergebnis statt sinnloser Volltabelle.
  const hasInput =
    !!input.query?.trim() ||
    !!input.category ||
    !!input.chemistry ||
    !!input.isoViscosity ||
    !!input.applicationArea?.trim() ||
    (input.requiredCertifications?.length ?? 0) > 0 ||
    (input.avoidIssues?.length ?? 0) > 0;
  if (!hasInput) {
    return NextResponse.json({
      source: null,
      alternatives: [],
      candidatesConsidered: 0,
      modelUsed: "rule-based",
    });
  }

  try {
    const result = useWeb
      ? await searchAlternativesWeb(input)
      : await searchAlternatives(input);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Alternativsuche fehlgeschlagen:", e);
    return NextResponse.json({ error: "Suche fehlgeschlagen" }, { status: 500 });
  }
}
