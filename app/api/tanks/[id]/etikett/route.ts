/**
 * Etikett zum Ausschneiden: PDF mit QR-Code für einen Tank.
 *
 * Warum: Der QR-Code an der Maschine ist der kürzeste Weg von der Messung in
 * die Datenbank — Handy dran, Werte rein, fertig. Ohne Suchen, ohne Tippen,
 * ohne ölige Finger auf der Tastatur.
 *
 * Der Bogen enthält dasselbe Etikett vier Mal (Tank, Nachfüllstation,
 * Werkstattbuch, Reserve) auf A4, mit Schnittmarken. Beschriftet mit dem
 * Tanknamen, dem Kühlschmierstoff und der Sollkonzentration — so ist das
 * Etikett auch dann nützlich, wenn gerade kein Handy zur Hand ist.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

/** A4 in Punkten. */
const SEITE_B = 595.28;
const SEITE_H = 841.89;

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

  const url = `${siteUrl()}/t/${token}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M", // hält auch einen Ölfleck oder Kratzer aus
    margin: 1,
    width: 600,
  });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tank-Etikett — ${tank.name}`);
  pdf.setProducer("Brisco Systems GmbH");
  const seite = pdf.addPage([SEITE_B, SEITE_H]);
  const qrBild = await pdf.embedPng(qrBytes);
  const fett = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);

  const gruen = rgb(0.36, 0.55, 0.16);
  const dunkel = rgb(0.1, 0.12, 0.15);
  const grau = rgb(0.45, 0.48, 0.52);
  const hellgrau = rgb(0.82, 0.84, 0.86);

  const produkt = tank.product
    ? `${tank.product.manufacturer.name} ${tank.product.name}`
    : tank.productFreetext || "Kühlschmierstoff nicht hinterlegt";
  const sollText =
    tank.product?.recommendedConcentrationMin != null &&
    tank.product?.recommendedConcentrationMax != null
      ? `Soll ${String(tank.product.recommendedConcentrationMin).replace(".", ",")}–${String(
          tank.product.recommendedConcentrationMax,
        ).replace(".", ",")} %`
      : null;
  const faktorText =
    tank.product?.refractometerFactor != null
      ? `Brix x ${String(tank.product.refractometerFactor).replace(".", ",")}`
      : null;

  /** Schneidet Text auf die verfügbare Breite. */
  function kuerze(text: string, groesse: number, maxBreite: number, font = normal): string {
    let t = text;
    while (t.length > 3 && font.widthOfTextAtSize(t, groesse) > maxBreite) {
      t = t.slice(0, -1);
    }
    return t.length < text.length ? t.trimEnd() + "…" : t;
  }

  // Vier Etiketten: 2 Spalten x 2 Zeilen
  const RAND = 34;
  const SPALT = 16;
  const etiB = (SEITE_B - 2 * RAND - SPALT) / 2;
  const etiH = 250;
  const startY = SEITE_H - RAND;

  for (let i = 0; i < 4; i++) {
    const spalte = i % 2;
    const zeile = Math.floor(i / 2);
    const x = RAND + spalte * (etiB + SPALT);
    const y = startY - zeile * (etiH + SPALT) - etiH;

    // Rahmen als Schnittlinie
    seite.drawRectangle({
      x,
      y,
      width: etiB,
      height: etiH,
      borderColor: hellgrau,
      borderWidth: 0.75,
      color: rgb(1, 1, 1),
    });

    // Kopfbalken
    seite.drawRectangle({ x, y: y + etiH - 26, width: etiB, height: 26, color: gruen });
    seite.drawText("BRISCO Systems GmbH", {
      x: x + 10,
      y: y + etiH - 18,
      size: 10,
      font: fett,
      color: rgb(1, 1, 1),
    });

    // QR-Code links
    const qrGroesse = 108;
    const qrX = x + 12;
    const qrY = y + etiH - 26 - qrGroesse - 12;
    seite.drawImage(qrBild, { x: qrX, y: qrY, width: qrGroesse, height: qrGroesse });

    // Texte rechts vom Code
    const tx = qrX + qrGroesse + 12;
    const maxB = etiB - (qrGroesse + 36);
    let ty = y + etiH - 26 - 22;

    seite.drawText(kuerze(tank.name, 13, maxB, fett), {
      x: tx, y: ty, size: 13, font: fett, color: dunkel,
    });
    ty -= 16;
    if (tank.machine) {
      seite.drawText(kuerze(tank.machine, 9, maxB), { x: tx, y: ty, size: 9, font: normal, color: grau });
      ty -= 13;
    }
    seite.drawText(kuerze(produkt, 9, maxB), { x: tx, y: ty, size: 9, font: normal, color: dunkel });
    ty -= 15;
    if (sollText) {
      seite.drawText(sollText, { x: tx, y: ty, size: 10, font: fett, color: gruen });
      ty -= 13;
    }
    if (faktorText) {
      seite.drawText(faktorText, { x: tx, y: ty, size: 9, font: normal, color: grau });
      ty -= 13;
    }
    if (tank.volumeLiters != null) {
      seite.drawText(`${String(tank.volumeLiters).replace(".", ",")} l Füllmenge`, {
        x: tx, y: ty, size: 9, font: normal, color: grau,
      });
    }

    // Handlungsaufforderung unter dem QR-Code
    seite.drawText("Scannen und Messwert eintragen", {
      x: qrX,
      y: qrY - 16,
      size: 10,
      font: fett,
      color: dunkel,
    });

    // Werbezeile am Fuß
    seite.drawLine({
      start: { x: x + 12, y: y + 36 },
      end: { x: x + etiB - 12, y: y + 36 },
      thickness: 0.5,
      color: hellgrau,
    });
    seite.drawText("Konzentration, pH und Standzeit im Blick —", {
      x: x + 12, y: y + 24, size: 8, font: normal, color: grau,
    });
    seite.drawText("kostenlos auf markt.brisco.ch", {
      x: x + 12, y: y + 13, size: 8, font: fett, color: gruen,
    });
  }

  // Fußzeile mit Klartext-Adresse, falls der Code nicht lesbar ist
  seite.drawText(`Falls der Code nicht lesbar ist: ${url}`, {
    x: RAND,
    y: RAND - 12,
    size: 7,
    font: normal,
    color: grau,
  });

  const bytes = await pdf.save();
  const dateiname = `Tank-Etikett-${tank.name.replace(/[^\p{L}\p{N}]+/gu, "-")}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
      "Cache-Control": "no-store",
    },
  });
}
