import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { adminQuery, adminUpdate } from "@/lib/firestore-admin";
import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);

async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const buf = await scrypt(pw, salt, 64) as Buffer;
    return crypto.timingSafeEqual(buf, Buffer.from(hash, "hex"));
  }
  // Legacy SHA-256
  const legacyHash = crypto.createHash("sha256").update(pw + (process.env.USER_JWT_SECRET ?? "")).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(legacyHash, "hex"), Buffer.from(stored, "hex"));
}

async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(32).toString("hex");
  const buf  = await scrypt(pw, salt, 64) as Buffer;
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Both current and new password are required." }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });

  const rows = await adminQuery("users", "email", session.email, 1);
  if (!rows.length) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const user = rows[0];
  const ok = await verifyPassword(currentPassword, String(user.passwordHash ?? ""));
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  const newHash = await hashPassword(newPassword);
  await adminUpdate("users", session.uid, { passwordHash: newHash });

  return NextResponse.json({ ok: true });
}
