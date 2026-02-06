import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth-state.json" });

test("user menu dropdown works", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-slot='dropdown-menu-trigger']").click();
  await expect(page.locator("text=Sign out")).toBeVisible();
});

test("editor loads manifesto at root", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".cm-content")).toContainText("Gist Mom", {
    timeout: 10000,
  });
});

test("preview split view", async ({ page }) => {
  await page.goto("/hasparus/a8390723cd893a21db00beba580fca36");
  await expect(page.locator(".cm-content")).toContainText("Gist Mom", {
    timeout: 10000,
  });
  await page.locator("button", { hasText: "Preview" }).click();
  await expect(page.locator(".preview")).toContainText("How to use it", {
    timeout: 5000,
  });
  await expect(page.locator(".cm-content")).toBeVisible();
  await page.locator("button", { hasText: "Preview" }).click();
  await expect(page.locator(".preview")).not.toBeVisible();
});

test("commit button visible", async ({ page }) => {
  await page.goto("/hasparus/a8390723cd893a21db00beba580fca36");
  await expect(
    page.locator("button", { hasText: "Commit" })
  ).toBeVisible({ timeout: 10000 });
});
