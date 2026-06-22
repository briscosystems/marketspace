"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "PENDING" | "SHIPPED" | "COMPLETED" | "CANCELED" | "DISPUTED";

export function TransactionActions({
  transactionId,
  status,
  role,
}: {
  transactionId: string;
  status: Status;
  role: "BUYER" | "SELLER";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "SHIP" | "COMPLETE" | "CANCEL" | "DISPUTE", confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setLoading(action);
    setError(null);
    const res = await fetch(`/api/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Aktion fehlgeschlagen.");
      return;
    }
    router.refresh();
  }

  const buttons: React.ReactNode[] = [];
  if (role === "SELLER" && status === "PENDING") {
    buttons.push(
      <button key="ship" disabled={loading !== null} className="btn-primary" onClick={() => act("SHIP")}>
        {loading === "SHIP" ? "…" : "Als versendet markieren"}
      </button>
    );
  }
  if (role === "BUYER" && (status === "PENDING" || status === "SHIPPED")) {
    buttons.push(
      <button
        key="complete"
        disabled={loading !== null}
        className="btn-primary"
        onClick={() =>
          act(
            "COMPLETE",
            "Lieferung erhalten und Transaktion als abgeschlossen markieren? Danach kannst du bewerten."
          )
        }
      >
        {loading === "COMPLETE" ? "…" : "Erhalten – Abschluss bestätigen"}
      </button>
    );
  }
  if (status === "PENDING") {
    buttons.push(
      <button
        key="cancel"
        disabled={loading !== null}
        className="btn-secondary"
        onClick={() => act("CANCEL", "Transaktion wirklich stornieren?")}
      >
        Stornieren
      </button>
    );
  }
  if (status !== "COMPLETED" && status !== "CANCELED" && status !== "DISPUTED") {
    buttons.push(
      <button
        key="dispute"
        disabled={loading !== null}
        className="text-sm text-red-600 hover:text-red-700"
        onClick={() => act("DISPUTE", "Dispute eröffnen? Ein Admin schaut sich das an.")}
      >
        Dispute eröffnen
      </button>
    );
  }

  if (buttons.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">{buttons}</div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
