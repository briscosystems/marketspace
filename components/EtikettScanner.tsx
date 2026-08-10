"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Loader2, TriangleAlert, CheckCircle2, ImageUp } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

type Treffer = {
  name: string;
  slug: string;
  refractometerFactor: number | null;
  recommendedConcentrationMin: number | null;
  recommendedConcentrationMax: number | null;
  manufacturer: { name: string; slug: string };
  issues: { id: string; title: string; severity: string; description: string }[];
  experienceReports: { id: string; text: string; problems: string[]; outcome: string | null }[];
} | null;

type Ergebnis = {
  gelesen: {
    hersteller: string | null;
    produkt: string | null;
    gebinde: string | null;
    charge: string | null;
    lesbarkeit: string;
    hinweis: string | null;
  };
  treffer: Treffer;
  saldo: number;
};

/**
 * Foto vom Produktetikett → die Seite erkennt das Produkt und zeigt sofort,
 * was andere darüber gemeldet haben.
 *
 * Das Bild wird im Browser auf 1400 px verkleinert, bevor es hochgeht —
 * ein Handyfoto hat sonst 6–12 MB.
 */
export function EtikettScanner() {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);

  async function verkleinern(datei: File): Promise<string> {
    const bitmap = await createImageBitmap(datei);
    const faktor = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * faktor);
    c.height = Math.round(bitmap.height * faktor);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }

  async function auswerten(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    setBusy(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const bild = await verkleinern(datei);
      setVorschau(bild);
      const res = await fetch("/api/etikett-erkennen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bild }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("scan.errGeneric"));
      setErgebnis(data);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("scan.errGeneric"));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">{t("scan.title")}</h2>
        </div>
        <p className="text-sm text-slate-600">{t("scan.intro")}</p>

        <div className="flex flex-wrap gap-3">
          <label className="btn-primary inline-flex cursor-pointer items-center gap-2">
            <Camera className="h-4 w-4" />
            {t("scan.take")}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={auswerten}
              className="hidden"
              disabled={busy}
            />
          </label>
          <label className="btn-secondary inline-flex cursor-pointer items-center gap-2">
            <ImageUp className="h-4 w-4" />
            {t("scan.fromGallery")}
            <input type="file" accept="image/*" onChange={auswerten} className="hidden" disabled={busy} />
          </label>
          <span className="chip bg-brand-50 text-brand-800">{t("scan.cost")}</span>
        </div>

        {busy && (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("scan.working")}
          </p>
        )}
        {fehler && <p className="text-sm text-red-600">{fehler}</p>}
        {vorschau && !busy && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vorschau} alt="" className="max-h-48 rounded-lg ring-1 ring-slate-200" />
        )}
      </section>

      {ergebnis && (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t("scan.readTitle")}</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{t("scan.fManufacturer")}</dt>
              <dd className="font-medium text-slate-900">{ergebnis.gelesen.hersteller ?? "–"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("scan.fProduct")}</dt>
              <dd className="font-medium text-slate-900">{ergebnis.gelesen.produkt ?? "–"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("scan.fPack")}</dt>
              <dd className="text-slate-800">{ergebnis.gelesen.gebinde ?? "–"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("scan.fBatch")}</dt>
              <dd className="text-slate-800">{ergebnis.gelesen.charge ?? "–"}</dd>
            </div>
          </dl>
          {ergebnis.gelesen.hinweis && (
            <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
              {ergebnis.gelesen.hinweis}
            </p>
          )}

          {ergebnis.treffer ? (
            <div className="space-y-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <p className="text-sm text-emerald-900">
                {t("scan.matched")}{" "}
                <Link
                  href={`/products/${ergebnis.treffer.manufacturer.slug}/${ergebnis.treffer.slug}`}
                  className="font-semibold underline"
                >
                  {ergebnis.treffer.manufacturer.name} {ergebnis.treffer.name}
                </Link>
              </p>
              {ergebnis.treffer.recommendedConcentrationMin != null && (
                <p className="text-sm text-emerald-900">
                  {fill(t("scan.targets"), {
                    min: String(ergebnis.treffer.recommendedConcentrationMin).replace(".", ","),
                    max: String(ergebnis.treffer.recommendedConcentrationMax ?? "?").replace(".", ","),
                    faktor: String(ergebnis.treffer.refractometerFactor ?? "?").replace(".", ","),
                  })}
                </p>
              )}

              {ergebnis.treffer.issues.length > 0 ? (
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                    <TriangleAlert className="h-4 w-4" />
                    {fill(t("scan.issues"), { n: String(ergebnis.treffer.issues.length) })}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-700">
                    {ergebnis.treffer.issues.map((i) => (
                      <li key={i.id} className="rounded bg-white/70 p-2">
                        <strong>{i.title}</strong>
                        <span className="block text-xs text-slate-600">
                          {i.description.slice(0, 160)}
                          {i.description.length > 160 ? "…" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("scan.noIssues")}
                </p>
              )}

              {ergebnis.treffer.experienceReports.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {fill(t("scan.reports"), {
                      n: String(ergebnis.treffer.experienceReports.length),
                    })}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-700">
                    {ergebnis.treffer.experienceReports.map((r) => (
                      <li key={r.id} className="rounded bg-white/70 p-2 text-xs">
                        {r.text.slice(0, 200)}
                        {r.text.length > 200 ? "…" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">{t("scan.noMatch")}</p>
          )}
        </section>
      )}
    </div>
  );
}
