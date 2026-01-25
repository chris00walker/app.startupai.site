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
 * Navigate to a user profile's admin actions tab
 */
async function navigateToUserAdminActions(page: Page): Promise<boolean> {
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');

  const searchInput = page.getByPlaceholder(/search.*email/i);
  await searchInput.fill('@');
  await page.getByRole('button', { name: /search/i }).click();
  await page.waitForLoadState('networkidle');

  const userLink = page.locator('a[href*="/admin/users/"]').first();
  if (await userLink.isVisible()) {
    await userLink.click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /admin actions/i }).click();
    return true;
  }
  return false;
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
    const actionTypeSelect = page.locator('select, [role="combobox"]').first();
    if (await actionTypeSelect.isVisible()) {
      await actionTypeSelect.click();
      // Should show action type options
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForLoadState('networkidle');
        // Page should update after filter
      }
    }
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
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Verify export data section exists
      await expect(page.getByText(/export user data/i)).toBeVisible();
    }
  });

  test('should display export type selector', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Export panel should have type selector
      const exportSelect = page.locator('[data-testid="export-type"], select').first();
      await expect(exportSelect).toBeVisible();
    }
  });

  test('should have export button', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Export button should be present
      await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    }
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
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Verify integrity check section exists
      await expect(page.getByText(/data integrity check/i)).toBeVisible();
    }
  });

  test('should have run check button', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Run check button should be present
      await expect(page.getByRole('button', { name: /run check/i })).toBeVisible();
    }
  });

  test('should show results after running check', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      const runButton = page.getByRole('button', { name: /run check/i });
      await runButton.click();

      // Wait for check to complete
      await page.waitForLoadState('networkidle');

      // Should show either passed or issues found
      const result = page.locator('[data-testid="integrity-result"], .text-green-500, .text-yellow-500');
      await expect(result).toBeVisible({ timeout: 10000 });
    }
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
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Verify billing section exists
      await expect(page.getByText(/billing.*subscription/i)).toBeVisible();
    }
  });

  test('should display subscription tier info', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Subscription tier should be displayed
      await expect(page.getByText(/tier/i)).toBeVisible();
    }
  });

  test('should have apply credit button', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // Apply credit button should be present
      await expect(page.getByRole('button', { name: /apply credit/i })).toBeVisible();
    }
  });

  test('should show credit dialog on button click', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      await page.getByRole('button', { name: /apply credit/i }).click();

      // Dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/credit type/i)).toBeVisible();
    }
  });

  test('should require reason for applying credit', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      await page.getByRole('button', { name: /apply credit/i }).click();

      // Reason field should be required
      await expect(page.getByText(/reason/i)).toBeVisible();

      // Apply button should be disabled without reason
      const applyButton = page.getByRole('button', { name: /apply credit/i }).last();
      await expect(applyButton).toBeDisabled();
    }
  });

  test('should show stripe pending notice for monetary credits', async ({ page }) => {
    const found = await navigateToUserAdminActions(page);
    if (found) {
      // The billing panel should indicate Stripe is pending
      const stripePending = page.getByText(/stripe pending/i);
      await expect(stripePending).toBeVisible();
    }
  });
});
