import {
  test,
  expect,
  TEST_GIST_PATH,
  mockEphemeralGist,
  mockGistRoutes,
} from "./fixtures";

test("footer shows attribution and GitHub stars link", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const footer = page.locator("footer");
  await expect(footer).toBeVisible();
  await expect(footer.getByText("built by")).toBeVisible();
  await expect(
    footer.locator("a[href='https://x.com/hasparus']")
  ).toBeVisible();
  await expect(
    footer.locator("a[href='https://github.com/hasparus/gist-mom']")
  ).toBeVisible();
  await expect(footer.getByText("stars on GitHub")).toBeVisible();
});

test("footer sits below content: off-screen for long docs until scrolled", async ({
  page,
}) => {
  const { path } = await mockEphemeralGist(page);
  await page.goto(path);
  const content = page.locator(".cm-content");
  await expect(content).toBeVisible({ timeout: 15_000 });

  await content.click();
  const longDoc = Array.from(
    { length: 200 },
    (_, i) => `line ${i + 1} of a long document`,
  ).join("\n");
  await page.keyboard.insertText(longDoc);
  await page.evaluate(() => window.scrollTo(0, 0));

  const footer = page.locator("footer");
  await expect(footer).not.toBeInViewport();

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(footer).toBeInViewport();
});

test("presence avatars stick to viewport bottom while footer is off-screen", async ({
  page,
  browser,
}) => {
  const { gistId, path } = await mockEphemeralGist(page);
  await page.goto(path);
  const content = page.locator(".cm-content");
  await expect(content).toBeVisible({ timeout: 15_000 });

  await content.click();
  const longDoc = Array.from(
    { length: 200 },
    (_, i) => `line ${i + 1} of a long document`,
  ).join("\n");
  await page.keyboard.insertText(longDoc);

  // Second client joins the same room to create a peer
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await mockGistRoutes(page2, gistId);
  await page2.goto(path);
  await expect(page2.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.evaluate(() => window.scrollTo(0, 0));

  const avatars = page.locator("[data-slot='avatar-group']");
  await expect(avatars).toBeVisible({ timeout: 10_000 });
  await expect(avatars).toBeInViewport();
  await expect(page.locator("footer")).not.toBeInViewport();

  // Scrolled to the end, avatars sit in flow directly above the footer
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(page.locator("footer")).toBeInViewport();
  await expect(avatars).toBeInViewport();

  await context2.close();
});
