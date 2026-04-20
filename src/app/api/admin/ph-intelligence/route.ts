import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/firebase";
import {
  collection, query, where, getDocs, doc, updateDoc, writeBatch, limit,
} from "firebase/firestore";

// GET — list pending items for admin review
export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Firebase not configured", pending: [], liveCount: 0, rejectedCount: 0 });

  try {
    const col = collection(db, "ph_intelligence");

    const [pendingSnap, liveSnap, rejSnap] = await Promise.all([
      getDocs(query(col, where("status", "==", "pending"), limit(100))),
      getDocs(query(col, where("status", "==", "live"),    limit(500))),
      getDocs(query(col, where("status", "==", "rejected"),limit(500))),
    ]);

    const pending = pendingSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(b.scrapedAt ?? "").localeCompare(String(a.scrapedAt ?? ""))
      );

    return NextResponse.json({
      pending,
      liveCount:     liveSnap.size,
      rejectedCount: rejSnap.size,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, pending: [], liveCount: 0, rejectedCount: 0 }, { status: 500 });
  }
}

// PATCH — approve or reject a single item: { id, action: "approve"|"reject" }
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
  await updateDoc(doc(db, "ph_intelligence", id), { status, reviewedAt: new Date().toISOString() });

  return NextResponse.json({ ok: true, id, status });
}

// DELETE body { action: "approve_all" } — bulk approve every pending item
export async function DELETE(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });

  const { action } = await req.json();
  if (action !== "approve_all") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const snap  = await getDocs(query(collection(db, "ph_intelligence"), where("status", "==", "pending"), limit(500)));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { status: "live", reviewedAt: new Date().toISOString() }));
  await batch.commit();

  return NextResponse.json({ ok: true, approved: snap.size });
}
