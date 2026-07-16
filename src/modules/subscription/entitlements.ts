import "server-only";

import type { MediaQuality, Plan, SubscriptionStatus } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * BEST is "highest available" rather than a rung on the resolution ladder;
 * AUDIO_ONLY is a separate axis (an audio extraction, not a video
 * resolution) and is always allowed regardless of plan.
 */
const QUALITY_LADDER: MediaQuality[] = ["SD480", "HD720", "HD1080", "BEST"];

export function isQualityAllowed(
  requested: MediaQuality,
  maxQuality: MediaQuality,
): boolean {
  if (requested === "AUDIO_ONLY") return true;
  if (maxQuality === "BEST") return true;
  const requestedIndex = QUALITY_LADDER.indexOf(requested);
  const maxIndex = QUALITY_LADDER.indexOf(maxQuality);
  return requestedIndex <= maxIndex;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

export interface Entitlements {
  plan: Plan;
  status: SubscriptionStatus;
  /** True once a TRIALING subscription's trialEnd has passed. */
  isTrialExpired: boolean;
  trialDaysRemaining: number | null;
  /** False for any non-active/expired-trial status — blocks paid actions. */
  hasAccess: boolean;
  usage: {
    uploadsToday: number;
    storageBytesUsed: bigint;
    activeJobs: number;
  };
  remaining: {
    /** Null = unlimited. */
    uploadsToday: number | null;
    storageBytes: bigint;
    simultaneousJobs: number;
  };
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const subscription = await db.subscription.findUniqueOrThrow({
    where: { userId },
    include: { plan: true },
  });

  const isTrialExpired =
    subscription.status === "TRIALING" &&
    Boolean(subscription.trialEnd) &&
    subscription.trialEnd! < new Date();

  const trialDaysRemaining =
    subscription.status === "TRIALING" && subscription.trialEnd
      ? Math.max(
          0,
          Math.ceil((subscription.trialEnd.getTime() - Date.now()) / 86_400_000),
        )
      : null;

  const hasAccess = ACTIVE_STATUSES.includes(subscription.status) && !isTrialExpired;

  const [usageRecord, storageAgg, activeJobs] = await Promise.all([
    db.usageRecord.findUnique({
      where: { userId_date: { userId, date: startOfToday() } },
    }),
    db.media.aggregate({
      where: { userId, status: { not: "FAILED" } },
      _sum: { sizeBytes: true },
    }),
    db.processingJob.count({
      where: { media: { userId }, status: { in: ["QUEUED", "ACTIVE"] } },
    }),
  ]);

  const uploadsToday = usageRecord?.uploadsCount ?? 0;
  const storageBytesUsed = storageAgg._sum.sizeBytes ?? BigInt(0);
  const { plan } = subscription;

  return {
    plan,
    status: subscription.status,
    isTrialExpired,
    trialDaysRemaining,
    hasAccess,
    usage: { uploadsToday, storageBytesUsed, activeJobs },
    remaining: {
      uploadsToday:
        plan.maxUploadsPerDay === null
          ? null
          : Math.max(0, plan.maxUploadsPerDay - uploadsToday),
      storageBytes:
        plan.maxStorageBytes - storageBytesUsed > BigInt(0)
          ? plan.maxStorageBytes - storageBytesUsed
          : BigInt(0),
      simultaneousJobs: Math.max(0, plan.maxSimultaneousJobs - activeJobs),
    },
  };
}

export interface EntitlementCheck {
  allowed: boolean;
  reason?: string;
}

export async function canUpload(
  userId: string,
  sizeBytes: bigint,
): Promise<EntitlementCheck> {
  const e = await getEntitlements(userId);

  if (!e.hasAccess) {
    return {
      allowed: false,
      reason: e.isTrialExpired
        ? "Your trial has ended. Upgrade to keep uploading."
        : "Your subscription isn't active. Upgrade to keep uploading.",
    };
  }
  if (e.remaining.uploadsToday !== null && e.remaining.uploadsToday <= 0) {
    return {
      allowed: false,
      reason: `You've reached today's upload limit (${e.plan.maxUploadsPerDay}).`,
    };
  }
  if (sizeBytes > e.remaining.storageBytes) {
    return { allowed: false, reason: "This file would exceed your storage quota." };
  }
  return { allowed: true };
}

export async function canStartProcessingJob(userId: string): Promise<EntitlementCheck> {
  const e = await getEntitlements(userId);
  if (!e.hasAccess) {
    return { allowed: false, reason: "Your subscription isn't active." };
  }
  if (e.remaining.simultaneousJobs <= 0) {
    return {
      allowed: false,
      reason: `You've reached your plan's limit of ${e.plan.maxSimultaneousJobs} simultaneous job(s).`,
    };
  }
  return { allowed: true };
}
