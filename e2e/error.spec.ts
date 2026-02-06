import { test as base, expect } from "@playwright/test";

// Don't use fixtures here — we intentionally mock failure responses

base("invalid gist shows error message", async ({ page }) => {
  await page.route("**/api/gists/0000000000000000000000000000dead", (route) => {
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Not Found" }),
    });
  });

  await page.goto("/nobody/0000000000000000000000000000dead");
  await expect(page.getByText("Could not load this gist")).toBeVisible({
    timeout: 15_000,
  });
});

base("403 error shows sign in prompt for unauthenticated user", async ({
  page,
}) => {
  await page.route("**/api/gists/**", (route) => {
    if (route.request().method() === "GET" && !route.request().url().includes("/commits")) {
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "403 rate limited" }),
      });
    }
    return route.continue();
  });

  await page.goto("/hasparus/198cfd97c8be1fb1d5967722fafc7331");
  await expect(page.getByText("Could not load this gist")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("rate-limits")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with GitHub" })
  ).toBeVisible();
});
