import { Page, expect } from '@playwright/test';

export type UserType = 'consultant' | 'founder';

export interface TestUser {
  email: string;
  password: string;
  type: UserType;
}

export const CONSULTANT_USER: TestUser = {
  email: 'chris00walker@gmail.com',
  password: 'Test123!',
  type: 'consultant',
};

export const FOUNDER_USER: TestUser = {
  email: 'chris00walker@proton.me',
  password: 'W7txYdr7bV0Tc30U0bv&',
  type: 'founder',
};

// Default to consultant for backward compatibility
export const TEST_USER = CONSULTANT_USER;

/**
 * Login helper that navigates to the site and performs login
 * @param page - Playwright page object
 * @param user - User credentials (defaults to CONSULTANT_USER)
 */
export async function login(page: Page, user: TestUser = CONSULTANT_USER) {
  // Navigate directly to the login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Check if we're already logged in and got redirected (look for dashboard or onboarding elements)
  const isLoggedIn = await page.locator('[data-testid="dashboard"], [data-testid="onboarding"]').isVisible().catch(() => false);

  if (isLoggedIn) {
    console.log('Already logged in, skipping login flow');
    return;
  }

  // Check if login form is visible
  const emailInput = page.locator('input#email');
  const hasLoginForm = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

  if (!hasLoginForm) {
    // May have been redirected - check current URL
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/onboarding')) {
      console.log(`Already authenticated, on: ${currentUrl}`);
      return;
    }
    throw new Error(`Login form not found and not redirected. URL: ${currentUrl}`);
  }

  // Fill in email/password form (NOT the GitHub OAuth button)
  const passwordInput = page.locator('input#password');

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(user.email);

  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(user.password);

  // Click the email/password submit button (NOT GitHub button)
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for any navigation after login - could be onboarding OR dashboard
  // Users who completed onboarding go to dashboard, new users go to onboarding
  try {
    await page.waitForURL(
      (url) => url.pathname.includes('/onboarding') ||
               url.pathname.includes('/dashboard') ||
               url.pathname.includes('/founder-dashboard') ||
               url.pathname.includes('/consultant-dashboard'),
      { timeout: 15000 }
    );
    const currentUrl = page.url();
    console.log(`Login successful, redirected to: ${currentUrl}`);
  } catch (e) {
    const currentUrl = page.url();
    // If still on login, check for error message
    if (currentUrl.includes('/login')) {
      const errorMsg = await page.locator('[role="alert"], .error-message, text=Invalid').textContent().catch(() => null);
      if (errorMsg) {
        throw new Error(`Login failed: ${errorMsg}`);
      }
      throw new Error(`Login timed out, still on login page`);
    }
    console.log(`Login completed, current URL: ${currentUrl}`);
  }

  console.log(`Login successful as ${user.type}: ${user.email}`);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Look for user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user menu" i], button:has-text("Account")').first();

  if (await userMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
    await userMenu.click();

    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Log out")').first();
    await logoutButton.click();

    // Wait for redirect to login page
    await page.waitForURL('**/login**', { timeout: 10000 });
  }
}

/**
 * Check if user is on onboarding page
 */
export async function isOnOnboardingPage(page: Page): Promise<boolean> {
  return await page.locator('[data-testid="onboarding"], [data-testid="chat-interface"]').isVisible({ timeout: 5000 }).catch(() => false);
}
