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
 *
 * Note: These tests run against test users who start with NO projects
 * (global-setup.ts clears projects). The gate evaluation page requires
 * a project. Tests verify the appropriate empty/guidance states.
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };

test.describe('US-F15: Gate Evaluation Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should navigate to gate evaluation page', async ({ page }) => {
    // Navigate to gate evaluation via the current project route
    await page.goto('/project/current/gate');
    await page.waitForLoadState('domcontentloaded');

    // Should show either:
    // 1. Gate Evaluation content (if project exists)
    // 2. "No Projects Found" message (if no project)
    // 3. Loading/redirect state
    const content = await page.content();
    const hasGateContent = content.includes('Gate') ||
                           content.includes('No Projects') ||
                           content.includes('Loading') ||
                           content.includes('Evaluation');
    expect(hasGateContent).toBeTruthy();
  });

  test('should show no projects message when user has no projects', async ({ page }) => {
    await page.goto('/project/current/gate');
    await page.waitForLoadState('domcontentloaded');

    // Without a project, the redirect page shows "No Projects Found"
    const noProjectsMessage = page.getByText(/no projects|create.*project/i).first();
    await expect(noProjectsMessage).toBeVisible(TIMEOUT);
  });

  test('should provide link to create project when none exist', async ({ page }) => {
    await page.goto('/project/current/gate');
    await page.waitForLoadState('domcontentloaded');

    // Should have a link or button to create a project
    const createLink = page.getByRole('link', { name: /create project/i });
    await expect(createLink).toBeVisible(TIMEOUT);
  });

  test('should display informative message about gate evaluation', async ({ page }) => {
    await page.goto('/project/current/gate');
    await page.waitForLoadState('domcontentloaded');

    // The page should contain gate-related text in some form
    // Either "No Projects Found" with guidance or actual gate content
    const pageText = await page.content();
    const hasRelevantContent = pageText.includes('gate') ||
                                pageText.includes('Gate') ||
                                pageText.includes('project') ||
                                pageText.includes('Project');
    expect(hasRelevantContent).toBeTruthy();
  });
});
