"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Loader2 } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

/** Vom Superadmin generierten Referral-/Gutschein-Code einlösen. */
export function RedeemCodeBox() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function redeem() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(withBasePath("/api/account/redeem-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Code konnte nicht eingelöst werden.");
      setSuccess(`+${data.credits} Credits gutgeschrieben. Neuer Stand: ${data.balance}.`);
      setCode("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          redeem();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code eingeben (z.B. BRISCO-XXXX-XXXX)"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
          Einlösen
        </button>
      </form>
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
