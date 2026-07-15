import "server-only";

import { randomUUID } from "@/lib/crypto";
import { redis } from "@/lib/redis";

const TTL_SECONDS = 5 * 60;

function key(challengeId: string) {
  return `2fa-challenge:${challengeId}`;
}

/** Short-lived proof that a user has already passed the password step. */
export async function createTwoFactorChallenge(userId: string): Promise<string> {
  const challengeId = randomUUID();
  await redis.set(key(challengeId), userId, "EX", TTL_SECONDS);
  return challengeId;
}

export async function resolveTwoFactorChallenge(
  challengeId: string,
): Promise<string | null> {
  return redis.get(key(challengeId));
}

export async function clearTwoFactorChallenge(challengeId: string): Promise<void> {
  await redis.del(key(challengeId));
}
