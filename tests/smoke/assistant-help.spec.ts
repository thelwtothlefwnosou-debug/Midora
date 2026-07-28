import { test, expect } from "@playwright/test";

test.describe("Midora help assistant", () => {
  test("opens chat and answers Midora search question", async ({ page }) => {
    await page.goto("/listings?rentalType=short_term");
    await page.waitForLoadState("domcontentloaded");

    await page
      .getByRole("button", { name: "Βοηθός Midora", description: "Ρώτησέ με για το Midora" })
      .click();
    await expect(page.getByRole("heading", { name: "Βοηθός Midora" })).toBeVisible();

    await page.getByPlaceholder("Γράψε την ερώτησή σου…").fill("Πώς κάνω αναζήτηση;");
    await page.getByLabel("Αποστολή").click();

    const assistantBubble = page.locator("text=αναζήτηση").last();
    await expect(assistantBubble).toBeVisible({ timeout: 20_000 });
  });

  test("refuses out-of-scope weather question", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page
      .getByRole("button", { name: "Βοηθός Midora", description: "Ρώτησέ με για το Midora" })
      .click();
    await page.getByPlaceholder("Γράψε την ερώτησή σου…").fill("τι καιρό κάνει;");
    await page.getByLabel("Αποστολή").click();

    await expect(
      page.getByText(/Μπορώ να βοηθήσω μόνο με ερωτήσεις που αφορούν το Midora/i)
    ).toBeVisible({ timeout: 20_000 });
  });
});
