export type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "INVALID_OR_EXPIRED_TOKEN"
  | "ALREADY_VERIFIED"
  | "INVALID_CURRENT_PASSWORD"
  | "INVALID_CODE"
  | "TWO_FACTOR_NOT_PENDING"
  | "TWO_FACTOR_ALREADY_ENABLED"
  | "DEVICE_NOT_FOUND"
  | "RATE_LIMITED";

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}
