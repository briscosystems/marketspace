import Stripe from "stripe";

// Stripe-Client als Singleton. Ist KEIN Secret-Key gesetzt (Testmodus / noch
// nicht konfiguriert), bleibt der Client null — die Billing-Routen geben dann
// eine klare „nicht konfiguriert"-Meldung zurück, statt zu crashen.
const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey ? new Stripe(secretKey) : null;

export function isStripeConfigured(): boolean {
  return !!secretKey;
}

// Basis-URL für Erfolg/Abbruch-Redirects.
export function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
