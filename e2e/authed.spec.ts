import { authedTest as test, expect, TEST_GIST_PATH } from "./fixtures";

test("user menu dropdown works", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await page.locator("[data-slot='dropdown-menu-trigger']").click();
  await expect(page.getByText("Sign out")).toBeVisible();
});

test("editor loads for gist", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
});

test("preview toggle", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Preview" }).first().click();
  await expect(page.locator(".preview")).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Preview" }).first().click();
  await expect(page.locator(".preview")).not.toBeVisible();
});

test("save button visible when authenticated", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(
    page.getByRole("button", { name: "Save" })
  ).toBeVisible({ timeout: 15_000 });
});
