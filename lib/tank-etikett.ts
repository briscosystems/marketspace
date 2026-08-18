/**
 * Tank-Etikett zeichnen — gemeinsamer Baustein für Einzel- und Sammeldruck.
 *
 * Format (Betreiber 2026-08-18): **ein Etikett pro Tank, halbe A4-Seite**.
 * Damit ist der QR-Code auch aus zwei Metern Abstand und mit dem Handy in
 * öliger Hand sicher zu treffen, und die Sollwerte sind ohne Bücken lesbar.
 * Zwei Etiketten passen auf ein Blatt; die Trennlinie in der Mitte zeigt, wo
 * geschnitten wird.
 *
 * Inhalt bewusst knapp: Tankname, Maschine, Produkt, Sollkonzentration,
 * Refraktometer-Faktor, Volumen — mehr braucht niemand am Tank. Dazu die
 * Aufforderung „Scannen und Messwert eintragen" und der Brisco-Fuß.
 */
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { siteUrl } from "@/lib/site-url";

/** A4 in Punkten. */
export const SEITE_B = 595.28;
export const SEITE_H = 841.89;

const GRUEN = rgb(0.36, 0.55, 0.16);
const DUNKEL = rgb(0.1, 0.12, 0.15);
const GRAU = rgb(0.45, 0.48, 0.52);
const HELLGRAU = rgb(0.82, 0.84, 0.86);

export type EtikettTank = {
  name: string;
  machine: string | null;
  volumeLiters: number | null;
  productFreetext: string | null;
  qrToken: string;
  product: {
    name: string;
    refractometerFactor: number | null;
    recommendedConcentrationMin: number | null;
    recommendedConcentrationMax: number | null;
    manufacturer: { name: string };
  } | null;
};

/** QR-Bild für einen Tank erzeugen und ins Dokument einbetten. */
export async function qrFuerTank(pdf: PDFDocument, token: string): Promise<PDFImage> {
  const url = `${siteUrl()}/t/${token}`;
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M", // hält auch einen Ölfleck oder Kratzer aus
    margin: 1,
    width: 900,
  });
  return pdf.embedPng(Buffer.from(dataUrl.split(",")[1], "base64"));
}

function kuerze(text: string, groesse: number, maxBreite: number, font: PDFFont): string {
  let t = text;
  while (t.length > 3 && font.widthOfTextAtSize(t, groesse) > maxBreite) t = t.slice(0, -1);
  return t.length < text.length ? t.trimEnd() + "…" : t;
}

const komma = (n: number) => String(n).replace(".", ",");

/**
 * Zeichnet EIN Etikett in die angegebene Hälfte der Seite.
 * @param haelfte 0 = obere Blatthälfte, 1 = untere
 */
export function zeichneEtikett(
  seite: PDFPage,
  tank: EtikettTank,
  qrBild: PDFImage,
  fonts: { fett: PDFFont; normal: PDFFont },
  haelfte: 0 | 1,
) {
  const { fett, normal } = fonts;
  const RAND = 34;
  const etiB = SEITE_B - 2 * RAND;
  const etiH = (SEITE_H - 2 * RAND - 20) / 2; // 20 pt Luft an der Schnittkante
  const x = RAND;
  const y = haelfte === 0 ? SEITE_H - RAND - etiH : RAND;

  // Rahmen als Schnittlinie
  seite.drawRectangle({
    x,
    y,
    width: etiB,
    height: etiH,
    borderColor: HELLGRAU,
    borderWidth: 0.75,
    color: rgb(1, 1, 1),
  });

  // Kopfbalken
  const kopfH = 40;
  seite.drawRectangle({ x, y: y + etiH - kopfH, width: etiB, height: kopfH, color: GRUEN });
  seite.drawText("BRISCO Systems GmbH", {
    x: x + 18,
    y: y + etiH - 26,
    size: 15,
    font: fett,
    color: rgb(1, 1, 1),
  });

  // QR-Code links — groß, damit er aus Distanz trifft
  const qrGroesse = 190;
  const qrX = x + 20;
  const qrY = y + etiH - kopfH - qrGroesse - 18;
  seite.drawImage(qrBild, { x: qrX, y: qrY, width: qrGroesse, height: qrGroesse });

  seite.drawText("Scannen und Messwert eintragen", {
    x: qrX,
    y: qrY - 22,
    size: 13,
    font: fett,
    color: DUNKEL,
  });

  // Texte rechts vom Code
  const tx = qrX + qrGroesse + 24;
  const maxB = x + etiB - tx - 20;
  let ty = y + etiH - kopfH - 30;

  seite.drawText(kuerze(tank.name, 26, maxB, fett), {
    x: tx, y: ty, size: 26, font: fett, color: DUNKEL,
  });
  ty -= 26;

  if (tank.machine) {
    seite.drawText(kuerze(tank.machine, 13, maxB, normal), {
      x: tx, y: ty, size: 13, font: normal, color: GRAU,
    });
    ty -= 20;
  }

  const produkt = tank.product
    ? `${tank.product.manufacturer.name} ${tank.product.name}`
    : tank.productFreetext || "Kühlschmierstoff nicht hinterlegt";
  seite.drawText(kuerze(produkt, 13, maxB, normal), {
    x: tx, y: ty, size: 13, font: normal, color: DUNKEL,
  });
  ty -= 26;

  if (
    tank.product?.recommendedConcentrationMin != null &&
    tank.product?.recommendedConcentrationMax != null
  ) {
    seite.drawText(
      `Soll ${komma(tank.product.recommendedConcentrationMin)}–${komma(
        tank.product.recommendedConcentrationMax,
      )} %`,
      { x: tx, y: ty, size: 19, font: fett, color: GRUEN },
    );
    ty -= 22;
  }
  if (tank.product?.refractometerFactor != null) {
    seite.drawText(`Refraktometer: Brix × ${komma(tank.product.refractometerFactor)}`, {
      x: tx, y: ty, size: 12, font: normal, color: GRAU,
    });
    ty -= 17;
  }
  if (tank.volumeLiters != null) {
    seite.drawText(`Tankvolumen total ${komma(tank.volumeLiters)} l`, {
      x: tx, y: ty, size: 12, font: normal, color: GRAU,
    });
  }

  // Fuß
  seite.drawLine({
    start: { x: x + 20, y: y + 44 },
    end: { x: x + etiB - 20, y: y + 44 },
    thickness: 0.5,
    color: HELLGRAU,
  });
  seite.drawText("Konzentration, pH und Standzeit im Blick —", {
    x: x + 20, y: y + 28, size: 10, font: normal, color: GRAU,
  });
  seite.drawText("kostenlos auf markt.brisco.ch", {
    x: x + 20, y: y + 14, size: 10, font: fett, color: GRUEN,
  });
}

/** Gestrichelte Schnittlinie in der Blattmitte. */
export function schnittlinie(seite: PDFPage) {
  seite.drawLine({
    start: { x: 20, y: SEITE_H / 2 },
    end: { x: SEITE_B - 20, y: SEITE_H / 2 },
    thickness: 0.5,
    color: HELLGRAU,
    dashArray: [4, 4],
  });
}
