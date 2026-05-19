"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    pseudonym: "",
    role: "RESELLER" as "RESELLER" | "OEM",
    companyName: "",
    vatId: "",
    country: "DE",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }
    const signin = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signin?.error) {
      setError("Account angelegt, Login fehlgeschlagen.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold">Registrieren</h1>
      <p className="mb-6 text-sm text-slate-600">
        Klarname und Kontaktdaten bleiben verborgen. Andere Reseller sehen nur dein
        Pseudonym.
      </p>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email (intern)</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Pseudonym (öffentlich)</label>
            <input
              type="text"
              required
              minLength={3}
              pattern="[A-Za-z0-9_-]+"
              value={form.pseudonym}
              onChange={(e) => update("pseudonym", e.target.value)}
              className="input"
              placeholder="z.B. Alpha-Trader"
            />
          </div>
        </div>

        <div>
          <label className="label">Passwort (min. 8 Zeichen)</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Rolle</label>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value as "RESELLER" | "OEM")}
              className="input"
            >
              <option value="RESELLER">Reseller</option>
              <option value="OEM">OEM Manufacturer</option>
            </select>
          </div>
          <div>
            <label className="label">Land (ISO-2)</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={2}
              value={form.country}
              onChange={(e) => update("country", e.target.value.toUpperCase())}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Firma (KYC, intern)</label>
          <input
            type="text"
            required
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">USt-ID (optional)</label>
          <input
            type="text"
            value={form.vatId}
            onChange={(e) => update("vatId", e.target.value)}
            className="input"
          />
        </div>

        {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Konto wird angelegt …" : "Konto anlegen"}
        </button>
        <p className="text-center text-sm text-slate-600">
          Bereits registriert?{" "}
          <Link href="/login" className="text-brand-500 hover:underline">
            Anmelden
          </Link>
        </p>
      </form>
    </div>
  );
}
