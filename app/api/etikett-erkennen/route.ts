/**
 * Etikett-Foto → Produkt erkennen → sofort prüfen, was darüber bekannt ist.
 *
 * Warum: Der häufigste Weg, wie ein Anwender zu einem Produkt kommt, ist nicht
 * die Suche, sondern das Gebinde vor ihm. Ein Foto vom Etikett ist schneller
 * und fehlerfreier als das Abtippen von „HYCUT ET 46 + ADDITIV ET".
 *
 * Ablauf:
 *  1. Bild an Claude (Bildauswertung) → Hersteller, Produktname, Gebinde
 *  2. Treffer im eigenen Katalog suchen (searchTokens)
 *  3. Sofort mitliefern, was zu diesem Produkt gemeldet ist: Praxis-Probleme
 *     und freigegebene Erfahrungsberichte anderer Betriebe
 *
 * Kosten: 1 Credit — abgebucht erst NACH erfolgreicher Erkennung; bei einem
 * Fehlschlag wird zurückgebucht (wie bei den übrigen KI-Aktionen).
 *
 * Ohne ANTHROPIC_API_KEY antwortet die Route mit 503 statt zu raten: Ein
 * falsch erkanntes Produkt wäre schlimmer als gar keins.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";
import { normalizeForSearch } from "@/lib/normalize-search";

const Eingabe = z.object({
  /** Foto als data:-URI (image/jpeg, image/png oder image/webp). */
  bild: z.string().startsWith("data:image/").max(8_000_000),
});

/** Was Claude vom Etikett ablesen soll. */
const SCHEMA = {
  type: "object",
  properties: {
    hersteller: { type: ["string", "null"], description: "Herstellername auf dem Etikett" },
    produkt: { type: ["string", "null"], description: "Produktname inkl. Typbezeichnung" },
    gebinde: { type: ["string", "null"], description: "Gebindegröße, z. B. '20 l Kanister'" },
    charge: { type: ["string", "null"], description: "Chargen-/Losnummer, falls lesbar" },
    lesbarkeit: {
      type: "string",
      enum: ["gut", "teilweise", "schlecht"],
      description: "Wie gut war das Etikett lesbar",
    },
    hinweis: {
      type: ["string", "null"],
      description: "Kurzer deutscher Hinweis, falls etwas unklar blieb",
    },
  },
  required: ["hersteller", "produkt", "gebinde", "charge", "lesbarkeit", "hinweis"],
  additionalProperties: false,
} as const;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte anmelden" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = Eingabe.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte ein Foto mitschicken" }, { status: 400 });
  }

  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(parsed.data.bild);
  if (!m) {
    return NextResponse.json(
      { error: "Nur JPEG, PNG oder WebP — bitte das Foto neu aufnehmen." },
      { status: 400 },
    );
  }
  const [, medienTyp, base64] = m;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Die Bilderkennung ist gerade nicht verfügbar. Bitte tippe das Produkt ein." },
      { status: 503 },
    );
  }

  const abbuchung = await chargeForAiAction(session.user.id, "labelScan");
  if (!abbuchung.ok) {
    return NextResponse.json(
      {
        error:
          abbuchung.reason === "no_access"
            ? "Dafür braucht es ein aktives Konto."
            : "Zu wenig Credits.",
        benoetigt: abbuchung.cost,
        saldo: abbuchung.balance,
      },
      { status: 402 },
    );
  }

  let gelesen: {
    hersteller: string | null;
    produkt: string | null;
    gebinde: string | null;
    charge: string | null;
    lesbarkeit: "gut" | "teilweise" | "schlecht";
    hinweis: string | null;
  };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const antwort = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system:
        "Du liest Etiketten von Industrieölen, Kühlschmierstoffen und Schmierstoffen ab. " +
        "Gib ausschließlich wieder, was tatsächlich auf dem Bild steht — rate nichts dazu. " +
        "Ist etwas nicht lesbar, setze das Feld auf null und beschreibe es kurz im Hinweis.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: medienTyp as "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: "Welches Produkt ist das? Lies Hersteller, Produktname, Gebindegröße und Charge ab.",
            },
          ],
        },
      ],
    });

    if (antwort.stop_reason === "refusal") throw new Error("refusal");
    const text = antwort.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("keine Antwort");
    gelesen = JSON.parse(text.text);
  } catch {
    await refundAiAction(session.user.id, "labelScan");
    return NextResponse.json(
      { error: "Das Etikett konnte nicht gelesen werden. Bitte näher heran und noch einmal." },
      { status: 503 },
    );
  }

  // ---- Treffer im eigenen Katalog suchen ----
  // Etiketten tragen Beiwerk („wassermischbarer Kühlschmierstoff", Klammern,
  // Gebindeangaben). Gesucht wird deshalb mit dem reinen Produktnamen; der
  // Hersteller grenzt zusätzlich ein, falls er im Katalog steht.
  const treffer = await produktSuchen(gelesen.produkt, gelesen.hersteller);

  return NextResponse.json({
    ok: true,
    gelesen,
    saldo: abbuchung.balance,
    treffer,
  });
}

/** Sucht das erkannte Produkt im Katalog und lädt mit, was dazu gemeldet ist. */
async function produktSuchen(produktName: string | null, herstellerName: string | null) {
  if (!produktName) return null;

  // Klammerzusätze und Produktart-Beiwerk entfernen — „Blasocut BC 35
  // (wassermischbarer Kühlschmierstoff)" wird zu „Blasocut BC 35".
  const kern = produktName
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(wassermischbar\w*|nicht\s+wassermischbar\w*|kühlschmierstoff\w*|kuehlschmierstoff\w*|schneidöl\w*|hydrauliköl\w*|konzentrat)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const tokens = normalizeForSearch(kern);
  if (tokens.length < 3) return null;

  const herstellerFilter = herstellerName
    ? { manufacturer: { name: { contains: herstellerName.split(/\s+/)[0], mode: "insensitive" as const } } }
    : {};

  const p =
    // Erst mit Hersteller (genauer), dann ohne — ein Etikett nennt den
    // Hersteller manchmal anders als der Katalog.
    (await prisma.product.findFirst({
      where: { ...herstellerFilter, searchTokens: { contains: tokens } },
      select: AUSWAHL,
    })) ??
    (await prisma.product.findFirst({
      where: { searchTokens: { contains: tokens } },
      select: AUSWAHL,
    })) ??
    (await prisma.product.findFirst({
      where: { name: { contains: kern, mode: "insensitive" } },
      select: AUSWAHL,
    }));
  return p;
}

const AUSWAHL = {
  id: true,
  name: true,
  slug: true,
  category: true,
  refractometerFactor: true,
  recommendedConcentrationMin: true,
  recommendedConcentrationMax: true,
  dataSheetUrl: true,
  manufacturer: { select: { name: true, slug: true } },
  issues: {
    select: { id: true, title: true, severity: true, description: true },
    orderBy: { reportCount: "desc" as const },
    take: 5,
  },
  experienceReports: {
    where: { status: "APPROVED" as const },
    select: { id: true, text: true, problems: true, outcome: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
} as const;
