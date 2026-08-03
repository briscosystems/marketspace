"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Star, Trash2, AlertTriangle } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { MAX_FOTOS, KANTE_GROSS, KANTE_KLEIN, MOTIV_VORSCHLAEGE } from "@/lib/listing-photos";

/**
 * Fotos zum Angebot — aufnehmen oder aus der Galerie wählen.
 *
 * Aufbau nach dem Muster großer Marktplätze (eBay, Kleinanzeigen, Mobile.de):
 *  - Zwei getrennte Knöpfe: „Foto aufnehmen" öffnet am Handy direkt die Kamera
 *    (capture="environment"), „Aus Galerie" erlaubt Mehrfachauswahl.
 *  - Das erste Bild ist das Titelbild; es ist sichtbar als solches markiert und
 *    lässt sich per Klick auf ein anderes Bild wechseln.
 *  - Verkleinert wird IM BROWSER, bevor etwas gesendet wird: Handyfotos haben
 *    4–12 MB, das wäre über Mobilfunk unzumutbar. Lange Kante 1600 px für die
 *    Detailansicht, zusätzlich 400 px als Vorschau für Trefferlisten.
 */

export type VorhandenesFoto = { id: string; position: number };

const QUALITAET = 0.82;

/**
 * WebP spart 25–35 % Bytes gegenüber JPEG bei gleicher Qualität — bei Ablage in
 * der Datenbank direkt spürbar. Ältere Browser können kein WebP schreiben;
 * dann fällt die Ausgabe automatisch auf JPEG zurück.
 */
function besterTyp(): "image/webp" | "image/jpeg" {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp")
      ? "image/webp"
      : "image/jpeg";
  } catch {
    return "image/jpeg";
  }
}

async function verkleinern(
  datei: File,
  maxKante: number,
  qualitaet: number,
): Promise<{ dataUrl: string; breite: number; hoehe: number }> {
  // imageOrientation ausdrücklich setzen — sonst liegen iPhone-Aufnahmen quer.
  const bitmap = await createImageBitmap(datei, { imageOrientation: "from-image" }).catch(
    () => createImageBitmap(datei).catch(() => null),
  );
  if (!bitmap) throw new Error("Bild konnte nicht gelesen werden");
  const faktor = Math.min(1, maxKante / Math.max(bitmap.width, bitmap.height));
  const breite = Math.round(bitmap.width * faktor);
  const hoehe = Math.round(bitmap.height * faktor);

  const canvas = document.createElement("canvas");
  canvas.width = breite;
  canvas.height = hoehe;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Zeichenfläche nicht verfügbar");
  ctx.drawImage(bitmap, 0, 0, breite, hoehe);
  bitmap.close?.();
  return { dataUrl: canvas.toDataURL(besterTyp(), qualitaet), breite, hoehe };
}

export function ListingPhotoUpload({
  listingId,
  initial = [],
}: {
  listingId: string;
  initial?: VorhandenesFoto[];
}) {
  const [fotos, setFotos] = useState<VorhandenesFoto[]>(
    [...initial].sort((a, b) => a.position - b.position),
  );
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const kameraRef = useRef<HTMLInputElement>(null);
  const galerieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fehler) return;
    const t = setTimeout(() => setFehler(null), 6000);
    return () => clearTimeout(t);
  }, [fehler]);

  const hochladen = useCallback(
    async (dateien: FileList | null) => {
      if (!dateien || dateien.length === 0) return;
      setFehler(null);
      const frei = MAX_FOTOS - fotos.length;
      if (frei <= 0) {
        setFehler(`Mehr als ${MAX_FOTOS} Fotos gehen nicht.`);
        return;
      }
      setLaedt(true);
      try {
        const nutzbar = Array.from(dateien)
          .filter((d) => d.type.startsWith("image/"))
          .slice(0, frei);
        const paket = [];
        for (const datei of nutzbar) {
          const gross = await verkleinern(datei, KANTE_GROSS, QUALITAET);
          const klein = await verkleinern(datei, KANTE_KLEIN, 0.75);
          paket.push({
            bild: gross.dataUrl,
            vorschau: klein.dataUrl,
            breite: gross.breite,
            hoehe: gross.hoehe,
          });
        }
        if (paket.length === 0) {
          setFehler("Das war kein Bild. Bitte JPG, PNG oder WEBP wählen.");
          return;
        }
        const res = await fetch(withBasePath(`/api/listings/${listingId}/photos`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fotos: paket }),
        });
        const daten = await res.json();
        if (!res.ok) {
          setFehler(daten?.error ?? "Hochladen fehlgeschlagen.");
          return;
        }
        setFotos((alt) => [
          ...alt,
          ...(daten.angelegt as string[]).map((id, i) => ({ id, position: alt.length + i })),
        ]);
      } catch {
        setFehler("Das Bild konnte nicht verarbeitet werden. Bitte noch einmal versuchen.");
      } finally {
        setLaedt(false);
        if (kameraRef.current) kameraRef.current.value = "";
        if (galerieRef.current) galerieRef.current.value = "";
      }
    },
    [fotos.length, listingId],
  );

  async function loeschen(id: string) {
    const vorher = fotos;
    setFotos((f) => f.filter((x) => x.id !== id));
    const res = await fetch(withBasePath(`/api/listing-photos/${id}`), { method: "DELETE" });
    if (!res.ok) {
      setFotos(vorher);
      setFehler("Foto konnte nicht gelöscht werden.");
    }
  }

  async function alsTitelbild(id: string) {
    const neu = [fotos.find((f) => f.id === id)!, ...fotos.filter((f) => f.id !== id)];
    setFotos(neu.map((f, i) => ({ ...f, position: i })));
    await fetch(withBasePath(`/api/listings/${listingId}/photos`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reihenfolge: neu.map((f) => f.id) }),
    });
  }

  const voll = fotos.length >= MAX_FOTOS;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-slate-700">
          Fotos vom Bestand{" "}
          <span className="font-normal text-slate-500">
            ({fotos.length}/{MAX_FOTOS})
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Nur eigene Fotos der tatsächlichen Ware. Hersteller- oder Katalogbilder zeigen nicht den
          Zustand deines Gebindes — und Käufer vertrauen eigenen Aufnahmen nachweislich mehr als
          perfekten Katalogbildern. Kein Text und keine Wasserzeichen ins Bild.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Bewährte Reihenfolge:{" "}
          {MOTIV_VORSCHLAEGE.map((m, i) => (
            <span key={m}>
              {i > 0 && " → "}
              <span className="font-medium text-slate-600">{m}</span>
            </span>
          ))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => kameraRef.current?.click()}
          disabled={laedt || voll}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {laedt ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          Foto aufnehmen
        </button>
        <button
          type="button"
          onClick={() => galerieRef.current?.click()}
          disabled={laedt || voll}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          <ImagePlus size={16} />
          Aus Galerie wählen
        </button>
      </div>

      {/* capture öffnet am Handy direkt die Rückkamera; am Rechner ist es wirkungslos. */}
      <input
        ref={kameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => hochladen(e.target.files)}
      />
      <input
        ref={galerieRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => hochladen(e.target.files)}
      />

      {fehler && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-900">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {fehler}
        </div>
      )}

      {fotos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((f, i) => (
            <li
              key={f.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath(`/api/listing-photos/${f.id}?v=klein`)}
                alt={i === 0 ? "Titelbild" : `Foto ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {i === 0 ? (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Star size={10} /> Titelbild
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => alsTitelbild(f.id)}
                  title="Als Titelbild verwenden"
                  className="absolute left-1.5 top-1.5 rounded-md bg-white/90 p-1 text-slate-600 opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-blue-700"
                >
                  <Star size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => loeschen(f.id)}
                title="Foto entfernen"
                className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-slate-600 opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-rose-600"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {fotos.length === 0 && !laedt && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          Noch kein Foto. Angebote mit eigenen Bildern verkaufen sich nachweislich häufiger — ein Bild vom Etikett beantwortet die halbe Rückfrage.
        </p>
      )}
    </div>
  );
}
