import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { EtikettScanner } from "@/components/EtikettScanner";
import { Camera } from "lucide-react";

export const metadata = { title: "Produkt am Etikett erkennen — Brisco Marketplace" };

export default async function ErkennenPage() {
  const t = await getT();
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Camera className="h-6 w-6 text-brand-600" />
          {t("scan.pageTitle")}
        </h1>
        <p className="text-sm text-slate-600">{t("scan.pageIntro")}</p>
      </header>

      {session?.user?.id ? (
        <EtikettScanner />
      ) : (
        <div className="card space-y-3">
          <p className="text-sm text-slate-700">{t("scan.needLogin")}</p>
          <Link href="/login" className="btn-primary inline-flex">
            {t("scan.login")}
          </Link>
        </div>
      )}
    </div>
  );
}
