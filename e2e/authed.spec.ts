import { authedTest as test, expect, MANIFESTO_PATH } from "./fixtures";

test("user menu dropdown works", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-slot='dropdown-menu-trigger']").click();
  await expect(page.getByText("Sign out")).toBeVisible();
});

test("editor loads at root", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
});

test("preview split view", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.locator(".preview")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".cm-content")).toBeVisible();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.locator(".preview")).not.toBeVisible();
});

test("save button visible when authenticated", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  await expect(
    page.getByRole("button", { name: "Save" })
  ).toBeVisible({ timeout: 15_000 });
});
