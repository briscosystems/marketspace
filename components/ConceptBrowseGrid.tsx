"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Tag, Check, Star, ShieldCheck, X } from "lucide-react";
import { CategoryGlyph } from "./CategoryGlyph";

export type BrowseListing = {
  id: string;
  productName: string;
  productType: string;
  manufacturer: string;
  iso: string | null;
  chem: string | null;
  quantity: number;
  unit: string;
  packaging: string;
  minOrder: number | null;
  region: string;
  price: number | null;
  seller: { name: string; tier: string; ratingAvg: number | null; ratingCount: number };
};

const fmt = (n: number) => n.toLocaleString("de-CH");
const price = (p: number | null) => (p == null ? null : p.toFixed(2).replace(".", ",") + " €");

function TierBadge({ tier }: { tier: string }) {
  if (tier === "VERIFIED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
        <Check size={11} /> Verifiziert
      </span>
    );
  if (tier === "TRADE_ASSURED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10.5px] font-bold text-brand-800">
        <ShieldCheck size={11} /> Trade-Assured
      </span>
    );
  if (tier === "PREMIUM" || tier === "DIAMOND")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">
        <Star size={11} className="fill-current" /> {tier === "DIAMOND" ? "Diamond" : "Premium"}
      </span>
    );
  return null;
}

const VERIFIED_TIERS = ["VERIFIED", "TRADE_ASSURED", "PREMIUM", "DIAMOND"];

export function ConceptBrowseGrid({ listings }: { listings: BrowseListing[] }) {
  const [selected, setSelected] = useState<BrowseListing | null>(null);
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("rel");

  function toggleFav(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setFavs((f) => ({ ...f, [id]: !f[id] }));
  }

  const displayed = [...listings]
    .filter((l) => !verifiedOnly || VERIFIED_TIERS.includes(l.seller.tier))
    .sort((a, b) => {
      if (sort === "price-asc") return (a.price ?? 1e12) - (b.price ?? 1e12);
      if (sort === "price-desc") return (b.price ?? -1) - (a.price ?? -1);
      if (sort === "qty-desc") return b.quantity - a.quantity;
      return 0;
    });

  return (
    <>
      {/* Werkzeugleiste — Anzahl · Nur verifizierte · Sortieren (wie im Konzept) */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-500">
          <span className="font-bold text-slate-900">{displayed.length}</span> Angebote
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setVerifiedOnly((v) => !v)}
          aria-pressed={verifiedOnly}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
            verifiedOnly
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span
            className={`grid h-4 w-4 place-items-center rounded border ${
              verifiedOnly ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
            }`}
          >
            {verifiedOnly && <Check size={11} />}
          </span>
          Nur verifizierte Anbieter
        </button>
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700">
          <span className="text-slate-500">Sortieren</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="cursor-pointer border-0 bg-transparent font-medium text-slate-900 outline-none"
          >
            <option value="rel">Empfohlen</option>
            <option value="price-asc">Preis aufsteigend</option>
            <option value="price-desc">Preis absteigend</option>
            <option value="qty-desc">Größte Menge</option>
          </select>
        </label>
      </div>

      {displayed.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Keine Angebote gefunden.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayed.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setSelected(l)}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-soft transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lift"
          >
            {/* Bildbereich — grüner Verlauf + Kategorie-Symbol */}
            <div className="relative flex items-center justify-center border-b border-slate-100 bg-gradient-to-br from-brand-50 to-white py-9">
              <CategoryGlyph productType={l.productType} className="h-12 w-12 text-brand-600" />
              <span className="absolute bottom-2.5 left-2.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {l.manufacturer}
              </span>
              <span
                onClick={(e) => toggleFav(e, l.id)}
                className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white/90 transition hover:scale-110 ${
                  favs[l.id] ? "text-rose-500" : "text-slate-400"
                }`}
                aria-label="Merken"
              >
                <Heart size={16} className={favs[l.id] ? "fill-current" : ""} />
              </span>
            </div>

            {/* Inhalt */}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
                <Tag size={10} /> Bietet an
              </span>
              <h3 className="text-base font-bold leading-tight text-slate-900">{l.productName}</h3>
              <div className="text-xs text-slate-500">{l.productType}</div>

              {(l.iso || l.chem) && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {l.iso && <span className="chip bg-slate-100 text-slate-700">{l.iso}</span>}
                  {l.chem && <span className="chip bg-slate-100 text-slate-700">{l.chem}</span>}
                </div>
              )}

              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} /> {l.region} · {fmt(l.quantity)} {l.unit}
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-xs font-medium text-slate-700">{l.seller.name}</span>
                  <TierBadge tier={l.seller.tier} />
                </div>
                {price(l.price) ? (
                  <div className="shrink-0 text-lg font-extrabold tracking-tight text-slate-900">
                    {price(l.price)}
                    <span className="text-xs font-semibold text-slate-500"> / {l.unit}</span>
                  </div>
                ) : (
                  <div className="shrink-0 text-sm font-bold text-slate-700">auf Anfrage</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setSelected(null)}
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity ${
          selected ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-over Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!selected}
      >
        {selected && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-700">Angebot</span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="flex aspect-[16/9] items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-brand-50 to-white">
                <CategoryGlyph productType={selected.productType} className="h-16 w-16 text-brand-600" />
              </div>

              <div>
                <div className="text-sm font-semibold text-brand-700">
                  {selected.manufacturer} · {selected.productType}
                </div>
                <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900">
                  {selected.productName}
                </h2>
                <div className="text-sm text-slate-500">
                  {[selected.iso, selected.chem].filter(Boolean).join(" · ")}
                </div>
              </div>

              {price(selected.price) ? (
                <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {price(selected.price)}
                  <span className="text-base font-semibold text-slate-500"> / {selected.unit}</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">Auf Anfrage</div>
              )}

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                <Spec k="Verfügbare Menge" v={`${fmt(selected.quantity)} ${selected.unit}`} />
                <Spec k="Gebinde" v={selected.packaging} />
                <Spec
                  k="Mindestabnahme"
                  v={selected.minOrder ? `${fmt(selected.minOrder)} ${selected.unit}` : "—"}
                />
                <Spec k="Standort" v={selected.region} />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">{selected.seller.name}</div>
                  <div className="text-xs text-slate-500">
                    {selected.seller.ratingCount > 0
                      ? `${(selected.seller.ratingAvg ?? 0).toFixed(1).replace(".", ",")} ★ · ${selected.seller.ratingCount}`
                      : "neuer Anbieter"}
                  </div>
                </div>
                <TierBadge tier={selected.seller.tier} />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-medium text-emerald-700">
                <ShieldCheck size={16} /> Sichere Abwicklung &amp; geprüfte Anbieter über Brisco
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 p-4">
              <Link
                href={`/listings/${selected.id}`}
                className="flex-1 rounded-full bg-brand-400 py-3 text-center text-base font-bold text-slate-900 transition hover:bg-brand-500"
              >
                Anbieter kontaktieren
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-white p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-slate-500">{k}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{v}</div>
    </div>
  );
}
