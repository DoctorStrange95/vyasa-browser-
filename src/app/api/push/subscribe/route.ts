import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { getAdminDb } from "@/lib/firestore-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const session = await getUserSession();
  const body = await req.json();
  const { subscription, action } = body as {
    subscription: PushSubscriptionJSON;
    action: "subscribe" | "unsubscribe";
  };

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const db = getAdminDb();
  const endpoint = subscription.endpoint;
  // Use a hash of the endpoint as document ID (endpoints can be very long)
  const id = Buffer.from(endpoint).toString("base64").slice(0, 64).replace(/[/+=]/g, "_");

  if (action === "unsubscribe") {
    await db.collection("push_subscriptions").doc(id).delete().catch(() => {});
    return NextResponse.json({ ok: true });
  }

  await db.collection("push_subscriptions").doc(id).set({
    endpoint,
    keys: subscription.keys ?? {},
    uid: session?.uid ?? null,
    state: body.state ?? null,
    subscribedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
