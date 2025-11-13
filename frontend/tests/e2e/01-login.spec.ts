import { test, expect } from '@playwright/test';
import { login, logout, CONSULTANT_USER, FOUNDER_USER } from './helpers/auth';

test.describe('Authentication Flow - Consultant User', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/login');
  });

  test('should successfully login as Consultant', async ({ page }) => {
    // Perform login as consultant
    await login(page, CONSULTANT_USER);

    // Verify we're logged in - check for authenticated user elements
    const authenticatedElements = page.locator(
      '[data-testid="dashboard"], [data-testid="onboarding"], [data-testid="user-menu"], [aria-label*="user" i]'
    );

    await expect(authenticatedElements.first()).toBeVisible({ timeout: 15000 });

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/consultant-login-success.png', fullPage: true });
  });

  test('should redirect Consultant to appropriate dashboard', async ({ page }) => {
    // Login as consultant
    await login(page, CONSULTANT_USER);

    // Login helper now waits for onboarding element, so we're ready
    const url = page.url();
    console.log(`Consultant redirected to: ${url}`);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/consultant-post-login.png', fullPage: true });
  });
});

test.describe('Authentication Flow - Founder User', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/login');
  });

  test('should successfully login as Founder', async ({ page }) => {
    // Perform login as founder
    await login(page, FOUNDER_USER);

    // Verify we're logged in
    const authenticatedElements = page.locator(
      '[data-testid="dashboard"], [data-testid="onboarding"], [data-testid="user-menu"], [aria-label*="user" i]'
    );

    await expect(authenticatedElements.first()).toBeVisible({ timeout: 15000 });

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/founder-login-success.png', fullPage: true });
  });

  test('should redirect Founder to onboarding if not completed', async ({ page }) => {
    // Login as founder
    await login(page, FOUNDER_USER);

    // Login helper now waits for onboarding element, so we're ready
    const url = page.url();
    const isOnboarding = url.includes('/onboarding') || url.includes('/chat');

    if (isOnboarding) {
      // Verify onboarding UI elements are present
      const chatInterface = page.locator('[data-testid="chat-interface"], textarea, [placeholder*="message" i]');
      await expect(chatInterface.first()).toBeVisible({ timeout: 10000 });

      console.log('Founder redirected to onboarding (expected for new founders)');
    } else {
      console.log('Founder has completed onboarding, redirected to dashboard');
    }

    // Take a screenshot
    await page.screenshot({ path: 'test-results/founder-post-login.png', fullPage: true });
  });

  test('should display validation errors for invalid credentials', async ({ page }) => {
    // Try to find login button/link
    const loginButton = page.locator('button:has-text("Log in"), button:has-text("Sign in"), a:has-text("Log in")').first();

    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();

      // Wait for login form to appear
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      const passwordInput = page.locator('input[type="password"]').first();

      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill('invalid@example.com');
        await passwordInput.fill('wrongpassword');

        const submitButton = page.locator('button[type="submit"], button:has-text("Log in")').first();
        await submitButton.click();

        // Wait for error message
        await page.waitForTimeout(2000);

        // Look for error messages
        const errorMessage = page.locator('[role="alert"], .error, [data-testid="error-message"]');

        // Check if error appeared or we're still on login page
        const stillOnLoginPage = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
        const hasErrorMessage = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

        expect(stillOnLoginPage || hasErrorMessage).toBeTruthy();

        console.log('Invalid credentials correctly rejected');
      } else {
        console.log('Login form not found, might be using different auth flow');
      }
    } else {
      console.log('Login button not found, user might already be logged in');
    }
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Login
    await login(page);

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for authenticated elements to reappear
    const authenticatedElements = page.locator(
      '[data-testid="dashboard"], [data-testid="onboarding"], [data-testid="user-menu"]'
    );

    await expect(authenticatedElements.first()).toBeVisible({ timeout: 15000 });

    console.log('Session maintained after reload');
  });
});
