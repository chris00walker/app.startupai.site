/**
 * @story US-A07, US-A09, US-A10, US-A12
 */

/**
 * 21-admin-audit.spec.ts
 *
 * Admin Audit and Data Operations E2E Tests
 *
 * Covers user stories:
 * - US-A07: View Audit Logs
 * - US-A09: Export User Data
 * - US-A10: Run Data Integrity Check
 * - US-A12: Billing Management
 *
 * Story Reference: docs/user-experience/stories/README.md
 * Journey Reference: docs/user-experience/journeys/platform/admin-journey-map.md
 */

import { test, expect, Page } from '@playwright/test';
import { ADMIN_USER } from './helpers/auth';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Login as admin user - uses strict assertions
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  // Login form MUST be visible
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });

  await emailInput.fill(ADMIN_USER.email);
  await passwordInput.fill(ADMIN_USER.password);

  // Use exact match to avoid matching "Sign in with GitHub" button
  const submitButton = page.getByRole('button', { name: 'Sign in', exact: true });
  await expect(submitButton).toBeVisible({ timeout: 5000 });
  await submitButton.click();

  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a user profile's admin actions tab - uses strict assertions
 */
async function navigateToUserAdminActions(page: Page): Promise<void> {
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');

  const searchInput = page.getByPlaceholder(/search.*email/i);
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill('@');

  const searchButton = page.getByRole('button', { name: /search/i });
  await expect(searchButton).toBeVisible({ timeout: 5000 });
  await searchButton.click();
  await page.waitForLoadState('networkidle');

  // User list MUST have results
  const userLink = page.locator('a[href*="/admin/users/"]').first();
  await expect(userLink).toBeVisible({ timeout: 10000 });
  await userLink.click();
  await page.waitForLoadState('networkidle');

  // Admin actions tab MUST exist
  const adminActionsTab = page.getByRole('tab', { name: /admin actions/i });
  await expect(adminActionsTab).toBeVisible({ timeout: 5000 });
  await adminActionsTab.click();
}

// =============================================================================
// US-A07: View Audit Logs
// =============================================================================

test.describe('US-A07: View Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
  });

  test('should display audit logs page', async ({ page }) => {
    // Verify the page loads
    await expect(page.getByRole('heading', { name: /audit logs/i })).toBeVisible();
  });

  test('should display filter options', async ({ page }) => {
    // Should have action type filter
    await expect(page.getByText(/action type/i)).toBeVisible();
  });

  test('should display audit log table or empty state', async ({ page }) => {
    // Either show log table or empty state
    const table = page.locator('table');
    const emptyState = page.getByText(/no audit logs/i);

    const hasLogs = await table.isVisible();
    const isEmpty = await emptyState.isVisible();

    expect(hasLogs || isEmpty).toBeTruthy();
  });

  test('should filter by action type', async ({ page }) => {
    // Filter select MUST exist
    const actionTypeSelect = page.locator('select, [role="combobox"]').first();
    await expect(actionTypeSelect).toBeVisible({ timeout: 10000 });
    await actionTypeSelect.click();

    // Options MUST appear
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    await page.waitForLoadState('networkidle');
  });
});

// =============================================================================
// US-A09: Export User Data
// =============================================================================

test.describe('US-A09: Export User Data', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display export data option on user profile', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Verify export data section exists
    await expect(page.getByText(/export user data/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display export type selector', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Export panel should have type selector
    const exportSelect = page.locator('[data-testid="export-type"], select').first();
    await expect(exportSelect).toBeVisible({ timeout: 10000 });
  });

  test('should have export button', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Export button should be present
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// US-A10: Run Data Integrity Check
// =============================================================================

test.describe('US-A10: Run Data Integrity Check', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display integrity check option on user profile', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Verify integrity check section exists
    await expect(page.getByText(/data integrity check/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have run check button', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Run check button should be present
    await expect(page.getByRole('button', { name: /run check/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show results after running check', async ({ page }) => {
    await navigateToUserAdminActions(page);

    const runButton = page.getByRole('button', { name: /run check/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    // Wait for check to complete
    await page.waitForLoadState('networkidle');

    // Should show either passed or issues found
    const result = page.locator('[data-testid="integrity-result"], .text-green-500, .text-yellow-500');
    await expect(result).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// US-A12: Billing Management
// =============================================================================

test.describe('US-A12: Billing Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display billing section on user profile', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Verify billing section exists
    await expect(page.getByText(/billing.*subscription/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display subscription tier info', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Subscription tier should be displayed
    await expect(page.getByText(/tier/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have apply credit button', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // Apply credit button should be present
    await expect(page.getByRole('button', { name: /apply credit/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show credit dialog on button click', async ({ page }) => {
    await navigateToUserAdminActions(page);

    const applyCreditButton = page.getByRole('button', { name: /apply credit/i });
    await expect(applyCreditButton).toBeVisible({ timeout: 10000 });
    await applyCreditButton.click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/credit type/i)).toBeVisible({ timeout: 5000 });
  });

  test('should require reason for applying credit', async ({ page }) => {
    await navigateToUserAdminActions(page);

    const applyCreditButton = page.getByRole('button', { name: /apply credit/i });
    await expect(applyCreditButton).toBeVisible({ timeout: 10000 });
    await applyCreditButton.click();

    // Reason field should be required
    await expect(page.getByText(/reason/i)).toBeVisible({ timeout: 5000 });

    // Apply button should be disabled without reason
    const applyButton = page.getByRole('button', { name: /apply credit/i }).last();
    await expect(applyButton).toBeDisabled();
  });

  test('should show stripe pending notice for monetary credits', async ({ page }) => {
    await navigateToUserAdminActions(page);
    // The billing panel should indicate Stripe is pending
    const stripePending = page.getByText(/stripe pending/i);
    await expect(stripePending).toBeVisible({ timeout: 10000 });
  });
});
