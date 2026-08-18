/**
 * Etikett zum Ausschneiden: PDF mit QR-Code für EINEN Tank.
 *
 * Warum: Der QR-Code an der Maschine ist der kürzeste Weg von der Messung in
 * die Datenbank — Handy dran, Werte rein, fertig. Ohne Suchen, ohne Tippen,
 * ohne ölige Finger auf der Tastatur.
 *
 * Format seit 2026-08-18 (Betreiber): **halbe A4-Seite je Etikett**. Der Bogen
 * enthält dasselbe Etikett zweimal — eines an den Tank, eines als Reserve für
 * Nachfüllstation oder Werkstattbuch. Gezeichnet wird mit demselben Baustein
 * wie der Sammeldruck über alle Tanks (lib/tank-etikett.ts), damit beide gleich
 * aussehen.
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
  briscoLogo,
  zeichneEtikett,
  schnittlinie,
} from "@/lib/tank-etikett";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { id } = await params;

  const tank = await prisma.coolantTank.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      name: true,
      machine: true,
      qrToken: true,
      productFreetext: true,
      volumeLiters: true,
      product: {
        select: {
          name: true,
          recommendedConcentrationMin: true,
          recommendedConcentrationMax: true,
          refractometerFactor: true,
          manufacturer: { select: { name: true } },
        },
      },
    },
  });
  if (!tank) return NextResponse.json({ error: "Tank nicht gefunden" }, { status: 404 });

  // Schlüssel nachtragen, falls der Tank vor dieser Funktion angelegt wurde.
  let token = tank.qrToken;
  if (!token) {
    const neu = await prisma.coolantTank.update({
      where: { id: tank.id },
      data: { qrToken: crypto.randomUUID().replace(/-/g, "") },
      select: { qrToken: true },
    });
    token = neu.qrToken!;
  }

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tank-Etikett — ${tank.name}`);
  pdf.setProducer("Brisco Systems GmbH");
  const fett = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await briscoLogo(pdf);
  const seite = pdf.addPage([SEITE_B, SEITE_H]);
  const qr = await qrFuerTank(pdf, token);

  schnittlinie(seite);
  zeichneEtikett(seite, { ...tank, qrToken: token }, qr, { fett, normal }, 0, logo);
  zeichneEtikett(seite, { ...tank, qrToken: token }, qr, { fett, normal }, 1, logo);

  const bytes = await pdf.save();
  const datei = `Tank-Etikett-${tank.name.replace(/[^\w-]+/g, "-")}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${datei}"`,
    },
  });
}
