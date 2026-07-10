import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSupportedCurrency } from "@/lib/currency";

const bodySchema = z.object({
  currency: z.string().refine(isSupportedCurrency, "Nicht unterstützte Währung").nullable(),
});

// Gewünschte Anzeige-/Abrechnungswährung des eigenen Profils speichern
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredCurrency: parsed.data.currency },
  });

  return NextResponse.json({ ok: true, currency: parsed.data.currency });
}
