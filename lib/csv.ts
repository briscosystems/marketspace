// CSV-Helfer für Export-Downloads.
//
// Trennzeichen ist der Strichpunkt — das öffnet in Excel (DE/CH-Gebietsschema)
// direkt in Spalten, ohne Import-Dialog. UTF-8-BOM voran, damit Umlaute in Excel
// korrekt erscheinen.

/** Einen Wert CSV-sicher machen (Anführungszeichen, Strichpunkt, Zeilenumbruch). */
export function csvField(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Aus Kopfzeile + Zeilen eine CSV-Zeichenkette bauen. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [header.map(csvField).join(";")];
  for (const r of rows) lines.push(r.map(csvField).join(";"));
  return lines.join("\r\n");
}

/** Eine CSV-Antwort mit Download-Dateinamen (inkl. UTF-8-BOM für Excel). */
export function csvResponse(filename: string, csv: string): Response {
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
