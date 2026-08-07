/**
 * QR-Schlüssel für bestehende Tanks nachtragen — 2026-08-06.
 *
 * Warum: Der Schlüssel (`CoolantTank.qrToken`) wurde erst mit dem Etikett-PDF
 * eingeführt. Tanks, die davor angelegt wurden, haben keinen — ohne ihn lässt
 * sich kein Etikett drucken.
 *
 * Warum ohne Datenbank-Eindeutigkeit: `prisma db push` meldet jede neue
 * `@unique`-Regel als möglichen Datenverlust und bricht beim Deploy ab — die
 * Seite käme nicht hoch. Der Schlüssel ist ein cuid; eine Kollision ist
 * praktisch ausgeschlossen, und diese Aufgabe prüft zusätzlich auf Doppelte.
 *
 * IDEMPOTENT: Es werden nur Tanks ohne Schlüssel angefasst.
 */
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";

export async function applyQrToken2026_08_06(): Promise<string> {
  const ohne = await prisma.coolantTank.findMany({
    where: { qrToken: null },
    select: { id: true },
  });
  if (ohne.length === 0) return "nichts zu tun (alle Tanks haben einen Schlüssel)";

  let gesetzt = 0;
  for (const t of ohne) {
    // Auf Nummer sicher: Schlüssel neu würfeln, falls er (unwahrscheinlich)
    // schon vergeben ist.
    let token = randomUUID().replace(/-/g, "");
    for (let versuch = 0; versuch < 5; versuch++) {
      const belegt = await prisma.coolantTank.findFirst({
        where: { qrToken: token },
        select: { id: true },
      });
      if (!belegt) break;
      token = randomUUID().replace(/-/g, "");
    }
    await prisma.coolantTank.update({ where: { id: t.id }, data: { qrToken: token } });
    gesetzt++;
  }
  return `${gesetzt} Tank(s) mit QR-Schlüssel versehen`;
}
