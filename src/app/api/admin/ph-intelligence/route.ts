import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { fsQuery, fsUpdate, fsBatchUpdate } from "@/lib/firestore";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [pending, live, rejected] = await Promise.all([
      fsQuery("ph_intelligence", "status", "pending", 100),
      fsQuery("ph_intelligence", "status", "live",    500),
      fsQuery("ph_intelligence", "status", "rejected",500),
    ]);

    const sorted = [...pending].sort((a, b) =>
      String(b.scrapedAt ?? "").localeCompare(String(a.scrapedAt ?? ""))
    );

    return NextResponse.json({ pending: sorted, liveCount: live.length, rejectedCount: rejected.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e), pending: [], liveCount: 0, rejectedCount: 0 }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const status = action === "approve" ? "live" : "rejected";
  await fsUpdate("ph_intelligence", id, { status, reviewedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, id, status });
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  if (action !== "approve_all") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const pending = await fsQuery("ph_intelligence", "status", "pending", 500);
  const ids     = pending.map(d => d._id as string).filter(Boolean);
  await fsBatchUpdate("ph_intelligence", ids, { status: "live", reviewedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, approved: ids.length });
}
