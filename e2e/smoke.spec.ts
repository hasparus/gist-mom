import { test, expect, MANIFESTO_PATH } from "./fixtures";

test("root loads editor", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=gist.mom").first()).toBeVisible();
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
});

test("sign in button visible when unauthenticated", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Sign in" })
  ).toBeVisible();
});

test("direct gist URL loads editor", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  await expect(
    page.locator("a", { hasText: "hasparus/a8390723" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
});

test("navbar logo links home", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  await page.locator("a", { hasText: "gist.mom" }).click();
  await expect(page).toHaveURL("/");
});
