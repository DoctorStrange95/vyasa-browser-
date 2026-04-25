import { NextRequest, NextResponse } from "next/server";
import { fsQuery, fsUpdate } from "@/lib/firestore";
import { signUserToken, USER_COOKIE } from "@/lib/userAuth";
import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);

async function verifyPassword(pw: string, stored: string): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (stored.startsWith("scrypt:")) {
    // New format: scrypt:salt:hash
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return { ok: false, needsUpgrade: false };
    const buf = await scrypt(pw, salt, 64) as Buffer;
    const ok  = crypto.timingSafeEqual(buf, Buffer.from(hash, "hex"));
    return { ok, needsUpgrade: false };
  }
  // Legacy SHA-256 format — verify and flag for upgrade
  const legacyHash = crypto
    .createHash("sha256")
    .update(pw + (process.env.USER_JWT_SECRET ?? ""))
    .digest("hex");
  const ok = crypto.timingSafeEqual(
    Buffer.from(legacyHash, "hex"),
    Buffer.from(stored, "hex")
  );
  return { ok, needsUpgrade: ok };
}

async function upgradeHash(uid: string, pw: string) {
  const salt = crypto.randomBytes(32).toString("hex");
  const buf  = await scrypt(pw, salt, 64) as Buffer;
  const hash = `scrypt:${salt}:${buf.toString("hex")}`;
  await fsUpdate("users", uid, { passwordHash: hash }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { email, password } = body as { email: string; password: string };
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const rows = await fsQuery("users", "email", email.toLowerCase().trim(), 1);
  if (!rows.length) {
    return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
  }

  const user = rows[0];
  const { ok, needsUpgrade } = await verifyPassword(password, String(user.passwordHash ?? ""));
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Silently upgrade legacy SHA-256 hashes on successful login
  if (needsUpgrade) upgradeHash(String(user._id), password);

  const token = await signUserToken({ uid: String(user._id), name: String(user.name), email: email.toLowerCase().trim() });
  const res   = NextResponse.json({ success: true, name: user.name, email: email.toLowerCase().trim() });
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  return res;
}
