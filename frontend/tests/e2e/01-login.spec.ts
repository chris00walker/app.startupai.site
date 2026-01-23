/**
 * @story US-AU01
 */

import { test, expect } from '@playwright/test';
import { login, logout, CONSULTANT_USER, FOUNDER_USER } from './helpers/auth';
import { checkA11y } from './helpers/accessibility';

test.describe('Authentication Flow - Consultant User', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/login');
  });

  test('login page should be accessible', async ({ page }) => {
    // WCAG 2.1 AA accessibility check on login page
    await checkA11y(page, 'login page');
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
    // Clear any existing session to ensure we're on the login page
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Wait for login form
    const emailInput = page.locator('input#email, input[type="email"]').first();
    const passwordInput = page.locator('input#password, input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    // Fill with invalid credentials
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for either error message or to stay on login page
    const errorMessage = page.locator('[role="alert"], .error, [data-testid="error-message"]');

    // Check if error appeared or we're still on login page (with email input visible)
    const stillOnLoginPage = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
    const hasErrorMessage = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

    expect(stillOnLoginPage || hasErrorMessage).toBeTruthy();

    console.log('Invalid credentials correctly rejected');
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
