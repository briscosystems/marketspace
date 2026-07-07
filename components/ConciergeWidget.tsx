"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircleQuestion, Send, Sparkles, X } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hallo! Ich bin der Brisco-Concierge. Beschreib mir dein Problem oder deine Aufgabe in normalen Worten — z. B. „Mein Kühlschmierstoff schäumt“ oder „Ich fräse Aluminium und suche eine Emulsion“. Ich zeige dir passende Produkte, Angebote und Praxis-Wissen.";

/** Markdown-Links [Text](/pfad) als klickbare Next-Links rendern, Rest als Text. */
function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <Link key={i++} href={m[2]} className="font-medium text-brand-700 underline hover:text-brand-800">
        {m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className="whitespace-pre-line">{parts}</span>;
}

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(withBasePath("/api/concierge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Nur die letzten 12 Nachrichten mitschicken — reicht als Gesprächskontext
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMsgs((cur) => [...cur, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Der Concierge ist gerade nicht erreichbar. Bitte später erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Schwebender Öffnen-Knopf */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-slate-900 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition hover:bg-slate-800"
          aria-label="Concierge öffnen"
        >
          <Sparkles size={16} className="text-brand-400" />
          Concierge
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          {/* Kopf */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-400 text-slate-900">
                <MessageCircleQuestion size={16} />
              </span>
              <div>
                <div className="text-sm font-bold leading-tight">Brisco-Concierge</div>
                <div className="text-[11px] text-slate-300">Dein digitaler Fachberater</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Schließen"
            >
              <X size={18} />
            </button>
          </div>

          {/* Verlauf */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            <Bubble role="assistant">
              <span className="whitespace-pre-line">{GREETING}</span>
            </Bubble>
            {msgs.map((m, i) => (
              <Bubble key={i} role={m.role}>
                <RichText text={m.content} />
              </Bubble>
            ))}
            {busy && (
              <Bubble role="assistant">
                <span className="inline-flex gap-1">
                  <Dot delay="0ms" /> <Dot delay="150ms" /> <Dot delay="300ms" />
                </span>
              </Bubble>
            )}
            {error && <p className="px-1 text-xs text-red-600">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Eingabe */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Frage oder Problem beschreiben …"
              maxLength={2000}
              className="min-w-0 flex-1 rounded-full border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              aria-label="Senden"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          role === "user"
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm bg-slate-100 text-slate-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
