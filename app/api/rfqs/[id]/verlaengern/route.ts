/**
 * Frist einer Anfrage verlängern (Betreiber 2026-08-16).
 *
 * Nur der Ersteller darf verlängern. Erlaubt bei OFFENEN und bei
 * AUSGELAUFENEN Anfragen — eine ausgelaufene wird damit wieder geöffnet
 * (das ist der ganze Zweck: nicht neu eintippen müssen). Vergebene oder
 * zurückgezogene Anfragen lassen sich nicht wiederbeleben.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Eingabe = z.object({
  /** Neue Frist als YYYY-MM-DD — muss in der Zukunft liegen. */
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }
  const { id } = await params;

  const parsed = Eingabe.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte ein gültiges Datum wählen." }, { status: 400 });
  }
  const neueFrist = new Date(`${parsed.data.deadline}T23:59:59`);
  if (!(neueFrist > new Date())) {
    return NextResponse.json({ error: "Die neue Frist muss in der Zukunft liegen." }, { status: 400 });
  }
  // Nicht endlos in die Zukunft — ein Jahr reicht für jede Beschaffung.
  const maxFrist = new Date();
  maxFrist.setFullYear(maxFrist.getFullYear() + 1);
  if (neueFrist > maxFrist) {
    return NextResponse.json({ error: "Höchstens ein Jahr im Voraus." }, { status: 400 });
  }

  const rfq = await prisma.rfq.findFirst({
    where: { id, buyerId: session.user.id },
    select: { id: true, status: true },
  });
  if (!rfq) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (rfq.status !== "OPEN" && rfq.status !== "EXPIRED") {
    return NextResponse.json(
      { error: "Nur offene oder ausgelaufene Anfragen lassen sich verlängern." },
      { status: 409 },
    );
  }

  await prisma.rfq.update({
    where: { id },
    data: { deadline: neueFrist, status: "OPEN" },
  });
  return NextResponse.json({ ok: true });
}
