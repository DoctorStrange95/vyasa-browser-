import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firestore-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state"); // optional: filter to state leaderboard

  const db = getAdminDb();

  try {
    const docId = state
      ? state.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      : "india";

    const doc = await db.collection("leaderboard").doc(docId).get();
    if (!doc.exists) {
      return NextResponse.json({ top: [], updatedAt: null, scope: state ?? "india" });
    }
    const data = doc.data()!;
    return NextResponse.json({
      top:       data.top ?? [],
      updatedAt: data.updatedAt ?? null,
      scope:     state ?? "india",
    });
  } catch {
    return NextResponse.json({ top: [], updatedAt: null, scope: state ?? "india" });
  }
}
