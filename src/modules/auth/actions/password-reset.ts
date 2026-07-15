"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getRequestMeta } from "@/lib/auth/request-meta";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "@/modules/auth/errors";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/modules/auth/password";
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "@/modules/auth/service";

import type { SimpleActionState } from "@/modules/auth/actions/types";

export async function forgotPasswordAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", error: "Enter a valid email address." };
  }

  const meta = await getRequestMeta();
  const limit = await rateLimit(`forgot-password:${meta.ip}`, 5, 15 * 60);
  if (!limit.success) {
    return { status: "error", error: "Too many attempts. Try again later." };
  }

  await requestPasswordReset(parsed.data.email);
  return { status: "success" };
}

export async function resetPasswordAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }

  redirect("/login?reset=success");
}

export async function changePasswordAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    await changePassword(
      session.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }

  // changePassword() revokes every session for this user, including the
  // one making this request — re-establish it so the user isn't logged out.
  const meta = await getRequestMeta();
  await createSession(session.user.id, meta);

  return { status: "success" };
}
