import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Manifesto gist ID used in most tests */
export const MANIFESTO_GIST_ID = "a8390723cd893a21db00beba580fca36";
export const MANIFESTO_PATH = `/hasparus/${MANIFESTO_GIST_ID}`;

const MANIFESTO_API_RESPONSE = {
  id: MANIFESTO_GIST_ID,
  description: "gist.mom manifesto",
  owner: { login: "hasparus" },
  files: { "gist-mom.md": { filename: "gist-mom.md" } },
};

const MANIFESTO_COMMITS = [
  {
    version: "0362b5b1234567890abcdef",
    user: { login: "hasparus" },
    committed_at: new Date(Date.now() - 21 * 60000).toISOString(),
    change_status: { total: 28, additions: 26, deletions: 2 },
  },
  {
    version: "19e63a21234567890abcdef",
    user: { login: "hasparus" },
    committed_at: new Date(Date.now() - 54 * 60000).toISOString(),
    change_status: { total: 5, additions: 3, deletions: 2 },
  },
];

const MOCK_SESSION = {
  user: {
    id: "test-user-id",
    name: "hasparus",
    email: "test@example.com",
    image: "https://avatars.githubusercontent.com/u/15332326",
  },
  session: {
    id: "test-session-id",
    userId: "test-user-id",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
};

const MOCK_GISTS = [
  {
    id: MANIFESTO_GIST_ID,
    description: "gist.mom manifesto",
    owner: { login: "hasparus" },
    files: { "gist-mom.md": { filename: "gist-mom.md" } },
  },
  {
    id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    description: "Another gist",
    owner: { login: "hasparus" },
    files: { "notes.md": { filename: "notes.md" } },
  },
];

function fulfill(route: { fulfill: Function }, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockGistRoutes(page: Page) {
  // Register most-specific routes first
  await page.route(
    `**/api/gists/${MANIFESTO_GIST_ID}/commits`,
    (route) => fulfill(route, MANIFESTO_COMMITS)
  );
  await page.route(
    `**/api/gists/${MANIFESTO_GIST_ID}`,
    (route) =>
      route.request().method() === "GET"
        ? fulfill(route, MANIFESTO_API_RESPONSE)
        : route.continue()
  );
}

/**
 * Test with mocked gist API (avoids GitHub rate limits).
 * WebSocket/DO still uses the real dev server.
 */
export const test = base.extend<{ mockGistApi: void }>({
  mockGistApi: [
    async ({ page }, use) => {
      await mockGistRoutes(page);
      await use();
    },
    { auto: true },
  ],
});

/**
 * Test with mocked auth session + gist API.
 * Use for authenticated UI tests (sidebar, save, user menu).
 */
export const authedTest = base.extend<{ mockAuth: void }>({
  mockAuth: [
    async ({ page }, use) => {
      await page.route("**/api/auth/get-session", (route) =>
        fulfill(route, MOCK_SESSION)
      );
      // Gist list — must use exact path match via regex to avoid catching /api/gists/:id
      await page.route(/\/api\/gists$/, (route) =>
        route.request().method() === "GET"
          ? fulfill(route, MOCK_GISTS)
          : route.continue()
      );
      await mockGistRoutes(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
