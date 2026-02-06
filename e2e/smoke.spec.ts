import { test, expect, TEST_GIST_PATH } from "./fixtures";

test("gist loads editor", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator("text=gist.mom").first()).toBeVisible();
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
});

test("sign in button visible when unauthenticated", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(
    page.getByRole("button", { name: "Sign in" })
  ).toBeVisible();
});

test("gist URL shows breadcrumb and preview button", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(
    page.locator("a", { hasText: "hasparus/198cfd97" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview" }).first()).toBeVisible();
});

test("navbar logo links home", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await page.locator("a", { hasText: "gist.mom" }).click();
  await expect(page).toHaveURL("/");
});
