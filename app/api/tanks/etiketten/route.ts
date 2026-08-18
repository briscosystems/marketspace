/**
 * Etiketten-Bogen für ALLE Tanks des Nutzers (Betreiber 2026-08-18).
 *
 * Ein Etikett je Tank, jedes eine halbe A4-Seite groß — zwei Tanks pro Blatt,
 * mit gestrichelter Schnittlinie in der Mitte. Wer zehn Maschinen hat, druckt
 * einmal und klebt der Reihe nach.
 *
 * Tanks ohne QR-Schlüssel bekommen ihn hier nachgetragen: Ältere Tanks wurden
 * angelegt, bevor es die Etiketten gab.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SEITE_B,
  SEITE_H,
  qrFuerTank,
  zeichneEtikett,
  schnittlinie,
  type EtikettTank,
} from "@/lib/tank-etikett";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const tanks = await prisma.coolantTank.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      machine: true,
      volumeLiters: true,
      productFreetext: true,
      qrToken: true,
      product: {
        select: {
          name: true,
          refractometerFactor: true,
          recommendedConcentrationMin: true,
          recommendedConcentrationMax: true,
          manufacturer: { select: { name: true } },
        },
      },
    },
  });
  if (tanks.length === 0) {
    return NextResponse.json({ error: "Noch keine Tanks angelegt" }, { status: 404 });
  }

  // Fehlende Schlüssel nachtragen — ohne Schlüssel kein QR-Code.
  const fertig: EtikettTank[] = [];
  for (const t of tanks) {
    let token = t.qrToken;
    if (!token) {
      const neu = await prisma.coolantTank.update({
        where: { id: t.id },
        data: { qrToken: crypto.randomUUID().replace(/-/g, "") },
        select: { qrToken: true },
      });
      token = neu.qrToken!;
    }
    fertig.push({ ...t, qrToken: token });
  }

  const pdf = await PDFDocument.create();
  pdf.setTitle("Tank-Etiketten — Brisco Systems");
  pdf.setProducer("Brisco Systems GmbH");
  const fett = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < fertig.length; i++) {
    const haelfte: 0 | 1 = i % 2 === 0 ? 0 : 1;
    const seite = haelfte === 0 ? pdf.addPage([SEITE_B, SEITE_H]) : pdf.getPage(pdf.getPageCount() - 1);
    if (haelfte === 0) schnittlinie(seite);
    const qr = await qrFuerTank(pdf, fertig[i].qrToken);
    zeichneEtikett(seite, fertig[i], qr, { fett, normal }, haelfte);
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Tank-Etiketten-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
