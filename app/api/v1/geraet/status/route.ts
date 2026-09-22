/**
 * REST-API v1 — Geräte-Endpunkt: Verbindung prüfen.
 *
 * Der erste Aufruf bei der Inbetriebnahme. Der Techniker trägt den Schlüssel
 * ein und sieht hier sofort, ob er stimmt — ohne ein Produkt kennen zu müssen.
 * Gibt nichts Vertrauliches preis: Name und Seriennummer sind die Angaben, die
 * der Besitzer selbst eingetragen hat.
 *
 *   GET /api/v1/geraet/status
 *   Authorization: Bearer brisco_…
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiAuthGeraet } from "@/lib/api-auth";
import { DROSSEL_GRENZE } from "@/lib/geraet-drossel";
import { MISCHBARE_KATEGORIEN } from "@/lib/kss-geraet";

export async function GET(req: Request) {
  const auth = await apiAuthGeraet(req);
  if (!auth.ok) return auth.response;

  const [schluessel, produkte, mitFaktor] = await Promise.all([
    prisma.apiKey.findUnique({
      where: { id: auth.caller.keyId },
      select: { name: true, geraetLabel: true, kind: true },
    }),
    prisma.product.count({ where: { category: { in: [...MISCHBARE_KATEGORIEN] as never[] } } }),
    prisma.product.count({
      where: {
        category: { in: [...MISCHBARE_KATEGORIEN] as never[] },
        refractometerFactor: { not: null },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    version: "1",
    serverZeit: new Date().toISOString(),
    schluessel: {
      name: schluessel?.name ?? null,
      geraet: schluessel?.geraetLabel ?? null,
      art: schluessel?.kind ?? null,
    },
    katalog: {
      wassermischbareProdukte: produkte,
      davonMitRefraktometerFaktor: mitFaktor,
    },
    grenzen: { aufrufeProMinute: DROSSEL_GRENZE },
  });
}
