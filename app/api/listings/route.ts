import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const listingSchema = z.object({
  productType: z.string().min(2),
  manufacturer: z.string().min(1),
  productName: z.string().min(2),
  isoViscosity: z.string().optional(),
  chemistry: z.enum(["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"]),
  applicationArea: z.string().min(2),
  quantity: z.number().positive(),
  quantityUnit: z.string().default("L"),
  minOrderQty: z.number().positive().optional(),
  locationRegion: z.string().min(2),
  packaging: z.enum(["DRUM", "IBC", "TANK", "CANISTER", "BULK", "OTHER"]),
  certificates: z.array(z.string()).default([]),
  priceEur: z.number().positive().optional(),
  shippingTerms: z.string().optional(),
  description: z.string().optional(),
  productionDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  // Fertigung, Rezeptur, Automation (alle optional)
  machiningOperations: z.array(z.string()).default([]),
  mineralOilContent: z.number().min(0).max(100).optional(),
  containsGlycol: z.boolean().nullable().optional(),
  automationSuitability: z.number().int().min(0).max(5).optional(),
  measurementMethods: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const listing = await prisma.listing.create({
    data: {
      ...data,
      productionDate: data.productionDate ? new Date(data.productionDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      sellerId: session.user.id,
    },
  });
  return NextResponse.json(listing, { status: 201 });
}
