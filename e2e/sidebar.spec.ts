import { authedTest as test, expect, TEST_GIST_PATH } from "./fixtures";

test("sidebar toggle opens and shows gist list", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  // Use the navbar trigger (inside <nav>), not the one inside the collapsed sidebar
  await page.locator("nav").getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(page.getByText("Your Gists")).toBeVisible({ timeout: 5_000 });
});

test("sidebar shows user gists", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.locator("nav").getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(page.getByText("Your Gists")).toBeVisible({ timeout: 5_000 });

  // wait for gists to load
  const menuButtons = page.locator("[data-sidebar='menu-button']");
  await expect(menuButtons.first()).toBeVisible({ timeout: 10_000 });
});

test("sidebar not visible when unauthenticated", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route(`**/api/gists/198cfd97c8be1fb1d5967722fafc7331`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "198cfd97c8be1fb1d5967722fafc7331",
        description: "test gist",
        owner: { login: "hasparus" },
        files: { "test.md": { filename: "test.md" } },
      }),
    });
  });

  await page.goto("http://localhost:1999/hasparus/198cfd97c8be1fb1d5967722fafc7331");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await expect(
    page.getByRole("button", { name: "Toggle Sidebar" })
  ).toHaveCount(0);
  await context.close();
});
