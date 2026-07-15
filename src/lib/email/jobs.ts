export type EmailJob =
  | { type: "welcome"; to: string; data: { name: string } }
  | { type: "verify-email"; to: string; data: { verifyUrl: string } }
  | { type: "reset-password"; to: string; data: { resetUrl: string } }
  | { type: "password-changed"; to: string; data: Record<string, never> };
