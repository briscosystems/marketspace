/**
 * Alternativprodukt-Suche.
 *
 * Zwei Stufen:
 *  1. searchAlternatives()  — sofortige, regelbasierte Suche aus dem Produkt-
 *     Katalog + Verfügbarkeits-Markierung aus aktiven Angeboten + Signal aus
 *     früher gehandelten Produkten. Schnell, ohne KI/Internet — Echtzeit beim
 *     Tippen.
 *  2. searchAlternativesWeb() — zusätzlich Claude mit Web-Suche-Werkzeug, das
 *     reale Erfahrungsberichte aus dem Internet heranzieht und Quellen liefert.
 *     Fällt ohne ANTHROPIC_API_KEY (oder bei Fehler) auf Stufe 1 zurück.
 *
 * Es gibt KEINE harte Relation Listing↔Product im Schema; die Verfügbarkeit
 * wird daher über normalisierte Namen abgeglichen.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeForSearch } from "@/lib/normalize-search";

export type AltSearchInput = {
  /** "product": query ist ein vorhandener Produktname. "requirements": freie Anforderungen. */
  mode: "product" | "requirements";
  /** Produktname (mode=product) oder Freitext-Beschreibung (mode=requirements). */
  query?: string;
  category?: string; // ProductCategory
  chemistry?: string; // ChemistryBase
  isoViscosity?: string;
  applicationArea?: string;
  requiredCertifications?: string[];
  /** Praxis-Probleme, die das Alternativprodukt NICHT haben soll. */
  avoidIssues?: string[];
};

export type AltAvailability = {
  available: boolean;
  listingId?: string;
  priceEur?: number | null;
  quantity?: number;
  quantityUnit?: string;
};

export type AltMatch = {
  productId: string;
  name: string;
  manufacturer: string;
  category: string | null;
  chemistry: string | null;
  viscosityIso: string | null;
  slug: string;
  manufacturerSlug: string;
  score: number;
  fit: "excellent" | "good" | "fair" | "weak";
  pros: string[];
  cons: string[];
  warnings: string[];
  availability: AltAvailability;
};

export type AltSource = {
  productId: string | null;
  name: string;
  manufacturer: string | null;
  category: string | null;
  chemistry: string | null;
};

export type AltSearchResult = {
  source: AltSource | null;
  alternatives: AltMatch[];
  candidatesConsidered: number;
  modelUsed: "rule-based" | "claude-web";
  reasoning?: string;
  webSources?: { title: string; url: string }[];
  webSummary?: string;
};

const CANDIDATE_LIMIT = 60;
const RESULT_LIMIT = 12;

type CandidateProduct = Prisma.ProductGetPayload<{
  include: { manufacturer: { select: { name: true; slug: true } } };
}>;

/** Aktive Angebote (klein), für Verfügbarkeits-Abgleich + "schon gehandelt"-Signal. */
async function loadAvailabilityIndex() {
  const [listings, soldTx] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        productName: true,
        manufacturer: true,
        priceEur: true,
        quantity: true,
        quantityUnit: true,
      },
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED", listing: { isNot: null } },
      select: { listing: { select: { productName: true } } },
    }),
  ]);

  const soldNames = new Set(
    soldTx
      .map((t) => normalizeForSearch(t.listing?.productName ?? ""))
      .filter(Boolean),
  );

  return { listings, soldNames };
}

/** Findet ein aktives Angebot, dessen Name zum Katalog-Produkt passt (Token-Überlappung). */
function matchListing(
  product: CandidateProduct,
  listings: { id: string; productName: string; manufacturer: string; priceEur: number | null; quantity: number; quantityUnit: string }[],
): AltAvailability {
  const pn = normalizeForSearch(product.name);
  if (!pn) return { available: false };
  for (const l of listings) {
    const ln = normalizeForSearch(l.productName);
    if (ln && (ln.includes(pn) || pn.includes(ln))) {
      return {
        available: true,
        listingId: l.id,
        priceEur: l.priceEur,
        quantity: l.quantity,
        quantityUnit: l.quantityUnit,
      };
    }
  }
  return { available: false };
}

/** Versucht, den eingegebenen Produktnamen im Katalog zu finden (Quell-Produkt). */
async function resolveSourceProduct(query: string): Promise<CandidateProduct | null> {
  const norm = normalizeForSearch(query);
  if (!norm) return null;
  // 1) exakter/teilweiser Treffer über searchTokens
  const byTokens = await prisma.product.findFirst({
    where: { searchTokens: { contains: norm } },
    include: { manufacturer: { select: { name: true, slug: true } } },
  });
  if (byTokens) return byTokens;
  // 2) Name enthält die Eingabe
  return prisma.product.findFirst({
    where: { name: { contains: query, mode: "insensitive" } },
    include: { manufacturer: { select: { name: true, slug: true } } },
  });
}

function fitFromScore(score: number): AltMatch["fit"] {
  return score >= 60 ? "excellent" : score >= 40 ? "good" : score >= 20 ? "fair" : "weak";
}

/**
 * Bewertet einen Kandidaten regelbasiert gegen das Ziel-Profil
 * (Quell-Produkt oder eingegebene Anforderungen).
 */
function scoreCandidate(
  c: CandidateProduct,
  target: {
    category: string | null;
    chemistry: string | null;
    isoViscosity: string | null;
    applicationArea: string | null;
    requiredCertifications: string[];
    avoidIssues: string[];
  },
  availability: AltAvailability,
  soldNames: Set<string>,
): AltMatch {
  const pros: string[] = [];
  const cons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (target.category && c.category === target.category) {
    pros.push("Gleiche Produktart");
    score += 25;
  } else if (target.category) {
    cons.push("Andere Produktart");
  }

  if (target.chemistry && c.chemistry === target.chemistry) {
    pros.push(`Gleiche Chemie-Basis (${c.chemistry})`);
    score += 20;
  } else if (target.chemistry && c.chemistry) {
    cons.push(`Andere Chemie: ${c.chemistry} statt ${target.chemistry}`);
  }

  if (target.isoViscosity && c.viscosityIso) {
    if (normalizeForSearch(c.viscosityIso) === normalizeForSearch(target.isoViscosity)) {
      pros.push(`Gleiche Viskosität (ISO VG ${c.viscosityIso})`);
      score += 20;
    } else {
      cons.push(`Abweichende Viskosität: ${c.viscosityIso} statt ${target.isoViscosity}`);
    }
  }

  if (target.applicationArea) {
    const want = normalizeForSearch(target.applicationArea);
    const hit = c.applicationAreas.some(
      (a) => want && (normalizeForSearch(a).includes(want) || want.includes(normalizeForSearch(a))),
    );
    if (hit) {
      pros.push(`Geeignet für „${target.applicationArea}"`);
      score += 12;
    }
  }

  for (const req of target.requiredCertifications) {
    const has = c.certifications.some((x) =>
      normalizeForSearch(x).includes(normalizeForSearch(req)),
    );
    if (has) {
      pros.push(`Erfüllt Freigabe: ${req}`);
      score += 8;
    } else {
      cons.push(`Fehlende Pflicht-Freigabe: ${req}`);
      score -= 15;
    }
  }

  for (const issue of target.avoidIssues) {
    const n = normalizeForSearch(issue);
    if (c.criticalIssuesKnown.some((x) => normalizeForSearch(x).includes(n) || n.includes(normalizeForSearch(x)))) {
      warnings.push(`Bekanntes Problem „${issue}" — manuell prüfen.`);
      score -= 12;
    } else if (c.criticalIssuesAddressed.some((x) => normalizeForSearch(x).includes(n) || n.includes(normalizeForSearch(x)))) {
      pros.push(`Adressiert gezielt „${issue}"`);
      score += 10;
    }
  }

  if (availability.available) {
    pros.push("Aktuell als Angebot verfügbar");
    score += 15;
  }

  if (soldNames.size > 0) {
    const pn = normalizeForSearch(c.name);
    for (const s of soldNames) {
      if (pn && (s.includes(pn) || pn.includes(s))) {
        pros.push("Wurde auf der Plattform bereits gehandelt");
        score += 6;
        break;
      }
    }
  }

  return {
    productId: c.id,
    name: c.name,
    manufacturer: c.manufacturer.name,
    category: c.category,
    chemistry: c.chemistry,
    viscosityIso: c.viscosityIso,
    slug: c.slug,
    manufacturerSlug: c.manufacturer.slug,
    score,
    fit: fitFromScore(score),
    pros,
    cons,
    warnings,
    availability,
  };
}

/** Stufe 1: sofortige regelbasierte Alternativsuche. */
export async function searchAlternatives(input: AltSearchInput): Promise<AltSearchResult> {
  let source: CandidateProduct | null = null;
  if (input.mode === "product" && input.query) {
    source = await resolveSourceProduct(input.query);
  }

  const target = {
    category: source?.category ?? input.category ?? null,
    chemistry: source?.chemistry ?? input.chemistry ?? null,
    isoViscosity: source?.viscosityIso ?? input.isoViscosity ?? null,
    applicationArea: input.applicationArea ?? null,
    requiredCertifications: input.requiredCertifications ?? [],
    avoidIssues: input.avoidIssues ?? [],
  };

  // Kandidaten holen: gleiche Produktart bevorzugt; sonst über Suchbegriff.
  const where: Prisma.ProductWhereInput = {};
  if (source) where.id = { not: source.id };
  if (target.category) {
    where.category = target.category as Prisma.ProductWhereInput["category"];
  } else if (input.query) {
    const norm = normalizeForSearch(input.query);
    where.OR = [
      { searchTokens: { contains: norm } },
      { name: { contains: input.query, mode: "insensitive" } },
      { description: { contains: input.query, mode: "insensitive" } },
    ];
  }

  const candidates = await prisma.product.findMany({
    where,
    include: { manufacturer: { select: { name: true, slug: true } } },
    take: CANDIDATE_LIMIT,
  });

  const { listings, soldNames } = await loadAvailabilityIndex();

  const ranked = candidates
    .map((c) => scoreCandidate(c, target, matchListing(c, listings), soldNames))
    .sort((a, b) => {
      // Verfügbare zuerst bei Gleichstand, sonst nach Score.
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.availability.available) - Number(a.availability.available);
    })
    .slice(0, RESULT_LIMIT);

  return {
    source: source
      ? {
          productId: source.id,
          name: source.name,
          manufacturer: source.manufacturer.name,
          category: source.category,
          chemistry: source.chemistry,
        }
      : null,
    alternatives: ranked,
    candidatesConsidered: candidates.length,
    modelUsed: "rule-based",
    reasoning:
      candidates.length === 0
        ? "Keine passenden Katalog-Produkte gefunden. Begriff/Anforderungen anpassen."
        : undefined,
  };
}

/** Extrahiert Web-Quellen (Titel + URL) aus einer Claude-Antwort mit Web-Suche. */
function extractWebSources(content: Anthropic.Messages.ContentBlock[]): { title: string; url: string }[] {
  const out: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const block of content) {
    // web_search_tool_result-Blöcke enthalten ein Array von {url, title}
    const anyBlock = block as unknown as {
      type: string;
      content?: { url?: string; title?: string }[];
    };
    if (anyBlock.type === "web_search_tool_result" && Array.isArray(anyBlock.content)) {
      for (const r of anyBlock.content) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          out.push({ title: r.title ?? r.url, url: r.url });
        }
      }
    }
  }
  return out;
}

/**
 * Stufe 2: zusätzliche KI-Web-Recherche. Nimmt die regelbasierten Kandidaten als
 * Basis, lässt Claude über das Web-Suche-Werkzeug reale Erfahrungen/Berichte
 * heranziehen, ordnet neu und liefert eine Zusammenfassung + Quellen.
 * Bei fehlendem Schlüssel/Fehler: regelbasiertes Ergebnis unverändert.
 */
export async function searchAlternativesWeb(input: AltSearchInput): Promise<AltSearchResult> {
  const base = await searchAlternatives(input);

  // Ohne Schlüssel keine Web-Recherche möglich → regelbasiertes Ergebnis.
  // (Aber: auch wenn der Katalog NICHTS gefunden hat, lassen wir die KI laufen —
  //  sie kann ein unbekanntes Produkt einordnen und Alternativen empfehlen.)
  if (!process.env.ANTHROPIC_API_KEY) {
    return base;
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const targetDesc = base.source
      ? `Quell-Produkt: ${base.source.manufacturer ?? ""} ${base.source.name} (Produktart: ${base.source.category ?? "?"}, Chemie: ${base.source.chemistry ?? "?"})`
      : `Anforderungen: ${[
          input.query,
          input.category && `Produktart ${input.category}`,
          input.chemistry && `Chemie ${input.chemistry}`,
          input.isoViscosity && `ISO VG ${input.isoViscosity}`,
          input.applicationArea && `Anwendung ${input.applicationArea}`,
          input.requiredCertifications?.length && `Freigaben ${input.requiredCertifications.join(", ")}`,
          input.avoidIssues?.length && `Vermeiden: ${input.avoidIssues.join(", ")}`,
        ]
          .filter(Boolean)
          .join("; ")}`;

    const candidateList =
      base.alternatives.length > 0
        ? base.alternatives
            .map((a, i) => `${i + 1}. ${a.manufacturer} ${a.name} (Chemie: ${a.chemistry ?? "?"}, ISO VG: ${a.viscosityIso ?? "-"})`)
            .join("\n")
        : "(keine Katalog-Kandidaten gefunden)";

    const systemPrompt =
      "Du bist Substitutions-Berater für Industrieöle und Kühlschmierstoffe. " +
      "Nutze die Web-Suche, um reale Erfahrungsberichte, Foren- und Hersteller-Querverweise " +
      "zu Alternativprodukten zu finden. Bewerte die vorgeschlagenen Kandidaten anhand dieser " +
      "Erfahrungen und gib eine ehrliche, knappe deutsche Einschätzung. Erfinde nichts.";

    const userPrompt = [
      targetDesc,
      "",
      "Kandidaten aus unserem Katalog (per Nummer referenzieren):",
      candidateList,
      "",
      "Aufgabe: Suche im Web nach Erfahrungen/Berichten zur Eignung dieser Produkte als",
      "Alternative. Falls oben '(keine Katalog-Kandidaten gefunden)' steht, ordne das gesuchte",
      "Produkt anhand der Web-Recherche ein und nenne in der summary, welche Produktarten,",
      "Spezifikationen oder Marken als gleichwertige Alternative in Frage kommen.",
      "Antworte mit einem JSON-Objekt:",
      '{"summary":"2-3 Sätze Gesamteinschätzung","ranking":[{"n":1,"verdict":"empfohlen|brauchbar|eher nicht","note":"1 Satz aus den gefundenen Erfahrungen"}]}',
      "ranking darf leer sein, wenn es keine Kandidaten gibt. Nur JSON am Ende, davor darf die Web-Suche laufen.",
    ].join("\n");

    // Web-Suche-Werkzeug braucht ein web-fähiges Modell (Haiku unterstützt die
    // dynamische Web-Suche nicht zuverlässig) — daher Sonnet 4.6.
    const resp = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        // max_uses begrenzt die Anzahl Web-Suchen → hält die Antwortzeit kurz.
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 4 } as unknown as Anthropic.Messages.ToolUnion,
        ],
        messages: [{ role: "user", content: userPrompt }],
      },
      // Hartes Zeitlimit: bricht ab, falls die Web-Suche zu lange läuft —
      // der catch unten liefert dann die Sofort-Treffer zurück.
      { timeout: 55000 },
    );

    const webSources = extractWebSources(resp.content);

    // Letzten Text-Block als JSON parsen.
    const texts = resp.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === "text");
    const raw = texts.map((t) => t.text).join("\n").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    let summary: string | undefined;
    const verdictByN = new Map<number, { verdict: string; note: string }>();
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          summary?: string;
          ranking?: { n: number; verdict: string; note: string }[];
        };
        summary = parsed.summary;
        for (const r of parsed.ranking ?? []) {
          verdictByN.set(r.n, { verdict: r.verdict, note: r.note });
        }
      } catch {
        // JSON nicht parsebar — wir liefern trotzdem Quellen + Basis.
      }
    }

    const VERDICT_BONUS: Record<string, number> = { empfohlen: 20, brauchbar: 5, "eher nicht": -15 };
    const enriched = base.alternatives.map((alt, idx) => {
      const v = verdictByN.get(idx + 1);
      if (!v) return alt;
      const pros = [...alt.pros];
      const cons = [...alt.cons];
      if (v.verdict === "eher nicht") cons.unshift(`Web-Erfahrung: ${v.note}`);
      else pros.unshift(`Web-Erfahrung: ${v.note}`);
      const score = alt.score + (VERDICT_BONUS[v.verdict] ?? 0);
      return { ...alt, pros, cons, score, fit: fitFromScore(score) };
    });
    enriched.sort((a, b) => b.score - a.score);

    return {
      ...base,
      alternatives: enriched,
      modelUsed: "claude-web",
      webSources,
      webSummary: summary,
    };
  } catch (e) {
    console.error("Web-Alternativsuche fehlgeschlagen, Fallback auf Regeln:", e);
    return base;
  }
}
