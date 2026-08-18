"use client";

import { useState } from "react";
import { Camera, Loader2, ImageUp, TriangleAlert, X } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

/**
 * Fehlvolumen aus einem Tankfoto schätzen (Betreiber 2026-08-19).
 *
 * Der Wert wird NICHT stillschweigend gesetzt, sondern als Vorschlag mit
 * Spanne angezeigt — erst ein Klick übernimmt ihn ins Feld „Fehlvolumen".
 * Grund: Geprüft am 2026-08-19 lag die Schätzung des Füllstands auf 0–7
 * Prozentpunkte genau, das Fehlvolumen ist aber die Differenz zum vollen Tank
 * — bei fast vollem Tank wird daraus schnell ein Drittel Abweichung. Wer den
 * Tank kennt, sieht sofort, ob der Vorschlag passt.
 */
export function FuellstandFoto({
  tankId,
  onFehlvolumen,
}: {
  tankId: string;
  onFehlvolumen: (liter: number) => void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<{
    beurteilbar: boolean;
    fuellstandProzent?: number;
    spanneVon?: number | null;
    spanneBis?: number | null;
    sicherheit?: string;
    begruendung?: string;
    hinweis?: string | null;
    fehlLiter?: number | null;
    fehlVon?: number | null;
    fehlBis?: number | null;
  } | null>(null);

  async function verkleinern(datei: File): Promise<string> {
    const bitmap = await createImageBitmap(datei);
    const faktor = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * faktor);
    c.height = Math.round(bitmap.height * faktor);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }

  async function auswerten(e: React.ChangeEvent<HTMLInputElement>) {
    const dateien = Array.from(e.target.files ?? []).slice(0, 3);
    e.target.value = "";
    if (dateien.length === 0) return;
    setBusy(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const bilder = await Promise.all(dateien.map(verkleinern));
      const res = await fetch(`/api/tanks/${tankId}/fuellstand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bilder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("fs.err"));
      setErgebnis(data);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("fs.err"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100">
          <Camera className="h-4 w-4" />
          {t("fs.knopf")}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={auswerten}
            className="hidden"
            disabled={busy}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700">
          <ImageUp className="h-3.5 w-3.5" />
          {t("fs.ausGalerie")}
          <input type="file" accept="image/*" multiple onChange={auswerten} className="hidden" disabled={busy} />
        </label>
        {busy && (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("fs.laeuft")}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{t("fs.hinweisFoto")}</p>

      {fehler && <p className="mt-2 text-sm text-red-600">{fehler}</p>}

      {ergebnis && !ergebnis.beurteilbar && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-white p-2.5 text-sm text-slate-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          {ergebnis.hinweis}
        </p>
      )}

      {ergebnis?.beurteilbar && (
        <div className="mt-2 space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-sm text-slate-800">
            <strong>
              {fill(t("fs.ergebnis"), { pct: String(ergebnis.fuellstandProzent) })}
            </strong>{" "}
            {ergebnis.fehlLiter != null && (
              <>
                {fill(t("fs.fehlt"), { liter: String(ergebnis.fehlLiter) })}
                {ergebnis.fehlVon != null && ergebnis.fehlBis != null && (
                  <span className="text-slate-500">
                    {" "}
                    {fill(t("fs.spanne"), {
                      von: String(ergebnis.fehlVon),
                      bis: String(ergebnis.fehlBis),
                    })}
                  </span>
                )}
              </>
            )}
          </p>
          <p className="text-xs text-slate-500">{ergebnis.begruendung}</p>

          {ergebnis.sicherheit === "gering" && (
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">{t("fs.unsicher")}</p>
          )}

          {ergebnis.fehlLiter != null ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onFehlvolumen(ergebnis.fehlLiter!)}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {fill(t("fs.uebernehmen"), { liter: String(ergebnis.fehlLiter) })}
              </button>
              <button
                type="button"
                onClick={() => setErgebnis(null)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" />
                {t("fs.verwerfen")}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{t("fs.ohneVolumen")}</p>
          )}

          <p className="text-xs text-slate-500">{t("fs.nachmessen")}</p>
        </div>
      )}
    </div>
  );
}
