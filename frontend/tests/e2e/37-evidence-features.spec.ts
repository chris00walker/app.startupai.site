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
 *
 * Note: These tests run against test users who start with NO projects
 * (global-setup.ts clears projects). Users without projects see the
 * EmptyState welcome screen. Evidence features require a project to function.
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };

test.describe('US-F13: Evidence Ledger - New User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should display dashboard for new users', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // New users see welcome message (no tabs, no evidence ledger)
    await expect(page.getByText(/welcome to startupai/i)).toBeVisible(TIMEOUT);
  });

  test('should mention evidence-led validation in onboarding', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // EmptyState feature card mentions evidence
    await expect(page.getByText(/evidence-led validation/i)).toBeVisible(TIMEOUT);
  });

  test('should provide path to create first project', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // CTA to start validation journey (which will create a project)
    const ctaButton = page.getByRole('link', { name: /start validating/i });
    await expect(ctaButton).toBeVisible(TIMEOUT);
  });
});

test.describe('US-F14: Evidence Explorer - New User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should show no projects message at evidence explorer route', async ({ page }) => {
    await page.goto('/project/current/evidence');
    await page.waitForLoadState('domcontentloaded');

    // Without a project, the redirect page shows "No Projects Found"
    const noProjectsMessage = page.getByText(/no projects found/i);
    await expect(noProjectsMessage).toBeVisible(TIMEOUT);
  });

  test('should provide link to create project from evidence explorer', async ({ page }) => {
    await page.goto('/project/current/evidence');
    await page.waitForLoadState('domcontentloaded');

    // Should have a link to create a project
    const createLink = page.getByRole('link', { name: /create project/i });
    await expect(createLink).toBeVisible(TIMEOUT);
  });

  test('should show appropriate empty state when no project exists', async ({ page }) => {
    await page.goto('/project/current/evidence');
    await page.waitForLoadState('domcontentloaded');

    // Page should contain helpful guidance (case-insensitive check)
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('project');
  });
});
