import "server-only";

import { emailQueue } from "@/lib/queue/queues";
import type { EmailJob } from "@/lib/email/jobs";

export async function enqueueEmail(job: EmailJob) {
  await emailQueue.add(job.type, job);
}
