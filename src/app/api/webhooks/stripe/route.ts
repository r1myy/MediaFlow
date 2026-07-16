import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import { handleStripeEvent } from "@/modules/subscription/webhook-handlers";

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error(`[stripe webhook] failed to handle ${event.type}:`, err);
    // 500 tells Stripe to retry with backoff — appropriate for a transient
    // DB error, but not for a permanently malformed event.
    return NextResponse.json(
      { error: "Internal error handling event" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
