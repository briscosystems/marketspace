/**
 * Zentraler Anthropic-Client mit harten Sicherheitsgrenzen, damit KI-Fehler
 * NIEMALS in unkontrollierten Token-Verbrauch laufen können.
 *
 * Drei Schutzebenen:
 *   1) createAnthropic() — begrenzte Retries (SDK-Default 2 → 1) + hartes Timeout.
 *      Verhindert, dass ein fehlerhafter Aufruf durch Auto-Retries die Tokenkosten
 *      vervielfacht oder ewig hängt.
 *   2) clampText() — kappt Freitext-/SDS-Eingaben, bevor sie in einen Prompt fließen.
 *      Verhindert Riesen-Prompts (Input-Tokens).
 *   3) Circuit-Breaker — nach mehreren Fehlern in Folge wird die KI kurz deaktiviert,
 *      damit ein Anbieter-Ausfall nicht bei JEDEM Request erneut (teure) Calls auslöst.
 *
 * max_tokens (Output-Deckel) wird weiterhin an jeder create()-Stelle gesetzt.
 */
import Anthropic from "@anthropic-ai/sdk";

const MAX_RETRIES = 1; // SDK-Default ist 2 — wir senken, um Token-Vervielfachung bei Fehlern zu bremsen
const REQUEST_TIMEOUT_MS = 60_000; // hartes Zeitlimit pro Call (einzelne create() dürfen kürzer sein)

/** Zeichen-Obergrenzen für Eingaben, die in Prompts fließen. */
export const AI_LIMITS = {
  freetext: 4000, // Nutzer-Freitext (Problembeschreibung, Suchanfrage, Werkstoff)
  sdsText: 12000, // aus einem hochgeladenen/gespeicherten SDS extrahierter Volltext
} as const;

/**
 * Kappt Text auf maxChars Zeichen. Leerer/undefinierter Text → "".
 * Der Aufrufer entscheidet, ob "" zu null wird (z. B. `clampText(x) || null`).
 */
export function clampText(text: string | null | undefined, maxChars: number): string {
  if (!text) return "";
  const t = text.trim();
  return t.length <= maxChars ? t : t.slice(0, maxChars) + " …[gekürzt]";
}

/**
 * Erzeugt einen Anthropic-Client mit begrenzten Retries + Timeout.
 * apiKey wird vom SDK aus ANTHROPIC_API_KEY gelesen (alle Aufrufer prüfen den Key vorher).
 */
export function createAnthropic(): Anthropic {
  return new Anthropic({
    maxRetries: MAX_RETRIES,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

// ---------------------------------------------------------------------------
// Circuit-Breaker (in-memory, pro Server-Instanz)
// ---------------------------------------------------------------------------
const FAILURE_THRESHOLD = 3; // so viele Fehler in Folge …
const COOLDOWN_MS = 60_000; // … deaktivieren die KI für diese Zeit

let consecutiveFailures = 0;
let disabledUntil = 0;

/** true, solange die KI wegen wiederholter Fehler pausiert ist → Aufrufer nutzt den Fallback. */
export function aiTemporarilyDisabled(): boolean {
  return Date.now() < disabledUntil;
}

/** Nach einem erfolgreichen KI-Call aufrufen — setzt den Fehlerzähler zurück. */
export function noteAiSuccess(): void {
  consecutiveFailures = 0;
  disabledUntil = 0;
}

/** Nach einem fehlgeschlagenen KI-Call aufrufen — pausiert die KI bei zu vielen Fehlern. */
export function noteAiFailure(): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    disabledUntil = Date.now() + COOLDOWN_MS;
    consecutiveFailures = 0;
    console.warn(`[ai-client] Circuit-Breaker aktiv: KI für ${COOLDOWN_MS / 1000}s deaktiviert (zu viele Fehler).`);
  }
}
