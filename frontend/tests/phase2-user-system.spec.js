import { test, expect } from "@playwright/test";

// ============================================
// Phase 2: User System E2E Tests
// ============================================

test.describe("Profile Page (requires auth)", () => {
  test("profile page redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/student/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("settings page redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/student/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("saved events page redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/student/saved");
    await expect(page).toHaveURL(/\/login/);
  });

  test("notifications page redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/student/notifications");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Organizer dashboard redirects", () => {
  test("organizer dashboard redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/organizer/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("organizer events page redirects to login", async ({ page }) => {
    await page.goto("/organizer/events");
    await expect(page).toHaveURL(/\/login/);
  });

  test("organizer create event redirects to login", async ({ page }) => {
    await page.goto("/organizer/events/create");
    await expect(page).toHaveURL(/\/login/);
  });

  test("organizer analytics redirects to login", async ({ page }) => {
    await page.goto("/organizer/analytics");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Admin dashboard redirects", () => {
  test("admin dashboard redirects to login for unauthenticated users", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin users page redirects to login", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Public pages still work after Phase 2", () => {
  test("landing page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/discover|manage/i);
  });

  test("explore page renders", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("h1")).toContainText("Explore Events");
  });

  test("event cards show bookmark button only for logged-in users", async ({ page }) => {
    await page.goto("/explore");
    // Wait for events to load
    await page.waitForTimeout(2000);

    // For unauthenticated users, bookmark button should NOT be visible
    // (share button still should be)
    const bookmarkButtons = await page.locator('button[title="Save event"]').count();
    expect(bookmarkButtons).toBe(0); // No bookmark for guests

    await page.screenshot({ path: "tests/screenshots/explore-no-bookmark.png" });
  });

  test("login page form works", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/login-form.png" });
  });

  test("register page form works", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    // Role is now button-based, not a select
    await expect(page.locator('button:has-text("Attend Events")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/register-form.png" });
  });
});
