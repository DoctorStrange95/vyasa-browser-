import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firestore-admin";
import { signUserToken, USER_COOKIE } from "@/lib/userAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const idToken = body?.idToken as string | undefined;
  if (!idToken) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  // Verify the Firebase ID token with Admin SDK
  let uid: string, email: string, name: string, picture: string | undefined;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    uid     = decoded.uid;
    email   = (decoded.email ?? "").toLowerCase();
    name    = decoded.name ?? decoded.email?.split("@")[0] ?? "User";
    picture = decoded.picture;
  } catch {
    return NextResponse.json({ error: "Invalid or expired Google token." }, { status: 401 });
  }

  if (!email) return NextResponse.json({ error: "Google account has no email." }, { status: 400 });

  // Upsert user in Firestore — use the Firebase uid as the document ID
  const db      = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const snap    = await userRef.get();

  if (!snap.exists) {
    await userRef.set({
      name,
      email,
      authProvider: "google",
      avatar:       picture ?? null,
      createdAt:    new Date().toISOString(),
      lastLogin:    new Date().toISOString(),
    });
  } else {
    await userRef.update({ lastLogin: new Date().toISOString() });
    // Use stored name if user previously updated their profile
    const stored = snap.data() as Record<string, unknown>;
    if (stored.name) name = String(stored.name);
  }

  // Issue our standard JWT session cookie — same shape as email/password login
  const token = await signUserToken({ uid, name, email });
  const res   = NextResponse.json({ success: true, name, email });
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });
  return res;
}
