"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "@/modules/auth/errors";
import { sendVerificationEmail } from "@/modules/auth/service";

import type { SimpleActionState } from "@/modules/auth/actions/types";

export async function resendVerificationAction(): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const limit = await rateLimit(`resend-verification:${session.user.id}`, 3, 60 * 60);
  if (!limit.success) {
    return { status: "error", error: "Too many attempts. Try again later." };
  }

  try {
    await sendVerificationEmail(session.user.id);
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }

  return { status: "success" };
}
