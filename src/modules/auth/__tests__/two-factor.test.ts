// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  consumeBackupCode,
  generateBackupCodes,
  generateTwoFactorSetup,
  hashBackupCodes,
  verifyTotpCode,
} from "@/modules/auth/two-factor";

describe("TOTP setup", () => {
  it("generates a secret, otpauth URL, and matching valid/invalid codes", async () => {
    const { TOTP } = await import("@otplib/totp");
    const { NobleCryptoPlugin } = await import("@otplib/plugin-crypto-noble");
    const { ScureBase32Plugin } = await import("@otplib/plugin-base32-scure");

    const setup = await generateTwoFactorSetup("user@example.com");
    expect(setup.otpauthUrl).toContain("otpauth://totp/");
    expect(setup.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);

    const totp = new TOTP({
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const validCode = await totp.generate({ secret: setup.secret });

    expect(await verifyTotpCode(setup.secret, validCode)).toBe(true);
    expect(await verifyTotpCode(setup.secret, "000000")).toBe(false);
  });
});

describe("backup codes", () => {
  it("generates 10 unique codes and can consume one", async () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);

    const hashed = await hashBackupCodes(codes);
    const remaining = await consumeBackupCode(codes[3]!, hashed);

    expect(remaining).not.toBeNull();
    expect(remaining).toHaveLength(9);
    // The consumed code no longer works a second time.
    expect(await consumeBackupCode(codes[3]!, remaining!)).toBeNull();
  });

  it("returns null for an unknown code", async () => {
    const hashed = await hashBackupCodes(generateBackupCodes());
    expect(await consumeBackupCode("not-a-real-code", hashed)).toBeNull();
  });
});
