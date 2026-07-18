import { NextResponse } from "next/server";
import { recordAiUsage } from "@/lib/ai-usage";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSearchWhere } from "@/lib/normalize-search";
import { chargeForAiAction, refundAiAction } from "@/lib/credits";

// KI-Concierge — der digitale Fachberater (Mehrwerte-Baustein H).
// Der Nutzer beschreibt sein Problem in normalen Worten; die Route sucht
// passende Produkte/Angebote/Praxis-Wissen aus der Datenbank zusammen und
// lässt Claude (Haiku) eine kurze, verlinkte Antwort formulieren.
// Ohne ANTHROPIC_API_KEY oder bei API-Fehlern antwortet ein rein
// regelbasierter Fallback — beide Pfade bleiben funktionsfähig.

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

type ChatMessage = z.infer<typeof bodySchema>["messages"][number];

/** Suchwörter aus der letzten Nutzer-Nachricht (Füllwörter raus). */
function keywords(text: string): string[] {
  const stop = new Set([
    "der", "die", "das", "ein", "eine", "und", "oder", "mit", "für", "von", "bei",
    "ich", "wir", "mein", "meine", "nach", "auf", "ist", "sind", "hat", "habe",
    "was", "wie", "wo", "kann", "brauche", "suche", "welche", "welches", "nicht",
    "dem", "den", "des", "im", "am", "um", "zu", "zur", "zum", "es", "sich",
  ]);
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-zäöüß0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stop.has(w)),
    ),
  ].slice(0, 8);
}

async function gatherContext(query: string) {
  const words = keywords(query);
  const wordOr = (fields: string[]) =>
    words.flatMap((w) =>
      fields.map((f) => ({ [f]: { contains: w, mode: "insensitive" as const } })),
    );

  const tokenWhere = buildSearchWhere("searchTokens", query);
  const [products, listings, issues] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          ...(tokenWhere ? [tokenWhere] : []),
          ...(words.length > 0 ? wordOr(["name"]) : []),
          ...(words.length > 0
            ? words.flatMap((w) => [
                { applicationAreas: { has: w } },
                { suitableMaterials: { has: w } },
              ])
            : []),
        ],
      },
      select: {
        name: true,
        slug: true,
        category: true,
        applicationAreas: true,
        certifications: true,
        containsBor: true,
        containsFormaldehydeDepot: true,
        manufacturer: { select: { name: true, slug: true } },
      },
      take: 5,
    }),
    prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        ...(words.length > 0
          ? { OR: wordOr(["productName", "manufacturer", "applicationArea", "productType"]) }
          : {}),
      },
      select: {
        id: true,
        manufacturer: true,
        productName: true,
        productType: true,
        applicationArea: true,
        quantity: true,
        quantityUnit: true,
        priceEur: true,
        locationRegion: true,
      },
      take: 5,
    }),
    words.length > 0
      ? prisma.productIssue.findMany({
          where: { OR: wordOr(["title", "description", "rootCause"]) },
          select: { id: true, title: true, category: true, workaround: true },
          take: 4,
        })
      : Promise.resolve([]),
  ]);

  return { products, listings, issues };
}

type Ctx = Awaited<ReturnType<typeof gatherContext>>;

function contextText(ctx: Ctx): string {
  const lines: string[] = [];
  if (ctx.products.length > 0) {
    lines.push("PRODUKTE aus dem Katalog (Link: /products/<herstellerSlug>/<slug>):");
    for (const p of ctx.products) {
      lines.push(
        `- ${p.manufacturer.name} ${p.name} | Kategorie ${p.category} | Anwendungen: ${p.applicationAreas.join(", ") || "–"} | Freigaben: ${p.certifications.join(", ") || "–"} | Link: /products/${p.manufacturer.slug}/${p.slug}`,
      );
    }
  }
  if (ctx.listings.length > 0) {
    lines.push("AKTIVE ANGEBOTE auf dem Marktplatz (Link: /listings/<id>):");
    for (const l of ctx.listings) {
      lines.push(
        `- ${l.manufacturer} ${l.productName} | ${l.productType} | ${l.applicationArea} | ${l.quantity} ${l.quantityUnit} | ${l.priceEur ? l.priceEur + " €/" + l.quantityUnit : "Preis auf Anfrage"} | Region ${l.locationRegion} | Link: /listings/${l.id}`,
      );
    }
  }
  if (ctx.issues.length > 0) {
    lines.push("PRAXIS-PROBLEME aus der Wissensbasis (Übersicht: /wissen):");
    for (const i of ctx.issues) {
      lines.push(
        `- ${i.title} [${i.category}]${i.workaround ? " | Abhilfe: " + i.workaround.slice(0, 160) : ""}`,
      );
    }
  }
  return lines.length > 0 ? lines.join("\n") : "(keine passenden Einträge gefunden)";
}

const SYSTEM_PROMPT = `Du bist der Brisco-Concierge — ein erfahrener Fachberater für Industrieöle,
Kühlschmierstoffe (KSS) und Schmierstoffe auf dem B2B-Marktplatz "Brisco Marketplace".

Regeln:
- Antworte auf Deutsch, per Du, kurz und praxisnah (maximal ~150 Wörter).
- Stütze dich NUR auf den mitgelieferten Daten-Kontext und allgemeines Fachwissen zu
  Schmierstoffen. Erfinde keine Produkte, Preise oder Angebote.
- Verlinke passende Seiten als Markdown-Link mit relativem Pfad, z. B.
  [Blasocut 2000 CF](/products/blaser/blasocut-2000-cf).
- Nützliche Seiten der Plattform: /listings (Angebote durchsuchen, Filter z. B.
  /listings?application=fraesen), /rfqs (Gesuch einstellen), /kss-finder
  (geführte KSS-Suche), /wissen (Praxis-Probleme), /prices (indikative
  Preis-Richtwerte), /manufacturers (Herstellerkatalog), /compare (Vergleich).
- Die Preise unter /prices sind MODELLIERTE Richtwerte zur Orientierung, keine
  bestätigten Marktpreise. Nenne sie nie "geprüfte" oder "verifizierte"
  Marktpreise; verbindlich ist immer das Angebot des Anbieters.
- Wenn die Daten nichts hergeben: sag das ehrlich und empfehle den passenden
  nächsten Schritt auf der Plattform (z. B. Gesuch unter /rfqs einstellen).
- Bei Sicherheits-/Gesundheitsfragen: aufs Sicherheitsdatenblatt (/sds) verweisen.
- Sprich von "Tank" (nie "Sumpf").`;

function heuristicReply(ctx: Ctx): string {
  const parts: string[] = [];
  if (ctx.products.length > 0) {
    parts.push(
      "Diese Produkte aus dem Katalog könnten passen:\n" +
        ctx.products
          .slice(0, 3)
          .map((p) => `- [${p.manufacturer.name} ${p.name}](/products/${p.manufacturer.slug}/${p.slug})`)
          .join("\n"),
    );
  }
  if (ctx.listings.length > 0) {
    parts.push(
      "Aktuelle Angebote dazu:\n" +
        ctx.listings
          .slice(0, 3)
          .map((l) => `- [${l.manufacturer} ${l.productName}](/listings/${l.id}) · ${l.quantity} ${l.quantityUnit}`)
          .join("\n"),
    );
  }
  if (ctx.issues.length > 0) {
    parts.push(
      "Bekannte Praxis-Probleme zum Thema findest du im [Wissens-Hub](/wissen):\n" +
        ctx.issues.slice(0, 3).map((i) => `- ${i.title}`).join("\n"),
    );
  }
  if (parts.length === 0) {
    return (
      "Dazu habe ich in der Wissensbasis nichts Passendes gefunden. " +
      "Du kannst dein Gesuch unter [Suchen](/rfqs) einstellen — Anbieter melden sich dann mit Preisen. " +
      "Oder probiere die [geführte KSS-Suche](/kss-finder)."
    );
  }
  return parts.join("\n\n");
}

async function askClaude(messages: ChatMessage[], ctx: Ctx): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  // Verlauf 1:1 übernehmen; Daten-Kontext an die letzte Nutzer-Nachricht anhängen
  const apiMessages = messages.map((m, idx) => ({
    role: m.role,
    content:
      idx === messages.length - 1 && m.role === "user"
        ? `${m.content}\n\n<daten-kontext>\n${contextText(ctx)}\n</daten-kontext>`
        : m.content,
  }));

  const response = await client.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
    },
    { timeout: 25000 },
  );

  recordAiUsage("concierge", response.model, response.usage);

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "";
  if (!text) throw new Error("Leere Antwort von Claude");
  return text;
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }
  const messages = parsed.data.messages;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "Keine Nutzer-Nachricht" }, { status: 400 });
  }

  const ctx = await gatherContext(lastUser.content);

  // KI-Antwort kostet 1 Credit — ohne Anmeldung/Credits antwortet der
  // regelbasierte Fallback mit denselben Daten plus Hinweis.
  const session = await getServerSession(authOptions);
  let notice = "";

  if (process.env.ANTHROPIC_API_KEY && session?.user?.id) {
    const charge = await chargeForAiAction(session.user.id, "concierge");
    if (charge.ok) {
      try {
        const reply = await askClaude(messages, ctx);
        return NextResponse.json({
          reply,
          source: "anthropic-claude",
          creditBalance: charge.balance,
        });
      } catch (err) {
        console.error("Concierge: Claude-Aufruf fehlgeschlagen, nutze Fallback:", err);
        await refundAiAction(session.user.id, "concierge");
        notice = "\n\n_KI gerade nicht erreichbar — dein Credit wurde erstattet._";
      }
    } else if (charge.reason === "no_credits") {
      notice =
        "\n\n_Dein Credit-Guthaben ist aufgebraucht — dies ist die einfache Suchantwort. Credits gibt es unter [Mitgliedschaft](/mitgliedschaft)._";
    } else {
      notice =
        "\n\n_Kennenlernphase abgelaufen — für KI-Antworten bitte ein [Abo lösen](/mitgliedschaft)._";
    }
  } else if (!session?.user?.id) {
    notice = "\n\n_Melde dich an, um KI-Antworten zu erhalten — dies ist die einfache Suchantwort._";
  }

  return NextResponse.json({
    reply: heuristicReply(ctx) + notice,
    source: "heuristic-fallback",
  });
}
