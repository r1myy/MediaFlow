import "server-only";

import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/cookies";
import type { RequestMeta } from "@/lib/auth/request-meta";

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = /edg\//i.test(userAgent)
    ? "Edge"
    : /chrome\//i.test(userAgent)
      ? "Chrome"
      : /firefox\//i.test(userAgent)
        ? "Firefox"
        : /safari\//i.test(userAgent)
          ? "Safari"
          : "Browser";
  const os = /windows/i.test(userAgent)
    ? "Windows"
    : /mac os/i.test(userAgent)
      ? "macOS"
      : /android/i.test(userAgent)
        ? "Android"
        : /iphone|ipad/i.test(userAgent)
          ? "iOS"
          : "an unknown OS";
  return `${browser} on ${os}`;
}

/**
 * Creates a database session for a credentials (email+password) sign-in and
 * sets the same cookie NextAuth's database strategy expects, so `auth()`
 * (used everywhere else in the app) recognizes it transparently — see
 * src/lib/auth/cookies.ts.
 */
export async function createSession(userId: string, meta: RequestMeta) {
  const device = await db.device.create({
    data: {
      userId,
      name: describeDevice(meta.userAgent),
      userAgent: meta.userAgent,
      ipAddress: meta.ip,
    },
  });

  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.session.create({
    data: { sessionToken: token, userId, deviceId: device.id, expires },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions,
    expires,
  });

  return { token, expires, deviceId: device.id };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { sessionToken: token } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
