import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import {
  OWNER_ROUTES,
  PUBLIC_ROUTES,
} from "./smoke-config";

const SCREENSHOT_DIR = path.join("test-results", "midora-smoke", "screenshots");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

const IGNORED_CONSOLE_PATTERNS = [
  /Download the React DevTools/i,
  /favicon\.ico/i,
  /Failed to load resource.*favicon/i,
  /\[Fast Refresh\]/i,
  /Hydration failed/i,
  /Text content did not match/i,
  // Missing/broken seed images in local storage — page shows fallback UI
  /Failed to load resource: the server responded with a status of 40\d/i,
];

function isIgnoredConsoleMessage(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text));
}

async function attachRuntimeGuards(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isIgnoredConsoleMessage(text)) return;
    consoleErrors.push(text);
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;
    const url = response.url();
    const type = response.request().resourceType();
    if (type === "image" || type === "media" || type === "font") return;
    if (/\/_next\/image|\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(url)) return;
    if (status >= 500) {
      pageErrors.push(`HTTP ${status} ${url}`);
    }
  });

  return {
    assertClean() {
      expect(pageErrors, "pageerror events").toEqual([]);
      expect(consoleErrors, "console error events").toEqual([]);
    },
  };
}

async function assertNoNextErrorOverlay(page: Page) {
  const overlay = page.locator(
    [
      "text=Unhandled Runtime Error",
      "text=Console Error",
      "text=Application error",
      "[data-nextjs-dialog-overlay]",
      "nextjs-portal",
    ].join(", ")
  );
  await expect(overlay.first()).toHaveCount(0);
}

async function assertNotBlank(page: Page) {
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  expect(text.length, "page body should not be blank").toBeGreaterThan(20);
}

async function assertExpectedText(
  page: Page,
  needles: readonly string[],
  anyOf?: readonly string[]
) {
  const body = await page.locator("body").innerText();
  for (const needle of needles) {
    expect(body, `expected text: ${needle}`).toContain(needle);
  }
  if (anyOf?.length) {
    const hit = anyOf.some((n) => body.includes(n));
    expect(hit, `expected one of: ${anyOf.join(" | ")}`).toBeTruthy();
  }
}

async function smokeVisit(
  page: Page,
  route: {
    path: string;
    name: string;
    expectText: readonly string[];
    expectAnyOf?: readonly string[];
    allowLogin?: boolean;
  }
) {
  const guards = await attachRuntimeGuards(page);
  const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
  expect(response, `${route.name} should return a response`).not.toBeNull();
  expect(response!.status(), `${route.name} HTTP status`).toBeLessThan(500);

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(500);
  await assertNotBlank(page);
  await assertNoNextErrorOverlay(page);
  await assertExpectedText(page, route.expectText, route.expectAnyOf);
  guards.assertClean();

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${route.name}.png`),
    fullPage: false,
  });
}

test.describe("Midora public smoke", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`public: ${route.name} (${route.path})`, async ({ page }) => {
      await smokeVisit(page, route);
    });
  }
});

test.describe("Midora owner smoke (unauthenticated)", () => {
  for (const route of OWNER_ROUTES) {
    test(`owner: ${route.name} (${route.path})`, async ({ page }) => {
      await smokeVisit(page, route);
    });
  }
});
