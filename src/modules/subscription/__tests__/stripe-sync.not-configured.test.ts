// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { SubscriptionError } from "@/modules/subscription/errors";
import {
  cancelSubscriptionAtPeriodEnd,
  createBillingPortalSession,
  createCheckoutSession,
  ensureStripePrices,
  isStripeConfigured,
  resumeSubscription,
} from "@/modules/subscription/stripe-sync";

/**
 * This sandbox genuinely has no STRIPE_SECRET_KEY set, so these exercise
 * the real (not mocked) "gracefully degrade" path — the same behavior
 * verified live via Playwright against the running dev server.
 */
describe("stripe-sync when Stripe isn't configured", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("isStripeConfigured() reflects the missing key", () => {
    expect(isStripeConfigured()).toBe(false);
  });

  it("createCheckoutSession throws a typed, user-facing error", async () => {
    await expect(
      createCheckoutSession({
        userId: "does-not-matter",
        planSlug: "basic",
        billingInterval: "MONTHLY",
      }),
    ).rejects.toMatchObject({
      code: "STRIPE_NOT_CONFIGURED",
    } satisfies Partial<SubscriptionError>);
  });

  it("createBillingPortalSession throws a typed, user-facing error", async () => {
    await expect(createBillingPortalSession("does-not-matter")).rejects.toBeInstanceOf(
      SubscriptionError,
    );
  });

  it("cancelSubscriptionAtPeriodEnd throws a typed, user-facing error", async () => {
    await expect(
      cancelSubscriptionAtPeriodEnd("does-not-matter"),
    ).rejects.toBeInstanceOf(SubscriptionError);
  });

  it("resumeSubscription throws a typed, user-facing error", async () => {
    await expect(resumeSubscription("does-not-matter")).rejects.toBeInstanceOf(
      SubscriptionError,
    );
  });

  it("ensureStripePrices throws before making any API call", async () => {
    const plan = await db.plan.findUniqueOrThrow({ where: { slug: "basic" } });
    await expect(ensureStripePrices(plan)).rejects.toBeInstanceOf(SubscriptionError);
  });
});
