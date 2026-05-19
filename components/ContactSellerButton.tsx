"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContactSellerButton({
  sellerId,
  listingId,
}: {
  sellerId: string;
  listingId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, listingId }),
    });
    if (res.status === 401) {
      router.push(`/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Konnte Konversation nicht öffnen.");
      setLoading(false);
      return;
    }
    const convo = await res.json();
    router.push(`/conversations/${convo.id}`);
  }

  return (
    <div>
      <button onClick={onClick} disabled={loading} className="btn-primary">
        {loading ? "Öffne Chat …" : "Verkäufer kontaktieren"}
      </button>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
