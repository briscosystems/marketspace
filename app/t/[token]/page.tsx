/**
 * Ziel des QR-Codes am Tank.
 *
 * Absicht: Vom Scannen bis zum gespeicherten Messwert soll es so kurz wie
 * möglich sein — der Aufkleber klebt an der Maschine, das Handy ist in der
 * Hand, die Finger sind ölig. Deshalb landet der Scan direkt im Messformular
 * für genau diesen Tank; nichts suchen, nichts auswählen.
 *
 * Bewusst KEIN Messverlauf auf dieser Seite: Der Schlüssel aus dem QR-Code
 * erlaubt nur das Eintragen. Die Messreihe sieht nur, wer angemeldet ist —
 * ein abfotografierter Aufkleber gibt also keine Betriebsdaten preis.
 */
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { MessungErfassen } from "@/components/MessungErfassen";
import { Mischungsrechner } from "@/components/Mischungsrechner";
import { Droplets } from "lucide-react";

export const metadata = {
  title: "Messwert eintragen — Brisco Marketplace",
  robots: { index: false, follow: false },
};

export default async function QrMessungPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;
  const session = await getServerSession(authOptions);

  const tank = await prisma.coolantTank.findFirst({
    where: { qrToken: token, archivedAt: null },
    select: {
      id: true,
      name: true,
      machine: true,
      volumeLiters: true,
      productFreetext: true,
      product: {
        select: {
          name: true,
          refractometerFactor: true,
          recommendedConcentrationMin: true,
          recommendedConcentrationMax: true,
          manufacturer: { select: { name: true } },
        },
      },
    },
  });
  if (!tank) notFound();

  const produkt = tank.product
    ? `${tank.product.manufacturer.name} ${tank.product.name}`
    : tank.productFreetext;
  const soll =
    tank.product?.recommendedConcentrationMin != null &&
    tank.product?.recommendedConcentrationMax != null
      ? `${tank.product.recommendedConcentrationMin}–${tank.product.recommendedConcentrationMax} %`
      : null;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Droplets className="h-5 w-5 text-brand-600" />
          {tank.name}
        </h1>
        <p className="text-sm text-slate-600">
          {produkt || t("tank.noProduct")}
          {tank.machine && ` · ${tank.machine}`}
          {tank.volumeLiters != null && ` · ${String(tank.volumeLiters).replace(".", ",")} l`}
        </p>
        {soll && (
          <p className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            {t("tank.target")} {soll}
          </p>
        )}
      </header>

      <MessungErfassen
        tankId={tank.id}
        refraktometerFaktor={tank.product?.refractometerFactor ?? null}
        istQr
        token={token}
      />

      {/* Foto-Schätzung nur für Angemeldete (2026-08-19): Sie kostet einen
          Credit. Über den QR-Code kommt man ohne Konto herein — dann dürfte
          ein Fremder das Guthaben des Betriebs verbrauchen. Messwerte
          eintragen bleibt wie bisher ohne Anmeldung möglich. */}
      <Mischungsrechner
        tankId={session?.user?.id ? tank.id : undefined}
        tankVolumen={tank.volumeLiters}
        sollMin={tank.product?.recommendedConcentrationMin ?? null}
        sollMax={tank.product?.recommendedConcentrationMax ?? null}
      />

      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        {t("tank.qrPrivacy")}{" "}
        <Link href="/tanks" className="text-brand-600 hover:underline">
          {t("tank.qrToRegister")}
        </Link>
      </p>
    </div>
  );
}
