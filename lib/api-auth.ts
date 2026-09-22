/**
 * Authentifizierung für die REST-Schnittstelle (/api/v1/*).
 *
 * Zugriff nur für Konten mit AKTIVER Marke-Stufe (höchstes Abo) — die Stufe
 * wird bei jedem Aufruf geprüft, nicht nur beim Anlegen des Schlüssels. Läuft
 * das Abo aus oder wird das Konto gesperrt, sind alle Schlüssel sofort wirkungslos.
 *
 * Schlüsselformat: "brisco_" + 48 Hex-Zeichen. Gespeichert wird nur der
 * sha256-Hash; der Klartext wird beim Anlegen genau einmal angezeigt.
 */
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeTier } from "@/lib/membership-tiers";
import { drossel, DROSSEL_GRENZE } from "@/lib/geraet-drossel";

export function generateApiKey(): string {
  return "brisco_" + randomBytes(24).toString("hex");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export type ApiCaller = {
  userId: string;
  keyId: string;
};

export type ApiAuthErgebnis =
  | { ok: true; caller: ApiCaller }
  | { ok: false; response: NextResponse };

function fehler(status: number, code: string, message: string): ApiAuthErgebnis {
  return {
    ok: false,
    response: NextResponse.json({ error: { code, message } }, { status }),
  };
}

/** Prüft den Authorization-Header und alle Zugangsvoraussetzungen. */
export async function apiAuth(req: Request): Promise<ApiAuthErgebnis> {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(brisco_[a-f0-9]{48})$/i.exec(header.trim());
  if (!m) {
    return fehler(
      401,
      "missing_key",
      "API-Schlüssel fehlt. Erwartet: Authorization: Bearer brisco_…",
    );
  }

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(m[1]) },
    select: {
      id: true,
      kind: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          blockedAt: true,
          membershipTier: true,
          membershipValidUntil: true,
        },
      },
    },
  });
  if (!key || key.revokedAt) {
    return fehler(401, "invalid_key", "API-Schlüssel ungültig oder widerrufen.");
  }
  if (key.user.blockedAt) {
    return fehler(403, "account_blocked", "Dieses Konto ist gesperrt.");
  }
  // Ein Geräte-Schlüssel darf NUR an die Geräte-Endpunkte. Er steckt in einer
  // Maschine in der Werkstatt, wo ihn jeder auslesen kann — damit darf man
  // weder den vollen Katalog abziehen noch KI-Aufrufe auslösen, die Credits
  // kosten. Auch dann nicht, wenn der Besitzer die Marke-Stufe hat.
  if (key.kind === "GERAET") {
    return fehler(
      403,
      "wrong_key_kind",
      "Das ist ein Geräte-Schlüssel. Er gilt nur für /api/v1/geraet/… — für den vollen Zugang bitte einen Plattform-Schlüssel anlegen.",
    );
  }
  const tier = activeTier({
    membershipTier: key.user.membershipTier,
    membershipValidUntil: key.user.membershipValidUntil,
  });
  if (tier !== "MARKE") {
    return fehler(
      403,
      "tier_required",
      "Die API steht nur Konten mit aktiver Marke-Stufe offen.",
    );
  }

  // Letzte Nutzung protokollieren — nie den eigentlichen Aufruf ausbremsen.
  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { ok: true, caller: { userId: key.user.id, keyId: key.id } };
}

/**
 * Authentifizierung für die GERÄTE-Endpunkte (/api/v1/geraet/*).
 *
 * Unterschied zu apiAuth(): Ein Schlüssel der Art GERAET braucht KEINE
 * Marke-Stufe (Betreiber 2026-09-22). Grund: Der eMix1500 steht beim Kunden
 * des Mischers — der ist nicht zwingend Marke-Mitglied. Das Gerät liest
 * ausschließlich Stammdaten, die auf den Produktseiten ohnehin öffentlich
 * stehen (Refraktometer-Faktor, Sollkonzentration, pH-Fenster).
 *
 * Ein PLATTFORM-Schlüssel darf die Geräte-Endpunkte ebenfalls benutzen —
 * dann aber mit der üblichen Marke-Prüfung. So kann ein Marke-Mitglied seine
 * bestehende Anbindung weiterverwenden.
 */
export async function apiAuthGeraet(req: Request): Promise<ApiAuthErgebnis> {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(brisco_[a-f0-9]{48})$/i.exec(header.trim());
  if (!m) {
    return fehler(
      401,
      "missing_key",
      "API-Schlüssel fehlt. Erwartet: Authorization: Bearer brisco_…",
    );
  }

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(m[1]) },
    select: {
      id: true,
      kind: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          blockedAt: true,
          membershipTier: true,
          membershipValidUntil: true,
        },
      },
    },
  });
  if (!key || key.revokedAt) {
    return fehler(401, "invalid_key", "API-Schlüssel ungültig oder widerrufen.");
  }
  if (key.user.blockedAt) {
    return fehler(403, "account_blocked", "Dieses Konto ist gesperrt.");
  }

  // Plattform-Schlüssel behalten die Marke-Pflicht; Geräte-Schlüssel nicht.
  if (key.kind === "PLATTFORM") {
    const tier = activeTier({
      membershipTier: key.user.membershipTier,
      membershipValidUntil: key.user.membershipValidUntil,
    });
    if (tier !== "MARKE") {
      return fehler(
        403,
        "tier_required",
        "Dieser Schlüssel gehört zu einem Konto ohne aktive Marke-Stufe. Für Maschinen bitte einen Geräte-Schlüssel anlegen.",
      );
    }
  }

  // Drossel: schützt die Datenbank vor einem Gerät, das im Sekundentakt fragt.
  const takt = drossel(key.id);
  if (!takt.erlaubt) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: "rate_limited",
            message: `Zu viele Aufrufe. Erlaubt sind ${DROSSEL_GRENZE} pro Minute je Schlüssel — in ${takt.wartenSekunden} Sekunden geht es weiter.`,
          },
        },
        { status: 429, headers: { "Retry-After": String(takt.wartenSekunden) } },
      ),
    };
  }

  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { ok: true, caller: { userId: key.user.id, keyId: key.id } };
}
