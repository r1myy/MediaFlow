import { expect, test } from "@playwright/test";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("billing", () => {
  test("shows trial usage and plan cards, and degrades gracefully without Stripe configured", async ({
    page,
  }) => {
    const email = uniqueEmail("billing");

    await page.goto("/register");
    await page.fill("#name", "Billing User");
    await page.fill("#email", email);
    await page.fill("#password", "SuperSecret123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/dashboard/billing");
    await expect(page.getByText("Trial plan")).toBeVisible();
    await expect(page.getByText(/day\(s\) left in trial/)).toBeVisible();
    await expect(page.getByText("Uploads today")).toBeVisible();
    await expect(page.getByText("Basic", { exact: true })).toBeVisible();
    await expect(page.getByText("Premium", { exact: true })).toBeVisible();
    await expect(page.getByText("Business", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Upgrade" }).first().click();
    await expect(page.getByText(/aren't configured/)).toBeVisible();
  });

  test("redirects unauthenticated users away from billing", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForURL("**/login**");
  });
});
