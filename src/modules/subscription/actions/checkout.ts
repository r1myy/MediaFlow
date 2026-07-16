"use server";

import type { BillingInterval } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SubscriptionError } from "@/modules/subscription/errors";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/modules/subscription/stripe-sync";

import type { SimpleActionState } from "@/modules/subscription/actions/types";

export async function checkoutAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const planSlug = formData.get("planSlug")?.toString();
  const billingInterval: BillingInterval =
    formData.get("billingInterval")?.toString() === "YEARLY" ? "YEARLY" : "MONTHLY";
  if (!planSlug) {
    return { status: "error", error: "Missing plan." };
  }

  let url: string;
  try {
    ({ url } = await createCheckoutSession({
      userId: session.user.id,
      planSlug,
      billingInterval,
    }));
  } catch (err) {
    if (err instanceof SubscriptionError)
      return { status: "error", error: err.message };
    throw err;
  }

  redirect(url);
}

export async function billingPortalAction(): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let url: string;
  try {
    ({ url } = await createBillingPortalSession(session.user.id));
  } catch (err) {
    if (err instanceof SubscriptionError)
      return { status: "error", error: err.message };
    throw err;
  }

  redirect(url);
}
