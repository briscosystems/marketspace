"use client";

import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

/**
 * Foto-Galerie auf der Angebots-Detailseite.
 *
 * Muster erfolgreicher Marktplätze (eBay, Kleinanzeigen, Mobile.de):
 * großes Titelbild, kleine Auswahlbilder darunter, Klick öffnet die Vollansicht
 * mit Pfeilen und Tastatursteuerung. Der Hinweis „Fotos vom Anbieter" steht
 * bewusst dabei — er unterscheidet echte Aufnahmen von Katalogbildern und ist
 * genau das Vertrauenssignal, für das die Fotos da sind.
 */
export function ListingPhotoGallery({
  photos,
  productName,
  aufgenommenAm,
}: {
  photos: { id: string }[];
  productName: string;
  aufgenommenAm?: string | null;
}) {
  const { t } = useLocale();
  const [aktiv, setAktiv] = useState(0);
  const [vollbild, setVollbild] = useState(false);

  const weiter = () => setAktiv((i) => (i + 1) % photos.length);
  const zurueck = () => setAktiv((i) => (i - 1 + photos.length) % photos.length);

  useEffect(() => {
    if (!vollbild) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setVollbild(false);
      if (e.key === "ArrowRight") weiter();
      if (e.key === "ArrowLeft") zurueck();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vollbild, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setVollbild(true)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
        aria-label={t("foto.vergroessern")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath(`/api/listing-photos/${photos[aktiv].id}`)}
          alt={`${productName} — Foto ${aktiv + 1} von ${photos.length}`}
          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          fetchPriority="high"
        />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white">
          <Camera size={12} /> {t("foto.vomAnbieter")}
        </span>
        {photos.length > 1 && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-semibold text-white">
            {aktiv + 1} / {photos.length}
          </span>
        )}
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setAktiv(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === aktiv ? "border-blue-600" : "border-transparent hover:border-slate-300"
              }`}
              aria-label={`Foto ${i + 1} anzeigen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath(`/api/listing-photos/${p.id}?v=klein`)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {aufgenommenAm && (
        <p className="text-xs text-slate-500">{fill(t("foto.eigeneAufnahme"), { d: aufgenommenAm })}</p>
      )}

      {vollbild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setVollbild(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setVollbild(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label={t("foto.schliessen")}
          >
            <X size={20} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); zurueck(); }}
                className="absolute left-3 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
                aria-label={t("foto.vorheriges")}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); weiter(); }}
                className="absolute right-3 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
                aria-label={t("foto.naechstes")}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath(`/api/listing-photos/${photos[aktiv].id}`)}
            alt={`${productName} — Foto ${aktiv + 1}`}
            className="max-h-[88vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
