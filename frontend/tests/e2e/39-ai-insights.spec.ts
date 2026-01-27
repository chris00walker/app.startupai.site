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
 *
 * Note: These tests run against test users who start with NO projects
 * (global-setup.ts clears projects). Users without projects see the
 * EmptyState welcome screen with onboarding CTA, not the dashboard tabs.
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };

test.describe('US-F16: AI Insights - New User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should display welcome message for new users without projects', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // New users see EmptyState with welcome message
    await expect(page.getByText(/welcome to startupai/i)).toBeVisible(TIMEOUT);
  });

  test('should show onboarding call-to-action for new users', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Should have "Start Validating Your Idea" button
    const ctaButton = page.getByRole('link', { name: /start validating/i });
    await expect(ctaButton).toBeVisible(TIMEOUT);
  });

  test('should display validation methodology overview', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // EmptyState shows feature cards mentioning validation concepts
    await expect(page.getByText(/evidence-led validation/i)).toBeVisible(TIMEOUT);
  });

  test('should display D-F-V validation framework reference', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Structured Experiments card mentions D-F-V
    await expect(page.getByText(/desirability.*feasibility.*viability/i)).toBeVisible(TIMEOUT);
  });

  test('should link to founder onboarding flow', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // CTA button links to onboarding
    const ctaButton = page.getByRole('link', { name: /start validating/i });
    await expect(ctaButton).toHaveAttribute('href', '/onboarding/founder');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Welcome message should still be visible on mobile
    await expect(page.getByText(/welcome to startupai/i)).toBeVisible(TIMEOUT);
  });
});
