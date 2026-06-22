"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Zurücksetzen fehlgeschlagen.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 page-title">Passwort zurücksetzen</h1>
        <div className="card">
          <p className="text-sm text-slate-600">
            Dieser Link ist unvollständig. Bitte fordere unter{" "}
            <Link href="/forgot-password" className="text-brand-500 hover:underline">
              Passwort vergessen
            </Link>{" "}
            einen neuen an.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 page-title">Neues Passwort vergeben</h1>
      {done ? (
        <div className="card">
          <div className="rounded bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            Dein Passwort wurde geändert. Du wirst zur Anmeldung weitergeleitet …
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="password">Neues Passwort (min. 8 Zeichen)</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Passwort wiederholen</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
            />
          </div>
          {error && (
            <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Wird gespeichert …" : "Passwort ändern"}
          </button>
        </form>
      )}
    </div>
  );
}
