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
 * Login as admin user - uses strict assertions
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });

  await emailInput.fill(ADMIN_USER.email);
  await passwordInput.fill(ADMIN_USER.password);

  const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
  await expect(submitButton).toBeVisible({ timeout: 5000 });
  await submitButton.click();

  await page.waitForLoadState('networkidle');
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
    await expect(page.getByRole('heading', { name: /failed workflows/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display workflow list with status and error', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    // Workflow table MUST be visible
    const workflowTable = page.locator('table');
    await expect(workflowTable).toBeVisible({ timeout: 10000 });

    // Table should have headers for key columns
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible({ timeout: 5000 });
  });

  test('should show retry button for failed workflows', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    // If there are failed workflows, retry buttons should be present and enabled
    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    await expect(retryButton).toBeVisible({ timeout: 10000 });
    await expect(retryButton).toBeEnabled();
  });

  test('should show confirmation dialog before retry', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');

    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    await expect(retryButton).toBeVisible({ timeout: 10000 });
    await retryButton.click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/are you sure/i)).toBeVisible({ timeout: 5000 });
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
    await expect(page.getByRole('heading', { name: /system health/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display Modal API status', async ({ page }) => {
    // Verify Modal status card
    await expect(page.getByText(/modal api/i)).toBeVisible({ timeout: 10000 });

    // Status indicator should be present
    const statusIndicator = page
      .locator('[data-testid="modal-status"], .text-green-500, .text-red-500, .text-yellow-500')
      .first();
    await expect(statusIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should display Supabase status', async ({ page }) => {
    // Verify Supabase status card
    await expect(page.getByText(/supabase/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display workflow statistics', async ({ page }) => {
    // Should show active, failed, and pending counts
    await expect(page.getByText(/active.*workflows|active runs/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have refresh capability', async ({ page }) => {
    // Verify refresh button exists
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible({ timeout: 10000 });
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
    await expect(page.getByRole('heading', { name: /feature flags/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display feature flag list or empty state', async ({ page }) => {
    // Either show flag cards or empty state - one MUST be visible
    const flagCard = page.locator('[class*="card"]').first();
    const emptyState = page.getByText(/no feature flags/i);

    await expect(flagCard.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('should show edit button on feature flag card', async ({ page }) => {
    const flagCard = page.locator('[class*="card"]').first();
    await expect(flagCard).toBeVisible({ timeout: 10000 });

    // Edit button (pencil icon) should be present
    const editButton = flagCard.getByRole('button').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
  });

  test('should show edit dialog with toggle and percentage options', async ({ page }) => {
    const flagCard = page.locator('[class*="card"]').first();
    await expect(flagCard).toBeVisible({ timeout: 10000 });

    // Click the edit button (pencil icon)
    const editButton = flagCard.getByRole('button').first();
    await editButton.click();

    // Dialog should appear with options
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/enable globally/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/percentage rollout/i)).toBeVisible({ timeout: 5000 });
  });

  test('should require reason for feature flag change', async ({ page }) => {
    const flagCard = page.locator('[class*="card"]').first();
    await expect(flagCard).toBeVisible({ timeout: 10000 });

    const editButton = flagCard.getByRole('button').first();
    await editButton.click();

    // Reason field should be present and required
    await expect(page.getByText(/reason for change/i)).toBeVisible({ timeout: 5000 });

    // Save button should be disabled without reason
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await expect(saveButton).toBeDisabled();
  });
});
