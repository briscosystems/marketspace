import { anfragenAblaufenLassen } from "@/lib/anfragen-ablauf";
import { notFound } from "next/navigation";

// Nutzer dürfen nie rohe Datenbank-Werte sehen („OPEN"). Gleiche Beschriftungen
// wie auf der Anfragen-Übersicht (app/rfqs/page.tsx).
const RFQ_STATUS_LABEL: Record<string, string> = {
  OPEN: "offen",
  ACCEPTED: "angenommen",
  EXPIRED: "ausgelaufen",
  CANCELED: "zurückgezogen",
};
import Link from "next/link";
import { LeerHinweis } from "@/components/LeerHinweis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n-server";
import { TrustBadge } from "@/components/TrustBadge";
import { SubmitOfferForm } from "@/components/SubmitOfferForm";
import { AcceptOfferButton } from "@/components/AcceptOfferButton";
import { CertBadgeList } from "@/components/CertBadge";
import { KSS_ISSUES, type KssIssueId } from "@/lib/kss-issues";

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await anfragenAblaufenLassen();
  const t = await getT();
  const { id } = await params;
  const [rfq, session] = await Promise.all([
    prisma.rfq.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, pseudonym: true, trustTier: true } },
        offers: {
          include: {
            seller: { select: { id: true, pseudonym: true, trustTier: true } },
          },
          orderBy: [{ status: "asc" }, { priceEur: "asc" }],
        },
      },
    }),
    getServerSession(authOptions),
  ]);
  if (!rfq) notFound();

  const me = session?.user?.id;
  const isBuyer = me === rfq.buyerId;
  const myOffer = me ? rfq.offers.find((o) => o.sellerId === me) : null;
  const canOffer =
    !!me &&
    !isBuyer &&
    rfq.status === "OPEN" &&
    rfq.deadline.getTime() > Date.now() &&
    (rfq.visibility === "PUBLIC" ||
      (session?.user?.trustTier && session.user.trustTier !== "UNVERIFIED"));

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="text-sm text-slate-900">{value ?? "–"}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link href="/rfqs" className="text-sm text-brand-700 hover:underline">
        {t("rfqd.uebersicht")}
      </Link>

      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{t("rfqd.gesucht")}</div>
            <h1 className="page-title">
              {rfq.manufacturer ? `${rfq.manufacturer} · ` : ""}
              {rfq.productType}
              {rfq.isoViscosity ? ` · ISO VG ${rfq.isoViscosity}` : ""}
            </h1>
            <div className="mt-0.5 text-sm font-medium text-slate-700">
              {rfq.quantity.toLocaleString("de-DE")} {rfq.quantityUnit}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <span>{rfq.buyer.pseudonym}</span>
              <TrustBadge tier={rfq.buyer.trustTier} size="xs" />
              {rfq.visibility === "VERIFIED_ONLY" && (
                <span className="chip bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                  {t("rfqd.nurGeprueft")}
                </span>
              )}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              rfq.status === "OPEN"
                ? "bg-amber-100 text-amber-800"
                : rfq.status === "ACCEPTED"
                ? "bg-emerald-100 text-emerald-800"
                : rfq.status === "EXPIRED"
                ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {RFQ_STATUS_LABEL[rfq.status] ?? rfq.status}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Region" value={rfq.locationRegion} />
          <Field label="Frist" value={rfq.deadline.toLocaleDateString("de-DE")} />
          <Field label="Chemie" value={rfq.chemistry ?? "egal"} />
          <Field label="Anwendung" value={rfq.applicationArea} />
          <Field
            label="Budget"
            value={
              rfq.budgetMinEur || rfq.budgetMaxEur
                ? `${rfq.budgetMinEur?.toFixed(2) ?? "?"} – ${rfq.budgetMaxEur?.toFixed(2) ?? "?"} €`
                : "offen"
            }
          />
          <Field
            label="Angebote"
            value={`${rfq.offers.length} ${rfq.offers.length === 1 ? "Angebot" : "Angebote"}`}
          />
        </div>

        {rfq.workpieceMaterial && (
          <div>
            <div className="eyebrow">Werkstoff</div>
            <p className="mt-1 text-sm text-slate-700">{rfq.workpieceMaterial}</p>
          </div>
        )}

        {rfq.requiredCertifications.length > 0 && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Pflicht-Zertifikate
            </div>
            <CertBadgeList certs={rfq.requiredCertifications} max={20} size="sm" />
          </div>
        )}

        {rfq.avoidIssues.length > 0 && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Zu vermeidende Probleme
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rfq.avoidIssues.map((id) => {
                const i = KSS_ISSUES.find((x) => x.id === (id as KssIssueId));
                return (
                  <span
                    key={id}
                    title={i?.short}
                    className="chip bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                  >
                    ⚠️ {i?.label ?? id}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {rfq.notes && (
          <div>
            <div className="eyebrow">Notizen</div>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{rfq.notes}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="section-title">{t("rfqd.angebote")}</h2>
        {rfq.offers.length === 0 ? (
          <LeerHinweis
            titel={t("rfqd.leerTitel")}
            text={t("rfqd.leerText")}
            aktionen={["alternative", "suche"]}
          />
        ) : (
          <div className="space-y-3">
            {rfq.offers.map((o) => {
              const accepted = o.status === "ACCEPTED";
              const declined = o.status === "DECLINED";
              return (
                <div
                  key={o.id}
                  className={`card ${
                    accepted ? "ring-2 ring-emerald-500" : declined ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{o.seller.pseudonym}</span>
                        <TrustBadge tier={o.seller.trustTier} size="xs" />
                        {accepted && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                            angenommen
                          </span>
                        )}
                        {declined && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                            abgelehnt
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {o.quantity.toLocaleString("de-DE")} {o.quantityUnit} · Lieferung in {o.deliveryDays} Tagen
                      </div>
                      {o.alternativeProduct && (
                        <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">
                          <strong>Alternativ-Vorschlag:</strong> {o.alternativeProduct}
                          {o.alternativeReason && (
                            <div className="mt-0.5">{o.alternativeReason}</div>
                          )}
                        </div>
                      )}
                      {o.notes && (
                        <div className="mt-2 text-sm text-slate-700">{o.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-900">
                        {o.priceEur.toFixed(2)} €
                      </div>
                      <div className="text-xs text-slate-500">pro {o.quantityUnit}</div>
                      {isBuyer && rfq.status === "OPEN" && (
                        <div className="mt-3">
                          <AcceptOfferButton rfqId={rfq.id} offerId={o.id} />
                          <p className="mt-1.5 text-xs text-slate-500">
                            {t("rfqd.nachAnnahme")}{" "}
                            <Link href="/vertrauen" className="font-medium text-brand-700 hover:underline">
                              {t("rfqd.kaeuferschutz")}
                            </Link>
                            .
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canOffer && (
        <div className="space-y-3">
          <h2 className="section-title">
            {myOffer ? "Dein Angebot aktualisieren" : "Angebot abgeben"}
          </h2>
          <SubmitOfferForm
            rfqId={rfq.id}
            initial={myOffer}
            defaultUnit={rfq.quantityUnit}
          />
        </div>
      )}

      {!canOffer && !isBuyer && me && rfq.visibility === "VERIFIED_ONLY" && session?.user?.trustTier === "UNVERIFIED" && (
        <div className="card text-sm text-amber-800">
Auf diese Anfrage dürfen nur geprüfte Mitglieder bieten.
        </div>
      )}
    </div>
  );
}
