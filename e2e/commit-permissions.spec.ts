import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const TEST_GIST_ID = "198cfd97c8be1fb1d5967722fafc7331";
const TEST_GIST_PATH = `/hasparus/${TEST_GIST_ID}`;

async function setupNonOwner(page: Page) {
  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "other-id",
          name: "otheruser",
          email: "other@example.com",
          image: null,
        },
        session: {
          id: "other-session",
          userId: "other-id",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      }),
    })
  );

  // Non-owner commit → 403
  await page.route(`**/api/gists/${TEST_GIST_ID}/commit`, (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "You don't have permission to edit this gist",
        }),
      });
    }
    return route.continue();
  });

  await page.route(`**/api/gists/${TEST_GIST_ID}/commits`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    })
  );

  await page.route(`**/api/gists/${TEST_GIST_ID}`, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: TEST_GIST_ID,
            description: "test gist",
            owner: { login: "hasparus" },
            files: { "test.md": { filename: "test.md" } },
          }),
        })
      : route.continue()
  );
}

base("non-owner commit attempt is rejected with 403", async ({ page }) => {
  await setupNonOwner(page);
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  // Call the commit endpoint from within the page context (goes through page.route)
  const result = await page.evaluate(async (gistId) => {
    const res = await fetch(`/api/gists/${gistId}/commit`, {
      method: "POST",
      credentials: "include",
    });
    return { status: res.status, body: await res.json() as { error: string } };
  }, TEST_GIST_ID);

  expect(result.status).toBe(403);
  expect(result.body.error).toContain("permission");
});
