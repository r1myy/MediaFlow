import "server-only";

import type { BillingInterval, Plan } from "@prisma/client";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import { SubscriptionError } from "@/modules/subscription/errors";

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

function assertStripeConfigured(): void {
  if (!isStripeConfigured()) {
    throw new SubscriptionError(
      "STRIPE_NOT_CONFIGURED",
      "Payments aren't configured in this environment yet.",
    );
  }
}

/**
 * Idempotently creates the Stripe Product/Prices for a plan and persists
 * the IDs back onto it. The trial plan (priceCents = 0) never gets Stripe
 * prices — it's never purchased, just the default DB state for new users.
 */
export async function ensureStripePrices(plan: Plan): Promise<{
  productId: string;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
}> {
  assertStripeConfigured();

  let productId = plan.stripeProductId;
  if (!productId) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description ?? undefined,
      metadata: { planId: plan.id, planSlug: plan.slug },
    });
    productId = product.id;
  }

  let monthlyPriceId = plan.stripePriceIdMonthly;
  if (!monthlyPriceId && plan.priceMonthlyCents > 0) {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: plan.priceMonthlyCents,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { planId: plan.id },
    });
    monthlyPriceId = price.id;
  }

  let yearlyPriceId = plan.stripePriceIdYearly;
  if (!yearlyPriceId && plan.priceYearlyCents > 0) {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: plan.priceYearlyCents,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { planId: plan.id },
    });
    yearlyPriceId = price.id;
  }

  if (
    productId !== plan.stripeProductId ||
    monthlyPriceId !== plan.stripePriceIdMonthly ||
    yearlyPriceId !== plan.stripePriceIdYearly
  ) {
    await db.plan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: productId,
        stripePriceIdMonthly: monthlyPriceId,
        stripePriceIdYearly: yearlyPriceId,
      },
    });
  }

  return { productId, monthlyPriceId, yearlyPriceId };
}

export async function getOrCreateStripeCustomerId(userId: string): Promise<string> {
  assertStripeConfigured();

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { subscription: true },
  });
  if (user.subscription?.stripeCustomerId) {
    return user.subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  if (user.subscription) {
    await db.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customer.id },
    });
  }

  return customer.id;
}

export async function createCheckoutSession(input: {
  userId: string;
  planSlug: string;
  billingInterval: BillingInterval;
}): Promise<{ url: string }> {
  assertStripeConfigured();

  const plan = await db.plan.findUnique({ where: { slug: input.planSlug } });
  if (!plan || plan.slug === "trial" || !plan.isActive) {
    throw new SubscriptionError("INVALID_PLAN", "That plan isn't available.");
  }

  const { monthlyPriceId, yearlyPriceId } = await ensureStripePrices(plan);
  const priceId = input.billingInterval === "YEARLY" ? yearlyPriceId : monthlyPriceId;
  if (!priceId) {
    throw new SubscriptionError(
      "INVALID_PLAN",
      "That billing interval isn't available for this plan.",
    );
  }

  const customerId = await getOrCreateStripeCustomerId(input.userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    client_reference_id: input.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=canceled`,
    subscription_data: { metadata: { userId: input.userId, planId: plan.id } },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new SubscriptionError("STRIPE_ERROR", "Could not start checkout. Try again.");
  }
  return { url: session.url };
}

export async function createBillingPortalSession(
  userId: string,
): Promise<{ url: string }> {
  assertStripeConfigured();

  const customerId = await getOrCreateStripeCustomerId(userId);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });
  return { url: portal.url };
}

async function getActiveStripeSubscriptionId(userId: string): Promise<string> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  if (!subscription?.stripeSubscriptionId) {
    throw new SubscriptionError(
      "NO_ACTIVE_SUBSCRIPTION",
      "You don't have an active paid subscription.",
    );
  }
  return subscription.stripeSubscriptionId;
}

/**
 * Cancellation/resumption only call Stripe — the `Subscription` row is
 * updated by the `customer.subscription.updated` webhook, which is the
 * single source of truth for subscription state (see webhook-handlers.ts).
 */
export async function cancelSubscriptionAtPeriodEnd(userId: string): Promise<void> {
  assertStripeConfigured();
  const stripeSubscriptionId = await getActiveStripeSubscriptionId(userId);
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(userId: string): Promise<void> {
  assertStripeConfigured();
  const stripeSubscriptionId = await getActiveStripeSubscriptionId(userId);
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}
