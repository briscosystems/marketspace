import Link from "next/link";
import { ShieldCheck, BadgeCheck, EyeOff, Lock, Star, Check } from "lucide-react";
import { TIER_STYLES } from "@/components/TrustBadge";

export const metadata = { title: "So sorgen wir für Vertrauen — Brisco" };

export default function VertrauenPage() {
  const tiers = Object.values(TIER_STYLES).sort((a, b) => a.level - b.level);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="rounded-2xl bg-emerald-50/60 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck size={24} className="text-emerald-600" />
          <h1 className="page-title">So sorgen wir für Vertrauen</h1>
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700">
          Beim Handel unter Unternehmen zählen zwei Fragen: <strong>Mit wem habe ich es
          zu tun?</strong> Und: <strong>Bin ich abgesichert, wenn etwas schiefgeht?</strong>
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Auf beides gibt Brisco eine klare Antwort. Hier erfährst du, wie.
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-500" />
          <h2 className="section-title">Bewertungen, die man nicht kaufen kann</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Eine Bewertung abgeben darf nur, wer über Brisco wirklich ein Geschäft
          <strong> abgeschlossen</strong> hat. Jeder Stern hängt an einer echten Transaktion —
          keine gekauften, keine erfundenen. Schnitt und Anzahl stehen offen auf jedem Profil.
        </p>
      </section>

      {/* Pseudonymität & Neutralität */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <EyeOff size={18} className="text-slate-600" />
          <h2 className="section-title">Anonym handeln, neutral sortiert</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Du trittst unter einem Pseudonym auf — dein Klarname bleibt verborgen. In den
          Nachrichten hält ein automatischer Filter Kontaktdaten (E-Mail, Telefon, Links)
          zurück, damit dich niemand an der Plattform vorbei abwirbt.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Und die Reihenfolge ist ehrlich: Bezahlte Platzierungen sind für alle sichtbar als{" "}
          <strong>„Gesponsert"</strong> gekennzeichnet. Alles andere ist neutral sortiert.
        </p>
      </section>

      {/* Sicherer Ablauf */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-emerald-600" />
          <h2 className="section-title">Alles dokumentiert</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Anfrage, Angebot, Annahme und Nachrichten laufen nachvollziehbar über die Plattform —
          nicht in verstreuten E-Mails. Geht etwas schief, gibt es einen klaren Weg zur
          Reklamation. Die Spielregeln stehen in den{" "}
          <Link href="/agb" className="text-brand-600 hover:underline">AGB</Link>.
        </p>
      </section>

      {/* Käuferschutz — ausführlich, weil hier echtes Geld im Spiel ist.
          WORTLAUT-PFLICHT: nie „Treuhand"/„Escrow" (Stripe-Vorgabe, Bestätigung liegt vor). */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          <h2 className="section-title">Käuferschutz: bezahlen, ohne in Vorleistung zu gehen</h2>
        </div>

        <p className="text-sm text-slate-600">
          Ein Fass Hydrauliköl kostet schnell vierstellig, ein IBC oder eine Palette deutlich
          mehr. Wer bei einem unbekannten Händler zuerst überweist, trägt das ganze Risiko
          allein — und wer zuerst liefert, ebenso. Genau diese Pattsituation löst der
          Käuferschutz auf.
        </p>

        {/* Ablauf */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            So läuft es ab
          </div>
          <ol className="mt-3 space-y-3 text-sm text-slate-700">
            {[
              [
                "Du zahlst — aber nicht an den Verkäufer",
                "Der Betrag geht per Karte an den Zahlungsdienstleister Stripe und bleibt dort liegen. Der Verkäufer sieht, dass gezahlt wurde, bekommt aber keinen Cent.",
              ],
              [
                "Der Verkäufer liefert",
                "Er liefert in dem Wissen, dass das Geld bereits hinterlegt ist. Deshalb liefert er auch an Käufer, die er nicht kennt.",
              ],
              [
                "Du bestätigst den Erhalt",
                "Erst dieser Klick gibt das Geld frei. Ohne ihn bewegt sich nichts — auch nicht durch den Verkäufer.",
              ],
              [
                "Stimmt etwas nicht: „Problem melden“",
                "Statt freizugeben, meldest du das Problem. Brisco prüft und entscheidet über Freigabe oder Rückerstattung.",
              ],
            ].map(([titel, text], i) => (
              <li key={titel} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <strong className="text-slate-900">{titel}</strong>
                  <span className="block text-slate-600">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Was der Käufer davon hat */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Was du davon hast</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Keine Vorkasse an einen Fremden.</strong> Dein Geld liegt bei Stripe,
                nicht beim Verkäufer.
              </span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Du hältst den Schlüssel.</strong> Ohne deine Lieferbestätigung wird
                nichts ausgezahlt.
              </span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Bei Rückerstattung bekommst du alles zurück — auch die Gebühr.</strong>{" "}
                Ein Problemfall darf dich nichts kosten.
              </span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Handel mit Unbekannten wird möglich.</strong> Der beste Preis kommt oft
                von einem Händler, mit dem du noch nie zu tun hattest.
              </span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Alles dokumentiert.</strong> Angebot, Annahme, Zahlung und Lieferung
                liegen nachvollziehbar auf der Plattform — nicht in verstreuten E-Mails.
              </span>
            </li>
          </ul>
        </div>

        {/* Kosten */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Was es kostet</h3>
          <p className="mt-1 text-sm text-slate-600">
            <strong>2,5 % + 0,25 €</strong> vom Kaufbetrag, getragen vom Käufer. Bei 2.000 €
            sind das 50,25 €. Die Gebühr deckt die Zahlungsabwicklung <em>und</em> den
            Käuferschutz-Service; ein Teil bleibt als Entgelt bei Brisco. Wird dir erstattet,
            bekommst du auch diese Gebühr zurück.
          </p>
        </div>

        {/* Ehrliche Grenzen — bewusst prominent, nicht im Kleingedruckten */}
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Was der Käuferschutz nicht ist — damit du dich richtig entscheidest
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>
              <strong>Kein Treuhandkonto und keine Versicherung.</strong> Brisco ist keine Bank.
              Der Betrag wird beim regulierten Zahlungsdienstleister <strong>Stripe</strong>{" "}
              gehalten, nicht auf einem Konto von Brisco.
            </li>
            <li>
              <strong>Im Streitfall entscheidet Brisco</strong> — nach Aktenlage, nicht als
              Gericht. Der Rechtsweg bleibt dir unbenommen.
            </li>
            <li>
              <strong>Nicht bei jedem Anbieter verfügbar.</strong> Nur wer das Abzeichen
              „Käuferschutz verfügbar" trägt, hat die Auszahlung eingerichtet.
            </li>
            <li>
              <strong>Er ersetzt keine Wareneingangsprüfung.</strong> Bestätige die Lieferung
              erst, wenn du geprüft hast — danach ist das Geld beim Verkäufer.
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Die vertraglichen Einzelheiten stehen in{" "}
          <Link href="/agb" className="text-brand-600 hover:underline">§ 7 der AGB</Link>.
        </p>
      </section>
    </div>
  );
}
