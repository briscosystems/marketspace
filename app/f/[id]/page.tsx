/**
 * Ziel des QR-Codes: die Aufnahmeseite auf dem Handy.
 *
 * Bewusst ohne Anmeldung — der Nutzer hat den Code gerade an seinem eigenen
 * Rechner erzeugt und mit seinem eigenen Handy gescannt. Ihn hier noch einmal
 * anmelden zu lassen wäre genau die Hürde, die diese Funktion beseitigt.
 * Der Schutz liegt in der Adresse: kurzlebig, nicht erratbar, genau ein Bild.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { HandyAufnahme } from "@/components/HandyAufnahme";
import { Camera } from "lucide-react";

export const metadata = {
  title: "Foto aufnehmen — Brisco Marketplace",
  robots: { index: false, follow: false },
};

export default async function HandyFotoPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;

  const uebergabe = await prisma.photoHandoff.findUnique({
    where: { id },
    select: { id: true, expiresAt: true, uploadedAt: true },
  });
  if (!uebergabe) notFound();

  const abgelaufen = uebergabe.expiresAt < new Date();

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header className="space-y-1 text-center">
        <Camera className="mx-auto h-8 w-8 text-brand-600" />
        <h1 className="text-xl font-bold text-slate-900">{t("handy.title")}</h1>
      </header>

      {abgelaufen ? (
        <div className="card text-center text-sm text-slate-700">{t("handy.expired")}</div>
      ) : uebergabe.uploadedAt ? (
        <div className="card text-center text-sm text-slate-700">{t("handy.already")}</div>
      ) : (
        <HandyAufnahme id={uebergabe.id} />
      )}
    </div>
  );
}
