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

  // Fill in email/password form (NOT the GitHub OAuth button)
  const emailInput = page.locator('input#email');
  const passwordInput = page.locator('input#password');

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(user.email);

  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(user.password);

  // Click the email/password submit button (NOT GitHub button)
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for navigation based on user type
  // Founders and Consultants get redirected to their specific onboarding pages
  const expectedPattern = user.type === 'consultant'
    ? '**/onboarding/consultant**'
    : '**/onboarding**';

  try {
    await page.waitForURL(expectedPattern, { timeout: 15000 });
    console.log(`${user.type} redirected to onboarding page`);
  } catch (e) {
    // If not redirected to onboarding, check if we're on dashboard
    const currentUrl = page.url();
    console.log(`Navigation timeout, current URL: ${currentUrl}`);

    // If we're on dashboard, need to click AI Assistant button
    if (currentUrl.includes('/dashboard')) {
      console.log('On dashboard, clicking AI Assistant button');
      const aiAssistantButton = page.locator('button:has-text("AI Assistant"), a:has-text("AI Assistant")').first();
      await aiAssistantButton.waitFor({ state: 'visible', timeout: 10000 });
      await aiAssistantButton.click();

      // Wait for onboarding page to load
      await page.waitForURL(expectedPattern, { timeout: 15000 });
    }
  }

  // Wait for onboarding interface to be ready (no networkidle - too slow)
  const onboardingElement = page.locator('[data-testid="onboarding"]');
  await onboardingElement.waitFor({ state: 'visible', timeout: 20000 });

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
