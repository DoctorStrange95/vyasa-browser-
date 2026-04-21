import { NextRequest, NextResponse } from "next/server";
import { fsQuery, fsAdd } from "@/lib/firestore";
import { signUserToken, USER_COOKIE } from "@/lib/userAuth";
import crypto from "crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw + process.env.USER_JWT_SECRET).digest("hex");
}

export async function POST(req: NextRequest) {
  const { name, age, email, phone, place, password } = await req.json() as {
    name: string; age: number; email: string; phone: string; place: string; password: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  const existing = await fsQuery("users", "email", email, 1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "This email is already registered. Please log in." }, { status: 409 });
  }

  const uid = await fsAdd("users", {
    name, age: age ?? null, email,
    phone: phone ?? "", place: place ?? "",
    passwordHash: hash(password),
    createdAt: new Date().toISOString(),
    contributions: 0,
  });

  const token = await signUserToken({ uid, name, email });
  const res   = NextResponse.json({ success: true, name, email });
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  return res;
}
