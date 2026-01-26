/**
 * @story US-F12
 */

/**
 * 36-assumption-map.spec.ts
 *
 * Assumption Map E2E Tests
 *
 * Covers user stories:
 * - US-F12: Manage Assumption Map
 *
 * Story Reference: docs/user-experience/stories/founder.md
 * Journey Reference: Strategyzer Assumption Map methodology
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };
const ASSUMPTION_MAP_URL = '/founder-dashboard?tab=assumptions';

test.describe('US-F12: Manage Assumption Map', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should navigate to assumptions tab from dashboard', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Click the Assumptions tab
    const assumptionsTab = page.getByRole('tab', { name: /assumptions/i });
    await assumptionsTab.click();

    // Verify we're on the assumptions tab
    await expect(page).toHaveURL(/tab=assumptions/);
    await expect(page.getByRole('heading', { name: /assumption map/i })).toBeVisible(TIMEOUT);
  });

  test('should display assumptions grouped by priority and validation status', async ({ page }) => {
    await page.goto(ASSUMPTION_MAP_URL);
    await expect(page.getByRole('heading', { name: /assumption map/i })).toBeVisible(TIMEOUT);

    // Should show the assumption map tabs (Matrix, List, Analytics)
    await expect(page.getByRole('tab', { name: /matrix/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /list/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /analytics/i })).toBeVisible();

    // Verify quadrant labels are visible in Matrix view
    await expect(page.getByText(/test first/i)).toBeVisible();
    await expect(page.getByText(/nice to have/i).first()).toBeVisible();
  });

  test('should create an assumption with category and priority', async ({ page }) => {
    await page.goto(ASSUMPTION_MAP_URL);
    await expect(page.getByRole('heading', { name: /assumption map/i })).toBeVisible(TIMEOUT);

    // Click Add Assumption button
    const addButton = page.getByRole('button', { name: /add assumption/i });
    await addButton.click();

    // Fill in the form
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(TIMEOUT);

    const statementInput = dialog.locator('textarea#statement');
    const testStatement = `Test assumption ${Date.now()}`;
    await statementInput.fill(testStatement);

    // Select category (Desirability by default)
    const categorySelect = dialog.locator('[id*="category"]').locator('..');
    await categorySelect.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Feasibility' }).click();

    // Select priority
    const prioritySelect = dialog.locator('[id*="priority"]').locator('..');
    await prioritySelect.getByRole('combobox').click();
    await page.getByRole('option', { name: /1 - Critical/i }).click();

    // Submit
    await dialog.getByRole('button', { name: /create/i }).click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible(TIMEOUT);

    // Verify assumption appears (switch to List view for easier verification)
    const listTab = page.getByRole('tab', { name: /list/i });
    await listTab.click();

    await expect(page.getByText(testStatement)).toBeVisible(TIMEOUT);
  });

  test('should filter assumptions by category', async ({ page }) => {
    await page.goto(ASSUMPTION_MAP_URL);
    await expect(page.getByRole('heading', { name: /assumption map/i })).toBeVisible(TIMEOUT);

    // Create assumptions with different categories first
    const addButton = page.getByRole('button', { name: /add assumption/i });
    const uniqueId = Date.now();

    // Create a Desirability assumption
    await addButton.click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(TIMEOUT);
    await dialog.locator('textarea#statement').fill(`Desirability test ${uniqueId}`);
    // Default is desirability, just submit
    await dialog.getByRole('button', { name: /create/i }).click();
    await expect(dialog).not.toBeVisible(TIMEOUT);

    // Create a Feasibility assumption
    await addButton.click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(TIMEOUT);
    await dialog.locator('textarea#statement').fill(`Feasibility test ${uniqueId}`);
    const categorySelect = dialog.locator('[id*="category"]').locator('..');
    await categorySelect.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Feasibility' }).click();
    await dialog.getByRole('button', { name: /create/i }).click();
    await expect(dialog).not.toBeVisible(TIMEOUT);

    // Switch to List view
    const listTab = page.getByRole('tab', { name: /list/i });
    await listTab.click();

    // Both should be visible initially
    await expect(page.getByText(`Desirability test ${uniqueId}`)).toBeVisible(TIMEOUT);
    await expect(page.getByText(`Feasibility test ${uniqueId}`)).toBeVisible(TIMEOUT);

    // Filter by Feasibility category
    const categoryFilter = page.locator('select, [role="combobox"]').filter({ hasText: /all/i }).first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByRole('option', { name: /feasibility/i }).click();

      // Only Feasibility should be visible
      await expect(page.getByText(`Feasibility test ${uniqueId}`)).toBeVisible(TIMEOUT);
      await expect(page.getByText(`Desirability test ${uniqueId}`)).not.toBeVisible();
    } else {
      // Alternative: use filter buttons if present
      const feasibilityFilter = page.getByRole('button', { name: /feasibility/i }).first();
      if (await feasibilityFilter.isVisible()) {
        await feasibilityFilter.click();
        await expect(page.getByText(`Feasibility test ${uniqueId}`)).toBeVisible(TIMEOUT);
      }
    }
  });

  test('should display analytics view with metrics', async ({ page }) => {
    await page.goto(ASSUMPTION_MAP_URL);
    await expect(page.getByRole('heading', { name: /assumption map/i })).toBeVisible(TIMEOUT);

    // Click Analytics tab
    const analyticsTab = page.getByRole('tab', { name: /analytics/i });
    await analyticsTab.click();

    // Verify analytics metrics are displayed
    await expect(page.getByText(/total assumptions/i)).toBeVisible(TIMEOUT);
    await expect(page.getByText(/validation rate/i)).toBeVisible(TIMEOUT);
  });

  test('should display matrix view with quadrants', async ({ page }) => {
    await page.goto(ASSUMPTION_MAP_URL);
    await expect(page.getByRole('heading', { name: /assumption map/i })).toBeVisible(TIMEOUT);

    // Matrix tab should be default or click it
    const matrixTab = page.getByRole('tab', { name: /matrix/i });
    await matrixTab.click();

    // Verify 2x2 matrix quadrants
    // Quadrant labels: Test First, Could Test, Deprioritize, Nice to Have
    await expect(page.getByText(/test first/i)).toBeVisible(TIMEOUT);
    await expect(page.getByText(/could test/i)).toBeVisible(TIMEOUT);
    await expect(page.getByText(/deprioritize/i)).toBeVisible(TIMEOUT);
    await expect(page.getByText(/nice to have/i).first()).toBeVisible(TIMEOUT);
  });
});
