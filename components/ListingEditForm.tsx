"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { Autocomplete } from "@/components/Autocomplete";
import { REGION_OPTIONS, REGION_PLACEHOLDER } from "@/lib/regionen";
import { useLocale } from "@/components/LocaleProvider";

const chemistries = ["MINERAL", "SYNTHETIC", "SEMI_SYNTHETIC", "ESTER", "PAG", "GTL", "OTHER"] as const;
const packagings = ["DRUM", "IBC", "TANK", "CANISTER", "BULK", "OTHER"] as const;
const statuses = ["ACTIVE", "PAUSED", "SOLD", "ARCHIVED"] as const;

export type EditableListing = {
  id: string;
  productType: string;
  manufacturer: string;
  productName: string;
  isoViscosity: string | null;
  chemistry: (typeof chemistries)[number];
  applicationArea: string;
  quantity: number;
  quantityUnit: string;
  minOrderQty: number | null;
  locationRegion: string;
  packaging: (typeof packagings)[number];
  certificates: string[];
  priceEur: number | null;
  shippingTerms: string | null;
  description: string | null;
  status: (typeof statuses)[number];
};

export function ListingEditForm({ listing }: { listing: EditableListing }) {
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const certificates = (fd.get("certificates") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      productType: fd.get("productType"),
      manufacturer: fd.get("manufacturer"),
      productName: fd.get("productName"),
      isoViscosity: ((fd.get("isoViscosity") as string) || "") || null,
      chemistry: fd.get("chemistry"),
      applicationArea: fd.get("applicationArea"),
      quantity: Number(fd.get("quantity")),
      quantityUnit: fd.get("quantityUnit") || "L",
      minOrderQty: fd.get("minOrderQty") ? Number(fd.get("minOrderQty")) : null,
      locationRegion: fd.get("locationRegion"),
      packaging: fd.get("packaging"),
      certificates,
      priceEur: fd.get("priceEur") ? Number(fd.get("priceEur")) : null,
      shippingTerms: ((fd.get("shippingTerms") as string) || "") || null,
      description: ((fd.get("description") as string) || "") || null,
      status: fd.get("status"),
    };
    const res = await fetch(withBasePath(`/api/listings/${listing.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("led.fehlerSpeichern"));
      return;
    }
    router.push(`/listings/${listing.id}`);
    router.refresh();
  }

  async function onDelete() {
    if (!confirm(t("led.confirmArchiv"))) return;
    setDeleting(true);
    const res = await fetch(withBasePath(`/api/listings/${listing.id}`), { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("led.fehlerArchiv"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">{t("led.produkttyp")}</label>
          <input name="productType" required defaultValue={listing.productType} className="input" />
        </div>
        <div>
          <label className="label">{t("led.hersteller")}</label>
          <input name="manufacturer" required defaultValue={listing.manufacturer} className="input" />
        </div>
        <div>
          <label className="label">{t("led.produktname")}</label>
          <input name="productName" required defaultValue={listing.productName} className="input" />
        </div>
        <div>
          <label className="label">{t("led.isoVisk")}</label>
          <input name="isoViscosity" defaultValue={listing.isoViscosity ?? ""} className="input" />
        </div>
        <div>
          <label className="label">{t("led.chemie")}</label>
          <select name="chemistry" defaultValue={listing.chemistry} className="input">
            {chemistries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("led.anwendung")}</label>
          <input name="applicationArea" required defaultValue={listing.applicationArea} className="input" />
        </div>
        <div>
          <label className="label">{t("led.menge")}</label>
          <input name="quantity" type="number" step="any" required defaultValue={listing.quantity} className="input" />
        </div>
        <div>
          <label className="label">{t("led.einheit")}</label>
          <input name="quantityUnit" defaultValue={listing.quantityUnit} className="input" />
        </div>
        <div>
          <label className="label">{t("led.mindestabnahme")}</label>
          <input name="minOrderQty" type="number" step="any" defaultValue={listing.minOrderQty ?? ""} className="input" />
        </div>
        <div>
          <label className="label">{t("led.verpackung")}</label>
          <select name="packaging" defaultValue={listing.packaging} className="input">
            {packagings.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("led.lagerregion")}</label>
          <Autocomplete
            name="locationRegion"
            options={REGION_OPTIONS}
            defaultValue={listing.locationRegion}
            required
            placeholder={REGION_PLACEHOLDER}
          />
        </div>
        <div>
          <label className="label">{t("led.preis")}</label>
          <input name="priceEur" type="number" step="0.01" defaultValue={listing.priceEur ?? ""} className="input" />
        </div>
        <div>
          <label className="label">{t("led.status")}</label>
          <select name="status" defaultValue={listing.status} className="input">
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t("led.zertifikate")}</label>
        <input name="certificates" defaultValue={listing.certificates.join(", ")} className="input" />
      </div>
      <div>
        <label className="label">{t("led.versand")}</label>
        <input name="shippingTerms" defaultValue={listing.shippingTerms ?? ""} className="input" />
      </div>
      <div>
        <label className="label">{t("led.beschreibung")}</label>
        <textarea name="description" rows={4} defaultValue={listing.description ?? ""} className="input" />
      </div>
      {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="text-sm text-red-600 hover:text-red-700"
        >
          {deleting ? t("led.archiviere") : t("led.archivieren")}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t("led.speichert") : t("led.speichern")}
        </button>
      </div>
    </form>
  );
}
