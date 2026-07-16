import { render } from "@react-email/render";
import { Worker } from "bullmq";
import * as React from "react";

import { env } from "@/lib/env";
import { resend } from "@/lib/email/resend";
import { queueConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES } from "@/lib/queue/queues";
import type { EmailJob } from "@/lib/email/jobs";
import PasswordChangedEmail from "@/emails/password-changed";
import PaymentFailedEmail from "@/emails/payment-failed";
import ResetPasswordEmail from "@/emails/reset-password";
import SubscriptionCanceledEmail from "@/emails/subscription-canceled";
import SubscriptionUpdatedEmail from "@/emails/subscription-updated";
import VerifyEmail from "@/emails/verify-email";
import WelcomeEmail from "@/emails/welcome";

const appUrl = env.NEXT_PUBLIC_APP_URL;

async function renderJob(job: EmailJob): Promise<{ subject: string; html: string }> {
  switch (job.type) {
    case "welcome":
      return {
        subject: "Welcome to MediaFlow",
        html: await render(
          React.createElement(WelcomeEmail, { name: job.data.name, appUrl }),
        ),
      };
    case "verify-email":
      return {
        subject: "Verify your MediaFlow email",
        html: await render(
          React.createElement(VerifyEmail, { verifyUrl: job.data.verifyUrl }),
        ),
      };
    case "reset-password":
      return {
        subject: "Reset your MediaFlow password",
        html: await render(
          React.createElement(ResetPasswordEmail, { resetUrl: job.data.resetUrl }),
        ),
      };
    case "password-changed":
      return {
        subject: "Your MediaFlow password was changed",
        html: await render(React.createElement(PasswordChangedEmail)),
      };
    case "subscription-updated":
      return {
        subject: `You're now on the ${job.data.planName} plan`,
        html: await render(
          React.createElement(SubscriptionUpdatedEmail, {
            planName: job.data.planName,
            appUrl,
          }),
        ),
      };
    case "subscription-canceled":
      return {
        subject: "Your MediaFlow subscription was canceled",
        html: await render(React.createElement(SubscriptionCanceledEmail, { appUrl })),
      };
    case "payment-failed":
      return {
        subject: "Your MediaFlow payment failed",
        html: await render(React.createElement(PaymentFailedEmail, { appUrl })),
      };
  }
}

const worker = new Worker<EmailJob>(
  QUEUE_NAMES.emails,
  async (job) => {
    const { subject, html } = await renderJob(job.data);

    if (!env.RESEND_API_KEY) {
      console.warn(
        `[email] RESEND_API_KEY not set — skipping send of "${subject}" to ${job.data.to}`,
      );
      return;
    }

    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: job.data.to,
      subject,
      html,
    });
    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  },
  { connection: queueConnection, concurrency: 5 },
);

worker.on("completed", (job) => {
  console.log(`[email] sent "${job.data.type}" to ${job.data.to}`);
});

worker.on("failed", (job, err) => {
  console.error(`[email] job ${job?.id} (${job?.data.type}) failed:`, err);
});

console.log("MediaFlow email worker started.");
