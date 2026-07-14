"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Store, CheckCircle2, ExternalLink } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

type ManufacturerOption = { id: string; name: string; slug: string };

/**
 * Verwaltung des Marken-Schaufensters (nur Stufe Marke): Hersteller wählen,
 * Überschrift & Vorstellungstext pflegen. Schaltet das verifizierte
 * Schaufenster (/manufacturers/[slug]) frei.
 */
export function StorefrontManager({
  manufacturers,
  currentManufacturerId,
  currentHeadline,
  currentAbout,
}: {
  manufacturers: ManufacturerOption[];
  currentManufacturerId: string | null;
  currentHeadline: string | null;
  currentAbout: string | null;
}) {
  const router = useRouter();
  const [manufacturerId, setManufacturerId] = useState(currentManufacturerId ?? "");
  const [headline, setHeadline] = useState(currentHeadline ?? "");
  const [about, setAbout] = useState(currentAbout ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = manufacturers.find((m) => m.id === manufacturerId);

  async function save() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const resp = await fetch(withBasePath("/api/marke/storefront"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturerId: manufacturerId || null,
          headline,
          about,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `HTTP ${resp.status}`);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 size={16} /> Schaufenster gespeichert.
        </div>
      )}

      <div>
        <label className="label" htmlFor="sf-manufacturer">
          Welche Marke vertreten Sie?
        </label>
        <select
          id="sf-manufacturer"
          className="input"
          value={manufacturerId}
          onChange={(e) => setManufacturerId(e.target.value)}
        >
          <option value="">— keine (Schaufenster aus) —</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="sf-headline">
          Überschrift (optional)
        </label>
        <input
          id="sf-headline"
          className="input"
          maxLength={160}
          placeholder="z. B. Kühlschmierstoffe für die Präzisionszerspanung"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="sf-about">
          Vorstellungstext (optional)
        </label>
        <textarea
          id="sf-about"
          className="input min-h-[90px]"
          maxLength={1200}
          placeholder="Kurze Vorstellung Ihrer Marke, Anwendungsschwerpunkte, Besonderheiten …"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
          Schaufenster speichern
        </button>
        {selected && (
          <Link
            href={`/manufacturers/${selected.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            Schaufenster ansehen <ExternalLink size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
