import {
  authedTest,
  test,
  expect,
  TEST_GIST_PATH,
  mockEphemeralGist,
} from "./fixtures";
import type { Page } from "@playwright/test";

/** Mock POST /api/gists and GET routes for the created gist. */
async function mockCreateGist(page: Page) {
  const { gistId, path } = await mockEphemeralGist(page);
  const requests: unknown[] = [];
  await page.route(/\/api\/gists$/, (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: gistId,
        description: null,
        owner: { login: "hasparus" },
        files: { "untitled.md": { filename: "untitled.md" } },
      }),
    });
  });
  return { path, requests };
}

for (const [item, isPublic] of [
  ["Secret gist", false],
  ["Public gist", true],
] as const) {
  authedTest(
    `creates a ${item.toLowerCase()} and navigates to it`,
    async ({ page }) => {
      const { path, requests } = await mockCreateGist(page);

      await page.goto(TEST_GIST_PATH);
      await expect(page.locator(".cm-content")).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole("button", { name: "New gist" }).click();
      await page.getByRole("menuitem", { name: item }).click();

      await expect(page).toHaveURL(path, { timeout: 10_000 });
      expect(requests).toEqual([{ public: isPublic }]);
      await expect(page.locator(".cm-content")).toBeVisible({
        timeout: 15_000,
      });
    }
  );
}

test("new gist button hidden when unauthenticated", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await expect(page.getByRole("button", { name: "New gist" })).toHaveCount(0);
});
