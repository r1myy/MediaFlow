// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";

import { redis } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  afterAll(async () => {
    await redis.quit();
  });

  it("allows requests under the limit and blocks over it", async () => {
    const key = `test-${Date.now()}`;

    const first = await rateLimit(key, 3, 60);
    expect(first).toEqual({
      success: true,
      remaining: 2,
      resetInSeconds: expect.any(Number),
    });

    await rateLimit(key, 3, 60);
    const third = await rateLimit(key, 3, 60);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await rateLimit(key, 3, 60);
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("tracks independent keys separately", async () => {
    const a = await rateLimit(`a-${Date.now()}`, 1, 60);
    const b = await rateLimit(`b-${Date.now()}`, 1, 60);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });
});
