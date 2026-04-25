import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Throw at startup so misconfigured deployments fail fast instead of using the fallback.
if (!process.env.ADMIN_JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("ADMIN_JWT_SECRET env var is required in production");
}

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "healthforindia-admin-secret-dev-only"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi  = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login");

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get("hfi_admin_session")?.value;
    if (!token) {
      if (isAdminApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      await jwtVerify(token, SECRET);
    } catch {
      if (isAdminApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("hfi_admin_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Covers both browser admin pages and all /api/admin/* API routes
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
