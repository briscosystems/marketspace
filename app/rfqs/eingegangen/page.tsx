import Link from "next/link";
import { MailCheck } from "lucide-react";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Anfrage eingegangen — Brisco Marketplace" };

/**
 * Bestätigung nach einer Anfrage ohne Konto.
 *
 * Die Anfrage-Detailseite kann noch nicht geöffnet werden, weil das Konto zwar
 * existiert, aber noch kein Passwort hat. Statt einer Fehlermeldung bekommt der
 * Besucher hier klar gesagt, was als Nächstes passiert.
 */
export default async function AnfrageEingegangenPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-xl">
      <div className="card text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <MailCheck size={26} />
        </span>
        <h1 className="page-title mt-4">{t("best.anfrageTitel")}</h1>
        <p className="mt-2 text-slate-600">
          {t("best.anfrageText")}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {t("best.spamHinweis")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/listings" className="btn-primary">
            {t("best.weiterKatalog")}
          </Link>
          <Link href="/forgot-password" className="btn-secondary">
            {t("best.neuerLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
