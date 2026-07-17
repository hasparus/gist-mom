import {
  authedTest,
  test,
  expect,
  TEST_GIST_ID,
  mockEphemeralGist,
} from "./fixtures";

authedTest("opens with Cmd+K and toggles preview", async ({ page }) => {
  await page.goto(`/hasparus/${TEST_GIST_ID}`);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press("ControlOrMeta+k");
  await expect(
    page.getByRole("dialog", { name: "Command Palette" }),
  ).toBeVisible();

  await page.getByRole("option", { name: "Toggle preview" }).click();
  await expect(page.locator(".preview")).toBeVisible({ timeout: 5_000 });
});

authedTest("jumps to a gist from the palette", async ({ page }) => {
  const { path } = await mockEphemeralGist(page);
  await page.goto(path);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("option", { name: "test gist" }).click();

  await expect(page).toHaveURL(`/hasparus/${TEST_GIST_ID}`, {
    timeout: 10_000,
  });
});

test("hides authed commands when signed out", async ({ page }) => {
  await page.goto(`/hasparus/${TEST_GIST_ID}`);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press("ControlOrMeta+k");
  await expect(
    page.getByRole("dialog", { name: "Command Palette" }),
  ).toBeVisible();
  await expect(page.getByRole("option", { name: "Toggle preview" })).toBeVisible();
  await expect(
    page.getByRole("option", { name: "New secret gist" }),
  ).toHaveCount(0);
});
