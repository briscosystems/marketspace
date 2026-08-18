"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Produkt = { id: string; label: string };

export function TankAnlegen({ produkte }: { produkte: Produkt[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [machine, setMachine] = useState("");
  const [volume, setVolume] = useState("");
  const [hoehe, setHoehe] = useState("");
  const [productId, setProductId] = useState("");
  const [productFreetext, setProductFreetext] = useState("");
  const [dh, setDh] = useState("");
  const [filledAt, setFilledAt] = useState("");

  const zahl = (s: string): number | null => {
    const n = Number(s.replace(",", "."));
    return s.trim() === "" || Number.isNaN(n) ? null : n;
  };

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch("/api/tanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          machine: machine || null,
          volumeLiters: zahl(volume),
          productId: productId || null,
          productFreetext: productId ? null : productFreetext || null,
          waterHardnessDh: zahl(dh),
          heightCm: zahl(hoehe),
          filledAt: filledAt ? new Date(filledAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("tank.errSave"));
      setOffen(false);
      setName("");
      setMachine("");
      setVolume("");
      setProductId("");
      setProductFreetext("");
      setDh("");
      setFilledAt("");
      router.refresh();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("tank.errSave"));
    } finally {
      setBusy(false);
    }
  }

  if (!offen) {
    return (
      <button type="button" onClick={() => setOffen(true)} className="btn-primary inline-flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {t("tank.addTank")}
      </button>
    );
  }

  return (
    <form onSubmit={speichern} className="card space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t("tank.addTank")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tank-name" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fName")}
          </label>
          <input
            id="tank-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("tank.fNamePh")}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="tank-machine" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fMachine")}
          </label>
          <input
            id="tank-machine"
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
            placeholder={t("tank.fMachinePh")}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="tank-product" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fProduct")}
          </label>
          <select
            id="tank-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="input"
          >
            <option value="">{t("tank.fProductNone")}</option>
            {produkte.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">{t("tank.fProductHint")}</p>
        </div>
        {!productId && (
          <div>
            <label htmlFor="tank-freetext" className="mb-1 block text-sm font-medium text-slate-700">
              {t("tank.fProductFree")}
            </label>
            <input
              id="tank-freetext"
              value={productFreetext}
              onChange={(e) => setProductFreetext(e.target.value)}
              className="input"
            />
          </div>
        )}
        <div>
          <label htmlFor="tank-volume" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fVolume")}
          </label>
          <input
            id="tank-volume"
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="400"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="tank-hoehe" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fHoehe")}
          </label>
          <input
            id="tank-hoehe"
            inputMode="decimal"
            value={hoehe}
            onChange={(e) => setHoehe(e.target.value)}
            placeholder="80"
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">{t("tank.fHoeheHint")}</p>
        </div>
        <div>
          <label htmlFor="tank-dh" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fHardness")}
          </label>
          <input
            id="tank-dh"
            inputMode="decimal"
            value={dh}
            onChange={(e) => setDh(e.target.value)}
            placeholder="14"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="tank-filled" className="mb-1 block text-sm font-medium text-slate-700">
            {t("tank.fFilled")}
          </label>
          <input
            id="tank-filled"
            type="date"
            value={filledAt}
            onChange={(e) => setFilledAt(e.target.value)}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">{t("tank.fFilledHint")}</p>
        </div>
      </div>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary inline-flex items-center gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("tank.save")}
        </button>
        <button type="button" onClick={() => setOffen(false)} className="btn-secondary">
          {t("tank.cancel")}
        </button>
      </div>
    </form>
  );
}
