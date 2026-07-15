import "server-only";

import { randomBytes } from "crypto";

import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { TOTP, verify as verifyTotp } from "@otplib/totp";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

const ISSUER = "MediaFlow";
const BACKUP_CODE_COUNT = 10;

const cryptoPlugin = new NobleCryptoPlugin();
const base32Plugin = new ScureBase32Plugin();

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export async function generateTwoFactorSetup(email: string): Promise<TwoFactorSetup> {
  const totp = new TOTP({
    issuer: ISSUER,
    label: email,
    crypto: cryptoPlugin,
    base32: base32Plugin,
  });
  const secret = totp.generateSecret();
  const otpauthUrl = totp.toURI({ secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, otpauthUrl, qrCodeDataUrl };
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  try {
    const result = await verifyTotp({
      secret,
      token: code.trim().replace(/\s/g, ""),
      crypto: cryptoPlugin,
      base32: base32Plugin,
      epochTolerance: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
}

function generateBackupCode(): string {
  // e.g. "8f2a-91cd" — short enough to type, long enough to resist guessing
  // across 10 codes (40 bits of entropy per code).
  return randomBytes(5)
    .toString("hex")
    .match(/.{1,4}/g)!
    .join("-");
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

/** Returns the remaining hashed codes with the matched one removed, or null if no match. */
export async function consumeBackupCode(
  code: string,
  hashedCodes: string[],
): Promise<string[] | null> {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(code.trim(), hashedCodes[i]!)) {
      return [...hashedCodes.slice(0, i), ...hashedCodes.slice(i + 1)];
    }
  }
  return null;
}
