"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

/**
 * USt-ID eingeben und gegen die offizielle EU-Datenbank (VIES) prüfen —
 * nur auf dem eigenen Profil sichtbar. Erfolgreiche Prüfung zeigt allen
 * Besuchern das "USt-ID geprüft"-Abzeichen (Vertrauenssignal).
 */
export function VatValidationBox({
  initialVatId,
  validatedAt,
}: {
  initialVatId: string | null;
  validatedAt: string | null;
}) {
  const router = useRouter();
  const [vatId, setVatId] = useState(initialVatId ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(withBasePath("/api/profile/validate-vat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vatId: vatId.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setChecking(false);
    if (!res.ok) {
      setError(data.error ?? "Prüfung fehlgeschlagen.");
      return;
    }
    setSuccess(
      data.name
        ? `Gültig — registriert auf: ${data.name}`
        : "Gültig — USt-ID von der EU-Datenbank bestätigt.",
    );
    router.refresh();
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="vatId">
          USt-ID
        </label>
        <input
          id="vatId"
          type="text"
          value={vatId}
          onChange={(e) => setVatId(e.target.value)}
          placeholder="z.B. DE123456789"
          className="w-44 rounded-md border border-slate-300 px-2 py-1 text-sm uppercase"
        />
        <button
          type="button"
          onClick={check}
          disabled={checking || vatId.trim().length < 4}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {checking ? "Prüfe …" : "Gegen EU-Datenbank prüfen"}
        </button>
        {validatedAt && !error && !success && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <BadgeCheck size={13} /> geprüft
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      <p className="text-xs text-slate-500">
        Prüfung über VIES, die offizielle Datenbank der EU-Kommission. Eine gültige
        USt-ID zeigt anderen Nutzern das Abzeichen „USt-ID geprüft" auf deinem Profil.
      </p>
    </div>
  );
}
