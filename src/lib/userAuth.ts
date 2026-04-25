import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret(): Uint8Array {
  const s = process.env.USER_JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("USER_JWT_SECRET is required in production");
    return new TextEncoder().encode("healthforindia-user-secret-dev-only");
  }
  return new TextEncoder().encode(s);
}

const COOKIE = "hfi_user_session";

export interface UserSession {
  uid:   string;
  name:  string;
  email: string;
}

export async function signUserToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export { COOKIE as USER_COOKIE };
