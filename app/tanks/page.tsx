import Link from "next/link";
import { QrTankScanner } from "@/components/QrTankScanner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { TankAnlegen } from "@/components/TankAnlegen";
import { bewerteMessung, schlechteste, standzeitWochen, type Ampel } from "@/lib/tank-bewertung";
import { Droplets, Gauge } from "lucide-react";

export const metadata = { title: "KSS-Management — Brisco Marketplace" };

const AMPEL_STIL: Record<Ampel, string> = {
  gut: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  achtung: "bg-amber-50 text-amber-800 ring-amber-200",
  kritisch: "bg-red-50 text-red-700 ring-red-200",
  unbekannt: "bg-slate-50 text-slate-600 ring-slate-200",
};

export default async function TanksPage() {
  const t = await getT();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card text-sm text-slate-600">
        {t("tank.pleaseLoginPre")}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t("tank.login")}
        </Link>
        {t("tank.pleaseLoginSuffix")}
      </div>
    );
  }

  const [tanks, produkte] = await Promise.all([
    prisma.coolantTank.findMany({
      where: { userId: session.user.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            name: true,
            refractometerFactor: true,
            recommendedConcentrationMin: true,
            recommendedConcentrationMax: true,
            phEmulsionMin: true,
            phEmulsionMax: true,
            manufacturer: { select: { name: true } },
          },
        },
        measurements: { orderBy: { measuredAt: "desc" }, take: 1 },
      },
    }),
    prisma.product.findMany({
      where: { category: "COOLANT_WATER_MIX" },
      select: { id: true, name: true, manufacturer: { select: { name: true } } },
      orderBy: [{ manufacturer: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const produktListe = produkte.map((p) => ({ id: p.id, label: `${p.manufacturer.name} ${p.name}` }));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Droplets className="h-6 w-6 text-brand-600" />
          {t("tank.title")}
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">{t("tank.intro")}</p>
        {/* Am Tank steht der QR-Aufkleber: scannen führt direkt ins
            Messformular dieses Tanks (Betreiber 2026-08-17). */}
        <div className="pt-1">
          <QrTankScanner />
        </div>
      </header>

      {tanks.length === 0 ? (
        <div className="card space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">{t("tank.emptyTitle")}</h2>
            <p className="max-w-2xl text-sm text-slate-600">{t("tank.emptyText")}</p>
          </div>
          <TankAnlegen produkte={produktListe} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tanks.map((tank) => {
              const letzte = tank.measurements[0];
              const befunde = letzte
                ? bewerteMessung(
                    {
                      brix: letzte.brix,
                      concentrationPct: letzte.concentrationPct,
                      ph: letzte.ph,
                      nitritePpm: letzte.nitritePpm,
                      bacteria: letzte.bacteria,
                    },
                    {
                      refractometerFactor: tank.product?.refractometerFactor ?? null,
                      recommendedConcentrationMin: tank.product?.recommendedConcentrationMin ?? null,
                      recommendedConcentrationMax: tank.product?.recommendedConcentrationMax ?? null,
                      phEmulsionMin: tank.product?.phEmulsionMin ?? null,
                      phEmulsionMax: tank.product?.phEmulsionMax ?? null,
                    },
                  )
                : [];
              const ampel = befunde.length ? schlechteste(befunde.map((b) => b.ampel)) : "unbekannt";
              const wochen = standzeitWochen(tank.filledAt);

              return (
                <Link
                  key={tank.id}
                  href={`/tanks/${tank.id}`}
                  className="card space-y-3 transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">{tank.name}</h3>
                      <p className="truncate text-xs text-slate-500">
                        {tank.product
                          ? `${tank.product.manufacturer.name} ${tank.product.name}`
                          : tank.productFreetext || t("tank.noProduct")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${AMPEL_STIL[ampel]}`}
                    >
                      {t(`tank.state.${ampel}`)}
                    </span>
                  </div>

                  {letzte ? (
                    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      {letzte.concentrationPct != null && (
                        <div>
                          <dt className="inline text-slate-500">{t("tank.concShort")}: </dt>
                          <dd className="inline font-medium text-slate-800">
                            {letzte.concentrationPct.toString().replace(".", ",")} %
                          </dd>
                        </div>
                      )}
                      {letzte.ph != null && (
                        <div>
                          <dt className="inline text-slate-500">pH: </dt>
                          <dd className="inline font-medium text-slate-800">
                            {letzte.ph.toString().replace(".", ",")}
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs text-slate-500">{t("tank.noMeasurement")}</p>
                  )}

                  <p className="text-xs text-slate-500">
                    {wochen != null
                      ? fill(t("tank.runningWeeks"), { weeks: String(wochen) })
                      : t("tank.noFillDate")}
                  </p>
                </Link>
              );
            })}
          </div>

          <TankAnlegen produkte={produktListe} />
        </>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
        <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>{t("tank.privacyNote")}</span>
      </p>
    </div>
  );
}
