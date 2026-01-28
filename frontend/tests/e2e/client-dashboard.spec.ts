/**
 * client-dashboard.spec.ts
 *
 * Client Dashboard E2E Tests
 *
 * Tests the founder's project dashboard with validation status,
 * evidence panels, and HITL checkpoints.
 *
 * Covers user stories:
 * - US-F03: View Validation Dashboard
 * - US-F04: View Evidence Summary
 *
 * Story Reference: docs/user-experience/stories/README.md
 *
 * @story US-F03, US-F04
 */

import { test, expect, Page } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Navigate to a specific project dashboard
 */
async function navigateToProjectDashboard(page: Page, projectId = 'test-project-1'): Promise<void> {
  await page.goto(`/projects/${projectId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Mock project data API response
 */
async function mockProjectData(
  page: Page,
  project: {
    id: string;
    name: string;
    stage: string;
    gate_status: string;
  }
): Promise<void> {
  await page.route(`**/api/projects/${project.id}*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: project }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock validation state API response
 */
async function mockValidationState(
  page: Page,
  projectId: string,
  state: {
    current_phase: number;
    phase_name: string;
    status: string;
    progress_pct: number;
  }
): Promise<void> {
  await page.route(`**/api/projects/${projectId}/validation*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock evidence data API response
 */
async function mockEvidenceData(
  page: Page,
  projectId: string,
  evidence: Array<{
    id: string;
    title: string;
    fit_type: string;
    evidence_type: string;
    created_at: string;
  }>
): Promise<void> {
  await page.route(`**/api/projects/${projectId}/evidence*`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: evidence }),
      });
    } else {
      await route.continue();
    }
  });
}

// =============================================================================
// Test Data
// =============================================================================

const TEST_PROJECT = {
  id: 'test-project-1',
  name: 'test-E2E Validation Project',
  stage: 'DESIRABILITY',
  gate_status: 'Pending',
};

const TEST_VALIDATION_STATE = {
  current_phase: 1,
  phase_name: 'Desirability',
  status: 'running',
  progress_pct: 45,
};

const TEST_EVIDENCE = [
  {
    id: 'evidence-1',
    title: 'Landing Page A/B Test',
    fit_type: 'Desirability',
    evidence_type: 'experiment',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'evidence-2',
    title: 'Customer Interview Summary',
    fit_type: 'Desirability',
    evidence_type: 'interview',
    created_at: '2026-01-14T00:00:00Z',
  },
];

// =============================================================================
// Test Suite: US-F03 - View Validation Dashboard
// =============================================================================

test.describe('US-F03: View Validation Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display project name and current stage', async ({ page }) => {
    // Given: I have a project with validation in progress
    await mockProjectData(page, TEST_PROJECT);
    await mockValidationState(page, TEST_PROJECT.id, TEST_VALIDATION_STATE);
    await mockEvidenceData(page, TEST_PROJECT.id, TEST_EVIDENCE);

    // When: I navigate to my project dashboard
    await navigateToProjectDashboard(page, TEST_PROJECT.id);

    // Then: I should see the project name
    await expect(page.getByText(/E2E Validation Project/i)).toBeVisible({ timeout: 10000 });

    // And: I should see the current stage
    await expect(page.getByText(/desirability/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-stage.png',
      fullPage: true,
    });
  });

  test('should display validation progress indicator', async ({ page }) => {
    await mockProjectData(page, TEST_PROJECT);
    await mockValidationState(page, TEST_PROJECT.id, TEST_VALIDATION_STATE);
    await mockEvidenceData(page, TEST_PROJECT.id, TEST_EVIDENCE);

    await navigateToProjectDashboard(page, TEST_PROJECT.id);

    // Then: I should see a progress indicator
    const progressIndicator = page.locator(
      '[data-testid="validation-progress"], [role="progressbar"], .progress'
    );
    await expect(progressIndicator).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-progress.png',
      fullPage: true,
    });
  });

  test('should display current phase name', async ({ page }) => {
    await mockProjectData(page, TEST_PROJECT);
    await mockValidationState(page, TEST_PROJECT.id, TEST_VALIDATION_STATE);
    await mockEvidenceData(page, TEST_PROJECT.id, TEST_EVIDENCE);

    await navigateToProjectDashboard(page, TEST_PROJECT.id);

    // Then: I should see the current phase name
    await expect(page.getByText(/desirability/i)).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-phase.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-F04 - View Evidence Summary
// =============================================================================

test.describe('US-F04: View Evidence Summary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display evidence list', async ({ page }) => {
    await mockProjectData(page, TEST_PROJECT);
    await mockValidationState(page, TEST_PROJECT.id, TEST_VALIDATION_STATE);
    await mockEvidenceData(page, TEST_PROJECT.id, TEST_EVIDENCE);

    await navigateToProjectDashboard(page, TEST_PROJECT.id);

    // Then: I should see evidence items
    await expect(page.getByText(/Landing Page A\/B Test/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Customer Interview Summary/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-evidence.png',
      fullPage: true,
    });
  });

  test('should show evidence fit type', async ({ page }) => {
    await mockProjectData(page, TEST_PROJECT);
    await mockValidationState(page, TEST_PROJECT.id, TEST_VALIDATION_STATE);
    await mockEvidenceData(page, TEST_PROJECT.id, TEST_EVIDENCE);

    await navigateToProjectDashboard(page, TEST_PROJECT.id);

    // Then: Evidence should be categorized by fit type
    const fitTypeBadge = page.locator(
      '[data-testid="fit-type"], .badge:has-text("Desirability"), span:has-text("Desirability")'
    );
    await expect(fitTypeBadge.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-fit-type.png',
      fullPage: true,
    });
  });

  test('should handle empty evidence gracefully', async ({ page }) => {
    await mockProjectData(page, TEST_PROJECT);
    await mockValidationState(page, TEST_PROJECT.id, TEST_VALIDATION_STATE);
    await mockEvidenceData(page, TEST_PROJECT.id, []);

    await navigateToProjectDashboard(page, TEST_PROJECT.id);

    // Then: Should show empty state or no evidence message
    await expect(
      page.getByText(/no evidence|evidence.*collected|start.*validation/i)
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-no-evidence.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Error Handling
// =============================================================================

test.describe('Client Dashboard Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route(`**/api/projects/**`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await navigateToProjectDashboard(page, 'test-project-1');

    // Then: Should show error state
    await expect(page.getByText(/error|failed|try again|something went wrong/i)).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-error.png',
      fullPage: true,
    });
  });

  test('should handle project not found', async ({ page }) => {
    // Mock 404 response
    await page.route(`**/api/projects/**`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Project not found' }),
      });
    });

    await navigateToProjectDashboard(page, 'nonexistent-project');

    // Then: Should show not found state
    await expect(page.getByText(/not found|doesn't exist|no project/i)).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-dashboard-not-found.png',
      fullPage: true,
    });
  });
});
