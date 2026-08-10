/**
 * Divinol als Handelsmarke von Zeller+Gmelin kenntlich machen — 2026-08-10.
 *
 * Warum: Divinol und Zeller+Gmelin stehen beide als Hersteller im Katalog, und
 * das ist auch richtig so — der Betreiber hat klargestellt: **Divinol ist die
 * Marke, unter der Zeller+Gmelin über den Fachhandel verkauft.** Beide
 * Bezeichnungen begegnen dem Einkäufer in der Praxis, je nachdem, ob er direkt
 * beim Hersteller oder beim Händler kauft.
 *
 * Deshalb wird hier NICHTS zusammengelegt und nichts gelöscht. Es wird nur
 * vermerkt, dass hinter Divinol Zeller+Gmelin steht — zurückhaltend formuliert:
 * eine Aussage über den Vertriebsweg, keine über Rezeptur-Gleichheit. Ob ein
 * Divinol-Produkt und ein gleichnamiges Zeller-Produkt identisch sind, steht
 * hier ausdrücklich nicht.
 *
 * IDEMPOTENT: Setzt die Texte nur, wenn sie noch nicht stehen.
 */
import { prisma } from "../lib/prisma";

const DIVINOL_TEXT =
  "Divinol ist die Handelsmarke der Zeller+Gmelin GmbH & Co. KG (Eislingen/Fils). " +
  "Unter diesem Namen vertreibt Zeller+Gmelin seine Schmierstoffe über den Fachhandel; " +
  "im Direktgeschäft und bei den Industrieprodukten (Multicut, Multidraw, Zubora) " +
  "tritt das Unternehmen unter dem eigenen Namen auf. Ob ein bestimmtes " +
  "Divinol-Produkt einem gleichnamigen Zeller+Gmelin-Produkt entspricht, ist damit " +
  "nicht gesagt — dafür bitte das jeweilige Datenblatt vergleichen.";

const ZELLER_TEXT =
  "Zeller+Gmelin GmbH & Co. KG, Eislingen/Fils — Hersteller von Kühlschmierstoffen " +
  "(Marke Zubora), Umform- und Schleifmedien (Multidraw, Multicut) sowie " +
  "Schmierstoffen. Über den Fachhandel verkauft das Unternehmen unter der " +
  "Handelsmarke Divinol.";

export async function applyDivinolMarke2026_08_10(): Promise<string> {
  let geaendert = 0;

  const d = await prisma.manufacturer.updateMany({
    where: { name: "Divinol", NOT: { description: { contains: "Handelsmarke" } } },
    data: { description: DIVINOL_TEXT },
  });
  geaendert += d.count;

  const z = await prisma.manufacturer.updateMany({
    where: { name: "Zeller+Gmelin", OR: [{ description: null }, { description: "" }] },
    data: { description: ZELLER_TEXT },
  });
  geaendert += z.count;

  return geaendert ? `${geaendert} Hersteller-Beschreibung(en) gesetzt` : "nichts zu tun (bereits vermerkt)";
}
