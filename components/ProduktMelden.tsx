"use client";

import { useState } from "react";
import { FileUp, Loader2, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Neues Produkt melden — erscheint im Angebots-Formular, wenn das eingegebene
 * Produkt nicht im Katalog steht.
 *
 * Datenblatt und Sicherheitsdatenblatt sind Pflicht, dazu zwei Bestätigungen.
 * Das ist bewusst streng: Die frühere automatische Anreicherung hat 53
 * erfundene Produkte in den Katalog gespült — ohne Beleg kommt nichts mehr rein.
 */
export function ProduktMelden({
  name,
  manufacturer,
  productType,
  chemistry,
  isoViscosity,
}: {
  name: string;
  manufacturer: string;
  productType: string;
  chemistry?: string;
  isoViscosity?: string;
}) {
  const { t } = useLocale();
  const [offen, setOffen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const [sds, setSds] = useState<{ data: string; name: string } | null>(null);
  const [tds, setTds] = useState<{ data: string; name: string } | null>(null);
  const [korrekt, setKorrekt] = useState(false);
  const [einwilligung, setEinwilligung] = useState(false);

  async function lesen(
    e: React.ChangeEvent<HTMLInputElement>,
    setzen: (v: { data: string; name: string } | null) => void,
  ) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    if (datei.size > 4 * 1024 * 1024) {
      setFehler(t("pm.tooBig"));
      e.target.value = "";
      return;
    }
    const leser = new FileReader();
    leser.onload = () => setzen({ data: String(leser.result), name: datei.name });
    leser.readAsDataURL(datei);
    setFehler(null);
  }

  async function senden() {
    if (!sds || !tds || !korrekt || !einwilligung) return;
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch("/api/produkt-meldung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          manufacturer,
          productType,
          chemistry: chemistry || undefined,
          isoViscosity: isoViscosity || undefined,
          sdsFile: sds.data,
          sdsFileName: sds.name,
          tdsFile: tds.data,
          tdsFileName: tds.name,
          confirmedAccurate: true,
          consentToUse: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("pm.err"));
      setFertig(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("pm.err"));
    } finally {
      setBusy(false);
    }
  }

  if (fertig) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          {t("pm.doneTitle")}
        </p>
        <p className="mt-1">{t("pm.doneText")}</p>
      </div>
    );
  }

  const bereit = sds && tds && korrekt && einwilligung && name && manufacturer && productType;

  return (
    <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="text-sm text-amber-900">
        <strong>{t("pm.notFound")}</strong> {t("pm.notFoundText")}
      </p>

      {!offen ? (
        <button
          type="button"
          onClick={() => setOffen(true)}
          className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          {t("pm.open")}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-amber-900">{t("pm.required")}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:ring-amber-300">
              <FileUp className="h-4 w-4 text-slate-500" />
              <span className="min-w-0 flex-1 truncate">
                {tds ? tds.name : t("pm.tds")}
              </span>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => lesen(e, setTds)}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:ring-amber-300">
              <FileUp className="h-4 w-4 text-slate-500" />
              <span className="min-w-0 flex-1 truncate">
                {sds ? sds.name : t("pm.sds")}
              </span>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => lesen(e, setSds)}
              />
            </label>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={korrekt}
              onChange={(e) => setKorrekt(e.target.checked)}
              className="mt-0.5"
            />
            <span>{t("pm.confirmAccurate")}</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={einwilligung}
              onChange={(e) => setEinwilligung(e.target.checked)}
              className="mt-0.5"
            />
            <span>{t("pm.consent")}</span>
          </label>

          {fehler && <p className="text-sm text-red-700">{fehler}</p>}

          <button
            type="button"
            onClick={senden}
            disabled={!bereit || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("pm.submit")}
          </button>
          <p className="text-xs text-slate-600">{t("pm.reviewNote")}</p>
        </div>
      )}
    </div>
  );
}
