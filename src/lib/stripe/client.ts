import Stripe from "stripe";

import { env } from "@/lib/env";

// The Stripe constructor throws synchronously on a falsy key, which would
// crash any route that imports it (even indirectly) in an environment
// without STRIPE_SECRET_KEY configured. Real usage is guarded by
// isStripeConfigured()/assertStripeConfigured() in
// src/modules/subscription/stripe-sync.ts, so this placeholder is never
// actually used to call the API.
export const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_not_configured", {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});
