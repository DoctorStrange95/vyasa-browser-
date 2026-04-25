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

  // Surface service-account errors so the admin UI can show an actionable banner
  const firstErr = [phi, submissions, waitlist, feedbackDoc]
    .find(r => r.status === "rejected")
    ?.reason as Error | undefined;
  const adminError = firstErr?.message?.includes("FIREBASE_SERVICE_ACCOUNT_KEY")
    ? "FIREBASE_SERVICE_ACCOUNT_KEY is not configured in Vercel environment variables. Go to Vercel → your project → Settings → Environment Variables, add FIREBASE_SERVICE_ACCOUNT_KEY (paste the full service account JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key), then redeploy."
    : firstErr
    ? `Admin SDK error: ${firstErr.message}`
    : null;

  return NextResponse.json({
    _error:      adminError,
    phi:         phi.status         === "fulfilled" ? phi.value         : [],
    submissions: submissions.status === "fulfilled" ? submissions.value : [],
    waitlist:    waitlist.status    === "fulfilled" ? waitlist.value    : [],
    idsp:        idspRaw.status     === "fulfilled" ? (idspRaw.value as Record<string, unknown> | null) : null,
    feedback:    feedbackDoc.status === "fulfilled"
                   ? ((feedbackDoc.value as { items?: unknown[] } | null)?.items ?? [])
                   : [],
  });
}
