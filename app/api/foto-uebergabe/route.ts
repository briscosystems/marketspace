/**
 * Foto-Übergabe vom Handy an den Rechner — Schritt 1: Übergabe eröffnen.
 *
 * Der Rechner fragt hier einen QR-Code an. Der Nutzer scannt ihn mit dem
 * Handy, landet auf einer schlanken Aufnahmeseite, fotografiert das Etikett —
 * und das Bild erscheint auf dem Rechner, ohne dass er es je selbst
 * herunterladen und hochladen musste.
 *
 * Der QR-Code enthält nur eine kurzlebige Adresse (15 Minuten). Wer sie hat,
 * darf genau ein Bild hochladen und sonst nichts.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

/** Wie lange eine Übergabe offen bleibt. */
const GUELTIG_MINUTEN = 15;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }

  // Alte, abgelaufene Übergaben desselben Nutzers wegräumen — die Tabelle ist
  // ein Briefkasten, kein Archiv.
  await prisma.photoHandoff
    .deleteMany({ where: { userId: session.user.id, expiresAt: { lt: new Date() } } })
    .catch(() => {});

  const uebergabe = await prisma.photoHandoff.create({
    data: {
      userId: session.user.id,
      expiresAt: new Date(Date.now() + GUELTIG_MINUTEN * 60_000),
    },
    select: { id: true, expiresAt: true },
  });

  const url = `${siteUrl()}/f/${uebergabe.id}`;
  const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width: 420 });

  return NextResponse.json({ id: uebergabe.id, url, qr, gueltigBis: uebergabe.expiresAt });
}
