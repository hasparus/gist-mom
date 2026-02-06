import { test, expect } from "@playwright/test";

test("root loads manifesto gist in editor", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=gist.mom").first()).toBeVisible();
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".cm-content")).toContainText("Gist Mom", {
    timeout: 10000,
  });
});

test("sign in button visible", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator("button", { hasText: "Sign in" }).first()
  ).toBeVisible();
});

test("direct gist URL loads editor", async ({ page }) => {
  await page.goto("/hasparus/a8390723cd893a21db00beba580fca36");
  await expect(page.locator("nav a", { hasText: "hasparus/a8390723" })).toBeVisible();
  await expect(
    page.locator("button", { hasText: "Preview" })
  ).toBeVisible();
});

test("navbar logo links home", async ({ page }) => {
  await page.goto("/hasparus/a8390723cd893a21db00beba580fca36");
  await page.locator("a", { hasText: "gist.mom" }).click();
  await expect(page).toHaveURL("/");
});
