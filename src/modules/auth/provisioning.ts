import "server-only";

import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email/enqueue";

const TRIAL_DAYS = 7;

/**
 * Runs once per new user, regardless of how they signed up (credentials
 * registration or first OAuth sign-in via NextAuth's `events.createUser`):
 * starts the trial subscription, sends the welcome email, and — if they
 * arrived via a referral link — records the attribution.
 */
export async function provisionNewUser(userId: string, referralCode?: string | null) {
  const trialPlan = await db.plan.findUniqueOrThrow({ where: { slug: "trial" } });

  const trialStart = new Date();
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await db.subscription.create({
    data: {
      userId,
      planId: trialPlan.id,
      status: "TRIALING",
      trialStart,
      trialEnd,
      currentPeriodStart: trialStart,
      currentPeriodEnd: trialEnd,
    },
  });

  if (referralCode) {
    const referrer = await db.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (referrer && referrer.id !== userId) {
      await db.referral.create({
        data: { referrerId: referrer.id, referredUserId: userId, status: "PENDING" },
      });
    }
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true },
  });

  await enqueueEmail({
    type: "welcome",
    to: user.email,
    data: { name: user.name ?? "there" },
  });

  await db.notification.create({
    data: {
      userId,
      type: "SYSTEM",
      title: "Welcome to MediaFlow",
      body: `Your ${TRIAL_DAYS}-day free trial is active. Upload your first file to get started.`,
    },
  });
}
