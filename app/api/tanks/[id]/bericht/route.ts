/**
 * Messbericht als PDF für einen Tank (Betreiber 2026-08-17).
 *
 * Enthält Kopf mit Brisco-Wortmarke, die Stammdaten des Tanks, die Sollwerte
 * aus Datenblatt/SDS und die Messreihe als Tabelle mit Bewertung. Werte
 * außerhalb des Sollbereichs sind rot — der Bericht taugt damit als Nachweis
 * für Audit, Berufsgenossenschaft oder Kunden.
 *
 * Am Fuß ein DEZENTER Hinweis auf Dosimetrix: Diese Arbeiten kann das System
 * automatisch übernehmen und spart dabei typischerweise über 25 % Konzentrat.
 * Bewusst klein und am Ende — der Bericht ist ein Werkzeug, keine Anzeige.
 */
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bewerteMessung, standzeitWochen } from "@/lib/tank-bewertung";

const SEITE_B = 595.28;
const SEITE_H = 841.89;
const RAND = 48;

const LIME = rgb(0.671, 0.851, 0.102);
const GRAPHIT = rgb(0.11, 0.102, 0.106);
const GRAU = rgb(0.42, 0.42, 0.42);
const HELLGRAU = rgb(0.88, 0.89, 0.87);
const ROT = rgb(0.78, 0.11, 0.24);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { id } = await params;

  const tank = await prisma.coolantTank.findFirst({
    where: { id, userId: session.user.id },
    include: {
      product: {
        select: {
          name: true,
          refractometerFactor: true,
          recommendedConcentrationMin: true,
          recommendedConcentrationMax: true,
          phEmulsionMin: true,
          phEmulsionMax: true,
          manufacturer: { select: { name: true } },
        },
      },
      measurements: { orderBy: { measuredAt: "desc" }, take: 60 },
    },
  });
  if (!tank) return NextResponse.json({ error: "Tank nicht gefunden" }, { status: 404 });

  const soll = {
    refractometerFactor: tank.product?.refractometerFactor ?? null,
    recommendedConcentrationMin: tank.product?.recommendedConcentrationMin ?? null,
    recommendedConcentrationMax: tank.product?.recommendedConcentrationMax ?? null,
    phEmulsionMin: tank.product?.phEmulsionMin ?? null,
    phEmulsionMax: tank.product?.phEmulsionMax ?? null,
  };

  const pdf = await PDFDocument.create();
  const fett = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  let seite = pdf.addPage([SEITE_B, SEITE_H]);
  let y = SEITE_H;

  const text = (s: string, x: number, yy: number, groesse = 9, f = normal, farbe = GRAPHIT) =>
    seite.drawText(s, { x, y: yy, size: groesse, font: f, color: farbe });

  // Echtes Logo (helle Fassung, PNG für pdf-lib) — liegt im Repo unter public/.
  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    logo = await pdf.embedPng(
      fs.readFileSync(path.join(process.cwd(), "public", "brisco-logo-light.png")),
    );
  } catch {
    /* ohne Logo geht es auch — der Bericht ist wichtiger als das Bild */
  }

  /** Kopfbereich mit Logo — auf jeder Seite. */
  const kopf = () => {
    seite.drawRectangle({ x: 0, y: SEITE_H - 76, width: SEITE_B, height: 76, color: GRAPHIT });
    if (logo) {
      const h = 26;
      const b = (logo.width / logo.height) * h;
      seite.drawImage(logo, { x: RAND, y: SEITE_H - 52, width: b, height: h });
    } else {
      seite.drawRectangle({ x: RAND, y: SEITE_H - 44, width: 22, height: 12, color: LIME });
      text("BRISCO Systems", RAND + 30, SEITE_H - 42, 16, fett, rgb(1, 1, 1));
    }
    text("markt.brisco.ch", SEITE_B - RAND - 74, SEITE_H - 42, 9, normal, rgb(0.75, 0.77, 0.73));
    y = SEITE_H - 100;
  };

  const neueSeite = () => {
    seite = pdf.addPage([SEITE_B, SEITE_H]);
    kopf();
  };

  kopf();

  // ── Titel ─────────────────────────────────────────────────────────────
  text("Messbericht Kühlschmierstoff", RAND, y, 17, fett);
  y -= 18;
  text(
    `${tank.name}${tank.machine ? ` · ${tank.machine}` : ""} · erstellt am ${new Date().toLocaleDateString("de-CH")}`,
    RAND,
    y,
    9,
    normal,
    GRAU,
  );
  y -= 26;

  // ── Stammdaten ────────────────────────────────────────────────────────
  const produkt = tank.product
    ? `${tank.product.manufacturer.name} ${tank.product.name}`
    : tank.productFreetext ?? "—";
  const wochen = standzeitWochen(tank.filledAt);
  const zeilen: [string, string][] = [
    ["Kühlschmierstoff", produkt],
    ["Tankvolumen total", `${tank.volumeLiters ?? "—"} l`],
    [
      "Sollkonzentration",
      soll.recommendedConcentrationMin != null
        ? `${soll.recommendedConcentrationMin}–${soll.recommendedConcentrationMax ?? "?"} %`
        : "keine Herstellerangabe hinterlegt",
    ],
    [
      "pH-Fenster",
      soll.phEmulsionMin != null ? `${soll.phEmulsionMin}–${soll.phEmulsionMax ?? "?"}` : "—",
    ],
    ["Refraktometer-Faktor", soll.refractometerFactor != null ? String(soll.refractometerFactor) : "—"],
    ["Wasserhärte", tank.waterHardnessDh != null ? `${tank.waterHardnessDh} °dH` : "—"],
    ["Standzeit", wochen != null ? `${wochen} Wochen seit Neuansatz` : "—"],
  ];
  seite.drawRectangle({
    x: RAND - 8,
    y: y - zeilen.length * 14 - 6,
    width: SEITE_B - 2 * RAND + 16,
    height: zeilen.length * 14 + 14,
    color: rgb(0.97, 0.98, 0.95),
  });
  for (const [k, v] of zeilen) {
    text(k, RAND, y, 9, normal, GRAU);
    text(v, RAND + 150, y, 9, fett);
    y -= 14;
  }
  y -= 22;

  // ── Messreihe ─────────────────────────────────────────────────────────
  text("Messreihe", RAND, y, 12, fett);
  y -= 16;
  const spalten = [RAND, RAND + 78, RAND + 150, RAND + 210, RAND + 275, RAND + 345];
  const kopfzeile = () => {
    text("Datum", spalten[0], y, 8, fett, GRAU);
    text("Konzentration", spalten[1], y, 8, fett, GRAU);
    text("pH", spalten[2], y, 8, fett, GRAU);
    text("Nitrit", spalten[3], y, 8, fett, GRAU);
    text("Keime", spalten[4], y, 8, fett, GRAU);
    text("Bemerkung", spalten[5], y, 8, fett, GRAU);
    y -= 4;
    seite.drawLine({
      start: { x: RAND, y },
      end: { x: SEITE_B - RAND, y },
      thickness: 0.7,
      color: HELLGRAU,
    });
    y -= 12;
  };
  kopfzeile();

  const KEIME: Record<string, string> = {
    NONE: "keine", LOW: "gering", MEDIUM: "mittel", HIGH: "stark",
  };
  const komma = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

  const chrono = [...tank.measurements].sort(
    (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime(),
  );
  for (const m of chrono) {
    if (y < 120) { neueSeite(); text("Messreihe (Fortsetzung)", RAND, y, 12, fett); y -= 16; kopfzeile(); }
    const befunde = bewerteMessung(
      { brix: m.brix, concentrationPct: m.concentrationPct, ph: m.ph, nitritePpm: m.nitritePpm, bacteria: m.bacteria },
      soll,
    );
    // Feldnamen und Ampelstufen exakt wie in lib/tank-bewertung.ts.
    const schlecht = (feld: string) =>
      befunde.some((b) => b.feld === feld && (b.ampel === "achtung" || b.ampel === "kritisch"));

    text(m.measuredAt.toLocaleDateString("de-CH"), spalten[0], y, 9);
    text(
      m.concentrationPct != null ? `${komma(m.concentrationPct)} %` : "—",
      spalten[1], y, 9, normal, schlecht("Konzentration") ? ROT : GRAPHIT,
    );
    text(m.ph != null ? komma(m.ph) : "—", spalten[2], y, 9, normal, schlecht("pH-Wert") ? ROT : GRAPHIT);
    text(
      m.nitritePpm != null ? `${komma(m.nitritePpm)}` : "—",
      spalten[3], y, 9, normal, schlecht("Nitrit") ? ROT : GRAPHIT,
    );
    text(m.bacteria ? KEIME[m.bacteria] ?? m.bacteria : "—", spalten[4], y, 9, normal,
      schlecht("Keimzahl") ? ROT : GRAPHIT);
    if (m.note) {
      // Bemerkung kürzen, damit die Zeile nicht über den Rand läuft.
      const platz = SEITE_B - RAND - spalten[5];
      let s = m.note.replace(/\s+/g, " ");
      while (normal.widthOfTextAtSize(s, 8) > platz && s.length > 4) s = s.slice(0, -2);
      text(s.length < m.note.length ? s + "…" : s, spalten[5], y, 8, normal, GRAU);
    }
    y -= 13;
  }

  if (chrono.length === 0) {
    text("Noch keine Messwerte erfasst.", RAND, y, 9, normal, GRAU);
    y -= 13;
  }

  y -= 10;
  text(
    "Rot = außerhalb des Sollbereichs bzw. über der Grenze (pH < 8,5 nach DGUV 109-003, Nitrit > 20 mg/l nach TRGS 611).",
    RAND, y, 7.5, normal, GRAU,
  );

  // ── Fuß: dezenter Dosimetrix-Hinweis ──────────────────────────────────
  const fussY = 96;
  seite.drawLine({
    start: { x: RAND, y: fussY + 34 },
    end: { x: SEITE_B - RAND, y: fussY + 34 },
    thickness: 0.7,
    color: HELLGRAU,
  });
  text(
    "Diese Arbeiten kann DOSIMETRIX® hybrid automatisch übernehmen: messen, mischen und dosieren ohne",
    RAND, fussY + 20, 8, normal, GRAU,
  );
  text(
    "Handarbeit — typischerweise über 25 % weniger Konzentratverbrauch. www.dosimetrix.eu",
    RAND, fussY + 10, 8, normal, GRAU,
  );
  text(
    "Brisco Systems GmbH · Schweiz · Angaben ohne Gewähr; maßgeblich ist das Datenblatt des Herstellers.",
    RAND, fussY - 6, 7.5, normal, GRAU,
  );

  const bytes = await pdf.save();
  const datei = `Messbericht-${tank.name.replace(/[^\w-]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${datei}"`,
    },
  });
}
