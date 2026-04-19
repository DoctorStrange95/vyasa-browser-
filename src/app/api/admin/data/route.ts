import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");

const ALLOWED: Record<string, string> = {
  states:   "states.json",
  national: "national.json",
  cities:   "cities.json",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") ?? "";
  const file = ALLOWED[section];
  if (!file) return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  const filePath = path.join(DATA_DIR, file);
  try {
    const content = await readFile(filePath, "utf-8");
    return new Response(content, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function POST(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { section, data } = body;
  const file = ALLOWED[section];
  if (!file) return NextResponse.json({ error: "Unknown section" }, { status: 400 });

  if (!data) return NextResponse.json({ error: "No data provided" }, { status: 400 });

  try {
    const filePath = path.join(DATA_DIR, file);
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ ok: true, message: `${file} updated successfully. Changes are live.` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
