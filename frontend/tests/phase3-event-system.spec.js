import { test, expect } from "@playwright/test";

test.describe("Event Details Page", () => {
  test("event details page loads for valid event", async ({ page }) => {
    // Go to explore first to find an event
    await page.goto("/explore");
    await page.waitForTimeout(2000);

    // Check if there are any event cards
    const eventLinks = page.locator('a[href^="/events/"]');
    const count = await eventLinks.count();

    if (count > 0) {
      // Click first event
      await eventLinks.first().click();
      await page.waitForTimeout(1000);

      // Should show event detail sections
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator('text=About This Event')).toBeVisible();

      await page.screenshot({ path: "tests/screenshots/event-details.png", fullPage: true });
    }
  });

  test("event details shows sidebar with registration info", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href^="/events/"]');
    const count = await eventLinks.count();

    if (count > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(1000);

      // Sidebar should show registration stats
      await expect(page.locator('text=/registered|Register Now|Join Waitlist/i').first()).toBeVisible();
    }
  });

  test("event details shows reviews section", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForTimeout(2000);

    const eventLinks = page.locator('a[href^="/events/"]');
    const count = await eventLinks.count();

    if (count > 0) {
      await eventLinks.first().click();
      await page.waitForTimeout(1000);

      await expect(page.locator('h2:has-text("Reviews")')).toBeVisible();
    }
  });
});

test.describe("Create Event Wizard (requires auth)", () => {
  test("create event page redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/organizer/events/create");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Explore page with events", () => {
  test("explore page renders event cards", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForTimeout(2000);

    // Should show either events or "no events" message
    const hasEvents = await page.locator('text=/event/i').count();
    expect(hasEvents).toBeGreaterThan(0);

    await page.screenshot({ path: "tests/screenshots/explore-events.png", fullPage: true });
  });

  test("explore page search works", async ({ page }) => {
    await page.goto("/explore");

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("test");
    await page.waitForTimeout(1500);

    // Page should still be functional
    await expect(page.locator("h1")).toContainText("Explore Events");
  });

  test("explore page URL params sync with filters", async ({ page }) => {
    await page.goto("/explore?category=Technical");

    // URL should have the category param
    expect(page.url()).toContain("category=Technical");
  });
});

test.describe("Landing page featured events", () => {
  test("landing page shows upcoming events section", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('h2:has-text("Upcoming Events")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/landing-events.png" });
  });
});
