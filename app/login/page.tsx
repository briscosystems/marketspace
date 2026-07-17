"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { useLocale } from "@/components/LocaleProvider";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t("auth.wrongCredentials"));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 page-title">{t("auth.signin")}</h1>
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
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">{t("auth.password")}</label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-500 hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t("auth.signingIn") : t("auth.signin")}
        </button>
        <p className="text-center text-sm text-slate-600">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-brand-500 hover:underline">
            {t("auth.toRegister")}
          </Link>
        </p>
      </form>
    </div>
  );
}
