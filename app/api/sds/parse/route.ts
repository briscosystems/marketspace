import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { parseSdsText } from "@/lib/sds-parser";
import { summarizeParsedSds } from "@/lib/sds-summary";

// pdftotext + fs brauchen die Node-Runtime (nicht Edge).
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB Upload-Limit

/**
 * Nimmt ein hochgeladenes SDS-PDF, extrahiert Text (pdftotext, max. 20 Seiten),
 * parst es zu strukturierten Feldern und liefert eine kompakte Zusammenfassung
 * zurück. Persistiert NICHTS — die Datei ist rein transient.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Keine Datei erhalten." }, { status: 400 });
  }
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ ok: false, error: "Bitte ein PDF hochladen." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ ok: false, error: "Datei ist leer." }, { status: 400 });
  }
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Datei zu groß (max. 10 MB)." }, { status: 400 });
  }

  const tmpPath = join(tmpdir(), `sds-${randomUUID()}.pdf`);
  try {
    await writeFile(tmpPath, bytes);
    // Harte Grenzen: max. 20 Seiten, 15 s Zeit, 8 MB Ausgabepuffer.
    const { stdout } = await execFileAsync(
      "pdftotext",
      ["-q", "-l", "20", "-enc", "UTF-8", tmpPath, "-"],
      { timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
    );

    const text = (stdout || "").trim();
    if (text.length < 40) {
      return NextResponse.json(
        {
          ok: false,
          error: "Kein Text im PDF gefunden (evtl. gescanntes Bild ohne Texterkennung).",
        },
        { status: 422 },
      );
    }

    const parsed = parseSdsText(text);
    return NextResponse.json({
      ok: true,
      summary: summarizeParsedSds(parsed, null),
      chars: text.length,
      hStatements: parsed.hStatements,
      signalWord: parsed.signalWord,
      flags: {
        containsBoron: parsed.containsBoron,
        containsFormaldehydeReleaser: parsed.containsFormaldehydeReleaser,
        containsSecondaryAmines: parsed.containsSecondaryAmines,
        containsChlorinatedParaffins: parsed.containsChlorinatedParaffins,
        containsMineralOil: parsed.containsMineralOil,
      },
    });
  } catch (e) {
    console.error("SDS-Parsing fehlgeschlagen:", e);
    return NextResponse.json(
      { ok: false, error: "SDB konnte nicht gelesen werden." },
      { status: 500 },
    );
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
