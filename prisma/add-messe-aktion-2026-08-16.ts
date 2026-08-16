/**
 * Deploy-Aufgabe: Messe-Aktion 2026 anlegen (idempotent).
 *
 * Der Messe-Flyer verspricht: 25 € Gutschrift für jede Anmeldung bis
 * 31. Oktober 2026, plus 10 € je Weiterempfehlung. Diese Aufgabe legt die
 * Aktion einmalig an (codelos = gilt für jede Anmeldung im Zeitraum);
 * erkannt wird sie am Titel. Beträge in Credits (1 Credit = 0,10 €).
 */
import { prisma } from "../lib/prisma";

const TITEL = "Messe-Aktion 2026";

export async function applyMesseAktion2026_08_16(): Promise<string> {
  const vorhanden = await prisma.creditAktion.findFirst({
    where: { titel: TITEL },
    select: { id: true },
  });
  if (vorhanden) return "schon vorhanden";
  await prisma.creditAktion.create({
    data: {
      titel: TITEL,
      code: "",
      creditsAnmeldung: 250, // 25 €
      creditsEmpfehlung: 100, // 10 €
      startsAt: new Date("2026-08-16T00:00:00Z"),
      endsAt: new Date("2026-10-31T23:59:59Z"),
    },
  });
  return "angelegt (25 € je Anmeldung, 10 € je Empfehlung, bis 31.10.2026)";
}
