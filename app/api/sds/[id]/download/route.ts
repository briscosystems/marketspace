import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sds = await prisma.safetyDataSheet.findUnique({ where: { id } });
  if (!sds) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cwd = process.cwd();
  const abs = path.resolve(cwd, sds.filePath);
  const allowedRoot = path.resolve(cwd, "data", "sds");
  if (!abs.startsWith(allowedRoot + path.sep) && abs !== allowedRoot) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await fs.readFile(abs);
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 410 });
  }

  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const safeName = `${sds.manufacturer}_${sds.productName}.pdf`.replace(/[^A-Za-z0-9._-]+/g, "_");

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buf.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
