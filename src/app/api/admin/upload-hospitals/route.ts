import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { fsSet } from "@/lib/firestore";
import * as XLSX from "xlsx";

export const maxDuration = 60;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\.(xls|xlsx)$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const save = formData.get("save") === "true";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.name.match(/\.(xls|xlsx)$/i))
    return NextResponse.json({ error: "Only .xls / .xlsx files accepted" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "Failed to parse XLS file" }, { status: 400 });
  }

  if (rows.length === 0) return NextResponse.json({ error: "File has no data rows" }, { status: 400 });

  const columns = Object.keys(rows[0]);
  const stateSlug = slugify(file.name);
  const stateName = file.name.replace(/\.(xls|xlsx)$/i, "");

  if (save) {
    await fsSet("hospitals", stateSlug, {
      stateName,
      stateSlug,
      hospitals: rows,
      count: rows.length,
      importedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    ok: true,
    columns,
    preview: rows.slice(0, 5),
    count: rows.length,
    stateSlug,
    stateName,
    saved: save,
  });
}
