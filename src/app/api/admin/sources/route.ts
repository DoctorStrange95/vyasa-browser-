import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { fsList, fsGet, fsQuery } from "@/lib/firestore";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [phi, submissions, waitlist, idspRaw, feedbackDoc] = await Promise.allSettled([
    Promise.all([
      fsQuery("ph_intelligence", "status", "live",     500),
      fsQuery("ph_intelligence", "status", "pending",  200),
      fsQuery("ph_intelligence", "status", "rejected", 200),
    ]).then(([live, pending, rejected]) => [...live, ...pending, ...rejected]),
    fsList("pendingSubmissions", 300),
    fsList("waitlist", 500),
    fsGet("idsp_weekly", "latest_v3"),
    fsGet("feedback", "all"),
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
