"use client";

import { useState } from "react";
import { Camera, Loader2, CheckCircle2, ImageUp } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Aufnahmeseite auf dem Handy (Ziel des QR-Codes).
 *
 * Bewusst minimal: ein großer Knopf, der direkt die Kamera öffnet. Wer hier
 * landet, steht vor einem Gebinde und hat eine Hand frei.
 */
export function HandyAufnahme({ id }: { id: string }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function verkleinern(datei: File): Promise<string> {
    const bitmap = await createImageBitmap(datei);
    const faktor = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * faktor);
    c.height = Math.round(bitmap.height * faktor);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }

  async function senden(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    setBusy(true);
    setFehler(null);
    try {
      const bild = await verkleinern(datei);
      const res = await fetch(`/api/foto-uebergabe/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bild }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("handy.err"));
      setFertig(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("handy.err"));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  if (fertig) {
    return (
      <div className="card space-y-2 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="text-lg font-semibold text-slate-900">{t("handy.doneTitle")}</p>
        <p className="text-sm text-slate-600">{t("handy.doneText")}</p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <p className="text-sm text-slate-600">{t("handy.intro")}</p>
      <label className="btn-primary flex w-full cursor-pointer items-center justify-center gap-2 py-4 text-base">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        {busy ? t("handy.sending") : t("handy.take")}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={senden}
          className="hidden"
          disabled={busy}
        />
      </label>
      <label className="btn-secondary flex w-full cursor-pointer items-center justify-center gap-2">
        <ImageUp className="h-4 w-4" />
        {t("handy.fromGallery")}
        <input type="file" accept="image/*" onChange={senden} className="hidden" disabled={busy} />
      </label>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
    </div>
  );
}
