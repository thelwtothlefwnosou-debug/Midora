import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/midora-smoke/html" }]],
  outputDir: "test-results/midora-smoke/artifacts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- -H 127.0.0.1 -p 3000",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
