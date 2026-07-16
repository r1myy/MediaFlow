"use server";

import { redirect } from "next/navigation";

import { getRequestMeta } from "@/lib/auth/request-meta";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "@/modules/auth/errors";
import { registerSchema } from "@/modules/auth/password";
import { registerUser } from "@/modules/auth/service";

import type { SimpleActionState } from "@/modules/auth/actions/types";

export async function registerAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
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
  // Generous enough to tolerate shared/NAT'd IPs (and a full E2E suite run,
  // which legitimately registers several accounts back to back) while
  // still bounding scripted mass-account creation.
  const limit = await rateLimit(`register:${meta.ip}`, 20, 60 * 60);
  if (!limit.success) {
    return { status: "error", error: "Too many attempts. Try again later." };
  }

  const referralCode = formData.get("ref")?.toString() || null;

  let userId: string;
  try {
    const user = await registerUser({ ...parsed.data, referralCode });
    userId = user.id;
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }

  await createSession(userId, meta);
  redirect("/dashboard");
}
