export type EmailJob =
  | { type: "welcome"; to: string; data: { name: string } }
  | { type: "verify-email"; to: string; data: { verifyUrl: string } }
  | { type: "reset-password"; to: string; data: { resetUrl: string } }
  | { type: "password-changed"; to: string; data: Record<string, never> }
  | { type: "subscription-updated"; to: string; data: { planName: string } }
  | { type: "subscription-canceled"; to: string; data: Record<string, never> }
  | { type: "payment-failed"; to: string; data: Record<string, never> };
