import {
  authedTest,
  test,
  expect,
  TEST_GIST_PATH,
  ephemeralGistId,
  mockGistRoutes,
} from "./fixtures";
import type { Page } from "@playwright/test";

/** Mock POST /api/gists and GET routes for the created gist. */
async function mockCreateGist(page: Page) {
  const newGistId = ephemeralGistId();
  const requests: unknown[] = [];
  await mockGistRoutes(page, newGistId);
  await page.route(/\/api\/gists$/, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: newGistId,
        description: null,
        owner: { login: "hasparus" },
        files: { "untitled.md": { filename: "untitled.md" } },
      }),
    });
  });
  return { newGistId, requests };
}

authedTest(
  "creates a secret gist and navigates to it",
  async ({ page }) => {
    const { newGistId, requests } = await mockCreateGist(page);

    await page.goto(TEST_GIST_PATH);
    await expect(page.locator(".cm-content")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "New gist" }).click();
    await page.getByRole("menuitem", { name: "Secret gist" }).click();

    await expect(page).toHaveURL(`/hasparus/${newGistId}`, {
      timeout: 10_000,
    });
    expect(requests).toEqual([{ public: false }]);
    await expect(page.locator(".cm-content")).toBeVisible({
      timeout: 15_000,
    });
  }
);

authedTest("creates a public gist", async ({ page }) => {
  const { newGistId, requests } = await mockCreateGist(page);

  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "New gist" }).click();
  await page.getByRole("menuitem", { name: "Public gist" }).click();

  await expect(page).toHaveURL(`/hasparus/${newGistId}`, {
    timeout: 10_000,
  });
  expect(requests).toEqual([{ public: true }]);
});

test("new gist button hidden when unauthenticated", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await expect(page.getByRole("button", { name: "New gist" })).toHaveCount(0);
});
