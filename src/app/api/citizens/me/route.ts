import { NextRequest, NextResponse } from "next/server";
import { getUserSession, signUserToken, USER_COOKIE } from "@/lib/userAuth";
import { adminQuery, adminUpdate } from "@/lib/firestore-admin";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const rows = await adminQuery("users", "email", session.email, 1);
  const user = rows[0];
  if (!user) return NextResponse.json({ name: session.name, email: session.email });

  return NextResponse.json({
    uid:          session.uid,
    name:         String(user.name  ?? session.name),
    email:        String(user.email ?? session.email),
    phone:        String(user.phone ?? ""),
    place:        String(user.place ?? ""),
    age:          user.age != null ? Number(user.age) : null,
    pinnedStates: Array.isArray(user.pinnedStates) ? (user.pinnedStates as string[]) : [],
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const allowed = ["name", "phone", "place", "age"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = key === "age" ? (body[key] ? Number(body[key]) : null) : String(body[key] ?? "").trim();
  }
  // pinnedStates is an array, handle separately
  if ("pinnedStates" in body && Array.isArray(body.pinnedStates)) {
    update.pinnedStates = (body.pinnedStates as unknown[]).filter(s => typeof s === "string").slice(0, 50);
  }
  if (update.name === "") return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });

  await adminUpdate("users", session.uid, update);

  // Re-issue cookie if name changed so the session reflects it
  const newName = String(update.name ?? session.name);
  const res = NextResponse.json({ ok: true, name: newName, email: session.email });
  if (update.name && update.name !== session.name) {
    const token = await signUserToken({ uid: session.uid, name: newName, email: session.email });
    res.cookies.set(USER_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
    });
  }
  return res;
}
