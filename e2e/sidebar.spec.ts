import { authedTest as test, expect } from "./fixtures";

test("sidebar toggle opens and shows gist list", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const sidebar = page.locator("[data-slot='sidebar']");
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");

  // Use the navbar trigger (inside <nav>), not the one inside the collapsed sidebar
  await page.locator("nav").getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(sidebar).toHaveAttribute("data-state", "expanded", {
    timeout: 5_000,
  });
  await expect(page.getByText("Your Gists")).toBeVisible();
});

test("sidebar shows user gists", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.locator("nav").getByRole("button", { name: "Toggle Sidebar" }).click();
  const sidebar = page.locator("[data-slot='sidebar']");
  await expect(sidebar).toHaveAttribute("data-state", "expanded", {
    timeout: 5_000,
  });

  // wait for gists to load
  const menuButtons = sidebar.locator("[data-sidebar='menu-button']");
  await expect(menuButtons.first()).toBeVisible({ timeout: 10_000 });
});

test("sidebar not visible when unauthenticated", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/gists/a8390723cd893a21db00beba580fca36", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "a8390723cd893a21db00beba580fca36",
        description: "gist.mom manifesto",
        owner: { login: "hasparus" },
        files: { "gist-mom.md": { filename: "gist-mom.md" } },
      }),
    });
  });

  await page.goto("http://localhost:1999/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await expect(
    page.getByRole("button", { name: "Toggle Sidebar" })
  ).toHaveCount(0);
  await context.close();
});
