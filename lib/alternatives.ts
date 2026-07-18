import Anthropic from "@anthropic-ai/sdk";
import { recordAiUsage } from "@/lib/ai-usage";
import type { Listing, SafetyDataSheet } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findMatchingSds } from "@/lib/sds";
import { KSS_ISSUES, type KssIssueId } from "@/lib/kss-issues";
import {
  MEASUREMENT_METHODS,
  estimateAutomation,
  AUTOMATION_FIT_LABEL,
} from "@/lib/kss-automation";

export type MustHave = {
  sameChemistry: boolean;
  sameViscosity: boolean;
  sameApplicationArea: boolean;
  samePackaging: boolean;
  sameProductType: boolean;
  requiredCertifications: string[];
  avoidIssues: KssIssueId[];
  workpieceMaterial?: string;
  /** Mindest-Automatisierungs-Score 1..5 — Filter "tauglich für Vollautomation" */
  minAutomationScore?: number;
  /** Wenn true: Kandidaten mit containsGlycol=true werden abgewertet */
  requireGlycolFree?: boolean;
};

export type AlternativeRanking = {
  listingId: string;
  /** Match-Index 0–100 % — wie gut die Alternative zum Ausgangsprodukt passt */
  score: number;
  fit: "excellent" | "good" | "fair" | "weak";
  /** Ein-Satz-Begründung, warum die Alternative (nicht) passt */
  summary: string;
  pros: string[];
  cons: string[];
  warnings: string[];
};

export type AlternativeResponse = {
  source: { id: string; manufacturer: string; productName: string };
  candidatesConsidered: number;
  alternatives: AlternativeRanking[];
  modelUsed: "claude" | "rule-based";
  reasoning?: string;
};

const SDS_TEXT_CHARS = 6000;

function trim(text: string | null, n: number): string {
  if (!text) return "";
  return text.length <= n ? text : text.slice(0, n) + "\n…[gekürzt]";
}

export async function findAlternatives(
  sourceListingId: string,
  mustHave: MustHave,
  opts: { allowAi?: boolean } = {},
): Promise<AlternativeResponse> {
  const allowAi = opts.allowAi ?? true;
  const source = await prisma.listing.findUnique({
    where: { id: sourceListingId },
    include: { seller: { select: { pseudonym: true, trustTier: true } } },
  });
  if (!source) throw new Error("Source listing not found");

  // Must-haves sind PRÄFERENZEN, keine harten Filter: Es werden immer
  // Alternativen angezeigt — Kandidaten, die Kriterien verletzen, bekommen
  // Punktabzug und einen niedrigen Match-Index statt auszuscheiden.
  // Stufe 1: Kandidaten, die alle Kriterien erfüllen (beste Startpunkte).
  const strictWhere: import("@prisma/client").Prisma.ListingWhereInput = {
    status: "ACTIVE",
    NOT: { id: source.id },
  };
  if (mustHave.sameProductType) strictWhere.productType = source.productType;
  if (mustHave.sameChemistry) strictWhere.chemistry = source.chemistry;
  if (mustHave.sameViscosity && source.isoViscosity) {
    strictWhere.isoViscosity = source.isoViscosity;
  }
  if (mustHave.sameApplicationArea) {
    strictWhere.applicationArea = {
      contains: source.applicationArea,
      mode: "insensitive",
    };
  }
  if (mustHave.samePackaging) strictWhere.packaging = source.packaging;
  if (mustHave.requiredCertifications.length > 0) {
    strictWhere.certificates = { hasEvery: mustHave.requiredCertifications };
  }

  const MAX_CANDIDATES = 12;
  const include = { seller: { select: { pseudonym: true, trustTier: true } } } as const;

  const candidates = await prisma.listing.findMany({
    where: strictWhere,
    include,
    orderBy: { createdAt: "desc" },
    take: MAX_CANDIDATES,
  });

  // Stufe 2: mit gleichem Produkttyp auffüllen, Stufe 3: alle übrigen aktiven.
  if (candidates.length < MAX_CANDIDATES) {
    const excluded = () => [source.id, ...candidates.map((c) => c.id)];
    const sameType = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: excluded() },
        productType: source.productType,
      },
      include,
      orderBy: { createdAt: "desc" },
      take: MAX_CANDIDATES - candidates.length,
    });
    candidates.push(...sameType);

    if (candidates.length < MAX_CANDIDATES) {
      const rest = await prisma.listing.findMany({
        where: { status: "ACTIVE", id: { notIn: excluded() } },
        include,
        orderBy: { createdAt: "desc" },
        take: MAX_CANDIDATES - candidates.length,
      });
      candidates.push(...rest);
    }
  }

  if (candidates.length === 0) {
    return {
      source: {
        id: source.id,
        manufacturer: source.manufacturer,
        productName: source.productName,
      },
      candidatesConsidered: 0,
      alternatives: [],
      modelUsed: "rule-based",
      reasoning:
        "Es gibt aktuell keine anderen aktiven Angebote auf dem Marktplatz.",
    };
  }

  const sourceSds = await findMatchingSds(source, 1);
  const candidateSds = await Promise.all(
    candidates.map((c) => findMatchingSds(c, 1).then((arr) => arr[0] ?? null)),
  );

  if (!allowAi || !process.env.ANTHROPIC_API_KEY) {
    return ruleBasedRanking(source, candidates, candidateSds, mustHave);
  }

  try {
    return await claudeRanking(
      source,
      sourceSds[0] ?? null,
      candidates,
      candidateSds,
      mustHave,
    );
  } catch (e) {
    console.error("Claude call failed, falling back:", e);
    return ruleBasedRanking(source, candidates, candidateSds, mustHave);
  }
}

/** Verletzt der Kandidat ein angekreuztes Must-have-Kriterium? → Liste der Verstöße */
function mustHaveViolations(c: Listing, source: Listing, mh: MustHave): string[] {
  const v: string[] = [];
  if (mh.sameProductType && c.productType !== source.productType) {
    v.push(`anderer Produkttyp (${c.productType})`);
  }
  if (mh.sameChemistry && c.chemistry !== source.chemistry) {
    v.push(`andere Chemie-Basis (${c.chemistry})`);
  }
  if (mh.sameViscosity && source.isoViscosity && c.isoViscosity !== source.isoViscosity) {
    v.push(`abweichende Viskosität (${c.isoViscosity ?? "ohne Angabe"})`);
  }
  if (
    mh.sameApplicationArea &&
    !c.applicationArea.toLowerCase().includes(source.applicationArea.toLowerCase())
  ) {
    v.push(`anderer Anwendungsbereich (${c.applicationArea})`);
  }
  if (mh.samePackaging && c.packaging !== source.packaging) {
    v.push(`andere Verpackung (${c.packaging})`);
  }
  for (const req of mh.requiredCertifications) {
    if (!c.certificates.some((x) => x.toLowerCase().includes(req.toLowerCase()))) {
      v.push(`Pflicht-Freigabe fehlt: ${req}`);
    }
  }
  return v;
}

function ruleBasedRanking(
  source: Listing,
  candidates: Listing[],
  candidateSds: (SafetyDataSheet | null)[],
  mustHave: MustHave,
): AlternativeResponse {
  const ranked = candidates.map<AlternativeRanking>((c, idx) => {
    const pros: string[] = [];
    const cons: string[] = [];
    const warnings: string[] = [];
    let score = 0;
    const sdsText = (candidateSds[idx]?.extractedText ?? "").toLowerCase();

    if (c.chemistry === source.chemistry) {
      pros.push(`Gleiche Chemie-Basis (${c.chemistry})`);
      score += 25;
    } else {
      cons.push(`Andere Chemie: ${c.chemistry} statt ${source.chemistry}`);
    }

    if (c.isoViscosity === source.isoViscosity && source.isoViscosity) {
      pros.push(`Gleiche Viskosität (ISO VG ${c.isoViscosity})`);
      score += 25;
    } else if (source.isoViscosity) {
      cons.push(`Abweichende Viskosität: ${c.isoViscosity ?? "—"} statt ${source.isoViscosity}`);
    }

    if (c.productType === source.productType) {
      pros.push(`Identischer Produkttyp (${c.productType})`);
      score += 15;
    }
    if (c.packaging === source.packaging) {
      pros.push(`Gleiche Verpackung (${c.packaging})`);
      score += 5;
    }
    const certMatches = c.certificates.filter((cert) =>
      source.certificates.some(
        (sCert) => sCert.toLowerCase() === cert.toLowerCase(),
      ),
    );
    if (certMatches.length > 0) {
      pros.push(`Gemeinsame Freigaben: ${certMatches.join(", ")}`);
      score += certMatches.length * 5;
    }
    if (c.priceEur && source.priceEur) {
      const pct = ((c.priceEur - source.priceEur) / source.priceEur) * 100;
      if (Math.abs(pct) < 5) {
        pros.push(`Preis vergleichbar (${pct.toFixed(0)} %)`);
      } else if (pct < 0) {
        pros.push(`${Math.abs(pct).toFixed(0)} % günstiger`);
        score += 5;
      } else {
        cons.push(`${pct.toFixed(0)} % teurer`);
      }
    }

    // KSS-Pain-Point Vorprüfung
    for (const issueId of mustHave.avoidIssues) {
      const issue = KSS_ISSUES.find((x) => x.id === issueId);
      if (!issue) continue;
      const hits = issue.keywords.filter((kw) => sdsText.includes(kw.toLowerCase()));
      if (hits.length > 0) {
        warnings.push(
          `SDS erwähnt "${hits.join(", ")}" — möglicherweise relevant für "${issue.label}". Manuell prüfen.`,
        );
        score -= 5;
      } else if (sdsText) {
        pros.push(`Kein expliziter SDS-Hinweis auf "${issue.label}"`);
        score += 2;
      }
    }

    // Automatisierungs-Eignung
    const automation = estimateAutomation({
      productType: c.productType,
      chemistry: c.chemistry,
      containsGlycol: c.containsGlycol,
      mineralOilContent: c.mineralOilContent,
      manufacturerProvidedScore: c.automationSuitability,
      manufacturerRecommendedMethods: c.measurementMethods,
    });
    if (typeof mustHave.minAutomationScore === "number" && automation.score > 0) {
      if (automation.score >= mustHave.minAutomationScore) {
        pros.push(
          `${AUTOMATION_FIT_LABEL[automation.fit]} (Score ${automation.score}/5)`,
        );
        score += 6;
      } else {
        cons.push(
          `Automation-Score nur ${automation.score}/5 (gefordert ≥ ${mustHave.minAutomationScore})`,
        );
        score -= 8;
      }
    }
    if (mustHave.requireGlycolFree && c.containsGlycol === true) {
      warnings.push(
        "Kandidat enthält Glykol — Filmbildung auf Refraktometer-Sensoren. Falls Vollautomation per Refraktometer geplant, eher Dosimetrix oder Titration nutzen.",
      );
      score -= 10;
    } else if (mustHave.requireGlycolFree && c.containsGlycol === false) {
      pros.push("Glykol-frei (gut für Refraktometer-Vollautomation)");
      score += 4;
    }

    if (mustHave.workpieceMaterial) {
      const mat = mustHave.workpieceMaterial.toLowerCase();
      if (sdsText && (sdsText.includes(mat) || mat.split(/\s+/).some((t) => t.length > 3 && sdsText.includes(t)))) {
        pros.push(`SDS erwähnt deinen Werkstoff "${mustHave.workpieceMaterial}"`);
        score += 5;
      }
    }

    // Must-have-Verstöße: Punktabzug + Deckel bei 49 % — Kandidat bleibt
    // sichtbar, wird aber klar als "erfüllt nicht alles" ausgewiesen.
    const violations = mustHaveViolations(c, source, mustHave);
    for (const v of violations) {
      cons.push(`Must-have nicht erfüllt: ${v}`);
      score -= 12;
    }

    let pct = Math.max(0, Math.min(100, score));
    if (violations.length > 0) pct = Math.min(pct, 49);

    const fit: AlternativeRanking["fit"] =
      pct >= 70 ? "excellent" : pct >= 50 ? "good" : pct >= 30 ? "fair" : "weak";

    const summary =
      violations.length > 0
        ? `Nur bedingt geeignet: ${violations[0]}${violations.length > 1 ? ` (+${violations.length - 1} weitere Abweichung${violations.length > 2 ? "en" : ""})` : ""}.`
        : pros.length > 0
          ? `Passt in den Kernpunkten: ${pros
              .slice(0, 2)
              .map((p) => p.replace(/\s*\(.*?\)\s*$/, ""))
              .join(", ")
              .toLowerCase()}.`
          : "Wenige Übereinstimmungen mit dem Ausgangsprodukt.";

    return {
      listingId: c.id,
      score: pct,
      fit,
      summary,
      pros,
      cons,
      warnings,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  return {
    source: {
      id: source.id,
      manufacturer: source.manufacturer,
      productName: source.productName,
    },
    candidatesConsidered: candidates.length,
    alternatives: ranked,
    modelUsed: "rule-based",
    reasoning:
      "Regelbasierte Bewertung. Der Match-Index (0–100 %) misst die Übereinstimmung mit dem Ausgangsprodukt; Kandidaten, die Must-have-Kriterien verletzen, bleiben sichtbar, sind aber bei maximal 49 % gedeckelt.",
  };
}

async function claudeRanking(
  source: Listing,
  sourceSds: SafetyDataSheet | null,
  candidates: Listing[],
  candidateSds: (SafetyDataSheet | null)[],
  mustHave: MustHave,
): Promise<AlternativeResponse> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const sourceBlock = formatListingBlock(source, sourceSds);
  const candidateBlocks = candidates
    .map((c, i) => formatListingBlock(c, candidateSds[i] ?? null, `KANDIDAT_${i + 1}`))
    .join("\n\n");

  const mustHaveText = formatMustHave(mustHave, source);
  const issuesText = formatIssues(mustHave.avoidIssues);
  const automationText = formatAutomation(mustHave);

  const systemPrompt = [
    "Du bist Substitutions-Berater für Industrie-Schmierstoffe und Kühlschmierstoffe.",
    "Bewerte für ein gegebenes Quell-Produkt, welche von mehreren Kandidaten als technische Alternative geeignet sind.",
    "Beziehe Viskosität, Chemie-Basis, Anwendungsbereich, Freigaben, Verpackung und – falls vorhanden – Sicherheitsdatenblatt-Inhalte ein.",
    "Sei ehrlich: wenn ein Kandidat nicht passt, sag das deutlich.",
    "Kandidaten können die Must-have-Kriterien des Käufers verletzen — sie werden trotzdem bewertet:",
    "Bei verletzten Must-haves darf der Score maximal 49 sein, und die Verletzung muss in cons klar benannt werden.",
    "Antworte ausschließlich als JSON-Objekt mit dem Schlüssel 'alternatives'.",
  ].join(" ");

  const userPrompt = [
    "## QUELL-PRODUKT (das, wofür eine Alternative gesucht wird)",
    sourceBlock,
    "",
    "## MUST-HAVE-KRITERIEN DES KÄUFERS",
    mustHaveText,
    mustHave.workpieceMaterial
      ? `\n## ZU BEARBEITENDER WERKSTOFF\n${mustHave.workpieceMaterial}`
      : "",
    issuesText ? `\n## PROBLEME, DIE DAS PRODUKT NICHT HABEN DARF\n${issuesText}` : "",
    automationText ? `\n## AUTOMATISIERUNGS-ANFORDERUNGEN\n${automationText}` : "",
    "",
    "## KANDIDATEN",
    candidateBlocks,
    "",
    "## AUFGABE",
    "Bewerte jeden Kandidat (KANDIDAT_1, KANDIDAT_2 …) gegen das Quell-Produkt.",
    "score = Match-Index 0-100 (100 = perfekte Substitution). fit = excellent (>=70), good (50-69), fair (30-49), weak (<30).",
    "Verletzt ein Kandidat ein Must-have-Kriterium: score maximal 49 und Verletzung in cons benennen.",
    "summary: EIN deutscher Satz, der für einen Einkäufer begründet, warum die Alternative passt oder nicht passt.",
    "pros: 2-4 prägnante deutsche Stichpunkte (technische Übereinstimmung, geprüft gegen SDS-Inhalte).",
    "cons: 0-4 prägnante deutsche Stichpunkte (Risiken / Abweichungen).",
    "warnings: 0-3 Stichpunkte. Falls der Käufer Probleme genannt hat (z. B. Schaumbildung,",
    "Hautreizung, Buntmetall-Verfärbung), MUSST du im SDS-Text nach Indikatoren suchen und",
    "Warnungen geben, sobald der Kandidat hinweisartig betroffen sein könnte (z. B.",
    "Borate/Amine bei Hautreizung, niedriger Flammpunkt bei Rauchbildung, Aluminium-",
    "Unverträglichkeit bei AlMg-Werkstoff). Wenn keine Hinweise gefunden werden, sag das.",
    'Antwort als JSON: {"alternatives":[{"key":"KANDIDAT_1","score":0,"fit":"...","summary":"...","pros":[],"cons":[],"warnings":[]}]}',
    "Nur JSON, kein Markdown, keine Erklärung außerhalb.",
  ]
    .filter(Boolean)
    .join("\n");

  const resp = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2500,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  recordAiUsage("alternatives", resp.model, resp.usage);

  const textPart = resp.content.find((c) => c.type === "text");
  if (!textPart || textPart.type !== "text") {
    throw new Error("No text content in Claude response");
  }
  const raw = textPart.text.trim();
  const jsonText = raw.startsWith("```")
    ? raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")
    : raw;
  const parsed = JSON.parse(jsonText) as {
    alternatives: { key: string; score: number; fit: string; summary?: string; pros: string[]; cons: string[]; warnings?: string[] }[];
  };

  const alternatives: AlternativeRanking[] = parsed.alternatives.map((a) => {
    const idx = Number(a.key.replace(/^KANDIDAT_/, "")) - 1;
    const candidate = candidates[idx];
    return {
      listingId: candidate?.id ?? a.key,
      score: Math.max(0, Math.min(100, Math.round(a.score))),
      fit: (["excellent", "good", "fair", "weak"].includes(a.fit)
        ? a.fit
        : "fair") as AlternativeRanking["fit"],
      summary: a.summary?.trim() || "Bewertung durch KI-Vergleich der Produktdaten und SDS-Inhalte.",
      pros: a.pros ?? [],
      cons: a.cons ?? [],
      warnings: a.warnings ?? [],
    };
  });
  alternatives.sort((x, y) => y.score - x.score);

  return {
    source: {
      id: source.id,
      manufacturer: source.manufacturer,
      productName: source.productName,
    },
    candidatesConsidered: candidates.length,
    alternatives,
    modelUsed: "claude",
  };
}

function formatListingBlock(
  l: Listing,
  sds: SafetyDataSheet | null,
  label?: string,
): string {
  const lines = [
    label ? `[${label}]` : null,
    `Marke: ${l.manufacturer}`,
    `Produkt: ${l.productName}`,
    `Produkttyp: ${l.productType}`,
    `Anwendungsbereich: ${l.applicationArea}`,
    `Chemie-Basis: ${l.chemistry}`,
    l.isoViscosity ? `Viskosität: ISO VG ${l.isoViscosity}` : null,
    `Verpackung: ${l.packaging} · ${l.quantity} ${l.quantityUnit}`,
    l.certificates.length ? `Freigaben/Normen: ${l.certificates.join("; ")}` : null,
    l.priceEur ? `Preis: ${l.priceEur.toFixed(2)} €` : null,
    l.description ? `Beschreibung: ${l.description}` : null,
    sds
      ? `\nSDS-EXTRAKT (${sds.manufacturer} ${sds.productName}):\n${trim(sds.extractedText, SDS_TEXT_CHARS)}`
      : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function formatIssues(ids: KssIssueId[]): string {
  if (ids.length === 0) return "";
  return ids
    .map((id) => {
      const i = KSS_ISSUES.find((x) => x.id === id);
      return i ? `- ${i.label}: ${i.short}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

function formatAutomation(mh: MustHave): string {
  const lines: string[] = [];
  if (typeof mh.minAutomationScore === "number" && mh.minAutomationScore > 0) {
    lines.push(
      `- Mindest-Automatisierungs-Score: ${mh.minAutomationScore}/5 (KSS-Vollautomation gewünscht)`,
    );
  }
  if (mh.requireGlycolFree) {
    lines.push(
      "- Muss glykol-frei sein (Vollautomation per Refraktometer setzt Glykol-freie Rezeptur voraus, sonst Filmbildung am Sensor)",
    );
  }
  if (lines.length > 0) {
    lines.push(
      "",
      "Hintergrund: Glykolhaltige KSS bilden zähe Filme auf Refraktometer-Prismen und Inline-Sensoroberflächen. Bei strenger Vollautomation-Anforderung daher entweder glykol-freies Konzentrat wählen oder auf volumetrisch-titrimetrische Dosier-Regelung (Dosimetrix-artige Verfahren) ausweichen.",
    );
  }
  return lines.join("\n");
}

function formatMustHave(mh: MustHave, source: Listing): string {
  const lines = [
    mh.sameProductType ? `- Gleicher Produkttyp wie '${source.productType}'` : null,
    mh.sameChemistry ? `- Gleiche Chemie-Basis (${source.chemistry})` : null,
    mh.sameViscosity && source.isoViscosity
      ? `- Gleiche Viskosität (ISO VG ${source.isoViscosity})`
      : null,
    mh.sameApplicationArea
      ? `- Gleicher Anwendungsbereich ('${source.applicationArea}')`
      : null,
    mh.samePackaging ? `- Gleiche Verpackung (${source.packaging})` : null,
    mh.requiredCertifications.length
      ? `- Pflicht-Freigaben: ${mh.requiredCertifications.join(", ")}`
      : null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "(keine harten Must-have-Kriterien)";
}
