import { test, expect } from "@playwright/test";
import { SMOKE_BASE_URL } from "./smoke-config";

const SEARCH_URL = `${SMOKE_BASE_URL}/listings?rentalType=short_term`;

/** Future calendar days relative to today (past days are disabled). */
function futureDayParts(offsetDays: number): { year: number; month: number; day: number } {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

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

async function goToMonthIfNeeded(
  page: import("@playwright/test").Page,
  year: number,
  month: number
) {
  const popover = await datePopover(page);
  const target = new Date(year, month - 1, 1);
  for (let i = 0; i < 14; i++) {
    const dayBtn = popover.getByRole("button", { name: dayAria(year, month, 1) });
    if ((await dayBtn.count()) > 0) return;
    // Prefer next month when targeting future dates
    const next = popover.getByRole("button", { name: "Επόμενος μήνας" });
    if (await next.isEnabled()) {
      await next.click();
      continue;
    }
    const prev = popover.getByRole("button", { name: "Προηγούμενος μήνας" });
    await prev.click();
    void target;
  }
}

async function clickCalendarDay(
  page: import("@playwright/test").Page,
  year: number,
  month: number,
  day: number
) {
  await goToMonthIfNeeded(page, year, month);
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

    const checkIn = futureDayParts(3);
    const checkOut = futureDayParts(6);

    await clickCalendarDay(page, checkIn.year, checkIn.month, checkIn.day);
    await calendarOpen(page);
    await clickCalendarDay(page, checkOut.year, checkOut.month, checkOut.day);
    await calendarClosed(page);

    await expect(checkInButton(page)).toContainText(String(checkIn.day));
    await expect(checkOutButton(page)).toContainText(String(checkOut.day));
    await expect(page.getByText("Ενήλικες")).toHaveCount(0);
  });

  test("reopen calendar to edit dates", async ({ page }) => {
    await openSearchCheckIn(page);

    const firstIn = futureDayParts(3);
    const firstOut = futureDayParts(6);
    const secondIn = futureDayParts(7);
    const secondOut = futureDayParts(11);

    await clickCalendarDay(page, firstIn.year, firstIn.month, firstIn.day);
    await clickCalendarDay(page, firstOut.year, firstOut.month, firstOut.day);
    await calendarClosed(page);

    await checkInButton(page).click();
    await calendarOpen(page);

    await clickCalendarDay(page, secondIn.year, secondIn.month, secondIn.day);
    await clickCalendarDay(page, secondOut.year, secondOut.month, secondOut.day);
    await calendarClosed(page);

    await expect(checkInButton(page)).toContainText(String(secondIn.day));
    await expect(checkOutButton(page)).toContainText(String(secondOut.day));
  });

  test("search works without opening guests", async ({ page }) => {
    await openSearchCheckIn(page);

    const checkIn = futureDayParts(3);
    const checkOut = futureDayParts(6);

    await clickCalendarDay(page, checkIn.year, checkIn.month, checkIn.day);
    await clickCalendarDay(page, checkOut.year, checkOut.month, checkOut.day);
    await calendarClosed(page);

    await page.locator(".listings-search-dock__submit").click();
    await page.waitForURL(/interestFrom=/);
    expect(page.url()).toMatch(/interestTo=/);
  });
});
