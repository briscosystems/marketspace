import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rfqSchema = z.object({
  productType: z.string().min(2),
  manufacturer: z.string().optional(),
  isoViscosity: z.string().optional(),
  chemistry: z.enum(["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"]).optional(),
  applicationArea: z.string().optional(),
  quantity: z.number().positive(),
  quantityUnit: z.string().default("L"),
  locationRegion: z.string().min(2),
  deadline: z.string().datetime(),
  budgetMinEur: z.number().positive().optional(),
  budgetMaxEur: z.number().positive().optional(),
  notes: z.string().optional(),
  visibility: z.enum(["PUBLIC", "VERIFIED_ONLY"]).default("PUBLIC"),
  workpieceMaterial: z.string().optional(),
  requiredCertifications: z.array(z.string()).default([]),
  avoidIssues: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = rfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const rfq = await prisma.rfq.create({
    data: {
      ...data,
      deadline: new Date(data.deadline),
      buyerId: session.user.id,
    },
  });
  return NextResponse.json(rfq, { status: 201 });
}
