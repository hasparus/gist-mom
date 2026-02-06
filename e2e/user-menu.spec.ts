import { authedTest as test, expect } from "./fixtures";

test("user menu shows GitHub profile and gists links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.locator("[data-slot='dropdown-menu-trigger']").click();
  await expect(page.getByText("GitHub profile")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Your gists" })).toBeVisible();
  await expect(page.getByText("Sign out")).toBeVisible();

  await expect(
    page.locator("a", { hasText: "GitHub profile" })
  ).toHaveAttribute("href", /github\.com\//);
  await expect(
    page.locator("a", { hasText: "Your gists" })
  ).toHaveAttribute("href", /gist\.github\.com\//);
});
