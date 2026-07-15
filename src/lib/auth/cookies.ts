/**
 * Shared between the NextAuth config (`auth.ts`) and the custom
 * credentials-login session creation in `src/modules/auth/session.ts` — both
 * must agree on the cookie name/options so `auth()` transparently recognizes
 * sessions created by either path. See ARCHITECTURE.md §3 (Phase 3) for why.
 */
const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_NAME = isProduction
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProduction,
};
