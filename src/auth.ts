import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { provisionNewUser } from "@/modules/auth/provisioning";

/**
 * Handles Google/Apple OAuth only. Email+password login is deliberately
 * NOT wired through NextAuth's Credentials provider — that provider forces
 * JWT-only sessions, which would leave the `Session`/`Device` tables (and
 * therefore device management) unused for the majority of users. Instead,
 * `src/modules/auth/service.ts` + `src/lib/auth/session.ts` verify the
 * password and create a database Session row directly, using the same
 * cookie name/options configured below — `auth()` then recognizes both
 * kinds of session transparently. See ARCHITECTURE.md §3.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database", maxAge: SESSION_MAX_AGE_SECONDS },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: sessionCookieOptions,
    },
  },
  providers: [
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    Apple({ clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return true;
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { status: true },
      });
      // New sign-ups don't exist yet at this point (adapter creates them
      // right after); only block existing suspended/banned accounts.
      if (dbUser && dbUser.status !== "ACTIVE") return false;
      return true;
    },
    async session({ session, user }) {
      // Refetched from our own Prisma model rather than trusting the
      // adapter-shaped `user` param's typing (NextAuth v5 beta re-exports
      // AdapterUser in a way that resists module augmentation) — also
      // keeps role/status fresh if they changed since the session began.
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true, status: true, twoFactorEnabled: true },
      });
      session.user.id = user.id;
      session.user.role = dbUser?.role ?? "USER";
      session.user.status = dbUser?.status ?? "ACTIVE";
      session.user.twoFactorEnabled = dbUser?.twoFactorEnabled ?? false;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await provisionNewUser(user.id);
      }
    },
  },
});
