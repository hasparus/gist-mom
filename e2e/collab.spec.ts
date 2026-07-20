import { expect, test, type Page } from "@playwright/test";
import { ephemeralGistId, mockGistRoutes } from "./fixtures";

test("edits sync between two clients", async ({ browser }) => {
  const gistId = ephemeralGistId();
  const url = `http://localhost:1999/hasparus/${gistId}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await mockGistRoutes(pageA, gistId);
  await mockGistRoutes(pageB, gistId);

  await pageA.goto(url);
  await expect(pageA.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
  await pageB.goto(url);
  await expect(pageB.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await pageA.locator(".cm-content").click();
  await pageA.keyboard.type("hello from client A");

  await expect(pageB.locator(".cm-content")).toContainText(
    "hello from client A",
    { timeout: 10_000 },
  );

  await pageB.locator(".cm-content").click();
  await pageB.keyboard.press("End");
  await pageB.keyboard.type(" and B");

  await expect(pageA.locator(".cm-content")).toContainText(
    "hello from client A and B",
    { timeout: 10_000 },
  );

  await contextA.close();
  await contextB.close();
});

async function setPageVisibility(page: Page, hidden: boolean) {
  await page.evaluate((isHidden) => {
    Object.defineProperty(document, "hidden", {
      value: isHidden,
      configurable: true,
    });
    Object.defineProperty(document, "visibilityState", {
      value: isHidden ? "hidden" : "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("hidden tab disconnects and catches up when visible again", async ({
  browser,
}) => {
  const gistId = ephemeralGistId();
  const url = `http://localhost:1999/hasparus/${gistId}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await mockGistRoutes(pageA, gistId);
  await mockGistRoutes(pageB, gistId);

  await pageA.goto(url);
  await expect(pageA.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
  await pageB.goto(url);
  await expect(pageB.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await pageA.locator(".cm-content").click();
  await pageA.keyboard.type("before hiding");
  await expect(pageB.locator(".cm-content")).toContainText("before hiding", {
    timeout: 10_000,
  });

  await setPageVisibility(pageB, true);
  await pageA.keyboard.type(" while B away");

  await pageA.waitForTimeout(1_500);
  await expect(pageB.locator(".cm-content")).not.toContainText("while B away");

  await setPageVisibility(pageB, false);
  await expect(pageB.locator(".cm-content")).toContainText(
    "before hiding while B away",
    { timeout: 10_000 },
  );

  await contextA.close();
  await contextB.close();
});
