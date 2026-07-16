// @vitest-environment node
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/webhooks/stripe/route";

describe("POST /api/webhooks/stripe", () => {
  it("rejects when STRIPE_WEBHOOK_SECRET isn't configured (this environment has none)", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ type: "customer.subscription.updated" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/not configured/i);
  });
});
