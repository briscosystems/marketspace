"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { generatePseudonym, findPseudonymLeak } from "@/lib/pseudonym";
import { EUROPE_COUNTRIES } from "@/lib/europe-countries";
import { withBasePath } from "@/lib/base-path";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    pseudonym: "",
    role: "RESELLER" as "RESELLER" | "OEM" | "ENDKUNDE",
    companyName: "",
    vatId: "",
    country: "DE",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Hinweis, wenn das eingegebene Pseudonym nicht zulässig war und wir es
  // selbständig durch einen neutralen Vorschlag ersetzt haben.
  const [pseudonymNote, setPseudonymNote] = useState<string | null>(null);

  /**
   * Prüft das eingegebene Pseudonym, sobald der Nutzer das Feld verlässt.
   * Ist es nicht zulässig (ungültige Zeichen/Leerzeichen/Umlaute, zu kurz
   * oder verrät Identität via E-Mail/Firma), wird es automatisch durch einen
   * neutralen Vorschlag ersetzt und der Grund angezeigt. Die vollständige
   * Hersteller-Prüfung passiert zusätzlich serverseitig.
   */
  function checkPseudonym() {
    const value = form.pseudonym.trim();
    if (!value) return;
    let reason: string | null = null;
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(value)) {
      reason =
        "nur Buchstaben, Zahlen, Bindestrich und Unterstrich erlaubt — keine Leerzeichen oder Umlaute";
    } else {
      reason = findPseudonymLeak(value, {
        companyName: form.companyName,
        email: form.email,
        vatId: form.vatId,
      });
    }
    if (reason) {
      const suggestion = generatePseudonym();
      setForm((f) => ({ ...f, pseudonym: suggestion }));
      setPseudonymNote(
        `„${value}" geht nicht (${reason}). Wir haben „${suggestion}" für dich eingesetzt — du kannst ihn anpassen.`,
      );
    } else {
      setPseudonymNote(null);
    }
  }

  // Neutralen Vorschlag erst im Browser erzeugen (nicht beim Server-Render),
  // sonst gäbe es eine Hydration-Warnung durch den Zufallswert.
  useEffect(() => {
    setForm((f) => (f.pseudonym ? f : { ...f, pseudonym: generatePseudonym() }));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.passwordConfirm) {
      setError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    const res = await fetch(withBasePath("/api/register"), {
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
      <h1 className="mb-2 page-title">Registrieren</h1>
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
            <p className="mt-1 text-xs text-slate-500">
              Wird <strong>nicht veröffentlicht</strong>. Wir nutzen sie nur für
              Login und Benachrichtigungen — andere Reseller sehen sie nie.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Pseudonym (öffentlich)</label>
              <button
                type="button"
                onClick={() => {
                  update("pseudonym", generatePseudonym());
                  setPseudonymNote(null);
                }}
                className="text-xs text-brand-500 hover:underline"
              >
                Neuer Vorschlag
              </button>
            </div>
            <input
              type="text"
              required
              minLength={3}
              pattern="[A-Za-z0-9_-]+"
              value={form.pseudonym}
              onChange={(e) => update("pseudonym", e.target.value)}
              onBlur={checkPseudonym}
              className="input"
              placeholder="z.B. Anbieter-7F3K"
            />
            {pseudonymNote ? (
              <p className="mt-1 text-xs text-amber-700">{pseudonymNote}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Neutraler Name zum Schutz deiner Identität. Verwende nicht deinen
                Firmen- oder Herstellernamen.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <div>
            <label className="label">Passwort wiederholen</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
              className="input"
            />
            {form.passwordConfirm && form.password !== form.passwordConfirm && (
              <p className="mt-1 text-xs text-red-600">
                Passwörter stimmen nicht überein.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Rolle</label>
            <select
              value={form.role}
              onChange={(e) =>
                update("role", e.target.value as "RESELLER" | "OEM" | "ENDKUNDE")
              }
              className="input"
            >
              <option value="RESELLER">Reseller</option>
              <option value="OEM">OEM Manufacturer</option>
              <option value="ENDKUNDE">Endkunde</option>
            </select>
          </div>
          <div>
            <label className="label">Land</label>
            <select
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className="input"
            >
              {EUROPE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
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
