import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ listings: [] });

  const listings = await prisma.listing.findMany({
    where: { id: { in: ids } },
    include: { seller: { select: { pseudonym: true } } },
  });
  return NextResponse.json({ listings });
}
