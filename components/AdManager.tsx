"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Play, Pause, ImagePlus } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { AdBannerView } from "@/components/AdBannerView";
import { useLocale } from "@/components/LocaleProvider";

type Placement = "HOME" | "STOREFRONT" | "LISTINGS";
type StatusTone = "live" | "scheduled" | "ended" | "paused";

type Ad = {
  id: string;
  eyebrow: string | null;
  headline: string;
  chips: string[];
  image: string;
  ctaLabel: string;
  ctaUrl: string;
  origin: string | null;
  placements: Placement[];
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  status: { label: string; tone: StatusTone };
};

const TONE_CLASS: Record<StatusTone, string> = {
  live: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  ended: "bg-slate-100 text-slate-500",
  paused: "bg-amber-100 text-amber-700",
};

const emptyForm = {
  eyebrow: "",
  headline: "",
  chipsText: "",
  image: "",
  ctaLabel: "",
  ctaUrl: "",
  origin: "",
  placements: ["HOME"] as Placement[],
  active: true,
  startsAt: "",
  endsAt: "",
};
type Form = typeof emptyForm;

/** Datei clientseitig auf max. 720px Breite verkleinern → JPEG-Data-URI. */
function fileToResizedDataUrl(file: File, t: (key: string) => string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 720;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error(t("adm.errCanvas")));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error(t("adm.errBild")));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(t("adm.errDatei")));
    reader.readAsDataURL(file);
  });
}

export function AdManager({
  initialAds,
  placements,
}: {
  initialAds: Ad[];
  placements: { value: Placement; label: string }[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null); // null = zu, "new" = neu
  const [form, setForm] = useState<Form>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openNew() {
    setForm({ ...emptyForm, ctaLabel: t("adm.mehrErfahren") });
    setError(null);
    setEditingId("new");
  }
  function openEdit(ad: Ad) {
    setForm({
      eyebrow: ad.eyebrow ?? "",
      headline: ad.headline,
      chipsText: ad.chips.join("\n"),
      image: ad.image,
      ctaLabel: ad.ctaLabel,
      ctaUrl: ad.ctaUrl,
      origin: ad.origin ?? "",
      placements: ad.placements,
      active: ad.active,
      startsAt: ad.startsAt ? ad.startsAt.slice(0, 10) : "",
      endsAt: ad.endsAt ? ad.endsAt.slice(0, 10) : "",
    });
    setError(null);
    setEditingId(ad.id);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, t);
      set("image", dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function togglePlacement(p: Placement) {
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(p)
        ? f.placements.filter((x) => x !== p)
        : [...f.placements, p],
    }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const chips = form.chipsText
        .split(/[\n,;]+/)
        .map((c) => c.trim())
        .filter(Boolean);
      const body = {
        eyebrow: form.eyebrow.trim() || null,
        headline: form.headline.trim(),
        chips,
        image: form.image,
        ctaLabel: form.ctaLabel.trim() || t("adm.mehrErfahren"),
        ctaUrl: form.ctaUrl.trim(),
        origin: form.origin.trim() || null,
        placements: form.placements,
        active: form.active,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt + "T23:59:59").toISOString() : null,
      };
      const isNew = editingId === "new";
      const resp = await fetch(withBasePath(isNew ? "/api/ads" : `/api/ads/${editingId}`), {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `HTTP ${resp.status}`);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(ad: Ad) {
    setBusy(true);
    try {
      await fetch(withBasePath(`/api/ads/${ad.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !ad.active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(ad: Ad) {
    if (!confirm(t("adm.confirmDelete"))) return;
    setBusy(true);
    try {
      await fetch(withBasePath(`/api/ads/${ad.id}`), { method: "DELETE" });
      if (editingId === ad.id) setEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const previewChips = form.chipsText
    .split(/[\n,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Liste */}
      <div className="space-y-3">
        {initialAds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {t("adm.leer")}
          </p>
        ) : (
          initialAds.map((ad) => (
            <div key={ad.id} className="card flex items-center gap-4">
              <div className="grid h-14 w-20 flex-none place-items-center overflow-hidden rounded-md bg-slate-900 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.image.startsWith("data:") ? ad.image : withBasePath(ad.image)}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{ad.headline}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASS[ad.status.tone]}`}
                  >
                    {ad.status.label}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {ad.placements.map((p) => placements.find((x) => x.value === p)?.label ?? p).join(", ") ||
                    t("adm.keinePlatzierung")}
                </div>
              </div>
              <div className="flex flex-none items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleActive(ad)}
                  disabled={busy}
                  title={ad.active ? t("adm.pausieren") : t("adm.aktivieren")}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  {ad.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(ad)}
                  title={t("adm.bearbeiten")}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(ad)}
                  disabled={busy}
                  title={t("adm.loeschen")}
                  className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingId === null ? (
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus size={16} /> {t("adm.neu")}
        </button>
      ) : (
        <div className="card space-y-4">
          <div className="text-sm font-semibold text-slate-800">
            {editingId === "new" ? t("adm.neu") : t("adm.bearbeitenTitel")}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Live-Vorschau */}
          {form.image ? (
            <div>
              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {t("adm.vorschau")}
              </div>
              <AdBannerView
                ad={{
                  eyebrow: form.eyebrow || null,
                  headline: form.headline || t("adm.headlinePlatzhalter"),
                  chips: previewChips,
                  image: form.image,
                  ctaLabel: form.ctaLabel || t("adm.mehrErfahren"),
                  ctaUrl: form.ctaUrl || "#",
                  origin: form.origin || null,
                }}
              />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{t("adm.bild")}</span>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:border-brand-400">
                <ImagePlus size={16} className="text-slate-400" />
                {form.image ? t("adm.bildAendern") : t("adm.bildWaehlen")}
                <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
              </label>
            </label>
            <label className="block">
              <span className="label">{t("adm.eyebrowLabel")}</span>
              <input
                className="input"
                value={form.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)}
                placeholder={t("adm.eyebrowPlatzhalter")}
              />
            </label>
          </div>

          <label className="block">
            <span className="label">{t("adm.schlagzeile")}</span>
            <input
              className="input"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder={t("adm.schlagzeilePlatzhalter")}
            />
          </label>

          <label className="block">
            <span className="label">{t("adm.vorteile")}</span>
            <textarea
              className="input min-h-[80px]"
              value={form.chipsText}
              onChange={(e) => set("chipsText", e.target.value)}
              placeholder={t("adm.vorteilePlatzhalter")}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{t("adm.buttonText")}</span>
              <input className="input" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
            </label>
            <label className="block">
              <span className="label">{t("adm.buttonLink")}</span>
              <input
                className="input"
                value={form.ctaUrl}
                onChange={(e) => set("ctaUrl", e.target.value)}
                placeholder="https://www.dosimetrix.eu"
              />
            </label>
          </div>

          <label className="block">
            <span className="label">{t("adm.zusatzzeile")}</span>
            <input
              className="input"
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
              placeholder={t("adm.zusatzzeilePlatzhalter")}
            />
          </label>

          <div>
            <span className="label">{t("adm.werbeplaetze")}</span>
            <div className="flex flex-wrap gap-2">
              {placements.map((p) => {
                const on = form.placements.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlacement(p.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      on
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{t("adm.start")}</span>
              <input
                type="date"
                className="input"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">{t("adm.ende")}</span>
              <input
                type="date"
                className="input"
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            {t("adm.sofortAktiv")}
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy || !form.image || !form.headline.trim() || !form.ctaUrl.trim() || form.placements.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {t("adm.speichern")}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("adm.abbrechen")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
