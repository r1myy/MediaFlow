// @vitest-environment node
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_fake",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

const productsCreate = vi.fn();
const pricesCreate = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    products: { create: (...args: unknown[]) => productsCreate(...args) },
    prices: { create: (...args: unknown[]) => pricesCreate(...args) },
  },
}));

const { db } = await import("@/lib/db");
const { ensureStripePrices } = await import("@/modules/subscription/stripe-sync");

const createdPlanIds: string[] = [];

afterEach(() => {
  productsCreate.mockReset();
  pricesCreate.mockReset();
});

afterAll(async () => {
  if (createdPlanIds.length > 0) {
    await db.plan.deleteMany({ where: { id: { in: createdPlanIds } } });
  }
  await db.$disconnect();
});

async function createBarePlan(slug: string) {
  const plan = await db.plan.create({
    data: {
      slug,
      name: `Test ${slug}`,
      priceMonthlyCents: 900,
      priceYearlyCents: 9000,
      maxSimultaneousJobs: 5,
      maxUploadsPerDay: null,
      maxStorageBytes: BigInt(50) * BigInt(1024 * 1024 * 1024),
      maxQuality: "HD1080",
    },
  });
  createdPlanIds.push(plan.id);
  return plan;
}

describe("ensureStripePrices", () => {
  it("creates a product and both prices when none exist, and persists the IDs", async () => {
    const plan = await createBarePlan(`ensure-fresh-${Date.now()}`);
    productsCreate.mockResolvedValue({ id: "prod_new" });
    pricesCreate
      .mockResolvedValueOnce({ id: "price_monthly_new" })
      .mockResolvedValueOnce({ id: "price_yearly_new" });

    const result = await ensureStripePrices(plan);

    expect(result).toEqual({
      productId: "prod_new",
      monthlyPriceId: "price_monthly_new",
      yearlyPriceId: "price_yearly_new",
    });
    expect(productsCreate).toHaveBeenCalledTimes(1);
    expect(pricesCreate).toHaveBeenCalledTimes(2);

    const persisted = await db.plan.findUniqueOrThrow({ where: { id: plan.id } });
    expect(persisted.stripeProductId).toBe("prod_new");
    expect(persisted.stripePriceIdMonthly).toBe("price_monthly_new");
    expect(persisted.stripePriceIdYearly).toBe("price_yearly_new");
  });

  it("is a no-op when the plan already has a product and both prices", async () => {
    const plan = await createBarePlan(`ensure-complete-${Date.now()}`);
    await db.plan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: "prod_existing",
        stripePriceIdMonthly: "price_existing_monthly",
        stripePriceIdYearly: "price_existing_yearly",
      },
    });
    const complete = await db.plan.findUniqueOrThrow({ where: { id: plan.id } });

    const result = await ensureStripePrices(complete);

    expect(result).toEqual({
      productId: "prod_existing",
      monthlyPriceId: "price_existing_monthly",
      yearlyPriceId: "price_existing_yearly",
    });
    expect(productsCreate).not.toHaveBeenCalled();
    expect(pricesCreate).not.toHaveBeenCalled();
  });

  it("only creates the missing price when the product already exists", async () => {
    const plan = await createBarePlan(`ensure-partial-${Date.now()}`);
    await db.plan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: "prod_existing",
        stripePriceIdMonthly: "price_existing_monthly",
      },
    });
    const partial = await db.plan.findUniqueOrThrow({ where: { id: plan.id } });
    pricesCreate.mockResolvedValue({ id: "price_yearly_backfilled" });

    const result = await ensureStripePrices(partial);

    expect(productsCreate).not.toHaveBeenCalled();
    expect(pricesCreate).toHaveBeenCalledTimes(1);
    expect(result.monthlyPriceId).toBe("price_existing_monthly");
    expect(result.yearlyPriceId).toBe("price_yearly_backfilled");
  });
});
