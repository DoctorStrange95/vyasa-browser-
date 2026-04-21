import { NextRequest, NextResponse } from "next/server";
import { fsQuery } from "@/lib/firestore";
import { signUserToken, USER_COOKIE } from "@/lib/userAuth";
import crypto from "crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw + process.env.USER_JWT_SECRET).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const rows = await fsQuery("users", "email", email, 1);
  if (!rows.length) {
    return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
  }

  const user = rows[0];
  if (user.passwordHash !== hash(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await signUserToken({ uid: user._id, name: user.name as string, email });
  const res   = NextResponse.json({ success: true, name: user.name, email });
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  return res;
}
