import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  kind: z.enum(["pageview", "search"]),
  path: z.string().max(300).optional(),
  meta: z.string().max(300).optional(),
});

// Nutzungs-Ereignis erfassen (Seitenaufruf, Suche). Datenschutzarm:
// keine IP, keine Cookies — nur Pfad/Begriff + optionale User-ID bei
// eingeloggten Nutzern. Fehler werden verschluckt (Tracking darf die
// Seite nie stören).
export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

    const session = await getServerSession(authOptions);
    await prisma.usageEvent.create({
      data: {
        kind: parsed.data.kind,
        path: parsed.data.path,
        meta: parsed.data.meta,
        userId: session?.user?.id ?? null,
      },
    });
  } catch {
    // bewusst still — Tracking ist nie kritisch
  }
  return NextResponse.json({ ok: true });
}
