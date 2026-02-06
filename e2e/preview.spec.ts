import {
  test,
  expect,
  TEST_GIST_PATH,
  mockEphemeralGist,
} from "./fixtures";

test("preview pane renders markdown", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Preview" }).click();
  const preview = page.locator(".preview");
  await expect(preview).toBeVisible({ timeout: 5_000 });
});

test("preview updates live as editor content changes", async ({ page }) => {
  const { path } = await mockEphemeralGist(page);
  await page.goto(path);
  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible({ timeout: 15_000 });

  // type unique text in editor
  await editor.click();
  const marker = `PREVIEW_TEST_${Date.now()}`;
  await page.keyboard.type(marker);

  // switch to preview and verify text appears
  await page.getByRole("button", { name: "Preview" }).click();
  const preview = page.locator(".preview");
  await expect(preview).toBeVisible({ timeout: 5_000 });
  await expect(preview.getByText(marker)).toBeVisible({ timeout: 5_000 });
});
