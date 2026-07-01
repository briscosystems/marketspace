"use client";

import Link from "next/link";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Nur im Prototyp: der erzeugte Reset-Link, solange kein Mailversand läuft.
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(withBasePath("/api/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setSent(true);
    setDevLink(data.resetUrl ?? null);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 page-title">Passwort vergessen</h1>
      <p className="mb-6 text-sm text-slate-600">
        Gib deine E-Mail-Adresse ein. Existiert ein Konto dazu, schicken wir dir
        einen Link zum Zurücksetzen.
      </p>

      {sent ? (
        <div className="card space-y-4">
          <div className="rounded bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            Wenn ein Konto zu <strong>{email}</strong> existiert, haben wir einen
            Link zum Zurücksetzen erzeugt. Bitte prüfe dein Postfach.
          </div>

          {devLink && (
            <div className="rounded border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="mb-1 font-semibold">
                Prototyp-Hinweis (E-Mail-Versand noch nicht aktiv):
              </p>
              <p className="mb-2">
                Normalerweise käme dieser Link per E-Mail. Zum Testen hier direkt:
              </p>
              <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="font-medium text-brand-600 underline break-all">
                Passwort jetzt zurücksetzen →
              </Link>
            </div>
          )}

          <Link href="/login" className="block text-center text-sm text-brand-500 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Wird gesendet …" : "Link anfordern"}
          </button>
          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="text-brand-500 hover:underline">
              Zurück zur Anmeldung
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
