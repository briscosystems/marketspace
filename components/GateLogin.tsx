"use client";

import { useState } from "react";
import { BASE_PATH } from "@/lib/base-path";

// Weiße, minimalistische Login-Seite, die dem Marktplatz vorgeschaltet ist.
// Wird vom RootLayout gerendert, solange kein gültiges Gate-Cookie vorliegt.

export function GateLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${BASE_PATH}/api/gate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        padding: "24px",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: "340px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "20px",
            fontWeight: 600,
            color: "#0f172a",
            textAlign: "center",
          }}
        >
          Brisco Marketplace
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Geschützter Zugang
        </p>

        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Benutzer"
          autoComplete="username"
          autoFocus
          style={inputStyle}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          autoComplete="current-password"
          style={inputStyle}
        />

        {error && (
          <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>
            Benutzer oder Passwort falsch.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "4px",
            padding: "11px 16px",
            border: "none",
            borderRadius: "8px",
            background: loading ? "#94a3b8" : "#0f172a",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
  color: "#0f172a",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
