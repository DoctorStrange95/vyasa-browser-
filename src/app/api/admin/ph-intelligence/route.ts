import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

// GET — list pending items for admin review
export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Firebase not configured", pending: [], live: 0, rejected: 0 }, { status: 200 });

  const [pendingSnap, liveSnap, rejSnap] = await Promise.all([
    db.collection("ph_intelligence").where("status", "==", "pending").orderBy("scrapedAt", "desc").limit(80).get(),
    db.collection("ph_intelligence").where("status", "==", "live").count().get(),
    db.collection("ph_intelligence").where("status", "==", "rejected").count().get(),
  ]);

  const pending = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({
    pending,
    liveCount:     liveSnap.data().count,
    rejectedCount: rejSnap.data().count,
  });
}

// PATCH — approve or reject a single item  { id, action: "approve"|"reject" }
export async function PATCH(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const status = action === "approve" ? "live" : "rejected";
  await db.collection("ph_intelligence").doc(id).update({
    status,
    reviewedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id, status });
}

// DELETE — bulk approve all pending items
export async function DELETE(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });

  const { action } = await req.json();
  if (action !== "approve_all") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const snap = await db.collection("ph_intelligence").where("status", "==", "pending").get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { status: "live", reviewedAt: new Date().toISOString() }));
  await batch.commit();

  return NextResponse.json({ ok: true, approved: snap.size });
}
