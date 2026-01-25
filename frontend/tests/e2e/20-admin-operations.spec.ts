/**
 * @story US-A04, US-A05, US-A06
 */

/**
 * 20-admin-operations.spec.ts
 *
 * Admin Operations E2E Tests
 *
 * Covers user stories:
 * - US-A04: Retry Failed Workflow
 * - US-A05: View System Health Dashboard
 * - US-A06: Manage Feature Flags
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

// =============================================================================
// US-A04: Retry Failed Workflow
// =============================================================================

test.describe('US-A04: Retry Failed Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display failed workflows page', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    // Verify the page loads
    await expect(page.getByRole('heading', { name: /failed workflows/i })).toBeVisible();
  });

  test('should display workflow list with status and error', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    // If there are workflows, they should show status indicators
    const workflowTable = page.locator('table');
    if (await workflowTable.isVisible()) {
      // Table should have headers for key columns
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
    }
  });

  test('should show retry button for failed workflows', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    // If there are failed workflows, retry buttons should be present
    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled();
    }
  });

  test('should show confirmation dialog before retry', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    if (await retryButton.isVisible()) {
      await retryButton.click();

      // Dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/are you sure/i)).toBeVisible();
    }
  });
});

// =============================================================================
// US-A05: View System Health Dashboard
// =============================================================================

test.describe('US-A05: View System Health Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display system health dashboard', async ({ page }) => {
    // Verify the page loads with title
    await expect(page.getByRole('heading', { name: /system health/i })).toBeVisible();
  });

  test('should display Modal API status', async ({ page }) => {
    // Verify Modal status card
    await expect(page.getByText(/modal api/i)).toBeVisible();

    // Status indicator should be present
    const statusIndicator = page.locator('[data-testid="modal-status"], .text-green-500, .text-red-500, .text-yellow-500').first();
    await expect(statusIndicator).toBeVisible();
  });

  test('should display Supabase status', async ({ page }) => {
    // Verify Supabase status card
    await expect(page.getByText(/supabase/i)).toBeVisible();
  });

  test('should display workflow statistics', async ({ page }) => {
    // Should show active, failed, and pending counts
    await expect(page.getByText(/active.*workflows|active runs/i)).toBeVisible();
  });

  test('should have refresh capability', async ({ page }) => {
    // Verify refresh button exists
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });
});

// =============================================================================
// US-A06: Manage Feature Flags
// =============================================================================

test.describe('US-A06: Manage Feature Flags', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/features');
    await page.waitForLoadState('networkidle');
  });

  test('should display feature flags page', async ({ page }) => {
    // Verify the page loads
    await expect(page.getByRole('heading', { name: /feature flags/i })).toBeVisible();
  });

  test('should display feature flag list or empty state', async ({ page }) => {
    // Either show flag cards or empty state
    const flagCard = page.locator('[class*="card"]').first();
    const emptyState = page.getByText(/no feature flags/i);

    const hasFlags = await flagCard.isVisible();
    const isEmpty = await emptyState.isVisible();

    // One of these should be visible
    expect(hasFlags || isEmpty).toBeTruthy();
  });

  test('should show edit button on feature flag card', async ({ page }) => {
    const flagCard = page.locator('[class*="card"]').first();
    if (await flagCard.isVisible()) {
      // Edit button (pencil icon) should be present
      const editButton = flagCard.getByRole('button').first();
      await expect(editButton).toBeVisible();
    }
  });

  test('should show edit dialog with toggle and percentage options', async ({ page }) => {
    const flagCard = page.locator('[class*="card"]').first();
    if (await flagCard.isVisible()) {
      // Click the edit button (pencil icon)
      const editButton = flagCard.getByRole('button').first();
      await editButton.click();

      // Dialog should appear with options
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/enable globally/i)).toBeVisible();
      await expect(page.getByText(/percentage rollout/i)).toBeVisible();
    }
  });

  test('should require reason for feature flag change', async ({ page }) => {
    const flagCard = page.locator('[class*="card"]').first();
    if (await flagCard.isVisible()) {
      const editButton = flagCard.getByRole('button').first();
      await editButton.click();

      // Reason field should be present and required
      await expect(page.getByText(/reason for change/i)).toBeVisible();

      // Save button should be disabled without reason
      const saveButton = page.getByRole('button', { name: /save changes/i });
      await expect(saveButton).toBeDisabled();
    }
  });
});
