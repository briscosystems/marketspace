"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Antwort bewusst nicht ausgewertet: Die Route antwortet immer gleich, damit
    // niemand herausfinden kann, welche Adressen registriert sind. Der Link geht
    // ausschließlich per E-Mail raus.
    await fetch(withBasePath("/api/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 page-title">{t("fp.title")}</h1>
      <p className="mb-6 text-sm text-slate-600">
        {t("fp.lead")}
      </p>

      {sent ? (
        <div className="card space-y-4">
          <div className="rounded bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            {t("fp.sentBefore")}<strong>{email}</strong>{t("fp.sentAfter")}
          </div>

          <Link href="/login" className="block text-center text-sm text-brand-700 hover:underline">
            {t("fp.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">{t("auth.email")}</label>
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
            {loading ? t("fp.sending") : t("fp.request")}
          </button>
          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="text-brand-700 hover:underline">
              {t("fp.backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
