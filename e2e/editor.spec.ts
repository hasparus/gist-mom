import {
  authedTest as test,
  expect,
  TEST_GIST_PATH,
  mockEphemeralGistAuthed,
} from "./fixtures";

test("save button is disabled when no changes", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const saveBtn = page.getByRole("button", { name: "Save" });
  await expect(saveBtn).toBeDisabled();
});

test("typing in editor inserts text", async ({ page }) => {
  // Use ephemeral gist so typed text doesn't pollute real gist DOs
  const { path } = await mockEphemeralGistAuthed(page);
  await page.goto(path);
  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible({ timeout: 15_000 });

  await editor.click();
  const marker = `EDIT_TEST_${Date.now()}`;
  await page.keyboard.type(marker);

  await expect(editor).toContainText(marker, { timeout: 5_000 });
});

test("breadcrumb links to GitHub gist", async ({ page }) => {
  await page.goto(TEST_GIST_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const breadcrumb = page.locator("a", { hasText: "hasparus/198cfd97" });
  await expect(breadcrumb).toHaveAttribute(
    "href",
    "https://gist.github.com/hasparus/198cfd97c8be1fb1d5967722fafc7331"
  );
  await expect(breadcrumb).toHaveAttribute("target", "_blank");
});
