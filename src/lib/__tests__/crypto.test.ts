// @vitest-environment node
import { describe, expect, it } from "vitest";

import { decrypt, encrypt, randomToken } from "@/lib/crypto";

describe("crypto", () => {
  it("round-trips a plaintext string", () => {
    const ciphertext = encrypt("hello world");
    expect(ciphertext).not.toContain("hello world");
    expect(decrypt(ciphertext)).toBe("hello world");
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects a tampered payload", () => {
    const ciphertext = encrypt("hello world");
    const tampered = ciphertext.slice(0, -4) + "abcd";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("generates unique random tokens", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toHaveLength(64);
  });
});
