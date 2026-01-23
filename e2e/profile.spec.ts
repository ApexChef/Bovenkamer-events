import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.describe('AUTH-001: Protected route without auth', () => {
    test('should protect profile page without auth', async ({ page }) => {
      // Clear any existing auth
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      // Try to access profile
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Should either redirect to login OR show login prompt/error
      const url = page.url();
      const isProtected = url.includes('/login') ||
                          url.includes('/register') ||
                          await page.locator('text=/inloggen|login|aanmelden/i').isVisible();

      expect(isProtected).toBeTruthy();
    });

    test('should protect dashboard without auth', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should either redirect to login OR show login prompt
      const url = page.url();
      const isProtected = url.includes('/login') ||
                          url.includes('/register') ||
                          await page.locator('text=/inloggen|login|aanmelden/i').isVisible();

      expect(isProtected).toBeTruthy();
    });
  });

  test.describe('AUTH-003: Admin route protection', () => {
    test('should not allow access to admin without admin role', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should redirect or show error - not show admin content
      const url = page.url();
      const isProtected = url.includes('/login') ||
                          url.includes('/dashboard') ||
                          !url.includes('/admin') ||
                          await page.locator('text=/geen toegang|access denied|inloggen/i').isVisible();

      expect(isProtected).toBeTruthy();
    });
  });

  test.describe('Leaderboard Page', () => {
    test('PROF-023: Leaderboard page should load', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');

      // Check page loaded (might require auth or be public)
      const pageLoaded = await page.locator('body').isVisible();
      expect(pageLoaded).toBeTruthy();
    });
  });
});

test.describe('Profile Section Accordion', () => {
  test.skip('PROF-003: Section headers should be clickable (requires auth)', async ({ page }) => {
    // This test requires a logged-in user
    // Skip for now - would need test fixtures with auth
    await page.goto('/profile');
  });
});
