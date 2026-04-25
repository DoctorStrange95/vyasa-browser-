import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { adminList, adminGet, adminQuery } from "@/lib/firestore-admin";
import { fsGet } from "@/lib/firestore";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [phi, submissions, waitlist, idspRaw, feedbackDoc] = await Promise.allSettled([
    Promise.all([
      adminQuery("ph_intelligence", "status", "live",     500),
      adminQuery("ph_intelligence", "status", "pending",  200),
      adminQuery("ph_intelligence", "status", "rejected", 200),
    ]).then(([live, pending, rejected]) => [...live, ...pending, ...rejected]),
    adminList("pendingSubmissions", 300),
    adminList("waitlist", 500),
    fsGet("idsp_weekly", "latest_v3"),           // public-readable, REST helper fine
    adminGet("feedback", "all"),
  ]);

  return NextResponse.json({
    phi:         phi.status         === "fulfilled" ? phi.value         : [],
    submissions: submissions.status === "fulfilled" ? submissions.value : [],
    waitlist:    waitlist.status    === "fulfilled" ? waitlist.value    : [],
    idsp:        idspRaw.status     === "fulfilled" ? (idspRaw.value as Record<string, unknown> | null) : null,
    feedback:    feedbackDoc.status === "fulfilled"
                   ? ((feedbackDoc.value as { items?: unknown[] } | null)?.items ?? [])
                   : [],
  });
}
