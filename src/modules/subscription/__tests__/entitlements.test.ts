// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import {
  canStartProcessingJob,
  canUpload,
  getEntitlements,
  isQualityAllowed,
} from "@/modules/subscription/entitlements";

const createdUserIds: string[] = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await db.$disconnect();
});

async function createUserWithPlan(
  slug: string,
  overrides: Partial<{ status: "TRIALING" | "ACTIVE"; trialEnd: Date }> = {},
) {
  const plan = await db.plan.findUniqueOrThrow({ where: { slug } });
  const user = await db.user.create({
    data: {
      email: `entitlements-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
      subscription: {
        create: {
          planId: plan.id,
          status: overrides.status ?? "TRIALING",
          trialStart: new Date(),
          trialEnd:
            overrides.trialEnd ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });
  createdUserIds.push(user.id);
  return user;
}

describe("isQualityAllowed", () => {
  it("allows AUDIO_ONLY regardless of plan", () => {
    expect(isQualityAllowed("AUDIO_ONLY", "SD480")).toBe(true);
  });

  it("respects the resolution ladder", () => {
    expect(isQualityAllowed("HD1080", "HD720")).toBe(false);
    expect(isQualityAllowed("HD720", "HD1080")).toBe(true);
    expect(isQualityAllowed("HD1080", "HD1080")).toBe(true);
  });

  it("treats BEST as satisfying any request", () => {
    expect(isQualityAllowed("HD1080", "BEST")).toBe(true);
  });
});

describe("getEntitlements", () => {
  it("reports trial limits and zero usage for a fresh trial user", async () => {
    const user = await createUserWithPlan("trial");
    const e = await getEntitlements(user.id);

    expect(e.plan.slug).toBe("trial");
    expect(e.hasAccess).toBe(true);
    expect(e.isTrialExpired).toBe(false);
    expect(e.trialDaysRemaining).toBe(7);
    expect(e.usage.uploadsToday).toBe(0);
    expect(e.remaining.uploadsToday).toBe(3);
  });

  it("flags an expired trial as no access", async () => {
    const user = await createUserWithPlan("trial", {
      trialEnd: new Date(Date.now() - 1000),
    });
    const e = await getEntitlements(user.id);

    expect(e.isTrialExpired).toBe(true);
    expect(e.hasAccess).toBe(false);
  });

  it("grants unlimited daily uploads for plans with maxUploadsPerDay = null", async () => {
    const user = await createUserWithPlan("premium", { status: "ACTIVE" });
    const e = await getEntitlements(user.id);

    expect(e.remaining.uploadsToday).toBeNull();
  });

  it("counts today's usage record against the daily limit", async () => {
    const user = await createUserWithPlan("trial");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await db.usageRecord.create({
      data: { userId: user.id, date: today, uploadsCount: 2 },
    });

    const e = await getEntitlements(user.id);
    expect(e.usage.uploadsToday).toBe(2);
    expect(e.remaining.uploadsToday).toBe(1);
  });

  it("sums media size toward the storage quota", async () => {
    const user = await createUserWithPlan("trial");
    await db.media.create({
      data: {
        userId: user.id,
        type: "VIDEO",
        status: "READY",
        title: "test",
        originalFileName: "test.mp4",
        mimeType: "video/mp4",
        storageKey: "k1",
        sizeBytes: BigInt(500_000_000), // 500MB, half the 1GB trial quota
      },
    });

    const e = await getEntitlements(user.id);
    expect(e.usage.storageBytesUsed).toBe(BigInt(500_000_000));
    expect(e.remaining.storageBytes).toBe(BigInt(1024 * 1024 * 1024 - 500_000_000));
  });

  it("counts only QUEUED/ACTIVE jobs toward the simultaneous-jobs limit", async () => {
    const user = await createUserWithPlan("trial");
    const media = await db.media.create({
      data: {
        userId: user.id,
        type: "VIDEO",
        status: "PROCESSING",
        title: "test",
        originalFileName: "test.mp4",
        mimeType: "video/mp4",
        storageKey: "k2",
        sizeBytes: BigInt(1000),
      },
    });
    await db.processingJob.createMany({
      data: [
        { mediaId: media.id, queueName: "media-processing", status: "ACTIVE" },
        { mediaId: media.id, queueName: "media-processing", status: "COMPLETED" },
      ],
    });

    const e = await getEntitlements(user.id);
    expect(e.usage.activeJobs).toBe(1);
  });
});

describe("canUpload", () => {
  it("denies uploads once the daily quota is exhausted", async () => {
    const user = await createUserWithPlan("trial");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await db.usageRecord.create({
      data: { userId: user.id, date: today, uploadsCount: 3 },
    });

    const result = await canUpload(user.id, BigInt(1000));
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/upload limit/);
  });

  it("denies uploads that would exceed storage quota", async () => {
    const user = await createUserWithPlan("trial");
    const result = await canUpload(user.id, BigInt(2 * 1024 * 1024 * 1024)); // 2GB > 1GB trial quota
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/storage quota/);
  });

  it("denies uploads for an expired trial", async () => {
    const user = await createUserWithPlan("trial", {
      trialEnd: new Date(Date.now() - 1000),
    });
    const result = await canUpload(user.id, BigInt(1000));
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/trial has ended/);
  });

  it("allows a reasonable upload for an active trial", async () => {
    const user = await createUserWithPlan("trial");
    const result = await canUpload(user.id, BigInt(1000));
    expect(result.allowed).toBe(true);
  });
});

describe("canStartProcessingJob", () => {
  it("denies starting a job once the simultaneous-job limit is reached", async () => {
    const user = await createUserWithPlan("trial"); // maxSimultaneousJobs = 1
    const media = await db.media.create({
      data: {
        userId: user.id,
        type: "VIDEO",
        status: "PROCESSING",
        title: "test",
        originalFileName: "test.mp4",
        mimeType: "video/mp4",
        storageKey: "k3",
        sizeBytes: BigInt(1000),
      },
    });
    await db.processingJob.create({
      data: { mediaId: media.id, queueName: "media-processing", status: "ACTIVE" },
    });

    const result = await canStartProcessingJob(user.id);
    expect(result.allowed).toBe(false);
  });
});
