"use client";

import { useState } from "react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Camera, Loader2, TriangleAlert, CheckCircle2, ImageUp, Smartphone, X } from "lucide-react";
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
  // Handy-Übergabe: QR-Code am Rechner erzeugen, das Handy fotografiert,
  // das Bild kommt von selbst hier an (Betreiber 2026-08-10).
  const [qr, setQr] = useState<{ id: string; qr: string; url: string } | null>(null);
  const [warte, setWarte] = useState(false);
  const abholung = useRef<ReturnType<typeof setInterval> | null>(null);

  async function verkleinern(datei: File): Promise<string> {
    const bitmap = await createImageBitmap(datei);
    const faktor = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * faktor);
    c.height = Math.round(bitmap.height * faktor);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }

  /** Ein fertiges Bild (data:-URI) auswerten — egal ob vom Rechner oder Handy. */
  async function bildAuswerten(bild: string) {
    setBusy(true);
    setFehler(null);
    setErgebnis(null);
    setVorschau(bild);
    try {
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
    }
  }

  /** QR-Code anfordern und danach im Sekundentakt auf das Foto warten. */
  async function handyStarten() {
    setFehler(null);
    try {
      const res = await fetch("/api/foto-uebergabe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("scan.errGeneric"));
      setQr({ id: data.id, qr: data.qr, url: data.url });
      setWarte(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("scan.errGeneric"));
    }
  }

  function handyAbbrechen() {
    if (abholung.current) clearInterval(abholung.current);
    abholung.current = null;
    setQr(null);
    setWarte(false);
  }

  // Solange ein Code offen ist: alle zwei Sekunden nachsehen, ob das Handy
  // schon geschickt hat. Der Server gibt das Bild genau einmal heraus.
  useEffect(() => {
    if (!qr || !warte) return;
    abholung.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/foto-uebergabe/${qr.id}`);
        const data = await res.json();
        if (data.status === "fertig" && data.bild) {
          handyAbbrechen();
          await bildAuswerten(data.bild);
        } else if (data.status === "abgelaufen") {
          handyAbbrechen();
          setFehler(t("scan.qrExpired"));
        }
      } catch {
        /* Netz-Aussetzer: beim nächsten Takt erneut versuchen. */
      }
    }, 2000);
    return () => {
      if (abholung.current) clearInterval(abholung.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr, warte]);

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
          <button type="button" onClick={handyStarten} className="btn-secondary inline-flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {t("scan.withPhone")}
          </button>
          <span className="chip bg-brand-50 text-brand-800">{t("scan.cost")}</span>
        </div>

        {qr && (
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{t("scan.qrTitle")}</p>
                <p className="mt-1 text-sm text-slate-600">{t("scan.qrText")}</p>
              </div>
              <button
                type="button"
                onClick={handyAbbrechen}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label={t("scan.qrCancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.qr} alt={t("scan.qrTitle")} className="h-52 w-52 rounded-lg bg-white p-2" />
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("scan.qrWaiting")}
              </p>
              <p className="break-all text-center text-xs text-slate-400">{qr.url}</p>
            </div>
          </div>
        )}

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
