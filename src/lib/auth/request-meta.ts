import { headers } from "next/headers";

export interface RequestMeta {
  ip: string;
  userAgent: string | null;
}

/** Best-effort client IP/UA extraction for rate limiting and device tracking. */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return { ip, userAgent: h.get("user-agent") };
}
