export type SubscriptionErrorCode =
  | "STRIPE_NOT_CONFIGURED"
  | "INVALID_PLAN"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "ALREADY_ON_PLAN"
  | "STRIPE_ERROR";

export class SubscriptionError extends Error {
  code: SubscriptionErrorCode;

  constructor(code: SubscriptionErrorCode, message: string) {
    super(message);
    this.name = "SubscriptionError";
    this.code = code;
  }
}
