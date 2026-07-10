"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

/**
 * Verkäufer-Seite des Käuferschutzes (auf /mitgliedschaft): einmaliges
 * Stripe-Onboarding freischalten. Danach trägt das Profil das Abzeichen
 * "Käuferschutz verfügbar" und Käufer können geschützt bezahlen.
 */
export function ConnectOnboardingBox({ onboarded }: { onboarded: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    const res = await fetch(withBasePath("/api/connect/onboard"), { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error ?? "Onboarding konnte nicht gestartet werden.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  if (onboarded) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <ShieldCheck size={16} />
        Käuferschutz ist aktiv — dein Profil trägt das Abzeichen „Käuferschutz verfügbar".
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Öffne Stripe …" : "Käuferschutz freischalten (Stripe-Prüfung)"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        Einmalige Identitäts- und Bankdaten-Prüfung durch Stripe. Danach können Käufer
        bei dir „mit Käuferschutz" bezahlen: Das Geld wird sicher geparkt und nach der
        Lieferbestätigung automatisch an dich überwiesen.
      </p>
    </div>
  );
}
