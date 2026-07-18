import Anthropic from "@anthropic-ai/sdk";
import { recordAiUsage } from "@/lib/ai-usage";

// ============================================================
// Kontaktdaten-Filter für Plattform-Nachrichten (FDS 4.5).
//
// Zwei Stufen:
//  1. findContactData()  — Regex-Filter, läuft auf JEDER Nachricht (kostenlos):
//     E-Mail-Adressen, Telefonnummern, URLs/Domains, verschleierte E-Mails
//     ("max (at) firma (punkt) de").
//  2. aiContactCheck()   — KI-Prüfung (Haiku) für raffiniert verschleierte
//     Kontaktdaten. Kosten trägt Brisco; deshalb limitiert:
//       - max. EINE Prüfung pro neuem Account (User.aiContactCheckAt),
//         angewendet auf dessen erste Nachricht
//       - harte Kostenobergrenze 20 Rp (CHF 0.20) pro Prüfung — real liegt
//         ein Aufruf bei ≈ 0.3 Rp (Haiku 4.5: $1/M Input, $5/M Output;
//         Input auf 4000 Zeichen gekappt + max_tokens 150)
// ============================================================

/** Harte Obergrenze pro KI-Prüfung in CHF (20 Rappen). */
export const AI_CHECK_MAX_COST_CHF = 0.2;

// Haiku 4.5 Preise (USD pro Token) — für die Kostenschätzung nach dem Call.
const HAIKU_INPUT_USD_PER_TOKEN = 1 / 1_000_000;
const HAIKU_OUTPUT_USD_PER_TOKEN = 5 / 1_000_000;
const USD_TO_CHF = 0.9; // grobe Annahme, konservativ genug für die Obergrenze

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
// Verschleierte E-Mail: "max (at) firma (punkt) de", "max [at] firma . de"
const OBFUSCATED_EMAIL_RE =
  /[\w.-]{2,}\s*(\(at\)|\[at\]|\{at\}|\s+at\s+)\s*[\w.-]{2,}\s*(\(dot\)|\[dot\]|\(punkt\)|\s+dot\s+|\s+punkt\s+)\s*\w{2,}/i;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
// Nackte Domain (ohne http/www) — gängige TLDs reichen für den Zweck
const DOMAIN_RE = /\b[a-z0-9][a-z0-9-]{1,60}\.(com|de|ch|at|net|org|eu|io|info|biz|shop)\b/i;
// Telefon-Kandidaten: +41..., 0041..., 079 123 45 67, 0171/1234567
const PHONE_CANDIDATE_RE = /(?:\+|00|0)\d[\d\s\-\/().]{5,}\d/g;

export type ContactFinding = { found: true; reason: string } | { found: false };

/**
 * Regex-Stufe — auf jeder Nachricht. Liefert den Grund (nutzerlesbar, deutsch),
 * wenn Kontaktdaten gefunden wurden.
 */
export function findContactData(text: string): ContactFinding {
  if (EMAIL_RE.test(text)) return { found: true, reason: "eine E-Mail-Adresse" };
  if (OBFUSCATED_EMAIL_RE.test(text)) return { found: true, reason: "eine (umschriebene) E-Mail-Adresse" };
  if (URL_RE.test(text)) return { found: true, reason: "einen Link" };
  if (DOMAIN_RE.test(text)) return { found: true, reason: "eine Web-Adresse" };

  // Telefonnummern: Kandidat muss ≥8 Ziffern haben und mit +/00/0 beginnen —
  // vermeidet Fehlalarme bei Mengen ("10 000 L") und Preisen.
  for (const m of text.matchAll(PHONE_CANDIDATE_RE)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length >= 8) return { found: true, reason: "eine Telefonnummer" };
  }

  return { found: false };
}

export type AiCheckResult =
  | { flagged: boolean; reason: string | null; costChf: number }
  | null;

/**
 * KI-Stufe — einmalig für die erste Nachricht eines neuen Accounts.
 * Erkennt raffiniert verschleierte Kontaktdaten, die der Regex nicht fängt
 * ("null sieben neun, drei mal die vier...", "Firmenname + Ort googeln").
 * Liefert null, wenn kein API-Key gesetzt ist oder der Call fehlschlägt —
 * die Nachricht wird dann NICHT blockiert (Regex-Stufe bleibt als Schutz).
 */
export async function aiContactCheck(text: string): Promise<AiCheckResult> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic();
    // Kostendeckel Teil 1: Input kappen (4000 Zeichen ≈ ~1200 Tokens)
    const capped = text.slice(0, 4000);
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150, // Kostendeckel Teil 2: kurze strukturierte Antwort
      system:
        "Du prüfst Nachrichten eines pseudonymen B2B-Marktplatzes. Die Regeln verbieten den Austausch direkter Kontaktdaten (E-Mail, Telefon, Webseite, Firmenname mit Ortsangabe, Messenger-Handles) — auch verschleiert oder umschrieben (ausgeschriebene Ziffern, 'at'/'punkt', 'googel uns', Social-Media-Verweise). Antworte NUR mit JSON: {\"flagged\": boolean, \"reason\": string|null}. reason: kurze deutsche Begründung, was gefunden wurde. Produktnamen, Mengen, Preise und Normen (ISO VG etc.) sind erlaubt und KEIN Fund.",
      messages: [{ role: "user", content: capped }],
    });

    recordAiUsage("contact_filter", resp.model, resp.usage);

    const usage = resp.usage;
    const costChf =
      (usage.input_tokens * HAIKU_INPUT_USD_PER_TOKEN +
        usage.output_tokens * HAIKU_OUTPUT_USD_PER_TOKEN) /
      USD_TO_CHF;
    if (costChf > AI_CHECK_MAX_COST_CHF) {
      // Sollte durch die Input-/Output-Kappung nie eintreten — Beleg im Log
      console.warn(`[Kontakt-Filter] KI-Prüfung über Kostendeckel: CHF ${costChf.toFixed(4)}`);
    }

    const textBlock = resp.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { flagged?: boolean; reason?: string | null };
    return { flagged: !!parsed.flagged, reason: parsed.reason ?? null, costChf };
  } catch (e) {
    console.warn("[Kontakt-Filter] KI-Prüfung fehlgeschlagen:", e);
    return null;
  }
}
