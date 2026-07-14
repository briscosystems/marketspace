// PATCH /api/ads/[id] — Anzeige ändern · DELETE /api/ads/[id] — löschen.
// Nur Eigentümer (oder Admin).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adSchema, requireAdManager } from "../route";

async function loadOwned(userId: string, id: string, isAdmin: boolean) {
  const ad = await prisma.adBanner.findUnique({ where: { id }, select: { id: true, ownerId: true } });
  if (!ad) return { error: "Nicht gefunden", status: 404 as const };
  if (ad.ownerId !== userId && !isAdmin) return { error: "Kein Zugriff", status: 403 as const };
  return { ad };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const access = await requireAdManager(session.user.id);
  if (!access) return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });

  const { id } = await ctx.params;
  const owned = await loadOwned(session.user.id, id, access.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const parsed = adSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.adBanner.update({
    where: { id },
    data: {
      ...(d.eyebrow !== undefined ? { eyebrow: d.eyebrow?.trim() || null } : {}),
      ...(d.headline !== undefined ? { headline: d.headline.trim() } : {}),
      ...(d.chips !== undefined ? { chips: d.chips.map((c) => c.trim()).filter(Boolean) } : {}),
      ...(d.image !== undefined ? { image: d.image } : {}),
      ...(d.ctaLabel !== undefined ? { ctaLabel: d.ctaLabel?.trim() || "Mehr erfahren" } : {}),
      ...(d.ctaUrl !== undefined ? { ctaUrl: d.ctaUrl.trim() } : {}),
      ...(d.origin !== undefined ? { origin: d.origin?.trim() || null } : {}),
      ...(d.placements !== undefined ? { placements: d.placements } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.startsAt !== undefined ? { startsAt: d.startsAt ? new Date(d.startsAt) : null } : {}),
      ...(d.endsAt !== undefined ? { endsAt: d.endsAt ? new Date(d.endsAt) : null } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const access = await requireAdManager(session.user.id);
  if (!access) return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });

  const { id } = await ctx.params;
  const owned = await loadOwned(session.user.id, id, access.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  await prisma.adBanner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
