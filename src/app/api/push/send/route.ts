import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAdminDb } from "@/lib/firestore-admin";
import webpush from "web-push";

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@vyasaa.com";

function getWebPush() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

export async function POST(req: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, url, stateFilter } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  let push: typeof webpush;
  try { push = getWebPush(); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }

  const db = getAdminDb();
  let query: FirebaseFirestore.Query = db.collection("push_subscriptions");
  if (stateFilter) query = query.where("state", "==", stateFilter);

  const snap = await query.limit(500).get();
  const payload = JSON.stringify({ title, body, url: url ?? "/", tag: "hfi-alert" });

  let sent = 0, failed = 0;
  const stale: string[] = [];

  await Promise.all(snap.docs.map(async (doc) => {
    const sub = doc.data();
    const pushSub = { endpoint: sub.endpoint as string, keys: sub.keys as Record<string, string> };
    try {
      await push.sendNotification(pushSub as Parameters<typeof push.sendNotification>[0], payload);
      sent++;
    } catch (e: unknown) {
      failed++;
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) stale.push(doc.id);
    }
  }));

  // Clean up expired subscriptions
  if (stale.length) {
    const batch = db.batch();
    stale.forEach(id => batch.delete(db.collection("push_subscriptions").doc(id)));
    await batch.commit();
  }

  return NextResponse.json({ ok: true, sent, failed, stale: stale.length });
}
