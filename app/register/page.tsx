"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { generatePseudonym, findPseudonymLeak } from "@/lib/pseudonym";
import { EUROPE_COUNTRIES } from "@/lib/europe-countries";
import { withBasePath } from "@/lib/base-path";
import { Gift } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  // Trial-Konditionen aus den Einstellungen holen (nie fest im Text, s. /api/trial-info)
  const [trial, setTrial] = useState<{ days: number; credits: number } | null>(null);
  useEffect(() => {
    fetch(withBasePath("/api/trial-info"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTrial(d))
      .catch(() => {}); // Werbekasten ist Beiwerk — Fehler darf das Formular nicht stören
  }, []);
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    pseudonym: "",
    role: "RESELLER" as "RESELLER" | "OEM" | "ENDKUNDE",
    companyName: "",
    vatId: "",
    country: "DE",
    referralCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Empfehlungs-Code aus dem Link übernehmen (/register?ref=Pseudonym)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setForm((f) => ({ ...f, referralCode: ref }));
  }, []);
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
      setError(t("reg.passwordMismatch"));
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
      setError(data.error ?? t("reg.failed"));
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
      setError(t("reg.createdLoginFailed"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 page-title">{t("reg.title")}</h1>
      <p className="mb-4 text-sm text-slate-600">
{t("reg.privacyNote")}
      </p>

      {/* Was der Neukunde bekommt. Stand bisher NIRGENDS — weder hier noch auf der
          Startseite. Zahlen kommen aus /api/trial-info (Superadmin-Einstellungen),
          damit der Text nie etwas anderes verspricht, als die Software gewährt. */}
      {trial && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-brand-700" />
            <span className="text-sm font-semibold text-slate-900">
              {fill(t("reg.trialDays"), { n: trial.days })}
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>· {t("reg.trialAccess")}</li>
            <li>· {fill(t("reg.trialCredits"), { c: trial.credits })}</li>
            <li>· {t("reg.trialKnowledge")}</li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">
{t("reg.trialNoAutoStart")}
          </p>
        </div>
      )}
      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("reg.emailLabel")}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
{t("reg.emailHint")}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">{t("reg.pseudonymLabel")}</label>
              <button
                type="button"
                onClick={() => {
                  update("pseudonym", generatePseudonym());
                  setPseudonymNote(null);
                }}
                className="text-xs text-brand-500 hover:underline"
              >
                {t("reg.pseudonymSuggest")}
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
              placeholder={t("reg.pseudonymPlaceholder")}
            />
            {pseudonymNote ? (
              <p className="mt-1 text-xs text-amber-700">{pseudonymNote}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
{t("reg.pseudonymHint")}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("reg.passwordLabel")}</label>
            <PasswordInput
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("reg.passwordConfirmLabel")}</label>
            <PasswordInput
              required
              minLength={8}
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
              className="input"
            />
            {form.passwordConfirm && form.password !== form.passwordConfirm && (
              <p className="mt-1 text-xs text-red-600">
                {t("reg.passwordMismatch")}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("reg.roleLabel")}</label>
            <select
              value={form.role}
              onChange={(e) =>
                update("role", e.target.value as "RESELLER" | "OEM" | "ENDKUNDE")
              }
              className="input"
            >
              <option value="RESELLER">{t("reg.roleReseller")}</option>
              <option value="OEM">{t("reg.roleOem")}</option>
              <option value="ENDKUNDE">{t("reg.roleEndUser")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("reg.countryLabel")}</label>
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
          <label className="label">{t("reg.companyLabel")}</label>
          <input
            type="text"
            required
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">{t("reg.vatLabel")}</label>
          <input
            type="text"
            value={form.vatId}
            onChange={(e) => update("vatId", e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">{t("reg.referralLabel")}</label>
          <input
            type="text"
            value={form.referralCode}
            onChange={(e) => update("referralCode", e.target.value)}
            placeholder={t("reg.referralPlaceholder")}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">
{t("reg.referralHint")}
          </p>
        </div>

        {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t("reg.submitting") : t("reg.submit")}
        </button>
        <p className="text-center text-sm text-slate-600">
          {t("reg.alreadyRegistered")}{" "}
          <Link href="/login" className="text-brand-500 hover:underline">
            {t("reg.toLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}
