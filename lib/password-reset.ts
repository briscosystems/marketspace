/**
 * Passwort-Reset-Tokens — Hilfsfunktionen für den "Passwort vergessen"-Flow.
 *
 * Sicherheitsprinzip: Der Klartext-Token geht nur an den Nutzer (per Link).
 * In der DB liegt ausschließlich der sha256-Hash. Selbst wer die DB liest,
 * kann damit kein Passwort zurücksetzen.
 */
import { createHash, randomBytes } from "crypto";

/** Gültigkeitsdauer eines Reset-Links: 1 Stunde. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Erzeugt einen kryptografisch sicheren Klartext-Token (URL-tauglich). */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** sha256-Hash eines Tokens — so wird er in der DB abgelegt und verglichen. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
