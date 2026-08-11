"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Loader2,
  ImageUp,
  Smartphone,
  X,
  TriangleAlert,
  CheckCircle2,
  Eye,
  Ruler,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Befund = {
  merkmal: string;
  sicherheit: "hoch" | "mittel" | "gering";
  beobachtung: string;
  bedeutung: string;
  massnahme: string;
};

type Ergebnis = {
  keinKss?: boolean;
  istKssOberflaeche?: boolean;
  befunde?: Befund[];
  gesamturteil?: "unauffaellig" | "beobachten" | "handeln" | "unklar";
  nachmessen?: string[];
  hinweis?: string | null;
};

/**
 * Foto der KSS-Oberfläche → die Seite sagt, was daran auffällt.
 *
 * Ergänzt das Etikett-Foto (Betreiber 2026-08-11): Das Etikett sagt, WELCHES
 * Produkt im Tank ist — die Oberfläche sagt, wie es ihm geht. Aufschwimmendes
 * Fremdöl, Schaum, Trübung, Beläge und Späne sieht man dort, bevor ein
 * Messwert anschlägt.
 *
 * Aufnahmewege wie beim Etikett: Kamera, Galerie oder Handy per QR-Code.
 */
export function OberflaechenScanner({ produktId }: { produktId?: string }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [bemerkung, setBemerkung] = useState("");
  const [qr, setQr] = useState<{ id: string; qr: string; url: string } | null>(null);
  const [warte, setWarte] = useState(false);
  const abholung = useRef<ReturnType<typeof setInterval> | null>(null);
  const bemerkungRef = useRef("");
  bemerkungRef.current = bemerkung;

  async function verkleinern(datei: File): Promise<string> {
    const bitmap = await createImageBitmap(datei);
    const faktor = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * faktor);
    c.height = Math.round(bitmap.height * faktor);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }

  async function bildAuswerten(bild: string) {
    setBusy(true);
    setFehler(null);
    setErgebnis(null);
    setVorschau(bild);
    try {
      const res = await fetch("/api/oberflaeche-pruefen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bild,
          produktId,
          bemerkung: bemerkungRef.current.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("surf.errGeneric"));
      setErgebnis(data);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("surf.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function auswerten(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    try {
      const bild = await verkleinern(datei);
      await bildAuswerten(bild);
    } catch {
      setFehler(t("surf.errGeneric"));
    } finally {
      e.target.value = "";
    }
  }

  async function handyStarten() {
    setFehler(null);
    try {
      const res = await fetch("/api/foto-uebergabe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("surf.errGeneric"));
      setQr({ id: data.id, qr: data.qr, url: data.url });
      setWarte(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("surf.errGeneric"));
    }
  }

  function handyAbbrechen() {
    if (abholung.current) clearInterval(abholung.current);
    abholung.current = null;
    setQr(null);
    setWarte(false);
  }

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
          setFehler(t("surf.qrExpired"));
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

  const urteilFarbe: Record<string, string> = {
    unauffaellig: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    beobachten: "bg-amber-50 text-amber-900 ring-amber-200",
    handeln: "bg-red-50 text-red-900 ring-red-200",
    unklar: "bg-slate-100 text-slate-800 ring-slate-200",
  };

  return (
    <div className="space-y-5">
      <section className="card space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">{t("surf.title")}</h2>
        </div>
        <p className="text-sm text-slate-600">{t("surf.intro")}</p>

        <div>
          <label className="label">{t("surf.noteLabel")}</label>
          <input
            type="text"
            value={bemerkung}
            onChange={(e) => setBemerkung(e.target.value)}
            placeholder={t("surf.notePlaceholder")}
            className="input"
            maxLength={500}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="btn-primary inline-flex cursor-pointer items-center gap-2">
            <Camera className="h-4 w-4" />
            {t("surf.take")}
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
            {t("surf.fromGallery")}
            <input type="file" accept="image/*" onChange={auswerten} className="hidden" disabled={busy} />
          </label>
          <button type="button" onClick={handyStarten} className="btn-secondary inline-flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {t("surf.withPhone")}
          </button>
          <span className="chip bg-brand-50 text-brand-800">{t("surf.cost")}</span>
        </div>

        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{t("surf.howto")}</p>

        {qr && (
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{t("surf.qrTitle")}</p>
                <p className="mt-1 text-sm text-slate-600">{t("surf.qrText")}</p>
              </div>
              <button
                type="button"
                onClick={handyAbbrechen}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label={t("surf.qrCancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.qr} alt={t("surf.qrTitle")} className="h-52 w-52 rounded-lg bg-white p-2" />
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("surf.qrWaiting")}
              </p>
              <p className="break-all text-center text-xs text-slate-400">{qr.url}</p>
            </div>
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("surf.working")}
          </p>
        )}
        {fehler && <p className="text-sm text-red-600">{fehler}</p>}
        {vorschau && !busy && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vorschau} alt="" className="max-h-48 rounded-lg ring-1 ring-slate-200" />
        )}
      </section>

      {ergebnis?.keinKss && (
        <section className="card">
          <p className="text-sm text-slate-700">{ergebnis.hinweis}</p>
          <p className="mt-2 text-xs text-slate-500">{t("surf.noCharge")}</p>
        </section>
      )}

      {ergebnis && !ergebnis.keinKss && (
        <section className="card space-y-4">
          <div
            className={`rounded-xl p-4 ring-1 ${urteilFarbe[ergebnis.gesamturteil ?? "unklar"]}`}
          >
            <p className="flex items-center gap-2 font-semibold">
              {ergebnis.gesamturteil === "unauffaellig" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <TriangleAlert className="h-5 w-5" />
              )}
              {t(`surf.verdict.${ergebnis.gesamturteil ?? "unklar"}`)}
            </p>
            {ergebnis.hinweis && <p className="mt-1 text-sm">{ergebnis.hinweis}</p>}
          </div>

          {(ergebnis.befunde ?? []).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">{t("surf.findings")}</h3>
              {(ergebnis.befunde ?? []).map((b, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                    {t(`surf.mark.${b.merkmal}`)}
                    <span className="chip bg-white text-slate-600">
                      {t(`surf.conf.${b.sicherheit}`)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{b.beobachtung}</p>
                  <p className="mt-1 text-sm text-slate-600">{b.bedeutung}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">→ {b.massnahme}</p>
                </div>
              ))}
            </div>
          )}

          {(ergebnis.nachmessen ?? []).length > 0 && (
            <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-200">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-blue-900">
                <Ruler className="h-4 w-4" />
                {t("surf.measure")}
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-blue-900">
                {(ergebnis.nachmessen ?? []).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-500">{t("surf.disclaimer")}</p>
        </section>
      )}
    </div>
  );
}
