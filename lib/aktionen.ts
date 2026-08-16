/**
 * Anmelde-Aktionen (z. B. Messe-Aktion 2026): zeitlich begrenzte Gutschriften
 * für Neuanmeldungen und Weiterempfehlungen.
 *
 * Beträge sind in CREDITS gespeichert (1 Credit = 0,10 €) — die Messe-Aktion
 * „25 € Gutschrift" sind also 250 Credits, „10 € je Weiterempfehlung" 100.
 */
import { prisma } from "@/lib/prisma";

export type AktiveAktion = {
  id: string;
  titel: string;
  creditsAnmeldung: number;
  creditsEmpfehlung: number;
};

/**
 * Liefert die Aktion, die für DIESE Registrierung gilt — oder null.
 *
 * Ohne Code zählt nur eine codelose Aktion im Zeitfenster; mit Code die
 * passende Code-Aktion. Gibt es mehrere, gewinnt die mit der höchsten
 * Anmelde-Gutschrift — niemand soll durch Aktions-Überschneidung schlechter
 * fahren.
 */
export async function passendeAktion(code?: string | null): Promise<AktiveAktion | null> {
  const jetzt = new Date();
  const kandidaten = await prisma.creditAktion.findMany({
    where: { active: true, startsAt: { lte: jetzt }, endsAt: { gte: jetzt } },
    select: {
      id: true,
      titel: true,
      code: true,
      creditsAnmeldung: true,
      creditsEmpfehlung: true,
    },
  });
  const eingabe = (code ?? "").trim().toLowerCase();
  const passend = kandidaten.filter((a) =>
    a.code === "" ? true : a.code.toLowerCase() === eingabe,
  );
  // Codelose Aktionen gelten immer; eine Code-Aktion nur bei passender Eingabe.
  // Bei mehreren Treffern die großzügigste.
  passend.sort((a, b) => b.creditsAnmeldung - a.creditsAnmeldung);
  const beste = passend[0];
  if (!beste) return null;
  return {
    id: beste.id,
    titel: beste.titel,
    creditsAnmeldung: beste.creditsAnmeldung,
    creditsEmpfehlung: beste.creditsEmpfehlung,
  };
}
