"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { PasswordInput } from "@/components/PasswordInput";
import { useLocale } from "@/components/LocaleProvider";

/** Passwort im eigenen Profil ändern (eingeloggt, mit aktuellem Passwort zur Bestätigung). */
export function PasswordChangeEditor() {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function save() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("pwd.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("pwd.tooShort"));
      return;
    }
    setSaving(true);
    const res = await fetch(withBasePath("/api/profile/password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("pwd.fehler"));
      return;
    }
    reset();
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  if (!editing) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          <KeyRound size={14} />
          {t("pwd.aendern")}
        </button>
        {done && <p className="text-sm text-emerald-700">{t("pwd.geaendert")}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-2">
      <div>
        <label className="label">{t("pwd.aktuell")}</label>
        <PasswordInput
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="label">{t("pwd.neu")}</label>
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="label">{t("pwd.wiederholen")}</label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? t("pwd.speichert") : t("pwd.speichern")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          {t("pwd.abbrechen")}
        </button>
      </div>
    </div>
  );
}
