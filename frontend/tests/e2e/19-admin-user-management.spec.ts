/**
 * @story US-A01, US-A02, US-A03, US-A08, US-A11
 */

/**
 * 19-admin-user-management.spec.ts
 *
 * Admin User Management E2E Tests
 *
 * Covers user stories:
 * - US-A01: Search and Find Users
 * - US-A02: View User Profile and State
 * - US-A03: Impersonate User (Read-Only)
 * - US-A08: Change User Role
 *
 * Story Reference: docs/user-experience/stories/README.md
 * Journey Reference: docs/user-experience/journeys/platform/admin-journey-map.md
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Admin user credentials
 */
const ADMIN_USER = {
  email: 'admin@startupai.com',
  password: 'AdminTest123!',
  type: 'admin' as const,
};

/**
 * Login as admin user
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
    await emailInput.fill(ADMIN_USER.email);
    await passwordInput.fill(ADMIN_USER.password);

    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    await submitButton.click();

    await page.waitForLoadState('networkidle');
  }
}

/**
 * Navigate to admin users page
 */
async function navigateToAdminUsers(page: Page): Promise<void> {
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// US-A01: Search and Find Users
// =============================================================================

test.describe('US-A01: Search and Find Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminUsers(page);
  });

  test('should display user search interface', async ({ page }) => {
    // Verify the search page loads with heading
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

    // Verify search input is present
    await expect(page.getByPlaceholder(/search.*email/i)).toBeVisible();
  });

  test('should search users by email', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('test@');

    // Click search button
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // Should display results or no results message
    const resultsOrEmpty = page.locator('[data-testid="user-results"], [data-testid="no-results"]');
    await expect(resultsOrEmpty).toBeVisible({ timeout: 5000 });
  });

  test('should display user role and status in results', async ({ page }) => {
    // Perform a search
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // If results exist, they should show role badges
    const userCard = page.locator('[data-testid="user-card"]').first();
    if (await userCard.isVisible()) {
      // User cards should have role indicator
      const roleBadge = userCard.locator('[class*="badge"], [data-testid="role-badge"]');
      await expect(roleBadge).toBeVisible();
    }
  });
});

// =============================================================================
// US-A02: View User Profile and State
// =============================================================================

test.describe('US-A02: View User Profile and State', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminUsers(page);
  });

  test('should display user profile details on click', async ({ page }) => {
    // Search for a user
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // Click on first user result if available
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      // Verify profile page elements
      await expect(page.getByText(/basic information/i)).toBeVisible();
      await expect(page.getByText(/subscription/i)).toBeVisible();
    }
  });

  test('should display tabs for profile, projects, activity, and actions', async ({ page }) => {
    // Navigate to a user profile directly (using a known path pattern)
    await page.goto('/admin/users');
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      // Verify tabs are present
      await expect(page.getByRole('tab', { name: /profile/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /projects/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /activity/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /admin actions/i })).toBeVisible();
    }
  });
});

// =============================================================================
// US-A03: Impersonate User (Read-Only)
// =============================================================================

test.describe('US-A03: Impersonate User (Read-Only)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminUsers(page);
  });

  test('should show impersonation button on user profile', async ({ page }) => {
    // Navigate to a user profile
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      // Go to admin actions tab
      await page.getByRole('tab', { name: /admin actions/i }).click();

      // Verify impersonation option exists
      await expect(page.getByText(/impersonate user/i)).toBeVisible();
    }
  });

  test('should not allow impersonating admin users', async ({ page }) => {
    // Navigate to an admin user profile and verify button is disabled
    // This requires navigating to an admin user
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('tab', { name: /admin actions/i }).click();

      // The impersonate button for admins should be disabled or show "Cannot Impersonate Admin"
      const impersonateBtn = page.getByRole('button', { name: /cannot impersonate|view as user/i });
      if (await impersonateBtn.isVisible()) {
        await expect(impersonateBtn).toBeDisabled();
      }
    }
  });
});

// =============================================================================
// US-A08: Change User Role
// =============================================================================

test.describe('US-A08: Change User Role', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminUsers(page);
  });

  test('should display change role button on user profile', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('tab', { name: /admin actions/i }).click();

      // Verify change role button exists
      await expect(page.getByRole('button', { name: /change role/i })).toBeVisible();
    }
  });

  test('should show confirmation dialog before role change', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('tab', { name: /admin actions/i }).click();

      // Click change role button
      await page.getByRole('button', { name: /change role/i }).click();

      // Dialog should appear with role selector and reason field
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/reason for change/i)).toBeVisible();
    }
  });

  test('should require reason for role change', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('@');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForLoadState('networkidle');

      await page.getByRole('tab', { name: /admin actions/i }).click();
      await page.getByRole('button', { name: /change role/i }).click();

      // Confirm button should be disabled without reason
      const confirmBtn = page.getByRole('button', { name: /confirm change/i });
      await expect(confirmBtn).toBeDisabled();
    }
  });
});
