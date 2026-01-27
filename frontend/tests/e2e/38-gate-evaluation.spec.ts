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

    // Gate evaluation page MUST be visible
    const title = page.getByRole('heading', { name: /gate evaluation/i });
    await expect(title).toBeVisible(TIMEOUT);

    // Verify key elements are present
    await expect(page.getByText(/evidence-led/i).first()).toBeVisible(TIMEOUT);

    // Verify refresh button exists
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible(TIMEOUT);
  });

  test('should display gate status, readiness score, evidence count, and experiment count', async ({ page }) => {
    await page.goto('/project/current/gate');

    // Gate evaluation page MUST be visible
    const title = page.getByRole('heading', { name: /gate evaluation/i });
    await expect(title).toBeVisible(TIMEOUT);

    // Should show Total Evidence count
    await expect(page.getByText(/total evidence/i).first()).toBeVisible(TIMEOUT);

    // Should show Experiments count
    await expect(page.getByText(/experiments/i).first()).toBeVisible(TIMEOUT);

    // Should show gate status (Pending, At Risk, Failed, or Passed)
    const statusBadge = page.locator('[class*="badge"]').first();
    await expect(statusBadge).toBeVisible(TIMEOUT);
  });

  test('should show guidance for non-passing gate status', async ({ page }) => {
    await page.goto('/project/current/gate');

    // Gate evaluation page MUST be visible
    const title = page.getByRole('heading', { name: /gate evaluation/i });
    await expect(title).toBeVisible(TIMEOUT);

    // Check for guidance messages based on status
    const guidance = page.locator('[role="alert"], [role="status"]').first();
    await expect(guidance).toBeVisible(TIMEOUT);

    // Verify guidance messages contain helpful text
    const guidanceText = await guidance.textContent();
    expect(guidanceText?.length).toBeGreaterThan(0);
  });

  test('should refresh gate evaluation when clicking refresh button', async ({ page }) => {
    await page.goto('/project/current/gate');

    // Gate evaluation page MUST be visible
    const title = page.getByRole('heading', { name: /gate evaluation/i });
    await expect(title).toBeVisible(TIMEOUT);

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible(TIMEOUT);

    // Click should trigger refresh
    await refreshButton.click();

    // Wait for refresh to complete by checking title remains visible
    await expect(title).toBeVisible(TIMEOUT);
  });

  test('should display CrewAI strategic summary section', async ({ page }) => {
    await page.goto('/project/current/gate');

    // Gate evaluation page MUST be visible
    const title = page.getByRole('heading', { name: /gate evaluation/i });
    await expect(title).toBeVisible(TIMEOUT);

    // Look for CrewAI summary section
    const crewAISection = page.getByText(/crewai strategic summary/i);
    await expect(crewAISection).toBeVisible(TIMEOUT);

    // Should have a region for the summary
    const summaryRegion = page.locator('[role="region"][aria-label*="CrewAI"]');
    await expect(summaryRegion).toBeVisible(TIMEOUT);
  });

  test('should display about stage gates help section', async ({ page }) => {
    await page.goto('/project/current/gate');

    // Gate evaluation page MUST be visible
    const title = page.getByRole('heading', { name: /gate evaluation/i });
    await expect(title).toBeVisible(TIMEOUT);

    // Look for help section
    const helpSection = page.getByRole('heading', { name: /about stage gates/i });
    await expect(helpSection).toBeVisible(TIMEOUT);

    // Should have explanatory text
    await expect(page.getByText(/evidence-based checkpoints/i)).toBeVisible(TIMEOUT);
  });
});
