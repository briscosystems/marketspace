import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  productType: z.string().min(2).optional(),
  manufacturer: z.string().min(1).optional(),
  productName: z.string().min(2).optional(),
  isoViscosity: z.string().nullable().optional(),
  chemistry: z.enum(["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "OTHER"]).optional(),
  applicationArea: z.string().min(2).optional(),
  quantity: z.number().positive().optional(),
  quantityUnit: z.string().optional(),
  minOrderQty: z.number().positive().nullable().optional(),
  locationRegion: z.string().min(2).optional(),
  packaging: z.enum(["DRUM", "IBC", "TANK", "CANISTER", "BULK", "OTHER"]).optional(),
  certificates: z.array(z.string()).optional(),
  priceEur: z.number().positive().nullable().optional(),
  shippingTerms: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "SOLD", "ARCHIVED"]).optional(),
});

async function assertOwner(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  if (!listing) return { ok: false as const, status: 404, error: "Not found" };
  if (listing.sellerId !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const check = await assertOwner(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const check = await assertOwner(id, session.user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.listing.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  return NextResponse.json({ ok: true });
}
