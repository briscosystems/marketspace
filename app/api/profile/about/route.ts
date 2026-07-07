import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  about: z.string().trim().max(1500, "Maximal 1500 Zeichen").nullable(),
});

// Schaufenster-Text ("Über uns") des eigenen Profils speichern
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

  const about = parsed.data.about || null;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { about },
  });

  return NextResponse.json({ ok: true, about });
}
