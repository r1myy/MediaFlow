import "server-only";

import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { enqueueEmail } from "@/lib/email/enqueue";
import { env } from "@/lib/env";
import { AuthError } from "@/modules/auth/errors";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import { provisionNewUser } from "@/modules/auth/provisioning";
import {
  consumeBackupCode,
  generateBackupCodes,
  generateTwoFactorSetup,
  hashBackupCodes,
  verifyTotpCode,
} from "@/modules/auth/two-factor";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function randomTokenString() {
  return randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Registration & email verification
// ---------------------------------------------------------------------------

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  referralCode?: string | null;
}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AuthError("EMAIL_TAKEN", "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  await provisionNewUser(user.id, input.referralCode);
  await sendVerificationEmail(user.id);

  return user;
}

export async function sendVerificationEmail(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerified) {
    throw new AuthError("ALREADY_VERIFIED", "This email is already verified.");
  }

  await db.verificationToken.deleteMany({ where: { identifier: user.email } });
  const token = randomTokenString();
  await db.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  await enqueueEmail({
    type: "verify-email",
    to: user.email,
    data: { verifyUrl: `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}` },
  });
}

export async function verifyEmailToken(token: string) {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    throw new AuthError(
      "INVALID_OR_EXPIRED_TOKEN",
      "This verification link is invalid or has expired.",
    );
  }

  const user = await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });
  await db.verificationToken.deleteMany({ where: { identifier: record.identifier } });

  return user;
}

// ---------------------------------------------------------------------------
// Password authentication
// ---------------------------------------------------------------------------

export async function authenticateWithPassword(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  if (user.status === "SUSPENDED") {
    throw new AuthError("ACCOUNT_SUSPENDED", "This account has been suspended.");
  }
  if (user.status === "BANNED") {
    throw new AuthError("ACCOUNT_BANNED", "This account has been banned.");
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return user;
}

// ---------------------------------------------------------------------------
// Password reset & change
// ---------------------------------------------------------------------------

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  // Deliberately silent on unknown emails — caller always shows a generic
  // "check your email" message to avoid leaking which emails have accounts.
  if (!user) return;

  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = randomTokenString();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  await enqueueEmail({
    type: "reset-password",
    to: user.email,
    data: { resetUrl: `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}` },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AuthError(
      "INVALID_OR_EXPIRED_TOKEN",
      "This reset link is invalid or has expired.",
    );
  }

  const passwordHash = await hashPassword(newPassword);
  const user = await db.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });
  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  // Force re-authentication everywhere — the old password may have been compromised.
  await db.session.deleteMany({ where: { userId: user.id } });

  await enqueueEmail({ type: "password-changed", to: user.email, data: {} });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.passwordHash) {
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AuthError(
        "INVALID_CURRENT_PASSWORD",
        "Your current password is incorrect.",
      );
    }
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  // Signs the user out everywhere, including the current device — the
  // caller (action layer) re-establishes a session for the current request.
  await db.session.deleteMany({ where: { userId } });

  await enqueueEmail({ type: "password-changed", to: user.email, data: {} });
}

// ---------------------------------------------------------------------------
// Two-factor authentication
// ---------------------------------------------------------------------------

export async function startTwoFactorSetup(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.twoFactorEnabled) {
    throw new AuthError(
      "TWO_FACTOR_ALREADY_ENABLED",
      "Two-factor authentication is already enabled.",
    );
  }

  const { secret, qrCodeDataUrl } = await generateTwoFactorSetup(user.email);
  // Stored pre-confirmation; twoFactorEnabled stays false until confirmed.
  await db.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encrypt(secret) },
  });

  return { secret, qrCodeDataUrl };
}

export async function confirmTwoFactorSetup(userId: string, code: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.twoFactorSecret) {
    throw new AuthError(
      "TWO_FACTOR_NOT_PENDING",
      "Start two-factor setup before confirming it.",
    );
  }

  const secret = decrypt(user.twoFactorSecret);
  if (!(await verifyTotpCode(secret, code))) {
    throw new AuthError("INVALID_CODE", "That code didn't match. Try again.");
  }

  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await hashBackupCodes(backupCodes);

  await db.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true, twoFactorRecoveryCodes: hashedBackupCodes },
  });

  return { backupCodes };
}

export async function disableTwoFactor(userId: string, code: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return;
  }

  const secret = decrypt(user.twoFactorSecret);
  const validTotp = await verifyTotpCode(secret, code);
  const validBackup = validTotp
    ? null
    : await consumeBackupCode(code, user.twoFactorRecoveryCodes);

  if (!validTotp && !validBackup) {
    throw new AuthError("INVALID_CODE", "That code didn't match.");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: [],
    },
  });
}

/** Used at login time, once the password has already been verified. */
export async function verifyTwoFactorLogin(userId: string, code: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return user;
  }

  const secret = decrypt(user.twoFactorSecret);
  if (await verifyTotpCode(secret, code)) {
    return user;
  }

  const remaining = await consumeBackupCode(code, user.twoFactorRecoveryCodes);
  if (remaining) {
    await db.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: remaining },
    });
    return user;
  }

  throw new AuthError("INVALID_CODE", "That code didn't match.");
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export async function listDevices(userId: string) {
  return db.device.findMany({
    where: { userId },
    include: { _count: { select: { sessions: true } } },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function revokeDevice(userId: string, deviceId: string) {
  const device = await db.device.findFirst({ where: { id: deviceId, userId } });
  if (!device) {
    throw new AuthError("DEVICE_NOT_FOUND", "Device not found.");
  }
  await db.session.deleteMany({ where: { deviceId } });
  await db.device.delete({ where: { id: deviceId } });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfile(userId: string, name: string) {
  return db.user.update({ where: { id: userId }, data: { name } });
}
