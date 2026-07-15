// @vitest-environment node
import { Prisma } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";

/**
 * Exercises the schema against a real Postgres instance (see
 * docker-compose.dev.yml / CI's `unit-tests` service) rather than just
 * checking that `prisma validate` accepts it.
 */
describe("prisma schema", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await db.$disconnect();
  });

  it("seeded the four subscription plans", async () => {
    const plans = await db.plan.findMany({ orderBy: { sortOrder: "asc" } });
    expect(plans.map((p) => p.slug)).toEqual(["trial", "basic", "premium", "business"]);
  });

  it("creates a user with a subscription to a plan and reads it back through the relation", async () => {
    const trial = await db.plan.findUniqueOrThrow({ where: { slug: "trial" } });

    const user = await db.user.create({
      data: {
        email: `schema-test-${Date.now()}@example.com`,
        subscription: {
          create: {
            planId: trial.id,
            status: "TRIALING",
            trialStart: new Date(),
            trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: { subscription: { include: { plan: true } } },
    });
    createdUserIds.push(user.id);

    expect(user.subscription?.plan.slug).toBe("trial");
    expect(user.subscription?.status).toBe("TRIALING");
  });

  it("cascades: deleting a user deletes their folders", async () => {
    const user = await db.user.create({
      data: {
        email: `schema-test-cascade-${Date.now()}@example.com`,
        folders: { create: { name: "My folder" } },
      },
      include: { folders: true },
    });

    const folderId = user.folders[0]!.id;
    await db.user.delete({ where: { id: user.id } });

    const folder = await db.folder.findUnique({ where: { id: folderId } });
    expect(folder).toBeNull();
  });

  it("enforces the (userId, parentId, name) unique constraint on folders", async () => {
    const user = await db.user.create({
      data: { email: `schema-test-unique-${Date.now()}@example.com` },
    });
    createdUserIds.push(user.id);

    await db.folder.create({ data: { userId: user.id, name: "Movies" } });

    await expect(
      db.folder.create({ data: { userId: user.id, name: "Movies" } }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });
});
