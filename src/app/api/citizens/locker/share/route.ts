import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { adminAdd, adminQuery } from "@/lib/firestore-admin";

// Creates a 24-hour share token. The doctor opens /health-share/[token].

export async function POST() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const files = await adminQuery("health_locker_files", "uid", session.uid, 1);
  if (!files.length) {
    return NextResponse.json({ error: "No files to share." }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const token = await adminAdd("health_share_tokens", {
    uid:       session.uid,
    name:      session.name,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ token, expiresAt });
}
