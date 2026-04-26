import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firestore-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
    const db = getAdminDb();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    await db.collection("analytics").doc(`pv_${today}`).set(
      { views: FieldValue.increment(1), date: today },
      { merge: true },
    );
    // also track per-path counts on the same doc
    const safeKey = `path_${path.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80)}`;
    await db.collection("analytics").doc(`pv_${today}`).update({
      [safeKey]: FieldValue.increment(1),
    });
  } catch {
    // fail silently — tracking is non-critical
  }
  return NextResponse.json({ ok: true });
}
