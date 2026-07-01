// Vorgeschaltete Zugangssperre ("Gate") — eine weiße Login-Seite, die die gesamte
// Anwendung abriegelt, bis ein gemeinsames Passwort eingegeben wurde. Zweck: die Lösung
// in Produktion nur gezielten Personen zugänglich machen (getrennt vom normalen
// Nutzer-Login der App).
//
// Das Gate speichert KEINE Serverzustände. Nach korrektem Passwort wird ein Cookie mit
// einem HMAC-Token gesetzt; das Layout prüft dieses Token bei jedem Seitenaufruf.

export const GATE_COOKIE = "mp_gate";

function secret(): string {
  return (
    process.env.GATE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-insecure-gate-secret"
  );
}

/**
 * Zugangsdaten für das Gate. Das echte Passwort steht NICHT im Code, sondern kommt
 * ausschließlich aus der Umgebungsvariablen GATE_PASSWORD (in Produktion in Railway
 * gesetzt). Ohne gesetztes GATE_PASSWORD bleibt der Standard ein unbrauchbarer
 * Platzhalter → das Gate lässt sich dann bewusst nicht öffnen (fail closed).
 */
export function gateCredentials(): { user: string; password: string } {
  return {
    user: process.env.GATE_USER || "admin",
    password: process.env.GATE_PASSWORD || "change-me-set-GATE_PASSWORD",
  };
}

/**
 * Ist die Sperre aktiv? Standard: nur in Produktion. Lokal (npm run dev) also aus, damit
 * der gewohnte Entwicklungs-Workflow unverändert bleibt. Per GATE_ENABLED erzwingbar.
 */
export function gateEnabled(): boolean {
  if (process.env.GATE_ENABLED === "false") return false;
  if (process.env.GATE_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

/** Berechnet das erwartete Cookie-Token (HMAC-SHA256 des Secrets). */
export async function gateToken(): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode("brisco-marketplace-gate-v1"),
  );
  return Buffer.from(sig).toString("hex");
}

/** Prüft einen Cookie-Wert gegen das erwartete Token (zeitkonstanter Vergleich). */
export async function isGateTokenValid(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const expected = await gateToken();
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) {
    diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
