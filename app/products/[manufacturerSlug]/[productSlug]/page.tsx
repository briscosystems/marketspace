import Link from "next/link";
import { PdfHinweis } from "@/components/PdfHinweis";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RefractometerCalculator } from "@/components/RefractometerCalculator";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { recommendMaterialsForProduct } from "@/lib/seal-recommendations";
import { bauteileFuer, ALLGEMEINE_HINWEISE, zeigeAllgemeineHinweise } from "@/lib/bauteil-hinweise";
import { ErfahrungTeilen } from "@/components/ErfahrungTeilen";
import { TrustBadge } from "@/components/TrustBadge";
import { getMonthlyMedianHistory, getCurrentMarketPrice } from "@/lib/price-aggregation";
import { getT } from "@/lib/i18n-server";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { PriceSubmitLauncher } from "@/components/PriceSubmitLauncher";
import { ProductIssuesSection } from "@/components/ProductIssuesSection";
import { GhsPictogramRow, GHS_NAMES } from "@/components/GhsPictogram";
import { ProductImage } from "@/components/ProductImage";
import { packagingForProduct } from "@/lib/product-packaging";
import { TcoCalculator } from "@/components/TcoCalculator";
import { ComplianceBadges } from "@/components/ComplianceBadges";
import { Droplets, Beaker, FileText, ExternalLink, AlertTriangle, Shield, AlertOctagon, CheckCircle2, FileSearch, TrendingUp, Sparkles } from "lucide-react";


const CHEMISTRY_LABEL: Record<string, string> = {
  MINERAL: "Mineralölbasiert (Soluble Oil)",
  SEMI_SYNTHETIC: "Semi-synthetisch",
  SYNTHETIC: "Vollsynthetisch",
  ESTER: "Ester-Basis",
  PAG: "PAG (Polyalkylenglykol)",
  OTHER: "Andere",
};

const COMPAT_STYLE: Record<string, string> = {
  RECOMMENDED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  COMPATIBLE: "border-slate-300 bg-slate-50 text-slate-700",
  CAUTION: "border-amber-300 bg-amber-50 text-amber-800",
  UNSUITABLE: "border-red-300 bg-red-50 text-red-800",
};

const COMPAT_LABEL: Record<string, string> = {
  RECOMMENDED: "Empfohlen",
  COMPATIBLE: "Geeignet",
  CAUTION: "Vorsicht",
  UNSUITABLE: "Nicht geeignet",
};


/**
 * Eigener Seitentitel je Produkt. Ohne das tragen alle 1.092 Produktseiten
 * denselben Titel und sind in Suchmaschinen nicht unterscheidbar — die
 * Wissensbasis ist aber der Grund, warum die Plattform überhaupt gefunden wird.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ manufacturerSlug: string; productSlug: string }>;
}) {
  const { manufacturerSlug, productSlug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug: productSlug, manufacturer: { slug: manufacturerSlug } },
    select: {
      name: true,
      description: true,
      viscosityIso: true,
      manufacturer: { select: { name: true } },
    },
  });
  if (!p) return { title: "Produkt nicht gefunden — Brisco Marketplace" };
  const viskositaet = p.viscosityIso ? ` ISO VG ${p.viscosityIso.replace(/^ISO\s*VG\s*/i, "")}` : "";
  const titel = `${p.manufacturer.name} ${p.name}${viskositaet} — Datenblatt, Alternativen & Preis-Richtwert`;
  const text =
    p.description?.slice(0, 155) ??
    `Technische Daten, Sicherheitsdatenblatt, Dichtungs-Verträglichkeit und Preis-Richtwerte zu ${p.manufacturer.name} ${p.name}.`;
  return {
    title: titel,
    description: text,
    openGraph: { title: titel, description: text },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ manufacturerSlug: string; productSlug: string }>;
}) {
  const t = await getT();
  const { manufacturerSlug, productSlug } = await params;
  const m = await prisma.manufacturer.findUnique({ where: { slug: manufacturerSlug } });
  if (!m) notFound();

  const product = await prisma.product.findUnique({
    where: { manufacturerId_slug: { manufacturerId: m.id, slug: productSlug } },
    include: {
      compatibilityNotes: true,
      safetyDataSheet: {
        select: {
          id: true,
          language: true,
          pageCount: true,
          signalWord: true,
          hStatements: true,
          ghsPictograms: true,
          reachCompliant: true,
          svhcSubstances: true,
          containsBoron: true,
          containsFormaldehydeReleaser: true,
          containsSecondaryAmines: true,
          containsChlorinatedParaffins: true,
          phValue: true,
          flashpointC: true,
          densityGcm3: true,
        },
      },
    },
  });
  if (!product) notFound();

  // Allgemeines Material-Wissen (scope = "general") für die Werkstoffe in suitable + unsuitable
  const materials = [...product.suitableMaterials, ...product.unsuitableMaterials];
  const generalNotes = await prisma.materialCompatibilityNote.findMany({
    where: {
      scope: "general",
      productId: null,
      OR: [
        { material: { in: materials } },
        { material: "Ansetzwasser (Allgemein)" },
      ],
    },
    orderBy: [{ material: "asc" }, { compatibility: "asc" }],
  });

  // Berechnete Dichtungs-/Kunststoff-Empfehlung basierend auf Produkt-Chemie
  // Preis-Daten + Praxis-Probleme parallel laden
  const [priceHistory, currentPrice, issues, erfahrungen] = await Promise.all([
    getMonthlyMedianHistory(product.id, 60),
    getCurrentMarketPrice(product.id),
    prisma.productIssue.findMany({
      where: { productId: product.id, status: { in: ["VERIFIED", "PENDING"] } },
      orderBy: [{ severity: "asc" }, { isOfficial: "desc" }, { reportCount: "desc" }],
    }),
    prisma.experienceReport.findMany({
      where: { productId: product.id, status: "APPROVED" },
      select: {
        id: true,
        text: true,
        source: true,
        createdAt: true,
        user: { select: { pseudonym: true, trustTier: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
]);

  const sealRec = await recommendMaterialsForProduct({
    category: product.category,
    chemistry: product.chemistry,
    containsBor: product.containsBor,
    containsFormaldehydeDepot: product.containsFormaldehydeDepot,
    containsMineralOil: product.containsMineralOil,
    containsChlorine: product.containsChlorine,
  });

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link href="/manufacturers" className="text-brand-600 hover:underline">
          Hersteller
        </Link>{" "}
        →{" "}
        <Link
          href={`/manufacturers/${m.slug}`}
          className="text-brand-600 hover:underline"
        >
          {m.name}
        </Link>
      </nav>

      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        {/* Gebinde-Bild mit Hersteller-Logo als Etikett */}
        <ProductImage
          manufacturer={m.name}
          productName={product.name}
          packaging={packagingForProduct(product.category, product.id)}
          size="lg"
        />
        <div className="flex-1">
          {/* Echtes Logo statt Namenstext — Marken erkennt man in Sekundenbruchteilen. */}
          <BrandLogo manufacturer={m.name} size="sm" />
          <h1 className="mt-1 page-title">{product.name}</h1>
          {/* Divinol ist die Handelsmarke, unter der Zeller+Gmelin über den
              Fachhandel verkauft (Betreiber 2026-08-10). Bewusst zurückhaltend
              formuliert: eine Aussage über den Vertriebsweg, KEINE über
              Rezeptur-Gleichheit mit einem gleichnamigen Zeller-Produkt. */}
          {m.name === "Divinol" && (
            <p className="mt-1 text-xs text-slate-500">{t("mfr.divinolHinweis")}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {t(`cat.${product.category}`)}
            </span>
            {product.chemistry ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                {t(`chem.${product.chemistry}`)}
              </span>
            ) : null}
            {product.productFamily ? (
              <span className="text-xs text-slate-500">Familie: {product.productFamily}</span>
            ) : null}
            <span className="text-xs text-slate-400">·</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                product.sourceConfidence === "verifiziert"
                  ? "bg-emerald-100 text-emerald-700"
                  : product.sourceConfidence === "hersteller-doku"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
              }`}
              title={t("product.dataConfidence")}
            >
              {{
                verifiziert: t("prod.confVerifiziert"),
                recherchiert: t("prod.confRecherchiert"),
                "hersteller-doku": t("prod.confHersteller"),
              }[product.sourceConfidence ?? ""] ?? product.sourceConfidence}
            </span>
            <ComplianceBadges product={product} />
          </div>
          {product.description ? (
            <p className="mt-3 text-sm text-slate-700">{product.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* DIE Handlung der Seite: Preis anfragen — wir holen Angebote ein.
                Vorher konnte man von hier weder anfragen noch anbieten. */}
            {/* Das angesehene Produkt wandert mit in die Anfrage (Betreiber
                2026-08-10): Wer hier auf „Preis anfragen" drückt, hat sich
                längst entschieden — er soll es nicht noch einmal eintippen. */}
            <Link
              href={`/rfqs/new?${new URLSearchParams({
                produkt: product.name,
                hersteller: m.name,
                kategorie: product.category,
                ...(product.chemistry ? { chemie: product.chemistry } : {}),
                ...(product.viscosityIso ? { iso: product.viscosityIso } : {}),
              }).toString()}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              {t("prod.preisAnfragen")}
            </Link>
            <CompareToggle id={product.id} kind="products" />
            {/* Häufigster Einkäufer-Anwendungsfall: Äquivalent bei Lieferantenwechsel */}
            <Link
              href={`/rfqs?alt=${encodeURIComponent(`${m.name} ${product.name}`)}#alternativen`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
            >
              <Sparkles size={14} />
              Alternative zu diesem Produkt finden
            </Link>
          </div>
        </div>
      </header>

      {/* PROMINENTE PREIS-KARTE — direkt unter Header, immer sofort sichtbar */}
      <PriceBanner
        productId={product.id}
        productName={product.name}
        manufacturer={m.name}
        currentPrice={currentPrice}
      />

      {/* GESAMTKOSTENRECHNER — nur für wassermischbare KSS sinnvoll
          (€/Jahr aus Konzentration × Verbrauch × Standzeit) */}
      {product.category === "COOLANT_WATER_MIX" && (
        <TcoCalculator
          product={{
            id: product.id,
            name: product.name,
            manufacturer: m.name,
            priceEurPerL:
              currentPrice && currentPrice.unitLabel === "EUR/L" ? currentPrice.median : null,
            concentrationPct:
              product.recommendedConcentrationMin != null &&
              product.recommendedConcentrationMax != null
                ? (product.recommendedConcentrationMin + product.recommendedConcentrationMax) / 2
                : null,
            sumpLifeWeeks: product.typicalSumpLifeWeeks,
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LINKE SPALTE: Technische Daten + Werkstoffe */}
        <div className="space-y-5 lg:col-span-2">
          {/* Anwendung & Werkstoffe */}
          {(product.applicationAreas.length > 0 ||
            product.suitableMaterials.length > 0 ||
            product.unsuitableMaterials.length > 0) && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="section-title">{t("product.appMaterials")}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {product.applicationAreas.length > 0 ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bearbeitungsverfahren
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.applicationAreas.map((a) => (
                        <span
                          key={a}
                          className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {product.suitableMaterials.length > 0 ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                      Geeignet für
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.suitableMaterials.map((m) => (
                        <span
                          key={m}
                          className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        >
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {product.unsuitableMaterials.length > 0 ? (
                  <div className="sm:col-span-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-red-600">
                      Nicht geeignet für
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.unsuitableMaterials.map((m) => (
                        <span
                          key={m}
                          className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                        >
                          ✗ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {/* Empfohlene Dichtungs- und Kunststoffwerkstoffe (berechnet) */}
          {sealRec.recommendations.length > 0 && (
            <SealCompatibilitySection
              t={t}
              recommendations={sealRec.recommendations}
              inferredIngredients={sealRec.inferredIngredients}
            />
          )}

          {/* Bauteile, die bei JEDEM wassermischbaren KSS zu beachten sind —
              unabhängig vom einzelnen Produkt, deshalb nicht aus der Matrix.
              Belege (DGUV FBHM-040, VDW, FUCHS) in lib/bauteil-hinweise.ts. */}
          {zeigeAllgemeineHinweise(product.category) && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-brand-600" />
                <h2 className="section-title">{t("bt.generalHeading")}</h2>
              </div>
              <ul className="mt-3 space-y-2">
                {ALLGEMEINE_HINWEISE.map((h) => (
                  <li
                    key={h.schluessel}
                    className={`rounded-lg p-3 text-xs ring-1 ${
                      h.stufe === "sicherheit"
                        ? "bg-red-50 text-red-900 ring-red-200"
                        : "bg-amber-50 text-amber-900 ring-amber-200"
                    }`}
                  >
                    <div className="font-semibold">{t(`${h.schluessel}.title`)}</div>
                    <p className="mt-1 leading-relaxed">{t(`${h.schluessel}.text`)}</p>
                    <p className="mt-1 opacity-70">{t(`${h.schluessel}.source`)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Verlinktes SDS aus eigener Bibliothek */}
          {product.safetyDataSheet && <LinkedSdsCard sds={product.safetyDataSheet} t={t} />}

          {/* Praxis-Probleme aus Foren, Hersteller-FAQs, Distributoren — Value Add für Anwender */}
          <ProductIssuesSection issues={issues} />

          {/* Nutzer-Erfahrungen: freigegebene Berichte + Aufruf zum Teilen.
              Die Belohnung (Credits nach Freigabe, positiv wie negativ gleich)
              ist das belegte Muster, das Beiträge verdreifacht. */}
          <section className="space-y-3">
            {erfahrungen.length > 0 && (
              <div className="card space-y-3">
                <h2 className="section-title">
                  {t("erf.listeTitel")}{" "}
                  <span className="text-sm font-normal text-slate-500">({erfahrungen.length})</span>
                </h2>
                <div className="divide-y divide-slate-100">
                  {erfahrungen.map((e) => (
                    <div key={e.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm text-slate-700">{e.text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{e.user.pseudonym}</span>
                        <TrustBadge tier={e.user.trustTier} size="xs" />
                        <span>{e.createdAt.toLocaleDateString("de-CH")}</span>
                        {e.source === "VOICE" && <span className="chip bg-slate-100 text-slate-500">🎙 diktiert</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ErfahrungTeilen productId={product.id} productName={`${m.name} ${product.name}`} />
          </section>

          {/* Marktpreis & Historie */}
          <PriceSection
            productId={product.id}
            productName={product.name}
            manufacturer={m.name}
            priceHistory={priceHistory}
            currentPrice={currentPrice}
          />


          {/* Technische Daten */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Beaker size={16} className="text-brand-600" />
              <h2 className="section-title">{t("product.techData")}</h2>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <DataRow
                label="Refraktometer-Faktor"
                value={
                  product.refractometerFactor != null
                    ? `${product.refractometerFactor} (Brix × Faktor = % Konz.)`
                    : null
                }
                highlight
              />
              <DataRow
                label="Empfohlene Konzentration"
                value={
                  product.recommendedConcentrationMin != null && product.recommendedConcentrationMax != null
                    ? `${product.recommendedConcentrationMin}–${product.recommendedConcentrationMax} %`
                    : null
                }
              />
              <DataRow label="pH (Konzentrat)" value={product.phConcentrate?.toString() ?? null} />
              <DataRow
                label="pH (Emulsion)"
                value={
                  product.phEmulsionMin != null
                    ? product.phEmulsionMax != null && product.phEmulsionMin !== product.phEmulsionMax
                      ? `${product.phEmulsionMin}–${product.phEmulsionMax}`
                      : `${product.phEmulsionMin}`
                    : null
                }
              />
              <DataRow label="ISO VG" value={product.viscosityIso} />
              <DataRow
                label="Viskosität @40°C"
                value={product.viscosityKv40 != null ? `${product.viscosityKv40} mm²/s` : null}
              />
              <DataRow
                label="Dichte @20°C"
                value={product.densityGcm3 != null ? `${product.densityGcm3} g/cm³` : null}
              />
              <DataRow
                label="Flammpunkt"
                value={product.flashpointC != null ? `${product.flashpointC} °C` : null}
              />
              <DataRow label="Bor-frei" value={booleanLabel(product.containsBor, true)} />
              <DataRow
                label="Formaldehyd-Depot"
                value={booleanLabel(product.containsFormaldehydeDepot)}
              />
              <DataRow label="Chlor-frei" value={booleanLabel(product.containsChlorine, true)} />
              <DataRow
                label="Mineralöl"
                value={
                  product.mineralOilContentPct != null
                    ? `${product.mineralOilContentPct} %`
                    : booleanLabel(product.containsMineralOil)
                }
              />
            </dl>
            {product.certifications.length > 0 ? (
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Zertifikate / Freigaben
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.certifications.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Ansetzwasser */}
          {(product.waterHardnessMinDh != null ||
            product.waterHardnessMaxDh != null ||
            product.waterHardnessNotes) && (
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-blue-600" />
                <h2 className="section-title">{t("product.waterReq")}</h2>
              </div>
              {product.waterHardnessMinDh != null || product.waterHardnessMaxDh != null ? (
                <div className="mt-2 font-mono text-lg font-bold text-blue-900">
                  {product.waterHardnessMinDh ?? 0}–{product.waterHardnessMaxDh ?? "?"} °dH
                </div>
              ) : null}
              {product.waterHardnessNotes ? (
                <p className="mt-2 text-sm text-slate-700">{product.waterHardnessNotes}</p>
              ) : null}
            </section>
          )}

          {/* Werkstoff-Wissen */}
          {generalNotes.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h2 className="section-title">
                  Allgemeine Werkstoff-Hinweise
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Branchen-Wissen zu den für dieses Produkt relevanten Werkstoffen und zum Ansetzwasser.
              </p>
              <div className="mt-3 space-y-2">
                {generalNotes.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 text-sm ${COMPAT_STYLE[n.compatibility]}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {n.material}
                        {n.condition ? <span className="font-normal"> · {n.condition}</span> : null}
                      </span>
                      <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        {t(`compat.${n.compatibility}`)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">{n.note}</p>
                    {n.sourceLabel ? (
                      <div className="mt-1 text-[10px] opacity-70">
                        Quelle: {n.sourceLabel}
                        {n.sourceUrl ? (
                          <a
                            href={n.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 underline"
                          >
                            ↗
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Notes */}
          {product.notes ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <strong>Hinweis:</strong> {product.notes}
            </section>
          ) : null}
        </div>

        {/* RECHTE SPALTE: Refraktometer-Rechner + Quellen */}
        <aside className="space-y-5">
          <RefractometerCalculator
            productName={product.name}
            factor={product.refractometerFactor}
            recommendedMin={product.recommendedConcentrationMin}
            recommendedMax={product.recommendedConcentrationMax}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-600" />
                <h3 className="font-semibold text-slate-900">{t("product.sources")}</h3>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <Link
                    href={`/products/${manufacturerSlug}/${productSlug}/tds`}
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                  >
                    Technisches Datenblatt (TDS) — Brisco-Ansicht
                  </Link>
                </li>
                {product.sourceUrl ? (
                  <li>
                    <a
                      href={product.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      Hersteller-Seite <ExternalLink size={11} />
                    </a>
                  </li>
                ) : null}
                {product.dataSheetUrl ? (
                  <li>
                    <a
                      href={product.dataSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      Tech. Datenblatt (PDS) <ExternalLink size={11} />
                    </a>
                  </li>
                ) : null}
                {product.sdsUrl ? (
                  <li>
                    <a
                      href={product.sdsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      Sicherheitsdatenblatt (SDS) <ExternalLink size={11} />
                    </a>
                  </li>
                ) : null}
              </ul>
              <PdfHinweis className="mt-3" />
            </section>
        </aside>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 py-1 last:border-none">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={`text-right text-sm ${
          value == null
            ? "text-slate-300"
            : highlight
              ? "font-mono font-semibold text-brand-700"
              : "font-medium text-slate-800"
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function booleanLabel(v: boolean | null | undefined, invertForFreiPrefix?: boolean): string | null {
  if (v == null) return null;
  if (invertForFreiPrefix) return v ? "nein (enthält)" : "ja";
  return v ? "ja" : "nein";
}

const SEAL_RATING_STYLE: Record<
  "RECOMMENDED" | "COMPATIBLE" | "CAUTION" | "UNSUITABLE",
  { bg: string; border: string; text: string; iconColor: string; label: string }
> = {
  RECOMMENDED: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-800",
    iconColor: "text-emerald-600",
    label: "empfohlen",
  },
  COMPATIBLE: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    iconColor: "text-emerald-600",
    label: "geeignet",
  },
  CAUTION: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-900",
    iconColor: "text-amber-600",
    label: "Vorsicht",
  },
  UNSUITABLE: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-900",
    iconColor: "text-red-600",
    label: "nicht geeignet",
  },
};

async function PriceBanner({
  productId,
  productName,
  manufacturer,
  currentPrice,
}: {
  productId: string;
  productName: string;
  manufacturer: string;
  currentPrice: import("@/lib/price-aggregation").CurrentMarketPrice | null;
}) {
  const t = await getT();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-soft">
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-slate-500" />
          <span className="eyebrow">
            Richtwert
          </span>
        </div>
        {currentPrice ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">
                {currentPrice.median.toFixed(2)}
              </span>
              <span className="text-base font-semibold text-slate-700">
                {currentPrice.unitLabel}
              </span>
            </div>
            <span className="text-xs text-slate-600">
              Spanne {currentPrice.min.toFixed(2)} – {currentPrice.max.toFixed(2)} ·{" "}
              {currentPrice.observationCount} Beobachtungen · letzte {currentPrice.windowDays} Tage
            </span>
            {/* Datenqualität ist kein Gefahrenstatus — neutral abgestuft und deutsch. */}
            <span
              className={`chip ring-1 ${
                currentPrice.confidence === "high"
                  ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                  : currentPrice.confidence === "medium"
                    ? "bg-slate-100 text-slate-700 ring-slate-300"
                    : "bg-slate-100 text-slate-500 ring-slate-200"
              }`}
            >
              {currentPrice.confidence === "high"
                ? t("prod.belegtHoch")
                : currentPrice.confidence === "medium"
                  ? t("prod.belegtMittel")
                  : t("prod.belegtWenig")}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-600">
            Noch keine Preisdaten — 
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a
          href="#preis-historie"
          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
        >
          📈 Chart ansehen
        </a>
        <PriceSubmitLauncher
          productId={productId}
          productName={productName}
          manufacturer={manufacturer}
        />
      </div>
    </div>
  );
}

async function PriceSection({
  productId,
  productName,
  manufacturer,
  priceHistory,
  currentPrice,
}: {
  productId: string;
  productName: string;
  manufacturer: string;
  priceHistory: import("@/lib/price-aggregation").MonthlyPriceDataPoint[];
  currentPrice: import("@/lib/price-aggregation").CurrentMarketPrice | null;
}) {
  const t = await getT();
  return (
    <section id="preis-historie" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white shadow-soft shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-300 px-4 py-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-700" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Indikativer Richtwert &amp; Verlauf
          </h2>
          <span className="text-[10px] uppercase tracking-wide text-amber-600/80">
            5-Jahres-Trend
          </span>
        </div>
        <PriceSubmitLauncher
          productId={productId}
          productName={productName}
          manufacturer={manufacturer}
        />
      </header>

      <div className="space-y-4 p-4">
        {/* Aktueller Marktpreis */}
        {currentPrice ? (
          <div className="flex flex-wrap items-baseline gap-4 rounded-lg border border-amber-200 bg-white p-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Aktueller Richtwert</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">
                  {currentPrice.median.toFixed(2)}
                </span>
                <span className="text-sm font-medium text-slate-600">{currentPrice.unitLabel}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Spanne: <strong>{currentPrice.min.toFixed(2)}</strong> – <strong>{currentPrice.max.toFixed(2)}</strong> ·{" "}
              {currentPrice.observationCount} Beobachtungen · letzte {currentPrice.windowDays} Tage
            </div>
            <span
              className={`chip ml-auto ring-1 ${
                currentPrice.confidence === "high"
                  ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                  : currentPrice.confidence === "medium"
                    ? "bg-slate-100 text-slate-700 ring-slate-300"
                    : "bg-slate-100 text-slate-500 ring-slate-200"
              }`}
            >
              {currentPrice.confidence === "high"
                ? t("prod.belegtHoch")
                : currentPrice.confidence === "medium"
                  ? t("prod.belegtMittel")
                  : t("prod.belegtWenig")}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
            Noch keine Preisdaten vorhanden. Wer einen aktuellen Preis kennt, kann ihn hier melden — anonym, er fließt in den Richtwert ein.
          </div>
        )}

        {/* Chart */}
        <PriceHistoryChart data={priceHistory} />

        <p className="text-[10px] text-slate-500">
          ⚠ <strong>Indikative Richtwerte</strong> — modelliert, keine bestätigten Marktpreise.
          Sie dienen der Orientierung und dem Vergleich. Sobald Nutzer eigene Preise melden oder
          Käufe über die Plattform laufen, fließen echte Werte ein. Verbindlich bleibt das
          individuelle Angebot des Anbieters.
        </p>
      </div>
    </section>
  );
}

function LinkedSdsCard({
  sds,
  t,
}: {
  t: (k: string) => string;
  sds: {
    id: string;
    language: string;
    pageCount: number | null;
    signalWord: string | null;
    hStatements: string[];
    ghsPictograms: string[];
    reachCompliant: boolean | null;
    svhcSubstances: string[];
    containsBoron: boolean | null;
    containsFormaldehydeReleaser: boolean | null;
    containsSecondaryAmines: boolean | null;
    containsChlorinatedParaffins: boolean | null;
    phValue: number | null;
    flashpointC: number | null;
    densityGcm3: number | null;
  };
}) {
  const flags: { label: string; v: boolean | null; tone: "neg" | "neutral" }[] = [
    { label: "Bor/Borate", v: sds.containsBoron, tone: "neg" },
    { label: "Formaldehyd-Donor", v: sds.containsFormaldehydeReleaser, tone: "neg" },
    { label: "sek. Amine", v: sds.containsSecondaryAmines, tone: "neg" },
    { label: "Chlorparaffine", v: sds.containsChlorinatedParaffins, tone: "neg" },
  ];
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSearch size={16} className="text-blue-600" />
          <h2 className="section-title">{t("product.sds")}</h2>
        </div>
        <Link
          href={`/sds/${sds.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          SDS öffnen <ExternalLink size={12} />
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {sds.signalWord && (
          <span
            className={`rounded px-2 py-0.5 font-bold uppercase ${
              /gefahr|danger/i.test(sds.signalWord)
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {sds.signalWord}
          </span>
        )}
        <span className="text-slate-500">
          {sds.language} · {sds.pageCount ?? "?"} Seiten
        </span>
        {sds.reachCompliant === true && (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
            REACH ✓
          </span>
        )}
        {sds.reachCompliant === false && (
          <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 ring-1 ring-red-200">
            nicht REACH-konform
          </span>
        )}
        {sds.svhcSubstances.length > 0 && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-red-800 ring-1 ring-red-300">
            SVHC ({sds.svhcSubstances.length})
          </span>
        )}
      </div>

      {/* GHS-/REACH-Gefahrenpiktogramme */}
      {sds.ghsPictograms.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Gefahrenpiktogramme (CLP/REACH)
          </div>
          <div className="mt-1.5 flex flex-wrap items-start gap-3">
            {sds.ghsPictograms.map((code) => (
              <div key={code} className="flex flex-col items-center gap-0.5" style={{ width: 68 }}>
                <GhsPictogramRow codes={[code]} size={44} />
                <span className="text-center text-[9px] leading-tight text-slate-500">
                  {GHS_NAMES[code] ?? code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Physiko-Werte aus SDS, falls vorhanden */}
      {(sds.phValue !== null || sds.flashpointC !== null || sds.densityGcm3 !== null) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-700">
          {sds.phValue !== null && <span>pH: <strong>{sds.phValue.toFixed(1)}</strong></span>}
          {sds.flashpointC !== null && (
            <span>
              Flammpunkt: <strong>{sds.flashpointC} °C</strong>
            </span>
          )}
          {sds.densityGcm3 !== null && (
            <span>
              Dichte: <strong>{sds.densityGcm3.toFixed(3)} g/cm³</strong>
            </span>
          )}
        </div>
      )}

      {/* H-Sätze */}
      {sds.hStatements.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            H-Sätze
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {sds.hStatements.slice(0, 12).map((h) => (
              <span key={h} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200">
                {h}
              </span>
            ))}
            {sds.hStatements.length > 12 && (
              <span className="text-[10px] text-slate-400">+{sds.hStatements.length - 12}</span>
            )}
          </div>
        </div>
      )}

      {/* Inhaltsstoff-Flags */}
      {flags.some((f) => f.v !== null) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {flags.map((f) => {
            if (f.v === null) return null;
            if (f.v === true)
              return (
                <span key={f.label} className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700 ring-1 ring-red-200">
                  ⚠ {f.label}: enthält
                </span>
              );
            return (
              <span key={f.label} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 ring-1 ring-emerald-200">
                ✓ {f.label}: frei
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SealCompatibilitySection({
  recommendations,
  inferredIngredients,
  t,
}: {
  recommendations: import("@/lib/seal-recommendations").MaterialRec[];
  inferredIngredients: { slug: string; name: string; why: string }[];
  t: (k: string) => string;
}) {
  const groups: Record<"UNSUITABLE" | "CAUTION" | "COMPATIBLE" | "RECOMMENDED", typeof recommendations> = {
    UNSUITABLE: [],
    CAUTION: [],
    COMPATIBLE: [],
    RECOMMENDED: [],
  };
  for (const r of recommendations) groups[r.worstRating].push(r);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-brand-600" />
          <h2 className="section-title">{t("product.sealMaterials")}</h2>
        </div>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          modelliert
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Basierend auf Chemie und Markierungen dieses Produkts. Werkstoffe sind nach{" "}
        <Link href="/materials" className="text-brand-600 hover:underline">
          Verträglichkeitsmatrix
        </Link>{" "}
        ISM/Trelleborg/Parker bewertet. Vor Anwendung Praxisversuche bei Einsatztemperatur empfohlen.
      </p>

      {/* Empfehlungs-Chips, nach Severität gruppiert — Positives zuerst:
          der Abschnitt ist eine Auswahlhilfe, keine Warnliste. */}
      <div className="mt-4 space-y-3">
        {(["RECOMMENDED", "COMPATIBLE", "CAUTION", "UNSUITABLE"] as const).map((bucket) => {
          const items = groups[bucket];
          if (items.length === 0) return null;
          const s = SEAL_RATING_STYLE[bucket];
          const Icon =
            bucket === "UNSUITABLE"
              ? AlertOctagon
              : bucket === "CAUTION"
                ? AlertTriangle
                : CheckCircle2;
          return (
            <div key={bucket}>
              <div className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${s.text}`}>
                <Icon size={12} className={s.iconColor} />
                {s.label} ({items.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((r) => (
                  <Link
                    key={r.materialId}
                    href={`/materials/${r.materialSlug}`}
                    className={`group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:shadow-sm ${s.bg} ${s.border} ${s.text}`}
                    title={
                      r.drivers.length > 0
                        ? r.drivers.map((d) => `${d.ingredientName}: ${d.rating} — ${d.note}`).join(" | ")
                        : `Verträglich gegen alle abgeleiteten Inhaltsstoffe`
                    }
                  >
                    {r.materialShortName}
                    {r.materialCategory === "THERMOPLASTIC" && (
                      <span className="text-[9px] opacity-60">(Kunststoff)</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dieselbe Aussage noch einmal in Werkstattsprache: Die Werkstoff-Chips
          oben bleiben unverändert (Betreiber-Entscheidung 2026-08-07) — hier
          kommt dazu, WO diese Werkstoffe in der Maschine sitzen. Belege für die
          Zuordnung in lib/bauteil-hinweise.ts. */}
      {groups.UNSUITABLE.length + groups.CAUTION.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="eyebrow">{t("bt.heading")}</div>
          <p className="mt-1 text-xs text-slate-500">{t("bt.sub")}</p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {[...groups.UNSUITABLE, ...groups.CAUTION]
              .map((r) => ({ r, b: bauteileFuer(r.materialSlug, r.materialShortName) }))
              .filter((x) => x.b)
              .slice(0, 6)
              .map(({ r, b }) => (
                <li key={r.materialId} className="flex flex-wrap items-baseline gap-x-1.5 rounded bg-amber-50/70 p-2">
                  <span className="font-medium text-slate-800">{b!.bauteile.join(", ")}</span>
                  <span className="text-slate-500">
                    ({r.materialShortName}
                    {b!.eigenheit ? ` — ${b!.eigenheit}` : ""})
                  </span>
                  <span className="text-amber-900">
                    {r.worstRating === "UNSUITABLE" ? t("bt.unsuitable") : t("bt.caution")}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Driver-Details für die kritischen Materialien */}
      {groups.UNSUITABLE.length + groups.CAUTION.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="eyebrow">
            Begründung
          </div>
          <div className="mt-2 space-y-2 text-xs">
            {[...groups.UNSUITABLE, ...groups.CAUTION].slice(0, 6).map((r) => (
              <div key={r.materialId} className="rounded bg-slate-50 p-2">
                <div className="font-medium text-slate-800">
                  {r.materialShortName} — {SEAL_RATING_STYLE[r.worstRating].label}
                </div>
                <ul className="mt-1 list-disc pl-4 text-slate-600">
                  {r.drivers.slice(0, 3).map((d, i) => (
                    <li key={i}>
                      <span className="font-medium">{d.ingredientName}:</span> {d.note}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inferenz-Transparenz: welche Inhaltsstoffe wurden angenommen */}
      <details className="mt-4 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
          Angenommene Inhaltsstoffe ({inferredIngredients.length}) anzeigen
        </summary>
        <ul className="mt-2 space-y-1 text-xs">
          {inferredIngredients.map((i) => (
            <li key={i.slug} className="rounded bg-slate-50 px-2 py-1">
              <span className="font-medium text-slate-800">{i.name}</span>
              <span className="text-slate-600"> — {i.why}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
