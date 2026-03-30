import { test, expect } from '@playwright/test';

test('app loads and renders without crashing', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Techcora|Event/i);
  await page.screenshot({ path: 'tests/screenshots/home-smoke.png', fullPage: true });
});

test('login page is accessible', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/login-smoke.png', fullPage: true });
});
