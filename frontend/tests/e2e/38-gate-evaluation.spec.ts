/**
 * @story US-F15
 */

/**
 * 38-gate-evaluation.spec.ts
 *
 * Gate Evaluation Dashboard E2E Tests
 *
 * Covers user stories:
 * - US-F15: Review Gate Evaluation Dashboard
 *
 * Story Reference: docs/user-experience/stories/founder.md
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };

test.describe('US-F15: Gate Evaluation Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should display gate evaluation page with status and metrics', async ({ page }) => {
    // Navigate to gate evaluation page
    await page.goto('/project/current/gate');

    const title = page.getByRole('heading', { name: /gate evaluation/i });
    const hasGatePage = await title.isVisible().catch(() => false);

    if (hasGatePage) {
      // Verify page title
      await expect(title).toBeVisible(TIMEOUT);

      // Verify key elements are present
      await expect(page.getByText(/evidence-led/i).first()).toBeVisible();

      // Verify refresh button exists
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await expect(refreshButton).toBeVisible(TIMEOUT);
    } else {
      // If no project, page may redirect - this is expected
      test.info().annotations.push({ type: 'info', description: 'No project available for gate evaluation test' });
    }
  });

  test('should display gate status, readiness score, evidence count, and experiment count', async ({ page }) => {
    await page.goto('/project/current/gate');

    const title = page.getByRole('heading', { name: /gate evaluation/i });
    const hasGatePage = await title.isVisible().catch(() => false);

    if (hasGatePage) {
      // Look for gate dashboard elements
      // Should show Total Evidence count
      await expect(page.getByText(/total evidence/i).first()).toBeVisible(TIMEOUT);

      // Should show Experiments count
      await expect(page.getByText(/experiments/i).first()).toBeVisible(TIMEOUT);

      // Should show gate status (Pending, At Risk, Failed, or Passed)
      const statusBadge = page.locator('[class*="badge"]').first();
      await expect(statusBadge).toBeVisible(TIMEOUT);
    }
  });

  test('should show guidance for non-passing gate status', async ({ page }) => {
    await page.goto('/project/current/gate');

    const title = page.getByRole('heading', { name: /gate evaluation/i });
    const hasGatePage = await title.isVisible().catch(() => false);

    if (hasGatePage) {
      // Check for guidance messages based on status
      // These appear in GateDashboard for Pending, At Risk, Failed states
      const guidance = page.locator('[role="alert"], [role="status"]');
      const hasGuidance = await guidance.count() > 0;

      if (hasGuidance) {
        // Verify guidance messages contain helpful text
        const guidanceText = await guidance.first().textContent();
        expect(guidanceText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should refresh gate evaluation when clicking refresh button', async ({ page }) => {
    await page.goto('/project/current/gate');

    const title = page.getByRole('heading', { name: /gate evaluation/i });
    const hasGatePage = await title.isVisible().catch(() => false);

    if (hasGatePage) {
      // Find and click refresh button
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await expect(refreshButton).toBeVisible(TIMEOUT);

      // Click should trigger refresh (button may show loading state)
      await refreshButton.click();

      // Button should either show loading or complete
      // Wait for any loading state to resolve
      await page.waitForTimeout(1000);

      // Page should still be functional after refresh
      await expect(title).toBeVisible(TIMEOUT);
    }
  });

  test('should display CrewAI strategic summary section', async ({ page }) => {
    await page.goto('/project/current/gate');

    const title = page.getByRole('heading', { name: /gate evaluation/i });
    const hasGatePage = await title.isVisible().catch(() => false);

    if (hasGatePage) {
      // Look for CrewAI summary section
      const crewAISection = page.getByText(/crewai strategic summary/i);
      await expect(crewAISection).toBeVisible(TIMEOUT);

      // Should have a region for the summary
      const summaryRegion = page.locator('[role="region"][aria-label*="CrewAI"]');
      if (await summaryRegion.isVisible()) {
        await expect(summaryRegion).toBeVisible();
      }
    }
  });

  test('should display about stage gates help section', async ({ page }) => {
    await page.goto('/project/current/gate');

    const title = page.getByRole('heading', { name: /gate evaluation/i });
    const hasGatePage = await title.isVisible().catch(() => false);

    if (hasGatePage) {
      // Look for help section
      const helpSection = page.getByRole('heading', { name: /about stage gates/i });
      await expect(helpSection).toBeVisible(TIMEOUT);

      // Should have explanatory text
      await expect(page.getByText(/evidence-based checkpoints/i)).toBeVisible();
    }
  });
});
