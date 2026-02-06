import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Test gist ID — https://gist.github.com/hasparus/198cfd97c8be1fb1d5967722fafc7331 */
export const TEST_GIST_ID = "198cfd97c8be1fb1d5967722fafc7331";
export const TEST_GIST_PATH = `/hasparus/${TEST_GIST_ID}`;

/** Random gist ID per call — creates a fresh DO room that won't pollute real gists */
export function ephemeralGistId() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const MOCK_GIST_RESPONSE = {
  id: TEST_GIST_ID,
  description: "test gist",
  owner: { login: "hasparus" },
  files: { "gist-mom.md": { filename: "gist-mom.md" } },
};

const MOCK_COMMITS = [
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
    id: TEST_GIST_ID,
    description: "test gist",
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

async function mockGistRoutes(page: Page, gistId = TEST_GIST_ID) {
  // Register most-specific routes first
  await page.route(
    `**/api/gists/${gistId}/commits`,
    (route) => fulfill(route, MOCK_COMMITS)
  );
  await page.route(
    `**/api/gists/${gistId}`,
    (route) =>
      route.request().method() === "GET"
        ? fulfill(route, {
            ...MOCK_GIST_RESPONSE,
            id: gistId,
          })
        : route.continue()
  );
}

/** Mock routes for an ephemeral gist ID. Returns { gistId, path }. */
export async function mockEphemeralGist(page: Page) {
  const gistId = ephemeralGistId();
  await mockGistRoutes(page, gistId);
  return { gistId, path: `/hasparus/${gistId}` };
}

/** Mock routes for an ephemeral gist with auth. Returns { gistId, path }. */
export async function mockEphemeralGistAuthed(page: Page) {
  await page.route("**/api/auth/get-session", (route) =>
    fulfill(route, MOCK_SESSION)
  );
  const gistId = ephemeralGistId();
  await mockGistRoutes(page, gistId);
  return { gistId, path: `/hasparus/${gistId}` };
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
