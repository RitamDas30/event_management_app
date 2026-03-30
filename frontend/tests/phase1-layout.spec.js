import { test, expect } from "@playwright/test";

// ============================================
// Phase 1: Layout & Navigation E2E Tests
// ============================================

test.describe("Public Layout & Navigation", () => {
  test("landing page renders hero section", async ({ page }) => {
    await page.goto("/");

    // Hero section should be visible
    await expect(page.locator("h1")).toContainText(/discover|manage|event/i);

    // Explore Events CTA button
    await expect(page.locator('a:has-text("Explore Events")').first()).toBeVisible();

    // Categories section
    await expect(page.locator('text=Browse by Category')).toBeVisible();

    // Features section
    await expect(page.locator('text=Why Evently')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/landing-hero.png", fullPage: false });
  });

  test("landing page shows full content sections", async ({ page }) => {
    await page.goto("/");

    // CTA section at bottom
    await expect(page.locator('text=Ready to Get Started')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/landing-full.png", fullPage: true });
  });

  test("public navbar renders correctly", async ({ page }) => {
    await page.goto("/");

    // Logo
    await expect(page.locator('a:has-text("Evently")').first()).toBeVisible();

    // Nav links (desktop - use .hidden.md\\:flex to target desktop-only nav)
    const desktopNav = page.locator('nav .hidden.md\\:flex');
    await expect(desktopNav.locator('a:has-text("Home")')).toBeVisible();
    await expect(desktopNav.locator('a:has-text("Explore Events")')).toBeVisible();
    await expect(desktopNav.locator('a:has-text("About")')).toBeVisible();
    await expect(desktopNav.locator('a:has-text("Contact")')).toBeVisible();

    // Auth buttons for guest (desktop nav)
    const desktopAuth = page.locator('nav .hidden.md\\:flex').last();
    await expect(desktopAuth.locator('a:has-text("Log in")')).toBeVisible();
    await expect(desktopAuth.locator('a:has-text("Sign up")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/navbar.png" });
  });

  test("footer renders correctly", async ({ page }) => {
    await page.goto("/");

    // Scroll to bottom to see footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(page.locator("footer")).toBeVisible();
    await expect(page.locator('footer:has-text("Evently")')).toBeVisible();
    await expect(page.locator('footer:has-text("Platform")')).toBeVisible();
    await expect(page.locator('footer:has-text("Categories")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/footer.png" });
  });
});

test.describe("Public Pages Navigation", () => {
  test("explore page loads and shows search/filters", async ({ page }) => {
    await page.goto("/explore");

    await expect(page.locator("h1")).toContainText("Explore Events");
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/explore.png", fullPage: true });
  });

  test("explore page filters work", async ({ page }) => {
    await page.goto("/explore");

    // Open filters
    await page.click('button:has-text("Filters")');
    await expect(page.locator('span.text-sm:has-text("Category")')).toBeVisible();

    // Category buttons should be visible
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Technical")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/explore-filters.png" });
  });

  test("about page renders", async ({ page }) => {
    await page.goto("/about");

    await expect(page.locator("h1")).toContainText("About Evently");
    await expect(page.locator('text=Our Mission')).toBeVisible();
    await expect(page.locator('text=Built With')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/about.png", fullPage: true });
  });

  test("contact page renders with form", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.locator("h1")).toContainText("Contact Us");
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="your@email.com"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send Message")')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/contact.png", fullPage: true });
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h2")).toContainText("Login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/login.png" });
  });

  test("register page is accessible", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator("h2")).toContainText("Register");
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/register.png" });
  });

  test("404 page renders for invalid routes", async ({ page }) => {
    await page.goto("/some-nonexistent-page");

    // Should show some kind of not found indication
    await expect(page.locator("body")).toContainText(/not found|404/i);

    await page.screenshot({ path: "tests/screenshots/404.png" });
  });
});

test.describe("Navigation Flow", () => {
  test("navbar links navigate correctly", async ({ page }) => {
    await page.goto("/");

    // Click Explore Events
    await page.click('nav a:has-text("Explore Events")');
    await expect(page).toHaveURL(/\/explore/);

    // Click About
    await page.click('nav a:has-text("About")');
    await expect(page).toHaveURL(/\/about/);

    // Click Contact
    await page.click('nav a:has-text("Contact")');
    await expect(page).toHaveURL(/\/contact/);

    // Click logo to go Home
    await page.click('nav a:has-text("Evently")');
    await expect(page).toHaveURL("/");
  });

  test("CTA buttons navigate correctly", async ({ page }) => {
    await page.goto("/");

    // Click Explore Events button in hero
    await page.click('a:has-text("Explore Events")');
    await expect(page).toHaveURL(/\/explore/);
  });

  test("guest is redirected from dashboard to login", async ({ page }) => {
    await page.goto("/student/dashboard");

    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/\/login/);
  });

  test("legacy routes redirect correctly", async ({ page }) => {
    await page.goto("/my-registrations");
    await expect(page).toHaveURL(/\/student\/registrations/);
  });
});

test.describe("Responsive Design", () => {
  test("mobile navbar shows hamburger menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Hamburger button should be visible on mobile
    await expect(page.locator('nav button').first()).toBeVisible();

    // Desktop nav should be hidden
    await expect(page.locator('nav .hidden.md\\:flex').first()).not.toBeVisible();

    await page.screenshot({ path: "tests/screenshots/mobile-landing.png", fullPage: false });
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Click hamburger
    await page.locator('nav button').first().click();
    await page.waitForTimeout(400); // Wait for animation

    await page.screenshot({ path: "tests/screenshots/mobile-menu-open.png" });
  });
});
