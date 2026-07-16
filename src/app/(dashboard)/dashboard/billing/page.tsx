import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CheckoutBanner } from "@/components/dashboard/billing/checkout-banner";
import { ManageSubscription } from "@/components/dashboard/billing/manage-subscription";
import { PlanPicker } from "@/components/dashboard/billing/plan-picker";
import { UsageCard } from "@/components/dashboard/billing/usage-card";
import { db } from "@/lib/db";
import { getEntitlements } from "@/modules/subscription/entitlements";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [entitlements, subscription, plans] = await Promise.all([
    getEntitlements(session.user.id),
    db.subscription.findUniqueOrThrow({ where: { userId: session.user.id } }),
    db.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your plan, usage, and payment method.
        </p>
      </div>

      <CheckoutBanner />

      <UsageCard entitlements={entitlements} />

      <ManageSubscription
        planName={entitlements.plan.slug === "trial" ? "Trial" : entitlements.plan.name}
        status={subscription.status}
        cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
        currentPeriodEnd={subscription.currentPeriodEnd}
        hasStripeCustomer={Boolean(subscription.stripeCustomerId)}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Plans</h2>
        <PlanPicker plans={plans} currentPlanSlug={entitlements.plan.slug} />
      </div>
    </div>
  );
}
