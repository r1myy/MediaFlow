import { Worker } from "bullmq";

import { queueConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES } from "@/lib/queue/queues";

/**
 * Placeholder worker — full media processing pipeline (transcode, thumbnail,
 * AI tagging) lands in Phase 5 (Media Engine).
 */
const worker = new Worker(
  QUEUE_NAMES.mediaProcessing,
  async (job) => {
    console.log(`[media-processing] received job ${job.id}: ${job.name}`);
  },
  { connection: queueConnection, concurrency: 4 },
);

worker.on("completed", (job) => {
  console.log(`[media-processing] completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[media-processing] job ${job?.id} failed:`, err);
});

console.log("MediaFlow media-processing worker started.");
