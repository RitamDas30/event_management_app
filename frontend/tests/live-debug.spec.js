import { test, expect } from "@playwright/test";

test("screenshot live event layout via organizer login", async ({ page }) => {
  // Login as organizer
  await page.goto("/login");
  await page.fill('input[type="email"]', "organizer@organizer.com");
  await page.fill('input[type="password"]', "organizer");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/organizer/, { timeout: 10000 });

  await page.screenshot({ path: "tests/screenshots/organizer-dashboard.png", fullPage: true });

  // Go to My Events
  await page.goto("/organizer/events");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tests/screenshots/organizer-events.png", fullPage: true });

  // Check if there are any online/hybrid events with live links
  const liveLinks = page.locator('a:has-text("Go Live"), a:has-text("Rejoin")');
  const liveCount = await liveLinks.count();

  if (liveCount > 0) {
    // Click first live link
    await liveLinks.first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/screenshots/live-event-page.png", fullPage: false });
  } else {
    // No live events — screenshot the events page for reference
    await page.screenshot({ path: "tests/screenshots/no-live-events.png" });
  }
});

test("screenshot dashboard layout dimensions", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', "organizer@organizer.com");
  await page.fill('input[type="password"]', "organizer");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/organizer/, { timeout: 10000 });

  // Check viewport vs content dimensions
  const dims = await page.evaluate(() => ({
    viewportH: window.innerHeight,
    viewportW: window.innerWidth,
    bodyH: document.body.scrollHeight,
    bodyW: document.body.scrollWidth,
  }));

  console.log("Dimensions:", dims);
  await page.screenshot({ path: "tests/screenshots/dashboard-dims.png" });
});
