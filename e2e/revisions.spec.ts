import { test, expect, TEST_GIST_PATH } from "./fixtures";

test("revisions popover opens and shows commit history", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: /Revisions/ }).click();
  await expect(page.getByText("Commit History")).toBeVisible({
    timeout: 10_000,
  });
});

test("revisions popover shows commit count after load", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const btn = page.getByRole("button", { name: /Revisions/ });
  await btn.click();
  await expect(btn).toHaveText(/\d+ Revisions/, { timeout: 10_000 });
});
