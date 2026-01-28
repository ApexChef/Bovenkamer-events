import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('LOGIN-002: Login with remembered email', () => {
    test('should have remember email checkbox visible', async ({ page }) => {
      await page.goto('/login');

      // Check for remember email checkbox/label
      const rememberLabel = page.locator('text=/onthoud.*email/i');
      await expect(rememberLabel).toBeVisible();

      // Check for checkbox
      const rememberCheckbox = page.locator('input[type="checkbox"]').first();
      await expect(rememberCheckbox).toBeVisible();
    });
  });

  test.describe('LOGIN-003: Login with redirect URL', () => {
    test('should show login form when accessing with redirect param', async ({ page }) => {
      await page.goto('/login?redirect=/profile');

      // Verify we're on the login page
      await expect(page).toHaveURL(/\/login/);

      // Check that redirect param is in URL
      expect(page.url()).toContain('redirect=/profile');

      // Login form should be visible
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    });
  });

  test.describe('Login form validation', () => {
    test('LOGIN-005: submit button disabled when email empty', async ({ page }) => {
      await page.goto('/login');

      // Fill only PIN
      const pinInputs = page.locator('input[maxlength="1"]');
      if (await pinInputs.count() >= 4) {
        await pinInputs.nth(0).fill('A');
        await pinInputs.nth(1).fill('B');
        await pinInputs.nth(2).fill('1');
        await pinInputs.nth(3).fill('2');
      }

      // Submit button should be disabled when email is empty
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();

      expect(isDisabled).toBeTruthy();
    });

    test('LOGIN-006: submit button disabled when PIN empty', async ({ page }) => {
      await page.goto('/login');

      // Fill only email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('test@example.com');

      // Submit button should be disabled when PIN is empty
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();

      expect(isDisabled).toBeTruthy();
    });
  });

  test.describe('Login error states', () => {
    test('LOGIN-016: should submit and show error for non-existent user', async ({ page }) => {
      await page.goto('/login');

      // Fill non-existent email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('nonexistent@example.com');

      // Fill PIN using individual inputs
      const pinInputs = page.locator('input[maxlength="1"]');
      if (await pinInputs.count() >= 4) {
        await pinInputs.nth(0).fill('A');
        await pinInputs.nth(1).fill('B');
        await pinInputs.nth(2).fill('1');
        await pinInputs.nth(3).fill('2');
      }

      // Submit - should be enabled now
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled({ timeout: 2000 });
      await submitButton.click();

      // Wait for API response and error display
      await page.waitForTimeout(2000);

      // Should show generic error (check for Dutch error messages)
      const errorVisible = await page.locator('[class*="error"], [class*="alert"], text=/onjuist|fout|mislukt/i').isVisible();
      expect(errorVisible).toBeTruthy();
    });
  });
});
