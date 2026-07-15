import Redis from "ioredis";

import { env } from "@/lib/env";

/**
 * BullMQ requires its own Redis connection (maxRetriesPerRequest: null)
 * separate from the general-purpose cache client in `@/lib/redis`.
 */
export const queueConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
