"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; pseudonym: string };
};

export function MessageThread({
  conversationId,
  meId,
}: {
  conversationId: string;
  meId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data: Message[] = await res.json();
      setMessages(data);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: input.trim() }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Senden fehlgeschlagen.");
      return;
    }
    setInput("");
    await load();
  }

  return (
    <div className="card flex h-[60vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Noch keine Nachrichten — schreib die erste.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    mine
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {!mine && (
                    <div className="mb-0.5 text-xs font-medium opacity-70">
                      {m.sender.pseudonym}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div
                    className={`mt-1 text-[10px] ${
                      mine ? "text-brand-50/80" : "text-slate-500"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSend} className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht schreiben …"
          className="input flex-1"
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>
          {sending ? "Senden …" : "Senden"}
        </button>
      </form>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
