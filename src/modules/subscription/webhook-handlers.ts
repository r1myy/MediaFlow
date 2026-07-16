import "server-only";

import type { SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email/enqueue";

/** Stripe's subscription status strings are already uppercase-compatible with our enum. */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  return status.toUpperCase() as SubscriptionStatus;
}

async function findPlanForPrice(priceId: string) {
  return db.plan.findFirst({
    where: {
      OR: [{ stripePriceIdMonthly: priceId }, { stripePriceIdYearly: priceId }],
    },
  });
}

async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.warn(
      `[stripe webhook] subscription ${subscription.id} has no userId metadata, skipping`,
    );
    return;
  }

  const item = subscription.items.data[0];
  if (!item) {
    console.warn(
      `[stripe webhook] subscription ${subscription.id} has no line items, skipping`,
    );
    return;
  }

  const plan = await findPlanForPrice(item.price.id);
  if (!plan) {
    console.warn(
      `[stripe webhook] no Plan matches Stripe price ${item.price.id}, skipping`,
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const billingInterval =
    item.price.id === plan.stripePriceIdYearly ? "YEARLY" : "MONTHLY";

  const previous = await db.subscription.findUnique({ where: { userId } });

  await db.subscription.update({
    where: { userId },
    data: {
      planId: plan.id,
      status: mapStatus(subscription.status),
      billingInterval,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: item.price.id,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  if (previous && previous.planId !== plan.id && subscription.status === "active") {
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    await enqueueEmail({
      type: "subscription-updated",
      to: user.email,
      data: { planName: plan.name },
    });
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  const existing = await db.subscription.findUnique({ where: { userId } });
  if (!existing || existing.stripeSubscriptionId !== subscription.id) return;

  await db.subscription.update({
    where: { userId },
    data: { status: "CANCELED", cancelAtPeriodEnd: false },
  });

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  await enqueueEmail({ type: "subscription-canceled", to: user.email, data: {} });
}

async function upsertInvoiceFromStripe(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionRef) return; // one-off invoices aren't subscription billing

  const stripeSubscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
  const dbSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId },
  });
  if (!dbSubscription) {
    console.warn(
      `[stripe webhook] invoice ${invoice.id} references unknown subscription ${stripeSubscriptionId}`,
    );
    return;
  }

  await db.invoice.upsert({
    where: { stripeInvoiceId: invoice.id! },
    create: {
      userId: dbSubscription.userId,
      subscriptionId: dbSubscription.id,
      stripeInvoiceId: invoice.id!,
      number: invoice.number,
      status: mapInvoiceStatus(invoice.status),
      amountDueCents: invoice.amount_due,
      amountPaidCents: invoice.amount_paid,
      currency: invoice.currency,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdfUrl: invoice.invoice_pdf,
    },
    update: {
      status: mapInvoiceStatus(invoice.status),
      amountDueCents: invoice.amount_due,
      amountPaidCents: invoice.amount_paid,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdfUrl: invoice.invoice_pdf,
    },
  });
}

function mapInvoiceStatus(
  status: Stripe.Invoice["status"],
): "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE" {
  switch (status) {
    case "draft":
      return "DRAFT";
    case "open":
      return "OPEN";
    case "paid":
      return "PAID";
    case "void":
      return "VOID";
    case "uncollectible":
      return "UNCOLLECTIBLE";
    default:
      return "OPEN";
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionRef) return;

  const stripeSubscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
  const dbSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId },
  });
  if (!dbSubscription) return;

  const user = await db.user.findUniqueOrThrow({
    where: { id: dbSubscription.userId },
    select: { email: true },
  });
  await enqueueEmail({ type: "payment-failed", to: user.email, data: {} });
}

/**
 * Pure(ish) event dispatcher — no signature verification here, that's the
 * route handler's job (src/app/api/webhooks/stripe/route.ts). Kept
 * separate so it can be unit-tested with constructed Stripe.Event objects,
 * without needing a real webhook secret.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscriptionFromStripe(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.paid":
      await upsertInvoiceFromStripe(event.data.object);
      break;
    case "invoice.payment_failed":
      await upsertInvoiceFromStripe(event.data.object);
      await handlePaymentFailed(event.data.object);
      break;
    default:
    // Unhandled event types are ignored — subscription state is fully
    // derived from customer.subscription.* events.
  }
}
