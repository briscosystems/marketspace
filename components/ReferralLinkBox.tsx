"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Mail } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

/**
 * Empfehlung per E-Mail: öffnet das eigene Mail-Programm des Nutzers, vorausgefüllt
 * mit dessen persönlichem Link. Brisco selbst verschickt oder speichert die
 * eingegebene Fremd-Adresse nicht — der Versand geht bewusst nicht über unseren
 * Server, sondern über den Mail-Client des werbenden Nutzers (siehe BGH,
 * "Tell-a-Friend"-Urteil vom 12.09.2013, I ZR 208/12: Ein automatischer Versand
 * durch den Betreiber an eine nicht einwilligende Drittperson wäre unzulässige
 * Werbung). Der Kopier-Link bleibt als Alternative für andere Kanäle bestehen.
 */
export function ReferralLinkBox({ pseudonym }: { pseudonym: string }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  // Erst im Browser berechnen (window) — vermeidet Hydration-Differenzen
  useEffect(() => {
    setLink(
      `${window.location.origin}${withBasePath(`/register?ref=${encodeURIComponent(pseudonym)}`)}`,
    );
  }, [pseudonym]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: Text markieren lassen
    }
  }

  function inviteByEmail(e: React.FormEvent) {
    e.preventDefault();
    const subject = "Einladung zu Brisco Marketplace";
    const body = `Hallo,\n\nich nutze Brisco Marketplace und wollte dich einladen, es dir auch anzuschauen:\n${link}\n\nViele Grüße`;
    window.location.href = `mailto:${encodeURIComponent(friendEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="space-y-3">
      <form onSubmit={inviteByEmail} className="flex items-center gap-2">
        <input
          type="email"
          required
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
          placeholder="E-Mail deines Kontakts"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Mail size={14} />
          Einladen
        </button>
      </form>
      <p className="text-xs text-slate-500">
        Öffnet dein eigenes Mail-Programm mit deinem persönlichen Link vorausgefüllt —
        Brisco speichert oder verschickt die Adresse deines Kontakts nicht selbst.
      </p>
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <input
          readOnly
          value={link || `…/register?ref=${pseudonym}`}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
    </div>
  );
}
