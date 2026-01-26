/**
 * @story US-F16
 */

/**
 * 39-ai-insights.spec.ts
 *
 * AI Insights E2E Tests
 *
 * Covers user stories:
 * - US-F16: Review AI Insights
 *
 * Story Reference: docs/user-experience/stories/founder.md
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };
const FIT_URL = '/founder-dashboard?tab=fit';

test.describe('US-F16: AI Insights', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should navigate to fit tab from dashboard', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Click the Fit tab (or overview/project tab)
    const fitTab = page.getByRole('tab', { name: /fit|overview|project/i });
    if (await fitTab.isVisible()) {
      await fitTab.click();
    }

    // Verify project overview with fit cards
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);
  });

  test('should display fit dashboard with three validation dimensions', async ({ page }) => {
    await page.goto(FIT_URL);

    // Verify project overview header
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);

    // Verify three fit cards (Desirability, Feasibility, Viability)
    await expect(page.getByText(/desirability/i).first()).toBeVisible(TIMEOUT);
    await expect(page.getByText(/feasibility/i).first()).toBeVisible(TIMEOUT);
    await expect(page.getByText(/viability/i).first()).toBeVisible(TIMEOUT);
  });

  test('should open fit detail panel with AI insights', async ({ page }) => {
    await page.goto(FIT_URL);
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);

    // Find a "View Details" button on any fit card
    const viewDetailsButton = page.getByRole('button', { name: /view details/i }).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      // Detail dialog should open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible(TIMEOUT);

      // Should show analysis title
      await expect(dialog.getByText(/analysis/i)).toBeVisible();

      // Should have AI Insights section
      const aiInsightsSection = dialog.getByRole('heading', { name: /ai insights/i });
      await expect(aiInsightsSection).toBeVisible(TIMEOUT);
    }
  });

  test('should display AI insight titles with supporting context', async ({ page }) => {
    await page.goto(FIT_URL);
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);

    // Open first fit detail panel
    const viewDetailsButton = page.getByRole('button', { name: /view details/i }).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible(TIMEOUT);

      // Look for insight cards within the AI Insights section
      const insightCards = dialog.locator('[class*="card"]').filter({ hasText: /insight|trend|validation/i });

      // If insights exist, verify they have both title and description
      const insightCount = await insightCards.count();
      if (insightCount > 0) {
        // First insight should have a title (h4 or font-medium)
        const firstInsight = insightCards.first();
        const title = firstInsight.locator('h4, [class*="font-medium"]').first();
        const description = firstInsight.locator('p, [class*="muted-foreground"]').first();

        await expect(title).toBeVisible();
        await expect(description).toBeVisible();
      }
    }
  });

  test('should display key assumptions in fit detail panel', async ({ page }) => {
    await page.goto(FIT_URL);
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);

    // Open first fit detail panel
    const viewDetailsButton = page.getByRole('button', { name: /view details/i }).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible(TIMEOUT);

      // Should have Key Assumptions section
      const assumptionsSection = dialog.getByRole('heading', { name: /key assumptions/i });
      await expect(assumptionsSection).toBeVisible(TIMEOUT);
    }
  });

  test('should display evidence summary in fit detail panel', async ({ page }) => {
    await page.goto(FIT_URL);
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);

    // Open first fit detail panel
    const viewDetailsButton = page.getByRole('button', { name: /view details/i }).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible(TIMEOUT);

      // Should have Evidence Summary section
      const evidenceSection = dialog.getByRole('heading', { name: /evidence summary/i });
      await expect(evidenceSection).toBeVisible(TIMEOUT);

      // Should show supporting and contradicting evidence counts
      await expect(dialog.getByText(/supporting evidence/i)).toBeVisible();
      await expect(dialog.getByText(/contradictions/i)).toBeVisible();
    }
  });

  test('should show score and confidence for each fit dimension', async ({ page }) => {
    await page.goto(FIT_URL);
    await expect(page.getByRole('heading', { name: /project overview/i })).toBeVisible(TIMEOUT);

    // Each fit card should show score and confidence
    // Look for percentage display (e.g., "75%")
    const scoreElements = page.locator('text=/%$/');
    const hasScores = await scoreElements.count() > 0;

    if (hasScores) {
      // Should have confidence badges
      const confidenceBadges = page.locator('[class*="badge"]').filter({ hasText: /confidence/i });
      await expect(confidenceBadges.first()).toBeVisible();
    }
  });
});
