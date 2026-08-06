/**
 * Korrektur „AVILUB METACORIN 833" (Avia Bantleon) — 2026-08-05.
 *
 * Warum: Der Eintrag stammt aus dem automatischen Aufbau aus dem
 * SDS-Bestand („Auto-generiert aus SDS-Bestand") und war durchgehend falsch
 * eingeordnet — er stand als wassermischbarer Kühlschmierstoff mit
 * Emulsionsform in der Datenbank, trug aber gleichzeitig die Beschreibung
 * „Nicht-wassermischbares Schneidöl". Aufgefallen beim Sollwerte-Sprint.
 *
 * Beleg: Technische Information AVILUB METACORIN 833, Hermann Bantleon GmbH,
 * Art.-Nr. 6833, Version 06 vom 2020-04-03 (PDF vom Betreiber bereitgestellt,
 * abrufbar unter der hinterlegten dataSheetUrl). Danach ist das Produkt ein
 * GEBRAUCHSFERTIGES Korrosionsschutzmittel mit Dewatering-Effekt für die
 * innerbetriebliche Zwischenlagerung — kein Kühlschmierstoff:
 *   - „auf bariumfreien Korrosionsschutzadditiven aufgebaut"
 *   - „entwässert und konserviert alle zu schützenden Metalle mit einem
 *     alterungsstabilen Korrosionsschutzfilm"
 *   - Applikation durch Tauchen, Tränken, Sprühen — nicht verdünnen
 *   - LABS-frei nach Volkswagen AG PV 3.10.7:2005-2
 *   - Dichte bei 15 °C: 786 kg/m³ = 0,786 g/cm³
 *   - Schichtdicke 2 µm, Ergiebigkeit 130 m²/l (Tauchen)
 *   - Schutzdauer: Innenlagerung 5–7 Monate, Außenlagerung unter Dach 2–3 Monate
 *
 * IDEMPOTENT: Die Korrektur greift nur, solange die Kategorie noch auf
 * COOLANT_WATER_MIX steht. Ein zweiter Lauf tut nichts.
 */
import { prisma } from "../lib/prisma";

export async function fixMetacorin833_2026_08_05(): Promise<string> {
  const r = await prisma.product.updateMany({
    where: {
      slug: "avilub-metacorin-833",
      category: "COOLANT_WATER_MIX",
    },
    data: {
      category: "CORROSION_PROTECTION",
      chemistry: "MINERAL",
      description:
        "Gebrauchsfertiges Korrosionsschutzmittel mit Dewatering-Effekt auf Basis bariumfreier Korrosionsschutzadditive. Entwässert und konserviert Metallteile mit einem alterungsstabilen Schutzfilm — für die innerbetriebliche Zwischenlagerung nach der spanabhebenden Bearbeitung. Anwendung unverdünnt durch Tauchen, Tränken oder Sprühen.",
      applicationAreas: ["Zwischenlagerung", "Konservierung", "Korrosionsschutz"],
      // Kein Kühlschmierstoff → keine Emulsionsform, keine Zerspanungs-Werkstoffliste.
      concentrateForm: null,
      suitableMaterials: [],
      certifications: ["LABS-frei nach VW PV 3.10.7:2005-2"],
      densityGcm3: 0.786,
      sourceConfidence: "verifiziert",
      notes:
        "Korrigiert 2026-08-05 nach dem Original-Datenblatt (Technische Information, Art.-Nr. 6833, Version 06 vom 2020-04-03): kein Kühlschmierstoff, sondern gebrauchsfertiger Korrosionsschutz mit Dewatering-Effekt. Schichtdicke 2 µm, Ergiebigkeit 130 m²/l (Tauchen). Schutzdauer: Innenlagerung 5–7 Monate, Außenlagerung unter Dach 2–3 Monate. Abreinigung mit AVILUB METASOLV 706 (KW-Lösemittel) oder AVILUB METACLEAN (wässrig-alkalisch). Der frühere Eintrag stammte aus dem automatischen Aufbau aus dem SDS-Bestand und war falsch eingeordnet.",
    },
  });
  return r.count ? "Metacorin 833 als Korrosionsschutz korrigiert" : "nichts zu tun (bereits korrigiert)";
}
