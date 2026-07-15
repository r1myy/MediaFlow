// @vitest-environment node
import { describe, expect, it } from "vitest";

import { hashPassword, passwordSchema, verifyPassword } from "@/modules/auth/password";

describe("password hashing", () => {
  it("round-trips a password through hash/verify", async () => {
    const hash = await hashPassword("SuperSecret123");
    expect(hash).not.toBe("SuperSecret123");
    expect(await verifyPassword("SuperSecret123", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123", hash)).toBe(false);
  });
});

describe("passwordSchema", () => {
  it.each([
    ["short1A", false, "too short"],
    ["alllowercase123", false, "no uppercase"],
    ["ALLUPPERCASE123", false, "no lowercase"],
    ["NoNumbersHere", false, "no digit"],
    ["ValidPassword123", true, "valid"],
  ])("%s -> valid=%s (%s)", (value, expected) => {
    expect(passwordSchema.safeParse(value).success).toBe(expected);
  });
});
