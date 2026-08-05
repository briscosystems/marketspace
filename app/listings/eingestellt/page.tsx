import Link from "next/link";
import { PackageCheck, Camera } from "lucide-react";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Angebot eingestellt — Brisco Marketplace" };

/**
 * Bestätigung nach einem Angebot ohne vorheriges Konto.
 *
 * Das Angebot ist sofort öffentlich; die Bearbeitung (Fotos, Preis) ist erst
 * möglich, wenn das Passwort gesetzt ist. Das sagen wir hier klar, statt den
 * Anbieter in eine gesperrte Seite laufen zu lassen.
 */
export default async function AngebotEingestelltPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const t = await getT();
  return (
    <div className="mx-auto max-w-xl">
      <div className="card text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <PackageCheck size={26} />
        </span>
        <h1 className="page-title mt-4">{t("best.angebotTitel")}</h1>
        <p className="mt-2 text-slate-600">
          {t("best.angebotText")}
        </p>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left text-sm text-blue-900">
          <Camera size={17} className="mt-0.5 shrink-0" />
          <span>
            {t("best.fotoHinweis")}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {id && (
            <Link href={`/listings/${id}`} className="btn-primary">
              {t("best.angebotAnsehen")}
            </Link>
          )}
          <Link href="/forgot-password" className="btn-secondary">
            {t("best.neuerLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
