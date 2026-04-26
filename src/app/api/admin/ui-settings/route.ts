import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAdminDb } from "@/lib/firestore-admin";
import { mergeConfig } from "@/lib/siteConfig";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db  = getAdminDb();
    const doc = await db.collection("config").doc("site_ui").get();
    const stored = doc.exists ? doc.data() : {};
    return NextResponse.json(mergeConfig(stored as never));
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const config = mergeConfig(body);
    const db = getAdminDb();
    await db.collection("config").doc("site_ui").set(config);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
