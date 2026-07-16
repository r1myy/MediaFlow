// @vitest-environment node
import type Stripe from "stripe";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { handleStripeEvent } from "@/modules/subscription/webhook-handlers";

/**
 * These construct minimal Stripe.Event-shaped fixtures rather than calling
 * the real Stripe API (no test-mode credentials in this environment) —
 * they verify OUR mapping/DB logic assuming Stripe sends events shaped as
 * documented (and as the installed `stripe` package's own types declare).
 * See ARCHITECTURE.md §9 for the verification caveat this implies.
 */

const createdUserIds: string[] = [];
const createdPlanIds: string[] = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  if (createdPlanIds.length > 0) {
    await db.plan.deleteMany({ where: { id: { in: createdPlanIds } } });
  }
  await db.$disconnect();
});

async function createTestPlan(slug: string, priceId: string) {
  const plan = await db.plan.create({
    data: {
      slug,
      name: `Test ${slug}`,
      priceMonthlyCents: 1900,
      priceYearlyCents: 19000,
      stripeProductId: `prod_${slug}`,
      stripePriceIdMonthly: priceId,
      maxSimultaneousJobs: 5,
      maxUploadsPerDay: null,
      maxStorageBytes: BigInt(50) * BigInt(1024 * 1024 * 1024),
      maxQuality: "HD1080",
    },
  });
  createdPlanIds.push(plan.id);
  return plan;
}

async function createTrialUser() {
  const trial = await db.plan.findUniqueOrThrow({ where: { slug: "trial" } });
  const user = await db.user.create({
    data: {
      email: `webhook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
      subscription: {
        create: {
          planId: trial.id,
          status: "TRIALING",
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function fakeSubscriptionEvent(
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted",
  subscription: Partial<Stripe.Subscription> & { id: string },
): Stripe.Event {
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type,
    data: { object: subscription },
  } as unknown as Stripe.Event;
}

describe("handleStripeEvent: subscription lifecycle", () => {
  it("upgrades a user's subscription on customer.subscription.updated", async () => {
    const user = await createTrialUser();
    const plan = await createTestPlan(
      `webhook-basic-${Date.now()}`,
      `price_${Date.now()}`,
    );

    const now = Math.floor(Date.now() / 1000);
    const event = fakeSubscriptionEvent("customer.subscription.updated", {
      id: "sub_test_123",
      status: "active",
      customer: "cus_test_123",
      cancel_at_period_end: false,
      canceled_at: null,
      metadata: { userId: user.id },
      items: {
        object: "list",
        data: [
          {
            price: { id: plan.stripePriceIdMonthly },
            current_period_start: now,
            current_period_end: now + 2_592_000,
          },
        ],
      },
    } as never);

    await handleStripeEvent(event);

    const subscription = await db.subscription.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(subscription.planId).toBe(plan.id);
    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.stripeSubscriptionId).toBe("sub_test_123");
    expect(subscription.stripeCustomerId).toBe("cus_test_123");
    expect(subscription.billingInterval).toBe("MONTHLY");
    expect(subscription.currentPeriodEnd).toEqual(new Date((now + 2_592_000) * 1000));
  });

  it("maps Stripe's past_due status onto our enum", async () => {
    const user = await createTrialUser();
    const plan = await createTestPlan(
      `webhook-pastdue-${Date.now()}`,
      `price_${Date.now()}`,
    );
    const now = Math.floor(Date.now() / 1000);

    await handleStripeEvent(
      fakeSubscriptionEvent("customer.subscription.updated", {
        id: "sub_test_456",
        status: "past_due",
        customer: "cus_test_456",
        cancel_at_period_end: false,
        canceled_at: null,
        metadata: { userId: user.id },
        items: {
          object: "list",
          data: [
            {
              price: { id: plan.stripePriceIdMonthly },
              current_period_start: now,
              current_period_end: now + 2_592_000,
            },
          ],
        },
      } as never),
    );

    const subscription = await db.subscription.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(subscription.status).toBe("PAST_DUE");
  });

  it("marks a subscription CANCELED on customer.subscription.deleted", async () => {
    const user = await createTrialUser();
    const plan = await createTestPlan(
      `webhook-cancel-${Date.now()}`,
      `price_${Date.now()}`,
    );
    const now = Math.floor(Date.now() / 1000);

    // First activate it, matching the real lifecycle (created -> deleted).
    await handleStripeEvent(
      fakeSubscriptionEvent("customer.subscription.updated", {
        id: "sub_test_789",
        status: "active",
        customer: "cus_test_789",
        cancel_at_period_end: false,
        canceled_at: null,
        metadata: { userId: user.id },
        items: {
          object: "list",
          data: [
            {
              price: { id: plan.stripePriceIdMonthly },
              current_period_start: now,
              current_period_end: now + 2_592_000,
            },
          ],
        },
      } as never),
    );

    await handleStripeEvent(
      fakeSubscriptionEvent("customer.subscription.deleted", {
        id: "sub_test_789",
        status: "canceled",
        customer: "cus_test_789",
        cancel_at_period_end: false,
        canceled_at: now,
        metadata: { userId: user.id },
      } as never),
    );

    const subscription = await db.subscription.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(subscription.status).toBe("CANCELED");
  });

  it("ignores events with no matching Plan for the price, without throwing", async () => {
    const user = await createTrialUser();
    const now = Math.floor(Date.now() / 1000);

    await expect(
      handleStripeEvent(
        fakeSubscriptionEvent("customer.subscription.updated", {
          id: "sub_unknown_price",
          status: "active",
          customer: "cus_test",
          cancel_at_period_end: false,
          canceled_at: null,
          metadata: { userId: user.id },
          items: {
            object: "list",
            data: [
              {
                price: { id: "price_does_not_exist" },
                current_period_start: now,
                current_period_end: now + 2_592_000,
              },
            ],
          },
        } as never),
      ),
    ).resolves.not.toThrow();

    // Subscription should be untouched (still on the trial plan).
    const subscription = await db.subscription.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(subscription.status).toBe("TRIALING");
  });

  it("ignores events with no userId metadata, without throwing", async () => {
    await expect(
      handleStripeEvent(
        fakeSubscriptionEvent("customer.subscription.updated", {
          id: "sub_no_user",
          status: "active",
          customer: "cus_test",
          cancel_at_period_end: false,
          canceled_at: null,
          metadata: {},
          items: { object: "list", data: [] },
        } as never),
      ),
    ).resolves.not.toThrow();
  });
});

describe("handleStripeEvent: unhandled types", () => {
  it("silently ignores event types we don't act on", async () => {
    const event = {
      id: "evt_x",
      object: "event",
      type: "customer.created",
      data: { object: {} },
    } as unknown as Stripe.Event;
    await expect(handleStripeEvent(event)).resolves.not.toThrow();
  });
});
