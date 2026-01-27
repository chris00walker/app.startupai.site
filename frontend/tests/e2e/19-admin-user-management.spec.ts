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

  test('should search users by email and return results', async ({ page }) => {
    // Search for the admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');

    // Click search button
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST return at least 1 result - the admin user we're logged in as
    // This verifies RLS policy allows admin to see user profiles
    const resultsTable = page.locator('table tbody tr');
    await expect(resultsTable).toHaveCount({ min: 1 }, { timeout: 10000 });

    // Verify the results header shows count > 0
    await expect(page.getByText(/Results \(\d+ user/)).toBeVisible();
  });

  test('should display user role and status in results', async ({ page }) => {
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // Results table MUST have rows - fail if no results
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount({ min: 1 }, { timeout: 10000 });

    // First row should have role badge
    const firstRow = tableRows.first();
    const roleBadge = firstRow.locator('[class*="badge"]');
    await expect(roleBadge).toBeVisible();

    // Should show "Admin" badge for admin user
    await expect(firstRow.getByText(/admin/i)).toBeVisible();
  });

  test('should show "No users found" only when search has no matches', async ({ page }) => {
    // Search for a non-existent user
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('nonexistent-user-xyz-12345@fakeemail.invalid');

    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // Should show no results message
    await expect(page.getByText(/no users found/i)).toBeVisible({ timeout: 5000 });
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
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    // Verify profile page elements
    await expect(page.getByText(/basic information/i)).toBeVisible();
    await expect(page.getByText(/subscription/i)).toBeVisible();
  });

  test('should display tabs for profile, projects, activity, and actions', async ({ page }) => {
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    // Verify tabs are present
    await expect(page.getByRole('tab', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /projects/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /activity/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /admin actions/i })).toBeVisible();
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
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    // Go to admin actions tab
    await page.getByRole('tab', { name: /admin actions/i }).click();

    // Verify impersonation option exists
    await expect(page.getByText(/impersonate user/i)).toBeVisible();
  });

  test('should not allow impersonating admin users', async ({ page }) => {
    // Search for admin user
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /admin actions/i }).click();

    // The impersonate button for admins should be disabled or show "Cannot Impersonate Admin"
    const impersonateBtn = page.getByRole('button', { name: /cannot impersonate|view as user/i });
    await expect(impersonateBtn).toBeVisible();
    await expect(impersonateBtn).toBeDisabled();
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
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /admin actions/i }).click();

    // Verify change role button exists
    await expect(page.getByRole('button', { name: /change role/i })).toBeVisible();
  });

  test('should show confirmation dialog before role change', async ({ page }) => {
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /admin actions/i }).click();

    // Click change role button
    await page.getByRole('button', { name: /change role/i }).click();

    // Dialog should appear with role selector and reason field
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/reason for change/i)).toBeVisible();
  });

  test('should require reason for role change', async ({ page }) => {
    // Search for admin user (known to exist)
    const searchInput = page.getByPlaceholder(/search.*email/i);
    await searchInput.fill('admin');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('networkidle');

    // MUST find user link - fail if search returns no results
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    await expect(userLink).toBeVisible({ timeout: 10000 });

    await userLink.click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /admin actions/i }).click();
    await page.getByRole('button', { name: /change role/i }).click();

    // Confirm button should be disabled without reason
    const confirmBtn = page.getByRole('button', { name: /confirm change/i });
    await expect(confirmBtn).toBeDisabled();
  });
});
