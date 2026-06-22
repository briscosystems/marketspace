import Link from "next/link";
import { ShieldCheck, BadgeCheck, EyeOff, Lock, Star } from "lucide-react";
import { TIER_STYLES } from "@/components/TrustBadge";

export const metadata = { title: "So sorgen wir für Vertrauen — Brisco" };

export default function VertrauenPage() {
  const tiers = Object.values(TIER_STYLES).sort((a, b) => a.level - b.level);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-emerald-600" />
          <h1 className="page-title">So sorgen wir für Vertrauen</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Beim Handel zwischen Unternehmen zählt: Mit wem habe ich es zu tun, und bin ich
          abgesichert? Dafür gibt es bei Brisco mehrere Mechanismen.
        </p>
      </div>

      {/* Verifizierungsstufen */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-brand-600" />
          <h2 className="section-title">Verifizierungsstufen</h2>
        </div>
        <p className="text-sm text-slate-600">
          Jeder Reseller trägt eine Vertrauensstufe. Sie steigt mit geprüfter Identität,
          abgeschlossenen Geschäften und guten Bewertungen — und ist überall sichtbar.
        </p>
        <div className="card divide-y divide-slate-100 p-0">
          {tiers.map((t) => {
            const Icon = t.Icon;
            return (
              <div key={t.level} className="flex items-start gap-3 p-3">
                <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 ${t.classes}`}>
                  <Icon size={14} className={t.iconColor} strokeWidth={2.25} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                  <div className="text-xs text-slate-600">{t.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Verifizierte Bewertungen */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-500" />
          <h2 className="section-title">Verifizierte Bewertungen</h2>
        </div>
        <p className="text-sm text-slate-600">
          Bewertungen kann nur abgeben, wer über Brisco tatsächlich ein Geschäft
          <strong> abgeschlossen</strong> hat. Jede Bewertung ist also an eine echte Transaktion
          gebunden — keine gekauften oder erfundenen Sterne. Schnitt und Anzahl sind auf jedem
          Profil sichtbar.
        </p>
      </section>

      {/* Pseudonymität & Neutralität */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <EyeOff size={18} className="text-slate-600" />
          <h2 className="section-title">Pseudonym & neutral</h2>
        </div>
        <p className="text-sm text-slate-600">
          Nutzer treten unter einem Pseudonym auf, und in den Nachrichten ist der Austausch von
          direkten Kontaktdaten nicht erlaubt. Das schützt beide Seiten vor Abwerbung und hält die
          Plattform <strong>neutral</strong>: Wir bevorzugen niemanden sichtbar, und niemand kann
          an Brisco vorbei „angefüttert" werden, bevor Vertrauen aufgebaut ist.
        </p>
      </section>

      {/* Sicherer Ablauf */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-emerald-600" />
          <h2 className="section-title">Sicherer Ablauf</h2>
        </div>
        <p className="text-sm text-slate-600">
          Anbahnung, Angebotsannahme und Kommunikation laufen dokumentiert über die Plattform.
          Bei Problemen gibt es einen klaren Weg, das Geschäft zu reklamieren. Die Spielregeln
          stehen in den{" "}
          <Link href="/agb" className="text-brand-600 hover:underline">AGB</Link>.
        </p>
        <p className="text-xs text-slate-500">
          In Vorbereitung: abgesicherte Zahlung (Treuhand), bei der das Geld erst nach
          erfolgreicher Lieferung an den Anbieter freigegeben wird.
        </p>
      </section>
    </div>
  );
}
