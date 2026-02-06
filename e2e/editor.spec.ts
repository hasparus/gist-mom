import { authedTest as test, expect, MANIFESTO_PATH } from "./fixtures";

test("save button is disabled when no changes", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const saveBtn = page.getByRole("button", { name: "Save" });
  await expect(saveBtn).toBeDisabled();
});

test("typing in editor enables save button", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible({ timeout: 15_000 });

  await expect(
    page.getByRole("button", { name: "Save" })
  ).toBeDisabled({ timeout: 10_000 });

  await editor.click();
  await page.keyboard.type("test change ");

  await expect(
    page.getByRole("button", { name: "Save" })
  ).toBeEnabled({ timeout: 5_000 });
});

test("breadcrumb links to GitHub gist", async ({ page }) => {
  await page.goto(MANIFESTO_PATH);
  await expect(page.locator(".cm-content")).toBeVisible({ timeout: 15_000 });

  const breadcrumb = page.locator("a", { hasText: "hasparus/a8390723" });
  await expect(breadcrumb).toHaveAttribute(
    "href",
    "https://gist.github.com/hasparus/a8390723cd893a21db00beba580fca36"
  );
  await expect(breadcrumb).toHaveAttribute("target", "_blank");
});
