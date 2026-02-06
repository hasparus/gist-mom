import { test, expect } from "./fixtures";

test("footer shows attribution and GitHub stars link", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const footer = page.locator("footer");
  await expect(footer).toBeVisible();
  await expect(footer.getByText("built by")).toBeVisible();
  await expect(
    footer.locator("a[href='https://x.com/hasparus']")
  ).toBeVisible();
  await expect(
    footer.locator("a[href='https://github.com/hasparus/gist-mom']")
  ).toBeVisible();
  await expect(footer.getByText("stars on GitHub")).toBeVisible();
});
