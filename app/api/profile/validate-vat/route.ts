import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateVatId } from "@/lib/vat-validation";

const bodySchema = z.object({
  // Optional neue USt-ID mitschicken (überschreibt die gespeicherte)
  vatId: z.string().trim().min(4).max(20).optional(),
});

// Eigene USt-ID gegen VIES (EU-Datenbank) prüfen und Ergebnis speichern.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { vatId: true },
  });
  const vatId = parsed.data.vatId ?? user?.vatId;
  if (!vatId) {
    return NextResponse.json(
      { error: "Keine USt-ID hinterlegt. Bitte zuerst eine USt-ID eingeben." },
      { status: 400 },
    );
  }

  const result = await validateVatId(vatId);
  if (!result.checkable) {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }

  if (!result.valid) {
    // Fehlgeschlagene Prüfung setzt einen früheren Erfolg zurück
    await prisma.user.update({
      where: { id: session.user.id },
      data: { vatId, vatValidatedAt: null, vatValidatedName: null },
    });
    return NextResponse.json(
      { error: "Diese USt-ID ist laut EU-Datenbank (VIES) nicht gültig." },
      { status: 422 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { vatId, vatValidatedAt: new Date(), vatValidatedName: result.name },
  });

  return NextResponse.json({ ok: true, name: result.name });
}
