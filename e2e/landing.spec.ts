import { expect, test } from "@playwright/test";

test("landing page renders hero and pricing", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /finally organized/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /start your 7-day free trial/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /simple, transparent pricing/i }),
  ).toBeVisible();
});
