"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, X, Loader2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Tank-Etikett scannen (Betreiber 2026-08-17: „Tank QR-Code scannen — diese
 * Funktion fehlt, wenn man einen Wert eingeben möchte").
 *
 * Der Aufkleber am Tank trägt die Adresse /t/<token>. Wer am Handy die
 * Kamera-App benutzt, landet dort ohnehin direkt. Wer aber schon IN der
 * Plattform ist (Tankliste, Mischungsrechner), soll nicht die App wechseln
 * müssen — dieser Knopf öffnet die Kamera im Browser.
 *
 * Technik: die eingebaute Strichcode-Erkennung des Browsers (BarcodeDetector,
 * vorhanden in Chrome/Edge/Android). Fehlt sie (Safari/Firefox), sagen wir das
 * ehrlich und zeigen den Weg über die Kamera-App — kein zusätzliches Paket,
 * keine stille Fehlfunktion.
 */

type BarcodeDetectorLike = {
  detect: (quelle: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

export function QrTankScanner({
  /** Wird mit dem erkannten Token aufgerufen; ohne Angabe leiten wir auf /t/<token>. */
  onToken,
  kompakt = false,
}: {
  onToken?: (token: string) => void;
  kompakt?: boolean;
}) {
  const { t } = useLocale();
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [suchtNoch, setSuchtNoch] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const laufend = useRef(false);

  const kannScannen = typeof window !== "undefined" && "BarcodeDetector" in window;

  function schliessen() {
    laufend.current = false;
    streamRef.current?.getTracks().forEach((s) => s.stop());
    streamRef.current = null;
    setOffen(false);
    setSuchtNoch(false);
  }

  /** Aus einer gescannten Adresse den Tank-Schlüssel ziehen (/t/<token>). */
  function tokenAus(text: string): string | null {
    const treffer = /\/t\/([A-Za-z0-9_-]{6,})/.exec(text);
    if (treffer) return treffer[1];
    // Auch ein blanker Schlüssel ohne Adresse ist brauchbar.
    return /^[A-Za-z0-9_-]{12,}$/.test(text.trim()) ? text.trim() : null;
  }

  useEffect(() => {
    if (!offen) return;
    let abbruch = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (abbruch) {
          stream.getTracks().forEach((s) => s.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setSuchtNoch(true);

        const Ctor = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => BarcodeDetectorLike })
          .BarcodeDetector;
        const detektor = new Ctor({ formats: ["qr_code"] });
        laufend.current = true;

        const suchen = async () => {
          if (!laufend.current || !videoRef.current) return;
          try {
            const treffer = await detektor.detect(videoRef.current);
            const roh = treffer[0]?.rawValue;
            const token = roh ? tokenAus(roh) : null;
            if (token) {
              schliessen();
              if (onToken) onToken(token);
              else window.location.href = `/t/${token}`;
              return;
            }
          } catch {
            /* einzelne Bilder dürfen fehlschlagen — weitersuchen */
          }
          requestAnimationFrame(suchen);
        };
        requestAnimationFrame(suchen);
      } catch {
        setFehler(t("qrs.noCam"));
        setSuchtNoch(false);
      }
    })();

    return () => {
      abbruch = true;
      laufend.current = false;
      streamRef.current?.getTracks().forEach((s) => s.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFehler(kannScannen ? null : t("qrs.useCamApp"));
          if (kannScannen) setOffen(true);
        }}
        className={
          kompakt
            ? "inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            : "btn-secondary inline-flex items-center gap-2"
        }
      >
        <QrCode className="h-4 w-4" />
        {t("qrs.button")}
      </button>

      {fehler && !offen && <p className="mt-2 text-sm text-slate-600">{fehler}</p>}

      {offen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-semibold text-slate-900">{t("qrs.title")}</p>
              <button
                type="button"
                onClick={schliessen}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={t("qrs.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} playsInline muted className="aspect-square w-full bg-black object-cover" />
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600">
              {suchtNoch && <Loader2 className="h-4 w-4 animate-spin" />}
              {fehler ?? t("qrs.hint")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
