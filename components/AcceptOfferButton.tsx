"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptOfferButton({
  rfqId,
  offerId,
}: {
  rfqId: string;
  offerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!confirm("Angebot annehmen und Chat mit dem Anbieter öffnen?")) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/rfqs/${rfqId}/offers/${offerId}/accept`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Annahme fehlgeschlagen.");
      setLoading(false);
      return;
    }
    const { conversationId } = await res.json();
    router.push(`/conversations/${conversationId}`);
  }

  return (
    <div>
      <button onClick={onClick} disabled={loading} className="btn-primary text-xs">
        {loading ? "…" : "Annehmen"}
      </button>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}
