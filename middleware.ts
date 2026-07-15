import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";

/**
 * Cheap, cookie-presence-only redirect for UX — NOT the source of truth for
 * authorization. Real enforcement (session validity, RBAC) happens in
 * `(dashboard)/layout.tsx` and `(admin)/layout.tsx` via `auth()`, which
 * needs Prisma and therefore can't run in the Edge middleware runtime. See
 * ARCHITECTURE.md §3.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PREFIXES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PREFIXES.some((p) => pathname.startsWith(p)) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
