"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, FileText, X } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { useLocale } from "@/components/LocaleProvider";

type Kind = "sample" | "quote";

/**
 * "Muster anfordern" / "Angebot anfragen" — B2B kauft nicht ungetestet.
 * Öffnet einen kleinen Dialog und startet den pseudonymen Chat mit einer
 * strukturierten Erstnachricht (über /api/conversations, initialMessage).
 */
export function InquiryButtons({
  sellerId,
  listingId,
  productLabel,
  quantityUnit,
  minOrderQty,
}: {
  sellerId: string;
  listingId: string;
  productLabel: string;
  quantityUnit: string;
  minOrderQty?: number | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState<Kind | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function show(kind: Kind) {
    setOpen(kind);
    setAmount(kind === "sample" ? "1" : minOrderQty ? String(minOrderQty) : "");
    setNote("");
    setError(null);
  }

  async function send() {
    if (!open) return;
    setSending(true);
    setError(null);
    const heading =
      open === "sample"
        ? `Muster-Anfrage zu „${productLabel}“`
        : `Angebots-Anfrage zu „${productLabel}“`;
    const amountLine =
      open === "sample"
        ? `Gewünschte Mustermenge: ${amount || "nach Absprache"} ${quantityUnit}`
        : `Gewünschte Menge: ${amount || "nach Absprache"} ${quantityUnit}`;
    const initialMessage = [heading, amountLine, note.trim()].filter(Boolean).join("\n");

    const res = await fetch(withBasePath("/api/conversations"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, listingId, initialMessage }),
    });
    if (res.status === 401) {
      router.push(`/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Anfrage konnte nicht gesendet werden.");
      setSending(false);
      return;
    }
    const convo = await res.json();
    router.push(`/conversations/${convo.id}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => show("sample")}
        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
      >
        <FlaskConical size={14} />
        {t("inq.muster")}
      </button>
      <button
        type="button"
        onClick={() => show("quote")}
        className="btn-primary inline-flex items-center gap-1.5 text-sm"
      >
        <FileText size={14} />
        {t("inq.angebot")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={() => !sending && setOpen(null)}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                {open === "sample" ? "Muster anfordern" : "Angebot anfragen"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-600">{productLabel}</p>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                {open === "sample" ? "Mustermenge" : "Menge"} ({quantityUnit})
              </span>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
              />
              {open === "quote" && minOrderQty ? (
                <span className="mt-1 block text-xs text-slate-500">
                  Mindestabnahme: {minOrderQty.toLocaleString("de-DE")} {quantityUnit}
                </span>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Nachricht (optional)
              </span>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1500}
                placeholder={
                  open === "sample"
                    ? "z. B. Einsatzzweck, Werkstoff, gewünschter Liefertermin …"
                    : "z. B. Lieferadresse-Region, Zeitrahmen, Zahlungsziel …"
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(null)}
                disabled={sending}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {sending ? "Sendet …" : "Anfrage senden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
