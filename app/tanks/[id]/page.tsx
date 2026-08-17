import Link from "next/link";
import { MessreiheChart } from "@/components/MessreiheChart";
import { TankTeilen } from "@/components/TankTeilen";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { MessungErfassen } from "@/components/MessungErfassen";
import { OberflaechenScanner } from "@/components/OberflaechenScanner";
import {
  bewerteMessung,
  schlechteste,
  standzeitWochen,
  nachdosierLiter,
  type Ampel,
} from "@/lib/tank-bewertung";
import { Mischungsrechner } from "@/components/Mischungsrechner";
import { ArrowLeft, Droplets, Mic, QrCode } from "lucide-react";

const AMPEL_STIL: Record<Ampel, string> = {
  gut: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  achtung: "bg-amber-50 text-amber-800 ring-amber-200",
  kritisch: "bg-red-50 text-red-700 ring-red-200",
  unbekannt: "bg-slate-50 text-slate-600 ring-slate-200",
};

export default async function TankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
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

  const tank = await prisma.coolantTank.findFirst({
    where: { id, userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          refractometerFactor: true,
          recommendedConcentrationMin: true,
          recommendedConcentrationMax: true,
          phEmulsionMin: true,
          phEmulsionMax: true,
          manufacturer: { select: { name: true, slug: true } },
        },
      },
      measurements: { orderBy: { measuredAt: "desc" }, take: 50 },
      freigaben: { select: { userId: true, user: { select: { pseudonym: true } } } },
    },
  });
  if (!tank) notFound();

  const soll = {
    refractometerFactor: tank.product?.refractometerFactor ?? null,
    recommendedConcentrationMin: tank.product?.recommendedConcentrationMin ?? null,
    recommendedConcentrationMax: tank.product?.recommendedConcentrationMax ?? null,
    phEmulsionMin: tank.product?.phEmulsionMin ?? null,
    phEmulsionMax: tank.product?.phEmulsionMax ?? null,
  };

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
        soll,
      )
    : [];
  const ampel = befunde.length ? schlechteste(befunde.map((b) => b.ampel)) : "unbekannt";
  const wochen = standzeitWochen(tank.filledAt);

  // Nachdosieren: Ziel ist die Mitte des empfohlenen Fensters.
  const ziel =
    soll.recommendedConcentrationMin != null && soll.recommendedConcentrationMax != null
      ? (soll.recommendedConcentrationMin + soll.recommendedConcentrationMax) / 2
      : null;
  const nachdosieren = nachdosierLiter(tank.volumeLiters, letzte?.concentrationPct ?? null, ziel);

  return (
    <div className="space-y-6">
      <Link href="/tanks" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        {t("tank.backToList")}
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Droplets className="h-6 w-6 text-brand-600" />
            {tank.name}
          </h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${AMPEL_STIL[ampel]}`}>
            {t(`tank.state.${ampel}`)}
          </span>
        </div>
        <p className="text-sm text-slate-600">
          {tank.product ? (
            <Link
              href={`/products/${tank.product.manufacturer.slug}/${tank.product.slug}`}
              className="text-brand-600 hover:underline"
            >
              {tank.product.manufacturer.name} {tank.product.name}
            </Link>
          ) : (
            tank.productFreetext || t("tank.noProduct")
          )}
          {tank.machine && ` · ${tank.machine}`}
          {tank.volumeLiters != null && ` · ${tank.volumeLiters.toString().replace(".", ",")} l`}
          {tank.waterHardnessDh != null &&
            ` · ${fill(t("tank.hardnessValue"), { dh: tank.waterHardnessDh.toString().replace(".", ",") })}`}
        </p>
        {wochen != null && (
          <p className="text-sm text-slate-500">{fill(t("tank.runningWeeks"), { weeks: String(wochen) })}</p>
        )}
      </header>

      {befunde.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{t("tank.assessmentTitle")}</h2>
          <ul className="space-y-2">
            {befunde.map((b) => (
              <li key={b.feld} className={`rounded-xl p-3 text-sm ring-1 ${AMPEL_STIL[b.ampel]}`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <strong className="font-semibold">{b.feld}:</strong>
                  <span>{b.wert}</span>
                  {b.soll && <span className="text-xs opacity-80">({t("tank.target")} {b.soll})</span>}
                </div>
                {b.hinweis && <p className="mt-1 text-xs opacity-90">{b.hinweis}</p>}
              </li>
            ))}
          </ul>
          {nachdosieren != null && (
            <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
              {fill(t("tank.topUp"), {
                liter: nachdosieren.toString().replace(".", ","),
                ziel: (ziel ?? 0).toString().replace(".", ","),
              })}
            </p>
          )}
        </section>
      )}

      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">{t("tank.labelTitle")}</h2>
        </div>
        <p className="text-sm text-slate-600">{t("tank.labelText")}</p>
        <a
          href={`/api/tanks/${tank.id}/etikett`}
          className="btn-primary inline-flex items-center gap-2"
          download
        >
          <QrCode className="h-4 w-4" />
          {t("tank.labelDownload")}
        </a>
      </section>

      <MessungErfassen tankId={tank.id} refraktometerFaktor={soll.refractometerFactor} />

      {/* Messwerte sagen, wie der Tank dasteht — das Foto zeigt, was kein
          Messgerät sieht: Fremdöl, Schaum, Beläge, Späne (Betreiber 2026-08-11). */}
      <OberflaechenScanner produktId={tank.product?.id} />

      {/* Verlauf als Diagramm mit hinterlegten Sollwerten (Betreiber 2026-08-17). */}
      <MessreiheChart
        punkte={tank.measurements.map((m) => ({
          datum: m.measuredAt.toISOString(),
          konzentration: m.concentrationPct,
          ph: m.ph,
          nitrit: m.nitritePpm,
        }))}
        sollKonzMin={soll.recommendedConcentrationMin}
        sollKonzMax={soll.recommendedConcentrationMax}
        sollPhMin={soll.phEmulsionMin}
        sollPhMax={soll.phEmulsionMax}
      />

      {/* Bericht als PDF holen und den Tank lesend mit anderen teilen. */}
      <TankTeilen
        tankId={tank.id}
        hatMessungen={tank.measurements.length > 0}
        freigaben={tank.freigaben.map((f) => ({ userId: f.userId, pseudonym: f.user.pseudonym }))}
      />

      <Mischungsrechner
        tankVolumen={tank.volumeLiters}
        sollMin={soll.recommendedConcentrationMin}
        sollMax={soll.recommendedConcentrationMax}
        istKonzentration={letzte?.concentrationPct ?? null}
      />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{t("tank.historyTitle")}</h2>
        {tank.measurements.length === 0 ? (
          <p className="text-sm text-slate-500">{t("tank.noMeasurement")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3 font-medium">{t("tank.colDate")}</th>
                  <th className="py-2 pr-3 font-medium">{t("tank.concShort")}</th>
                  <th className="py-2 pr-3 font-medium">pH</th>
                  <th className="py-2 pr-3 font-medium">{t("tank.mNitrite")}</th>
                  <th className="py-2 font-medium">{t("tank.colNote")}</th>
                </tr>
              </thead>
              <tbody>
                {tank.measurements.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-600">
                      {m.measuredAt.toLocaleDateString("de-CH")}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {m.concentrationPct != null
                        ? `${m.concentrationPct.toString().replace(".", ",")} %`
                        : "–"}
                    </td>
                    <td className="py-2 pr-3 text-slate-800">
                      {m.ph != null ? m.ph.toString().replace(".", ",") : "–"}
                    </td>
                    <td className="py-2 pr-3 text-slate-800">
                      {m.nitritePpm != null ? `${m.nitritePpm.toString().replace(".", ",")} mg/l` : "–"}
                    </td>
                    <td className="py-2 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        {m.source === "VOICE" && <Mic className="h-3 w-3 text-slate-400" />}
                        {m.note || "–"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
