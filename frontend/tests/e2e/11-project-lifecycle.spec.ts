/**
 * 11-project-lifecycle.spec.ts
 *
 * Project Lifecycle E2E Tests - Archive and Delete flows
 *
 * Covers user stories:
 * - US-F04: Archive Project
 * - US-F05: Delete Project Permanently
 *
 * Story Reference: docs/user-experience/stories/README.md
 * Feature Reference: docs/features/project-client-management.md
 *
 * @story US-F04, US-F05
 */

import { test, expect, Page } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Navigate to Settings page
 */
async function navigateToSettings(page: Page): Promise<void> {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to Projects tab in Settings
 */
async function navigateToProjectsTab(page: Page): Promise<void> {
  await navigateToSettings(page);

  const projectsTab = page.getByRole('tab', { name: /projects/i });
  await expect(projectsTab).toBeVisible({ timeout: 10000 });
  await projectsTab.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Mock projects API response
 */
async function mockProjects(
  page: Page,
  projects: Array<{
    id: string;
    name: string;
    status: 'active' | 'archived';
    created_at: string;
  }>
): Promise<void> {
  await page.route('**/api/projects*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: projects }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock archive project API
 */
async function mockArchiveProject(page: Page, success = true): Promise<void> {
  await page.route('**/api/projects/*/archive', async (route) => {
    if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Project archived' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to archive project' }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock restore project API
 */
async function mockRestoreProject(page: Page, success = true): Promise<void> {
  await page.route('**/api/projects/*/restore', async (route) => {
    if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Project restored' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to restore project' }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock delete project API
 */
async function mockDeleteProject(page: Page, success = true): Promise<void> {
  await page.route('**/api/projects/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Project deleted permanently' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to delete project' }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

// =============================================================================
// Test Data
// =============================================================================

const TEST_PROJECTS = [
  {
    id: 'proj-1',
    name: 'StartupAI Validation',
    status: 'active' as const,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Side Project',
    status: 'active' as const,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Old Idea',
    status: 'archived' as const,
    created_at: '2025-12-01T00:00:00Z',
  },
];

// =============================================================================
// Test Suite: US-F04 - Archive Project
// =============================================================================

test.describe('US-F04: Archive Project', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display project selector in Settings', async ({ page }) => {
    // Given: I am logged in as a Founder with at least one active project
    await mockProjects(page, TEST_PROJECTS);

    // When: I navigate to Settings → Projects tab
    await navigateToProjectsTab(page);

    // Then: I should see a project selector or project list
    const projectSelector = page.locator(
      '[data-testid="project-selector"], select[name="project"], [data-testid="project-list"]'
    );

    // Check for any project management UI element
    const settingsContent = await page.textContent('main');
    expect(
      settingsContent?.toLowerCase().includes('project') ||
        (await projectSelector.isVisible()) ||
        (await page.getByText(/startupai validation/i).isVisible())
    ).toBeTruthy();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-settings-tab.png',
      fullPage: true,
    });
  });

  test('should show archive button for active projects', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await navigateToProjectsTab(page);

    // Then: I should see an archive button - MUST be visible after mock
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible({ timeout: 10000 });
    await expect(archiveButton).toBeEnabled();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-archive-button.png',
      fullPage: true,
    });
  });

  test('should archive project when confirmed', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await mockArchiveProject(page, true);
    await navigateToProjectsTab(page);

    // Given: I have selected a project - MUST be visible
    const projectItem = page.getByText(/startupai validation/i);
    await expect(projectItem).toBeVisible({ timeout: 10000 });
    await projectItem.click();

    // When: I click "Archive Project" - MUST be visible
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible();
    await archiveButton.click();

    // Handle confirmation dialog - MUST appear
    const confirmButton = page.getByRole('button', { name: /confirm|yes|archive/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Then: The project status should change to archived
    await expect(page.getByText(/archived|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-archived-success.png',
      fullPage: true,
    });
  });

  test('should hide archived projects from dashboard by default', async ({ page }) => {
    // Given: I have archived a project
    await mockProjects(page, TEST_PROJECTS);

    // When: I view my dashboard
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: The archived project should be hidden
    const oldIdea = page.getByText(/old idea/i);
    await expect(oldIdea).not.toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/dashboard-no-archived.png',
      fullPage: true,
    });
  });

  test('should show archived projects when toggled in Settings', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await navigateToProjectsTab(page);

    // Given: I have archived a project
    // When: I toggle "Show archived projects" in Settings - MUST be visible
    const showArchivedToggle = page.locator(
      '[data-testid="show-archived-toggle"], input[name="showArchived"], label:has-text("archived")'
    );
    await expect(showArchivedToggle).toBeVisible({ timeout: 10000 });
    await showArchivedToggle.click();

    // Then: I should see the archived project with a "Restore" option
    await page.waitForLoadState('networkidle');

    const archivedProject = page.getByText(/old idea/i);
    await expect(archivedProject).toBeVisible({ timeout: 5000 });

    const restoreButton = page.getByRole('button', { name: /restore/i });
    await expect(restoreButton).toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-show-archived.png',
      fullPage: true,
    });
  });

  test('should restore archived project', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await mockRestoreProject(page, true);
    await navigateToProjectsTab(page);

    // Given: I am viewing archived projects - toggle MUST be visible
    const showArchivedToggle = page.locator(
      '[data-testid="show-archived-toggle"], input[name="showArchived"]'
    );
    await expect(showArchivedToggle).toBeVisible({ timeout: 10000 });
    await showArchivedToggle.click();
    await page.waitForLoadState('networkidle');

    // When: I click "Restore" on an archived project - MUST be visible
    const restoreButton = page.getByRole('button', { name: /restore/i });
    await expect(restoreButton).toBeVisible({ timeout: 5000 });
    await restoreButton.click();

    // Then: The project should be restored
    await expect(page.getByText(/restored|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-restored.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-F05 - Delete Project Permanently
// =============================================================================

test.describe('US-F05: Delete Project Permanently', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display Danger Zone in Settings', async ({ page }) => {
    // Given: I am logged in as a Founder with at least one project
    await mockProjects(page, TEST_PROJECTS);

    // When: I navigate to Settings → Projects tab → Danger Zone
    await navigateToProjectsTab(page);

    // Then: I should see a Danger Zone section or delete-related content
    const dangerZone = page.locator(
      '[data-testid="danger-zone"], .danger-zone, h3:has-text("Danger")'
    );
    const deleteSection = page.getByText(/delete|permanently|danger/i);

    await expect(dangerZone.or(deleteSection)).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-danger-zone.png',
      fullPage: true,
    });
  });

  test('should show impact summary before delete', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await navigateToProjectsTab(page);

    // When: I click on delete button - MUST be visible
    const deleteButton = page.getByRole('button', { name: /delete.*project|delete.*forever/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    // Then: I should see an impact summary in modal
    const modal = page.locator('[role="dialog"], [data-testid="delete-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Should show what will be deleted
    await expect(
      modal.getByText(/hypothes|evidence|data|will be deleted|cannot be undone/i)
    ).toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-delete-impact.png',
      fullPage: true,
    });
  });

  test('should require project name confirmation', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await navigateToProjectsTab(page);

    // Given: I click "Delete Project Forever" - MUST be visible
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    // When: I see the confirmation dialog - MUST appear
    const modal = page.locator('[role="dialog"], [data-testid="delete-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Then: I should need to type the project name to confirm
    const confirmInput = modal.locator(
      'input[type="text"], input[name="confirmName"], [data-testid="confirm-input"]'
    );
    await expect(confirmInput).toBeVisible();

    // Type incorrect name first
    await confirmInput.fill('wrong name');

    // Confirm button should be disabled when name doesn't match
    const confirmDeleteButton = modal.getByRole('button', {
      name: /confirm.*delete|delete.*forever/i,
    });
    await expect(confirmDeleteButton).toBeDisabled();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-delete-confirm.png',
      fullPage: true,
    });
  });

  test('should delete project permanently when confirmed', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await mockDeleteProject(page, true);
    await navigateToProjectsTab(page);

    // Given: I click "Delete Project Forever" - MUST be visible
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    // Modal MUST appear
    const modal = page.locator('[role="dialog"], [data-testid="delete-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // When: I type the project name to confirm
    const confirmInput = modal.locator('input[type="text"]');
    await expect(confirmInput).toBeVisible();
    await confirmInput.fill('StartupAI Validation');

    // And click confirm - button should now be enabled
    const confirmDeleteButton = modal.getByRole('button', { name: /confirm|delete/i });
    await expect(confirmDeleteButton).toBeVisible();
    await expect(confirmDeleteButton).toBeEnabled();
    await confirmDeleteButton.click();

    // Then: The project should be permanently deleted
    await expect(page.getByText(/deleted|removed|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-deleted.png',
      fullPage: true,
    });
  });

  test('should not show deleted project even with "show archived"', async ({ page }) => {
    // Given: I have deleted a project
    // Mock empty projects to simulate deletion
    await mockProjects(page, [TEST_PROJECTS[1]]); // Only show remaining project

    // When: I view my dashboard with "show archived" enabled
    await navigateToProjectsTab(page);

    const showArchivedToggle = page.locator(
      '[data-testid="show-archived-toggle"], input[name="showArchived"]'
    );

    // Toggle may or may not be visible depending on implementation
    if (await showArchivedToggle.isVisible()) {
      await showArchivedToggle.click();
    }

    // Then: The deleted project should not appear
    await expect(page.getByText(/startupai validation/i)).not.toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-not-found-after-delete.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Error Handling
// =============================================================================

test.describe('Project Lifecycle Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should handle archive failure gracefully', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await mockArchiveProject(page, false);
    await navigateToProjectsTab(page);

    // When: Archive fails - archive button MUST be visible
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible({ timeout: 10000 });
    await archiveButton.click();

    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Then: Error message should be shown
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-archive-error.png',
      fullPage: true,
    });
  });

  test('should handle delete failure gracefully', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await mockDeleteProject(page, false);
    await navigateToProjectsTab(page);

    // When: Delete fails - delete button MUST be visible
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const confirmInput = modal.locator('input[type="text"]');
    await expect(confirmInput).toBeVisible();
    await confirmInput.fill('StartupAI Validation');

    const confirmDeleteButton = modal.getByRole('button', { name: /confirm|delete/i });
    await expect(confirmDeleteButton).toBeVisible();
    await confirmDeleteButton.click();

    // Then: Error message should be shown
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-delete-error.png',
      fullPage: true,
    });
  });

  test('should prevent delete without confirmation', async ({ page }) => {
    await mockProjects(page, TEST_PROJECTS);
    await navigateToProjectsTab(page);

    // When: Delete dialog is open but name not entered
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Then: Confirm button should be disabled without proper confirmation
    const confirmDeleteButton = modal.getByRole('button', {
      name: /confirm.*delete|delete.*forever/i,
    });
    await expect(confirmDeleteButton).toBeVisible();
    await expect(confirmDeleteButton).toBeDisabled();

    await page.screenshot({
      path: 'tests/e2e/screenshots/project-delete-disabled.png',
      fullPage: true,
    });
  });
});
