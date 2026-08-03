/**
 * Lagerregionen vereinheitlichen (2026-08-03).
 *
 * Bis dahin waren nur neun deutsche Bundesländer einzeln wählbar, Schweiz und
 * Österreich nur als ganzes Land — der Platzhalter lautete „DE-BW". Die neue
 * Liste (lib/regionen.ts) deckt alle Kantone, Bundesländer und Europa ab und
 * schreibt Kürzel plus Name („CH-ZH (Zürich)"). Diese Aufgabe zieht die bereits
 * gespeicherten Kurzwerte nach.
 *
 * IDEMPOTENT: Werte, die schon in der neuen Schreibweise stehen, bleiben
 * unverändert; unbekannte Freitexte werden nicht angefasst.
 */
import { prisma } from "../lib/prisma";
import { normalisiereRegion } from "../lib/regionen";

export async function applyRegionen2026_08_03(): Promise<string> {
  let angebote = 0;
  let anfragen = 0;

  const listings = await prisma.listing.findMany({
    select: { id: true, locationRegion: true },
  });
  for (const l of listings) {
    const neu = normalisiereRegion(l.locationRegion);
    if (neu !== l.locationRegion) {
      await prisma.listing.update({ where: { id: l.id }, data: { locationRegion: neu } });
      angebote++;
    }
  }

  const rfqs = await prisma.rfq.findMany({ select: { id: true, locationRegion: true } });
  for (const r of rfqs) {
    const neu = normalisiereRegion(r.locationRegion);
    if (neu !== r.locationRegion) {
      await prisma.rfq.update({ where: { id: r.id }, data: { locationRegion: neu } });
      anfragen++;
    }
  }

  return angebote + anfragen === 0
    ? "nichts zu tun (bereits vereinheitlicht)"
    : `${angebote} Angebot(e) und ${anfragen} Anfrage(n) auf die neue Schreibweise gebracht`;
}

if (process.argv[1]?.includes("fix-regionen-2026-08-03")) {
  applyRegionen2026_08_03()
    .then((r) => { console.log("Ergebnis:", r); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
