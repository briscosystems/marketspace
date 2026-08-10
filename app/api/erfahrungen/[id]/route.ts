/**
 * Eigenen Erfahrungsbericht ändern oder zurückziehen.
 *
 * Prüfung 2026-08-10 ergab: Nutzer konnten ihre eigenen Berichte weder
 * bearbeiten noch löschen — nur der Betreiber. Das ist zu wenig: Wer einen
 * Tippfehler macht, versehentlich seinen Firmennamen nennt oder es sich anders
 * überlegt, muss selbst eingreifen können.
 *
 * Zwei Regeln halten die Moderation dicht:
 *  1. **Ändern nur, solange der Bericht offen ist.** Wäre ein freigegebener
 *     Bericht nachträglich änderbar, könnte jemand einen harmlosen Text
 *     freigeben lassen und danach etwas anderes hineinschreiben — die Prüfung
 *     wäre wertlos.
 *  2. **Zurückziehen jederzeit.** Das eigene Wort zurücknehmen zu können, ist
 *     etwas anderes als es zu verändern. Gutgeschriebene Credits bleiben — die
 *     Prüfarbeit ist geleistet, und eine Rückbuchung würde Leute bestrafen,
 *     die aus gutem Grund zurückziehen.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pruefeErfahrung } from "@/lib/erfahrung-pruefung";

const Aenderung = z.object({
  text: z.string().trim().min(40, "Bitte schreibe mindestens 40 Zeichen.").max(5000),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }
  const { id } = await params;

  const bericht = await prisma.experienceReport.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      status: true,
      productId: true,
      productFreetext: true,
      problems: true,
      machine: true,
    },
  });
  if (!bericht) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (bericht.status !== "PENDING") {
    return NextResponse.json(
      {
        error:
          "Freigegebene Berichte lassen sich nicht mehr ändern — sonst wäre die Prüfung wertlos. " +
          "Du kannst den Bericht zurückziehen und einen neuen schreiben.",
      },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = Aenderung.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 },
    );
  }

  // Geänderter Text heißt neue Prüfung — sonst könnte man die Vorprüfung
  // umgehen, indem man nach dem Absenden umschreibt.
  const produktName = bericht.productId
    ? await prisma.product
        .findUnique({
          where: { id: bericht.productId },
          select: { name: true, manufacturer: { select: { name: true } } },
        })
        .then((p) => (p ? `${p.manufacturer.name} ${p.name}` : null))
    : bericht.productFreetext;

  const pruefung = await pruefeErfahrung({
    text: parsed.data.text,
    produkt: produktName,
    problems: bericht.problems,
    machine: bericht.machine,
  });

  await prisma.experienceReport.update({
    where: { id },
    data: { text: parsed.data.text, aiVerdict: pruefung.verdict, aiNote: pruefung.note },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }
  const { id } = await params;

  const bericht = await prisma.experienceReport.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!bericht) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Angehängte Fotos und Laborberichte gehen über die Datenbank-Beziehung mit.
  await prisma.experienceReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
