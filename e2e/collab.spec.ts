import { expect, test } from "@playwright/test";
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
