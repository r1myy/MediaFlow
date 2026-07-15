import { Resend } from "resend";

import { env } from "@/lib/env";

// The Resend constructor throws synchronously if given a falsy key, which
// would crash the email worker on boot in any environment without
// RESEND_API_KEY configured (e.g. local dev). Fall back to a placeholder —
// the worker checks `env.RESEND_API_KEY` itself before ever calling
// `.send()`, so this key is never actually used.
export const resend = new Resend(env.RESEND_API_KEY || "re_not_configured");
