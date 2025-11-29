import { Page, expect } from '@playwright/test';

export type UserType = 'consultant' | 'founder';

export interface TestUser {
  email: string;
  password: string;
  type: UserType;
}

// Timeout constants for consistent configuration
const LOGIN_REDIRECT_TIMEOUT = 25_000; // 25s for auth callback chain
const ELEMENT_VISIBILITY_TIMEOUT = 10_000; // 10s for element checks
const SESSION_CHECK_TIMEOUT = 5_000; // 5s for quick session checks

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
 * Verify session is established after login
 */
async function verifySession(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(c =>
    c.name.includes('supabase') ||
    c.name.includes('sb-') ||
    c.name.includes('auth')
  );
}

/**
 * Core login implementation
 */
async function loginCore(page: Page, user: TestUser): Promise<void> {
  // Navigate directly to the login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Check if we're already logged in (look for dashboard or onboarding elements)
  const dashboardOrOnboarding = page.locator('[data-testid="dashboard"], [data-testid="onboarding"]');
  const isLoggedIn = await dashboardOrOnboarding.isVisible({ timeout: SESSION_CHECK_TIMEOUT }).catch(() => false);

  if (isLoggedIn) {
    console.log('Already logged in, skipping login flow');
    return;
  }

  // Check if login form is visible
  const emailInput = page.locator('input#email');
  const hasLoginForm = await emailInput.isVisible({ timeout: SESSION_CHECK_TIMEOUT }).catch(() => false);

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

  await expect(emailInput).toBeVisible({ timeout: ELEMENT_VISIBILITY_TIMEOUT });
  await emailInput.fill(user.email);

  await expect(passwordInput).toBeVisible({ timeout: ELEMENT_VISIBILITY_TIMEOUT });
  await passwordInput.fill(user.password);

  // Click the email/password submit button (NOT GitHub button)
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for navigation after login - could be onboarding OR dashboard
  // Auth callback chain: token exchange → metadata update → profile lookup → redirect
  try {
    await page.waitForURL(
      (url) => url.pathname.includes('/onboarding') ||
               url.pathname.includes('/dashboard') ||
               url.pathname.includes('/founder-dashboard') ||
               url.pathname.includes('/consultant-dashboard'),
      { timeout: LOGIN_REDIRECT_TIMEOUT }
    );
    const currentUrl = page.url();
    console.log(`Login successful, redirected to: ${currentUrl}`);
  } catch {
    const currentUrl = page.url();
    // If still on login, check for error message
    if (currentUrl.includes('/login')) {
      const errorMsg = await page.locator('[role="alert"], .error-message, .error').textContent().catch(() => null);
      if (errorMsg) {
        throw new Error(`Login failed: ${errorMsg}`);
      }
      throw new Error(`Login timed out after ${LOGIN_REDIRECT_TIMEOUT}ms, still on login page`);
    }
    console.log(`Login completed, current URL: ${currentUrl}`);
  }

  // Verify session cookie is set
  const hasSession = await verifySession(page);
  if (!hasSession) {
    console.warn('Warning: No auth cookie found after login');
  }

  console.log(`Login successful as ${user.type}: ${user.email}`);
}

/**
 * Login helper that navigates to the site and performs login
 * @param page - Playwright page object
 * @param user - User credentials (defaults to CONSULTANT_USER)
 */
export async function login(page: Page, user: TestUser = CONSULTANT_USER) {
  await loginCore(page, user);
}

/**
 * Login with retry for flaky network conditions
 * @param page - Playwright page object
 * @param user - User credentials
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 */
export async function loginWithRetry(
  page: Page,
  user: TestUser = CONSULTANT_USER,
  maxRetries = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await loginCore(page, user);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Login attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        // Clear cookies and retry
        await page.context().clearCookies();
        await page.waitForTimeout(1000); // Brief pause before retry
      }
    }
  }

  throw lastError || new Error('Login failed after all retries');
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Look for user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user menu" i], button:has-text("Account")').first();

  if (await userMenu.isVisible({ timeout: SESSION_CHECK_TIMEOUT }).catch(() => false)) {
    await userMenu.click();

    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Log out")').first();
    await logoutButton.click();

    // Wait for redirect to login page
    await page.waitForURL('**/login**', { timeout: ELEMENT_VISIBILITY_TIMEOUT });
  }
}

/**
 * Check if user is on onboarding page
 */
export async function isOnOnboardingPage(page: Page): Promise<boolean> {
  return await page.locator('[data-testid="onboarding"], [data-testid="chat-interface"]').isVisible({ timeout: SESSION_CHECK_TIMEOUT }).catch(() => false);
}

/**
 * Wait for authenticated page to load (dashboard or onboarding)
 * Use this after login to ensure page is fully rendered
 */
export async function waitForAuthenticatedPage(page: Page): Promise<void> {
  const authenticatedContent = page.locator(
    '[data-testid="dashboard"], [data-testid="onboarding"], [data-testid="founder-dashboard"], [data-testid="consultant-dashboard"]'
  );
  await expect(authenticatedContent.first()).toBeVisible({ timeout: ELEMENT_VISIBILITY_TIMEOUT });
}
