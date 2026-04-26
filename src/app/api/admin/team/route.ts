import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { adminGet, adminSet } from "@/lib/firestore-admin";

const COL = "team_page";
const DOC = "config";

export async function GET() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const doc = await adminGet(COL, DOC);
  return NextResponse.json(doc ?? {});
}

export async function POST(req: Request) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await adminSet(COL, DOC, { ...body, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
