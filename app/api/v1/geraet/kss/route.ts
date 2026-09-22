/**
 * REST-API v1 — Geräte-Endpunkt: KSS-Typ auflösen.
 *
 * Für den eMix1500 und ähnliche Mischer (Betreiber 2026-09-22). Das Gerät
 * schickt den Kühlschmierstoff so, wie er in seiner Steuerung steht, und
 * bekommt den Umrechnungsfaktor Brix → Konzentration samt Sollfenster zurück.
 *
 *   GET /api/v1/geraet/kss?typ=B-Cool%20755&hersteller=blaser
 *   Authorization: Bearer brisco_…
 *
 * Parameter:
 *   typ         Pflicht, der KSS-Name aus der Maschinensteuerung
 *   hersteller  freiwillig, Name oder Slug — grenzt stark ein
 *   alle        "1" = auch Nicht-Emulsionen durchsuchen (Standard: nur
 *               wassermischbare KSS, alles andere kann ein Mischer nicht)
 *
 * Antwort:
 *   { eindeutig: true,  treffer: {…}, kandidaten: [] }   → Gerät kann rechnen
 *   { eindeutig: false, treffer: null, kandidaten: [ …bis 10… ] }
 *                                                        → Bediener wählt aus
 *
 * **Es wird nicht geraten.** Passen zwei Namen fast gleich gut, kommt bewusst
 * kein eindeutiger Treffer zurück — ein falscher Faktor setzt die Emulsion
 * falsch an.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuthGeraet } from "@/lib/api-auth";
import { bewerte, entscheide, type MatchKandidat } from "@/lib/kss-matching";
import { normalizeForSearch } from "@/lib/normalize-search";
import { GERAET_AUSWAHL, fuerGeraet, MISCHBARE_KATEGORIEN } from "@/lib/kss-geraet";

export async function GET(req: Request) {
  const auth = await apiAuthGeraet(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const typ = (url.searchParams.get("typ") ?? "").trim();
  const hersteller = (url.searchParams.get("hersteller") ?? "").trim();
  const alle = url.searchParams.get("alle") === "1";

  if (typ.length < 2) {
    return NextResponse.json(
      { error: { code: "missing_typ", message: "Parameter „typ“ fehlt (mindestens 2 Zeichen)." } },
      { status: 400 },
    );
  }

  // Vorauswahl über die Datenbank: Herstellerfilter und — sofern möglich —
  // ein Teiltreffer auf den Suchtoken. Die Feinbewertung macht danach
  // lib/kss-matching.ts, weil sie Tippfehler verzeiht.
  const tokens = normalizeForSearch(typ);
  const herstellerFilter = hersteller
    ? {
        manufacturer: {
          OR: [
            { slug: { equals: hersteller, mode: "insensitive" as const } },
            { name: { contains: hersteller, mode: "insensitive" as const } },
          ],
        },
      }
    : {};

  const grundmenge = {
    ...(alle ? {} : { category: { in: [...MISCHBARE_KATEGORIEN] as never[] } }),
    ...herstellerFilter,
  };

  // Zuerst eng suchen (Teiltreffer im Suchtoken). Findet das nichts — etwa bei
  // einem Tippfehler —, die Grundmenge breiter laden und rechnerisch prüfen.
  let produkte = await prisma.product.findMany({
    where: { ...grundmenge, searchTokens: { contains: tokens } },
    select: GERAET_AUSWAHL,
    take: 50,
  });
  if (produkte.length === 0) {
    produkte = await prisma.product.findMany({
      where: grundmenge,
      select: GERAET_AUSWAHL,
      take: hersteller ? 400 : 1500,
    });
  }

  const kandidaten: MatchKandidat<(typeof produkte)[number]>[] = [];
  for (const p of produkte) {
    const b = bewerte(typ, p.name, p.manufacturer.name);
    if (b) kandidaten.push({ produkt: p, punkte: b.punkte, art: b.art });
  }

  const { eindeutig, beste, alle: sortiert } = entscheide(kandidaten);

  if (eindeutig && beste) {
    return NextResponse.json({
      eindeutig: true,
      treffer: { ...fuerGeraet(beste.produkt), trefferGuete: beste.punkte, trefferArt: beste.art },
      kandidaten: [],
      hinweis:
        beste.produkt.refractometerFactor == null
          ? "Für dieses Produkt ist kein Refraktometer-Faktor hinterlegt. Bitte den Faktor aus dem Datenblatt des Herstellers verwenden — die Plattform rät keinen."
          : null,
    });
  }

  // Kein eindeutiger Treffer: Wenigstens den Hersteller erkennen, damit das
  // Gerät direkt dessen Produktliste anzeigen kann statt in einer Sackgasse zu
  // stehen. Steht schon ein Hersteller im Aufruf, gilt der.
  const herstellerTreffer = await herstellerErkennen(hersteller || typ);

  return NextResponse.json({
    eindeutig: false,
    treffer: null,
    kandidaten: sortiert.slice(0, 10).map((k) => ({
      ...fuerGeraet(k.produkt),
      trefferGuete: k.punkte,
      trefferArt: k.art,
    })),
    herstellerTreffer,
    hinweis:
      sortiert.length > 0
        ? "Mehrere Produkte passen ähnlich gut. Bitte am Gerät auswählen lassen — es wird bewusst nicht geraten."
        : herstellerTreffer
          ? `Kein passender Kühlschmierstoff gefunden. Der Hersteller „${herstellerTreffer.name}“ ist aber bekannt — seine Produkte stehen unter /api/v1/geraet/produkte?hersteller=${herstellerTreffer.slug}.`
          : "Kein passender Kühlschmierstoff gefunden. Bitte Hersteller mitgeben oder über /api/v1/geraet/hersteller auswählen.",
  });
}

/**
 * Steckt in der Eingabe ein bekannter Herstellername?
 *
 * Auch der erste Namensteil zählt, weil im Gerät meist „Blaser" statt
 * „Blaser Swisslube" steht. Gibt es mehrere Treffer, gewinnt der längste —
 * der ist der genauere.
 */
async function herstellerErkennen(eingabe: string) {
  const text = normalizeForSearch(eingabe);
  if (text.length < 3) return null;

  const alle = await prisma.manufacturer.findMany({ select: { id: true, name: true, slug: true } });
  let beste: { id: string; name: string; slug: string } | null = null;
  let besteLaenge = 0;

  for (const h of alle) {
    const voll = normalizeForSearch(h.name);
    const ersterTeil = normalizeForSearch(h.name.split(/[\s-]+/)[0] ?? "");
    for (const kandidat of [voll, ersterTeil]) {
      if (kandidat.length >= 4 && text.includes(kandidat) && kandidat.length > besteLaenge) {
        beste = h;
        besteLaenge = kandidat.length;
      }
    }
  }
  return beste;
}
