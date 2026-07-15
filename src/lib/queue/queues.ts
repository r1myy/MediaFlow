import { Queue } from "bullmq";

import { queueConnection } from "@/lib/queue/connection";

export const QUEUE_NAMES = {
  mediaProcessing: "media-processing",
  emails: "emails",
  aiTagging: "ai-tagging",
} as const;

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5_000 } as const,
  removeOnComplete: { age: 60 * 60 * 24 }, // 24h
  removeOnFail: { age: 60 * 60 * 24 * 7 }, // 7d
};

export const mediaProcessingQueue = new Queue(QUEUE_NAMES.mediaProcessing, {
  connection: queueConnection,
  defaultJobOptions,
});

export const emailQueue = new Queue(QUEUE_NAMES.emails, {
  connection: queueConnection,
  defaultJobOptions: { ...defaultJobOptions, attempts: 5 },
});

export const aiTaggingQueue = new Queue(QUEUE_NAMES.aiTagging, {
  connection: queueConnection,
  defaultJobOptions,
});
