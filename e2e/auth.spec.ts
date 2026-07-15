import { PrismaClient } from "@prisma/client";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { TOTP } from "@otplib/totp";
import { expect, test } from "@playwright/test";

// Playwright specs run in Node, so — unlike the browser page under test —
// they can talk to Postgres directly. Used only to read back tokens that a
// real user would get via email (no email sink in this environment).
const db = new PrismaClient();

test.afterAll(async () => {
  await db.$disconnect();
});

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("registration & login", () => {
  test("registers, lands on the dashboard, logs out, and logs back in", async ({
    page,
  }) => {
    const email = uniqueEmail("register");

    await page.goto("/register");
    await page.fill("#name", "E2E Test User");
    await page.fill("#email", email);
    await page.fill("#password", "SuperSecret123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");

    await expect(
      page.getByText("Verify your email to secure your account."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login");

    await page.fill("#email", email);
    await page.fill("#password", "SuperSecret123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("**/dashboard");
  });

  test("rejects an incorrect password", async ({ page }) => {
    const email = uniqueEmail("badpw");

    await page.goto("/register");
    await page.fill("#name", "Bad Password User");
    await page.fill("#email", email);
    await page.fill("#password", "CorrectPass123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login");

    await page.fill("#email", email);
    await page.fill("#password", "WrongPassword123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });
});

test.describe("route protection", () => {
  test("redirects unauthenticated users away from protected routes", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**");

    await page.goto("/admin");
    await page.waitForURL("**/login**");
  });

  test("redirects a non-admin user away from /admin", async ({ page }) => {
    const email = uniqueEmail("rbac");
    await page.goto("/register");
    await page.fill("#name", "RBAC User");
    await page.fill("#email", email);
    await page.fill("#password", "RbacPass123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/admin");
    await page.waitForURL("**/dashboard");
  });
});

test.describe("password reset", () => {
  test("resets a forgotten password end-to-end", async ({ page }) => {
    const email = uniqueEmail("reset");

    await page.goto("/register");
    await page.fill("#name", "Reset User");
    await page.fill("#email", email);
    await page.fill("#password", "OldPassword123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login");

    await page.goto("/forgot-password");
    await page.fill("#email", email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/)).toBeVisible();

    const resetToken = await db.passwordResetToken.findFirstOrThrow({
      where: { user: { email } },
      orderBy: { createdAt: "desc" },
    });

    await page.goto(`/reset-password?token=${resetToken.token}`);
    await page.fill("#password", "BrandNewPassword456");
    await page.getByRole("button", { name: "Reset password" }).click();
    await page.waitForURL("**/login?reset=success");

    await page.fill("#email", email);
    await page.fill("#password", "BrandNewPassword456");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("**/dashboard");
  });
});

test.describe("two-factor authentication", () => {
  test("enables 2FA and requires it on next login", async ({ page }) => {
    const email = uniqueEmail("2fa");

    await page.goto("/register");
    await page.fill("#name", "2FA User");
    await page.fill("#email", email);
    await page.fill("#password", "SuperSecret123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/dashboard/settings/security");
    await page
      .getByRole("button", { name: "Enable two-factor authentication" })
      .click();
    await page.waitForSelector("code");
    const secret = await page.textContent("code");

    const totp = new TOTP({
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const code = await totp.generate({ secret: secret! });

    await page.fill("#confirm-code", code);
    await page.getByRole("button", { name: "Confirm & enable" }).click();
    await expect(page.getByText(/Save these backup codes/)).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login");

    await page.fill("#email", email);
    await page.fill("#password", "SuperSecret123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Two-factor authentication")).toBeVisible();

    const loginCode = await totp.generate({ secret: secret! });
    await page.fill("#code", loginCode);
    await page.getByRole("button", { name: "Verify" }).click();
    await page.waitForURL("**/dashboard");
  });
});
