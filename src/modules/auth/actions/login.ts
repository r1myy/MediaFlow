"use server";

import { redirect } from "next/navigation";

import { getRequestMeta } from "@/lib/auth/request-meta";
import { createSession } from "@/lib/auth/session";
import {
  clearTwoFactorChallenge,
  createTwoFactorChallenge,
  resolveTwoFactorChallenge,
} from "@/lib/auth/two-factor-challenge";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "@/modules/auth/errors";
import { loginSchema } from "@/modules/auth/password";
import { authenticateWithPassword, verifyTwoFactorLogin } from "@/modules/auth/service";

import type { LoginActionState } from "@/modules/auth/actions/types";

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const meta = await getRequestMeta();
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit(`login:ip:${meta.ip}`, 20, 15 * 60),
    rateLimit(`login:email:${parsed.data.email}`, 8, 15 * 60),
  ]);
  if (!ipLimit.success || !emailLimit.success) {
    return { status: "error", error: "Too many attempts. Try again later." };
  }

  let user;
  try {
    user = await authenticateWithPassword(parsed.data.email, parsed.data.password);
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }

  if (user.twoFactorEnabled) {
    const challengeId = await createTwoFactorChallenge(user.id);
    return { status: "twoFactorRequired", challengeId };
  }

  await createSession(user.id, meta);
  redirect("/dashboard");
}

export async function verifyTwoFactorLoginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const challengeId = formData.get("challengeId")?.toString();
  const code = formData.get("code")?.toString();
  if (!challengeId || !code) {
    return { status: "error", error: "Enter your authentication code." };
  }

  const limit = await rateLimit(`2fa-login:${challengeId}`, 8, 15 * 60);
  if (!limit.success) {
    return { status: "error", error: "Too many attempts. Please log in again." };
  }

  const userId = await resolveTwoFactorChallenge(challengeId);
  if (!userId) {
    return {
      status: "error",
      error: "This challenge has expired. Please log in again.",
    };
  }

  try {
    await verifyTwoFactorLogin(userId, code);
  } catch (err) {
    if (err instanceof AuthError) {
      return { status: "twoFactorRequired", challengeId, error: err.message };
    }
    throw err;
  }

  await clearTwoFactorChallenge(challengeId);
  const meta = await getRequestMeta();
  await createSession(userId, meta);
  redirect("/dashboard");
}

/**
 * Single entry point for the login form: dispatches to the password step
 * or the 2FA step based on which fields are present, so the client only
 * needs one `useActionState` hook across both steps of the flow.
 */
export async function loginFormAction(
  prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (formData.get("challengeId")) {
    return verifyTwoFactorLoginAction(prev, formData);
  }
  return loginAction(prev, formData);
}
