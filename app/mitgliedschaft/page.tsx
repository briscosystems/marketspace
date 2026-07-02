import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMembershipActive, membershipPriceEur } from "@/lib/membership";
import { isStripeConfigured } from "@/lib/stripe";
import { MembershipActions } from "@/components/MembershipActions";
import { CreditCard, ShieldCheck, Lock } from "lucide-react";

export const metadata = { title: "Mitgliedschaft — Brisco Marketplace" };

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card text-sm text-slate-600">
        Bitte zuerst{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          einloggen
        </Link>
        .
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipValidUntil: true },
  });
  const active = isMembershipActive(user?.membershipValidUntil);
  const priceEur = membershipPriceEur();
  const configured = isStripeConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard size={20} className="text-brand-600" />
        <h1 className="page-title">Mitgliedschaft & Zugang</h1>
      </div>

      <div className="card space-y-2">
        <div className="text-sm text-slate-600">Status</div>
        {active ? (
          <div className="text-lg font-semibold text-emerald-700">
            Aktiv bis{" "}
            {user!.membershipValidUntil!.toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        ) : (
          <div className="text-lg font-semibold text-slate-900">Kein aktiver Zugang</div>
        )}
        <p className="text-sm text-slate-600">
          Der Jahres-Zugang kostet <strong>{priceEur} €</strong> und schaltet die Plattform für
          12 Monate frei.
        </p>
      </div>

      {!configured && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Hinweis:</strong> Stripe ist noch nicht konfiguriert. Trage{" "}
          <code>STRIPE_SECRET_KEY</code> (Test-Key <code>sk_test_…</code>) in die <code>.env</code>{" "}
          ein und starte den Dev-Server neu — dann funktioniert die Kartenzahlung im Testmodus.
        </div>
      )}

      <div className="card">
        <MembershipActions active={active} priceEur={priceEur} />
      </div>

      {/* Sichtbare Vertrauenssignale zur Zahlung */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldCheck size={18} className="text-emerald-600" />
          Sichere Bezahlung über Stripe
        </div>
        <p className="text-sm text-slate-600">
          Die Zahlung läuft über <strong>Stripe</strong>, einen weltweit führenden
          Zahlungsdienstleister. Ihre Kartendaten werden verschlüsselt direkt bei Stripe
          verarbeitet und <strong>niemals auf dieser Plattform gespeichert</strong>
          {" "}(Sicherheitsstandard PCI-DSS Level 1).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {["Visa", "Mastercard", "American Express"].map((brand) => (
            <span
              key={brand}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {brand}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Lock size={12} /> SSL-verschlüsselt
          </span>
        </div>
      </div>
    </div>
  );
}
