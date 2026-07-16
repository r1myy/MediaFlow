"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SubscriptionError } from "@/modules/subscription/errors";
import {
  cancelSubscriptionAtPeriodEnd,
  resumeSubscription,
} from "@/modules/subscription/stripe-sync";

import type { SimpleActionState } from "@/modules/subscription/actions/types";

export async function cancelSubscriptionAction(): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    await cancelSubscriptionAtPeriodEnd(session.user.id);
  } catch (err) {
    if (err instanceof SubscriptionError)
      return { status: "error", error: err.message };
    throw err;
  }

  revalidatePath("/dashboard/billing");
  return { status: "success" };
}

export async function resumeSubscriptionAction(): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    await resumeSubscription(session.user.id);
  } catch (err) {
    if (err instanceof SubscriptionError)
      return { status: "error", error: err.message };
    throw err;
  }

  revalidatePath("/dashboard/billing");
  return { status: "success" };
}
