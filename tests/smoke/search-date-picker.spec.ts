import { test, expect } from "@playwright/test";
import { SMOKE_BASE_URL } from "./smoke-config";

const SEARCH_URL = `${SMOKE_BASE_URL}/listings?rentalType=short_term`;

function dayAria(year: number, month: number, day: number): RegExp {
  const date = new Date(year, month - 1, day);
  const label = new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  return new RegExp(label.replace(/\./g, "\\.?"), "i");
}

async function openSearchCheckIn(page: import("@playwright/test").Page) {
  const dock = page.locator(".listings-search-dock");
  await dock
    .locator(".listings-search-segment")
    .filter({ hasText: "Άφιξη" })
    .getByRole("button")
    .click();
}

async function datePopover(page: import("@playwright/test").Page) {
  return page.getByRole("dialog").last();
}

async function clickCalendarDay(
  page: import("@playwright/test").Page,
  year: number,
  month: number,
  day: number
) {
  const popover = await datePopover(page);
  await popover.getByRole("button", { name: dayAria(year, month, day) }).click();
}

async function calendarOpen(page: import("@playwright/test").Page) {
  const popover = await datePopover(page);
  await expect(popover.getByRole("button", { name: "Προηγούμενος μήνας" })).toBeVisible();
}

async function calendarClosed(page: import("@playwright/test").Page) {
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

function checkInButton(page: import("@playwright/test").Page) {
  return page
    .locator(".listings-search-dock")
    .locator(".listings-search-segment")
    .filter({ hasText: "Άφιξη" })
    .getByRole("button");
}

function checkOutButton(page: import("@playwright/test").Page) {
  return page
    .locator(".listings-search-dock")
    .locator(".listings-search-segment")
    .filter({ hasText: "Αναχώρηση" })
    .getByRole("button");
}

test.describe("Search date picker close behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCH_URL);
  });

  test("stays open after check-in, closes after check-out", async ({ page }) => {
    await openSearchCheckIn(page);
    await calendarOpen(page);

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    await clickCalendarDay(page, year, month, 16);
    await calendarOpen(page);
    await clickCalendarDay(page, year, month, 19);
    await calendarClosed(page);

    await expect(checkInButton(page)).toContainText("16");
    await expect(checkOutButton(page)).toContainText("19");
    await expect(page.getByText("Ενήλικες")).toHaveCount(0);
  });

  test("reopen calendar to edit dates", async ({ page }) => {
    await openSearchCheckIn(page);

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    await clickCalendarDay(page, year, month, 16);
    await clickCalendarDay(page, year, month, 19);
    await calendarClosed(page);

    await checkInButton(page).click();
    await calendarOpen(page);

    await clickCalendarDay(page, year, month, 20);
    await clickCalendarDay(page, year, month, 24);
    await calendarClosed(page);

    await expect(checkInButton(page)).toContainText("20");
    await expect(checkOutButton(page)).toContainText("24");
  });

  test("search works without opening guests", async ({ page }) => {
    await openSearchCheckIn(page);

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    await clickCalendarDay(page, year, month, 16);
    await clickCalendarDay(page, year, month, 19);
    await calendarClosed(page);

    await page.locator(".listings-search-dock__submit").click();
    await page.waitForURL(/interestFrom=/);
    expect(page.url()).toMatch(/interestTo=/);
  });
});
