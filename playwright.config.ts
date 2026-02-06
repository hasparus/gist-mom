import { defineConfig, devices } from "@playwright/test";

const PORT = 1999;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  forbidOnly: !!process.env["CI"],
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  reporter: "html",
  retries: process.env["CI"] ? 2 : 0,
  testDir: "./e2e",
  testMatch: "**/*.{spec,e2e}.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run dev",
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
    url: baseURL,
  },
  workers: process.env["CI"] ? 1 : undefined,
});
