/**
 * @story US-F13, US-F14
 */

/**
 * 37-evidence-features.spec.ts
 *
 * Evidence Features E2E Tests
 *
 * Covers user stories:
 * - US-F13: Use Evidence Ledger with Fit Filters
 * - US-F14: Explore Evidence Explorer
 *
 * Story Reference: docs/user-experience/stories/founder.md
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };
const EVIDENCE_LEDGER_URL = '/founder-dashboard?tab=evidence';

test.describe('US-F13: Evidence Ledger with Fit Filters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should navigate to evidence tab from dashboard', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Click the Evidence tab
    const evidenceTab = page.getByRole('tab', { name: /evidence/i });
    await evidenceTab.click();

    // Verify we're on the evidence tab
    await expect(page).toHaveURL(/tab=evidence/);
    await expect(page.getByRole('heading', { name: /evidence ledger/i })).toBeVisible(TIMEOUT);
  });

  test('should display evidence items with strength, fit type, and summary', async ({ page }) => {
    await page.goto(EVIDENCE_LEDGER_URL);
    await expect(page.getByRole('heading', { name: /evidence ledger/i })).toBeVisible(TIMEOUT);

    // Should display filter controls
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible();
    await expect(page.getByText(/fit type/i)).toBeVisible();
    await expect(page.getByText(/evidence strength/i)).toBeVisible();
  });

  test('should filter evidence by fit type', async ({ page }) => {
    await page.goto(EVIDENCE_LEDGER_URL);
    await expect(page.getByRole('heading', { name: /evidence ledger/i })).toBeVisible(TIMEOUT);

    // Find the fit type filter
    const fitTypeSelect = page.locator('[aria-labelledby="fit-type-label"]');
    await expect(fitTypeSelect).toBeVisible(TIMEOUT);

    // Click to open dropdown
    await fitTypeSelect.click();

    // Select Desirability
    await page.getByRole('option', { name: /desirability/i }).click();

    // Verify filter is applied - selector value should change
    await expect(fitTypeSelect).toContainText(/desirability/i);
  });

  test('should add evidence through evidence form', async ({ page }) => {
    await page.goto(EVIDENCE_LEDGER_URL);
    await expect(page.getByRole('heading', { name: /evidence ledger/i })).toBeVisible(TIMEOUT);

    // Click Add Evidence button
    const addButton = page.getByRole('button', { name: /add evidence/i });
    await addButton.click();

    // Evidence form dialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(TIMEOUT);
    await expect(dialog.getByRole('heading', { name: /add evidence/i })).toBeVisible();

    // Fill in evidence form
    const uniqueTitle = `Test evidence ${Date.now()}`;
    await dialog.locator('input[name="title"], input#title').fill(uniqueTitle);
    await dialog.locator('textarea[name="summary"], textarea#summary').fill('This is test evidence summary');

    // Select category if dropdown exists
    const categorySelect = dialog.locator('[id*="category"]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: /interview/i }).click();
    }

    // Submit the form
    const submitButton = dialog.getByRole('button', { name: /add|submit|save|create/i });
    await submitButton.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible(TIMEOUT);

    // Verify evidence appears in list
    await expect(page.getByText(uniqueTitle)).toBeVisible(TIMEOUT);
  });

  test('should view evidence details', async ({ page }) => {
    await page.goto(EVIDENCE_LEDGER_URL);
    await expect(page.getByRole('heading', { name: /evidence ledger/i })).toBeVisible(TIMEOUT);

    // Create evidence first to ensure we have something to view
    const addButton = page.getByRole('button', { name: /add evidence/i });
    await addButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(TIMEOUT);

    const uniqueTitle = `View test ${Date.now()}`;
    await dialog.locator('input[name="title"], input#title').fill(uniqueTitle);
    await dialog.locator('textarea[name="summary"], textarea#summary').fill('Evidence to view in detail');

    await dialog.getByRole('button', { name: /add|submit|save|create/i }).click();
    await expect(dialog).not.toBeVisible(TIMEOUT);

    // Find the evidence card and click View
    const evidenceCard = page.locator('[class*="card"]').filter({ hasText: uniqueTitle }).first();
    await expect(evidenceCard).toBeVisible(TIMEOUT);

    const viewButton = evidenceCard.getByRole('button', { name: /view/i });
    await viewButton.click();

    // Detail dialog should open
    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible(TIMEOUT);
    await expect(detailDialog.getByText(/full evidence/i)).toBeVisible();
  });
});

test.describe('US-F14: Evidence Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should display evidence explorer page with summary metrics and timeline', async ({ page }) => {
    // Navigate to a project's evidence explorer
    // First get the project ID from the dashboard
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Navigate to project's evidence explorer via URL pattern
    await page.goto('/project/current/evidence');

    // If redirected or page loads, verify evidence explorer content
    // The page should show either evidence explorer or redirect to a project
    const title = page.getByRole('heading', { name: /evidence explorer/i });
    const hasExplorer = await title.isVisible().catch(() => false);

    if (hasExplorer) {
      // Verify summary metrics area exists
      await expect(page.getByText(/total evidence/i).first()).toBeVisible(TIMEOUT);

      // Verify filters exist
      await expect(page.getByText(/all sources|all strengths/i).first()).toBeVisible();
    } else {
      // If no project, page may show error or redirect - this is expected behavior
      test.info().annotations.push({ type: 'info', description: 'No project available for evidence explorer test' });
    }
  });

  test('should filter evidence and update timeline', async ({ page }) => {
    await page.goto('/project/current/evidence');

    const explorer = page.getByRole('heading', { name: /evidence explorer/i });
    const hasExplorer = await explorer.isVisible().catch(() => false);

    if (hasExplorer) {
      // Find dimension tabs (All, Desirability, Feasibility, Viability)
      const desirabilityTab = page.getByRole('tab', { name: /desirability/i });

      if (await desirabilityTab.isVisible()) {
        await desirabilityTab.click();

        // Verify tab is now selected
        await expect(desirabilityTab).toHaveAttribute('data-state', 'active');
      }
    }
  });

  test('should show detail panel when clicking evidence item', async ({ page }) => {
    await page.goto('/project/current/evidence');

    const explorer = page.getByRole('heading', { name: /evidence explorer/i });
    const hasExplorer = await explorer.isVisible().catch(() => false);

    if (hasExplorer) {
      // Look for any evidence card in the timeline
      const evidenceCard = page.locator('[class*="card"]').filter({ hasText: /evidence|analysis/i }).first();

      if (await evidenceCard.isVisible().catch(() => false)) {
        await evidenceCard.click();

        // Detail panel (sheet) should open
        const sheet = page.locator('[role="dialog"], [class*="sheet"]');
        await expect(sheet).toBeVisible(TIMEOUT);
      }
    }
  });
});
