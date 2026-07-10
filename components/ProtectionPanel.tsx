"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { PROTECTION_STATUS_LABEL } from "@/lib/protection";

/**
 * Käuferschutz auf der Transaktionsseite.
 * Käufer: bezahlen (Geld wird geparkt) → nach Erhalt freigeben oder Problem
 * melden. Verkäufer: sieht den Status. Beim ersten Geschäft zwischen den
 * Parteien wird der Schutz ausdrücklich empfohlen (Vorauswahl).
 */
export function ProtectionPanel({
  transactionId,
  role,
  protectionStatus,
  totalEur,
  feeEur,
  sellerOffersProtection,
  isFirstDeal,
  txOpen,
}: {
  transactionId: string;
  role: "BUYER" | "SELLER";
  protectionStatus: string;
  totalEur: number;
  feeEur: number;
  sellerOffersProtection: boolean;
  isFirstDeal: boolean;
  txOpen: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(path: string, key: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setLoading(key);
    setError(null);
    const res = await fetch(withBasePath(path), { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setError(data.error ?? "Aktion fehlgeschlagen.");
      return;
    }
    if (data.url) {
      window.location.href = data.url; // Stripe-Checkout
      return;
    }
    router.refresh();
  }

  const header = (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
      <ShieldCheck size={16} className="text-emerald-600" />
      Käuferschutz
      {protectionStatus !== "NONE" && (
        <span className="chip bg-slate-100 text-slate-700">
          {PROTECTION_STATUS_LABEL[protectionStatus] ?? protectionStatus}
        </span>
      )}
    </div>
  );

  // Noch kein Schutz aktiv → Angebot an den Käufer (sofern Verkäufer teilnimmt)
  if (protectionStatus === "NONE" || protectionStatus === "PENDING_PAYMENT") {
    if (!txOpen) return null;
    if (!sellerOffersProtection) {
      return (
        <div className="card space-y-1.5">
          {header}
          <p className="text-sm text-slate-600">
            Dieser Verkäufer bietet (noch) keinen Käuferschutz an — die Abwicklung läuft
            direkt zwischen euch.
          </p>
        </div>
      );
    }
    return (
      <div className={`card space-y-2 ${isFirstDeal ? "border-emerald-300 ring-1 ring-emerald-200" : ""}`}>
        {header}
        {isFirstDeal && (
          <div className="w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Empfohlen — euer erstes Geschäft miteinander
          </div>
        )}
        <p className="text-sm text-slate-600">
          Du zahlst über die Plattform, das Geld wird sicher geparkt und erst nach deiner
          Lieferbestätigung an den Verkäufer freigegeben. Abwicklungsgebühr:{" "}
          <strong>{feeEur.toFixed(2)} €</strong> (Zahlungsdienstleister — Brisco verdient
          an der Transaktion nichts).
        </p>
        {role === "BUYER" ? (
          <button
            type="button"
            onClick={() => post(`/api/transactions/${transactionId}/protection/checkout`, "pay")}
            disabled={loading !== null}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading === "pay"
              ? "Öffne Checkout …"
              : `Mit Käuferschutz bezahlen (${(totalEur + feeEur).toFixed(2)} €)`}
          </button>
        ) : (
          <p className="text-xs text-slate-500">Der Käufer kann diese Zahlung wählen.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Geld geparkt → Käufer kann freigeben oder Problem melden
  if (protectionStatus === "HELD") {
    return (
      <div className="card space-y-2 border-blue-200 bg-blue-50/40">
        {header}
        <p className="text-sm text-slate-700">
          Die Zahlung ({totalEur.toFixed(2)} €) ist eingegangen und sicher geparkt.
          {role === "SELLER"
            ? " Sobald der Käufer die Lieferung bestätigt, wird das Geld an dich überwiesen."
            : " Bestätige nach Erhalt der Ware die Lieferung — erst dann geht das Geld an den Verkäufer."}
        </p>
        {role === "BUYER" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                post(
                  `/api/transactions/${transactionId}/protection/release`,
                  "release",
                  "Ware erhalten und in Ordnung? Das Geld wird endgültig an den Verkäufer überwiesen.",
                )
              }
              disabled={loading !== null}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading === "release" ? "Gebe frei …" : "Ware erhalten — Zahlung freigeben"}
            </button>
            <button
              type="button"
              onClick={() =>
                post(
                  `/api/transactions/${transactionId}/protection/dispute`,
                  "dispute",
                  "Problem melden? Das Geld bleibt geparkt, bis Brisco den Fall geprüft hat.",
                )
              }
              disabled={loading !== null}
              className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {loading === "dispute" ? "Melde …" : "Problem melden"}
            </button>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Endzustände + Problemfall
  return (
    <div className="card space-y-1.5">
      {header}
      <p className="text-sm text-slate-600">
        {protectionStatus === "RELEASED" &&
          "Die Lieferung wurde bestätigt — das Geld wurde an den Verkäufer überwiesen."}
        {protectionStatus === "REFUNDED" &&
          "Der Betrag wurde vollständig an den Käufer zurückerstattet."}
        {protectionStatus === "DISPUTED" &&
          "Ein Problem wurde gemeldet. Das Geld bleibt geparkt, bis Brisco den Fall entschieden hat — ihr werdet benachrichtigt."}
      </p>
    </div>
  );
}
