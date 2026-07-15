import { redis } from "@/lib/redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Fixed-window rate limiter backed by Redis. Callers key by whatever scope
 * makes sense (IP, IP+email, userId, ...) — e.g. `login:${ip}`.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  const ttl = await redis.ttl(redisKey);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    resetInSeconds: ttl > 0 ? ttl : windowSeconds,
  };
}
