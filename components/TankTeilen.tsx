"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, Loader2, X, FileText } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Tank freigeben und Bericht holen (Betreiber 2026-08-17).
 *
 * Zwei Dinge, die zusammengehören: Der Messverlauf lässt sich als PDF-Bericht
 * herunterladen ODER lesend mit einem anderen Konto teilen — beides Wege, die
 * eigenen Daten aus der Plattform heraus nutzbar zu machen.
 *
 * Freigaben sind lesend und jederzeit widerrufbar; angesprochen wird über das
 * Pseudonym, die E-Mail bleibt verborgen.
 */
export function TankTeilen({
  tankId,
  freigaben,
  hatMessungen,
}: {
  tankId: string;
  freigaben: { userId: string; pseudonym: string }[];
  hatMessungen: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pseudonym, setPseudonym] = useState("");
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function teilen(e: React.FormEvent) {
    e.preventDefault();
    if (!pseudonym.trim()) return;
    setBusy(true);
    setFehler(null);
    setOk(null);
    try {
      const res = await fetch(`/api/tanks/${tankId}/freigabe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("share.err"));
      setOk(data.pseudonym);
      setPseudonym("");
      router.refresh();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : t("share.err"));
    } finally {
      setBusy(false);
    }
  }

  async function widerrufen(userId: string) {
    await fetch(`/api/tanks/${tankId}/freigabe?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Share2 className="h-5 w-5 text-brand-600" />
          {t("share.titel")}
        </h2>
        {hatMessungen && (
          <a
            href={`/api/tanks/${tankId}/bericht`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            <FileText className="h-4 w-4" />
            {t("share.bericht")}
          </a>
        )}
      </div>
      <p className="text-sm text-slate-600">{t("share.intro")}</p>

      <form onSubmit={teilen} className="flex flex-wrap items-center gap-2">
        <input
          value={pseudonym}
          onChange={(e) => setPseudonym(e.target.value)}
          placeholder={t("share.ph")}
          className="input min-w-0 flex-1 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={busy || !pseudonym.trim()}
          className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("share.knopf")}
        </button>
      </form>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      {ok && <p className="text-sm text-emerald-700">{t("share.ok")} {ok}</p>}

      {freigaben.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {t("share.aktuell")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {freigaben.map((f) => (
              <li
                key={f.userId}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm text-slate-700"
              >
                {f.pseudonym}
                <button
                  type="button"
                  onClick={() => widerrufen(f.userId)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-red-700"
                  aria-label={t("share.widerrufen")}
                  title={t("share.widerrufen")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
