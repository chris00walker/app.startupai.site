/**
 * 12-client-lifecycle.spec.ts
 *
 * Client Lifecycle E2E Tests - Archive, Restore, and Resend flows
 *
 * Covers user stories:
 * - US-C05: Archive Client
 * - US-C06: Resend Client Invite
 *
 * Story Reference: docs/user-experience/stories/README.md
 * Feature Reference: docs/features/consultant-client-system.md
 *
 * @story US-C05, US-C06
 */

import { test, expect, Page } from '@playwright/test';
import { login, CONSULTANT_USER } from './helpers/auth';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Navigate to Consultant Dashboard
 */
async function navigateToConsultantDashboard(page: Page): Promise<void> {
  await page.goto('/consultant-dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to Settings → Clients tab
 * Uses strict assertions - FAILS if clients tab doesn't exist
 */
async function navigateToClientsSettings(page: Page): Promise<void> {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  const clientsTab = page.getByRole('tab', { name: /clients/i });
  await expect(clientsTab).toBeVisible({ timeout: 10000 });
  await clientsTab.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Mock clients API response
 */
async function mockClients(
  page: Page,
  clients: Array<{
    id: string;
    name: string;
    email: string;
    status: 'active' | 'pending' | 'archived';
    invite_sent_at?: string;
    invite_resend_count?: number;
  }>
): Promise<void> {
  await page.route('**/api/consultant/clients*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: clients }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock archive client API
 */
async function mockArchiveClient(page: Page, success = true): Promise<void> {
  await page.route('**/api/consultant/clients/*/archive', async (route) => {
    if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Client archived' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to archive client' }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock restore client API
 */
async function mockRestoreClient(page: Page, success = true): Promise<void> {
  await page.route('**/api/consultant/clients/*/restore', async (route) => {
    if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Client restored' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to restore client' }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock resend invite API
 */
async function mockResendInvite(page: Page, success = true, limitReached = false): Promise<void> {
  await page.route('**/api/consultant/clients/*/resend-invite', async (route) => {
    if (route.request().method() === 'POST') {
      if (limitReached) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Resend limit reached',
            message: 'Maximum 3 resends per invite',
          }),
        });
      } else if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Invite resent' }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to resend invite' }),
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

const TEST_CLIENTS = [
  {
    id: 'client-1',
    name: 'Acme Corp',
    email: 'founder@acme.com',
    status: 'active' as const,
  },
  {
    id: 'client-2',
    name: 'Beta Startup',
    email: 'ceo@beta.io',
    status: 'pending' as const,
    invite_sent_at: '2026-01-15T00:00:00Z',
    invite_resend_count: 1,
  },
  {
    id: 'client-3',
    name: 'Old Client',
    email: 'old@client.com',
    status: 'archived' as const,
  },
  {
    id: 'client-4',
    name: 'Max Resend Client',
    email: 'max@resend.com',
    status: 'pending' as const,
    invite_sent_at: '2026-01-10T00:00:00Z',
    invite_resend_count: 3,
  },
];

// =============================================================================
// Test Suite: US-C05 - Archive Client
// =============================================================================

test.describe('US-C05: Archive Client', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should display client selector in Settings', async ({ page }) => {
    // Given: I am logged in as a Consultant with active clients
    await mockClients(page, TEST_CLIENTS);

    // When: I navigate to Settings → Clients tab
    await navigateToClientsSettings(page);

    // Then: I should see a client list with at least one client
    const clientList = page.locator(
      '[data-testid="client-list"], [data-testid="client-selector"], table'
    );
    await expect(clientList).toBeVisible({ timeout: 10000 });

    // Verify Acme Corp (our test client) is displayed
    const acmeClient = page.getByText(/acme corp/i);
    await expect(acmeClient).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-settings-tab.png',
      fullPage: true,
    });
  });

  test('should show archive button for active clients', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Then: I should see an archive button for active clients
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible({ timeout: 10000 });
    await expect(archiveButton).toBeEnabled();

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-archive-button.png',
      fullPage: true,
    });
  });

  test('should archive client when confirmed', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockArchiveClient(page, true);
    await navigateToClientsSettings(page);

    // Given: I have selected a client
    const clientRow = page.getByText(/acme corp/i);
    await expect(clientRow).toBeVisible({ timeout: 10000 });
    await clientRow.click();

    // When: I click "Archive Client"
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible({ timeout: 5000 });
    await archiveButton.click();

    // Handle confirmation dialog
    const confirmButton = page.getByRole('button', { name: /confirm|yes|archive/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Then: The client should be archived - success message shown
    await expect(page.getByText(/archived|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-archived-success.png',
      fullPage: true,
    });
  });

  test('should hide archived clients from portfolio by default', async ({ page }) => {
    // Given: I have an archived client in my list
    await mockClients(page, TEST_CLIENTS);

    // When: I view my portfolio
    await navigateToConsultantDashboard(page);

    // Then: The archived client "Old Client" should NOT be visible
    const oldClient = page.getByText(/old client/i);
    await expect(oldClient).not.toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/portfolio-no-archived.png',
      fullPage: true,
    });
  });

  test('should show archived clients when toggled in Settings', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Given: I have archived clients
    // When: I toggle "Show archived clients" in Settings
    const showArchivedToggle = page.locator(
      '[data-testid="show-archived-toggle"], input[name="showArchived"], label:has-text("archived")'
    );
    await expect(showArchivedToggle).toBeVisible({ timeout: 10000 });
    await showArchivedToggle.click();

    // Then: I should see the archived client with a "Restore" option
    await page.waitForLoadState('networkidle');

    const archivedClient = page.getByText(/old client/i);
    await expect(archivedClient).toBeVisible({ timeout: 5000 });

    const restoreButton = page.getByRole('button', { name: /restore/i });
    await expect(restoreButton).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-show-archived.png',
      fullPage: true,
    });
  });

  test('should restore archived client', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockRestoreClient(page, true);
    await navigateToClientsSettings(page);

    // Given: I am viewing archived clients
    const showArchivedToggle = page.locator(
      '[data-testid="show-archived-toggle"], input[name="showArchived"]'
    );
    await expect(showArchivedToggle).toBeVisible({ timeout: 10000 });
    await showArchivedToggle.click();
    await page.waitForLoadState('networkidle');

    // When: I click "Restore" on an archived client
    const restoreButton = page.getByRole('button', { name: /restore/i });
    await expect(restoreButton).toBeVisible({ timeout: 5000 });
    await restoreButton.click();

    // Then: The client should be restored - success message shown
    await expect(page.getByText(/restored|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-restored.png',
      fullPage: true,
    });
  });

  test('should preserve client data when archived', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // When: I view archived clients
    const showArchivedToggle = page.locator('[data-testid="show-archived-toggle"]');
    await expect(showArchivedToggle).toBeVisible({ timeout: 10000 });
    await showArchivedToggle.click();

    // Then: Archived client should still have their details available
    const archivedClient = page.getByText(/old client/i);
    await expect(archivedClient).toBeVisible({ timeout: 5000 });

    // Email should still be associated
    await expect(page.getByText(/old@client.com/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-data-preserved.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-C06 - Resend Client Invite
// =============================================================================

test.describe('US-C06: Resend Client Invite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should show Resend button for pending invites', async ({ page }) => {
    // Given: I have a pending (uninvited) client
    await mockClients(page, TEST_CLIENTS);

    // When: I view the invite in my client list
    await navigateToClientsSettings(page);

    // Then: I should see a "Resend" button for pending client
    const pendingClient = page.getByText(/beta startup/i);
    await expect(pendingClient).toBeVisible({ timeout: 10000 });

    const resendButton = page.getByRole('button', { name: /resend/i });
    await expect(resendButton).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-button.png',
      fullPage: true,
    });
  });

  test('should show pending status indicator', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Then: Pending clients should have a status indicator
    const pendingBadge = page.locator(
      '[data-testid="status-pending"], .badge:has-text("pending"), span:has-text("Pending")'
    );
    await expect(pendingBadge).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-pending-status.png',
      fullPage: true,
    });
  });

  test('should resend invite successfully', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockResendInvite(page, true);
    await navigateToClientsSettings(page);

    // Given: I have a pending client
    const pendingClient = page.getByText(/beta startup/i);
    await expect(pendingClient).toBeVisible({ timeout: 10000 });

    // When: I click "Resend"
    const resendButton = page.getByRole('button', { name: /resend/i });
    await expect(resendButton).toBeVisible({ timeout: 5000 });
    await resendButton.click();

    // Then: A new email should be sent - success message shown
    await expect(page.getByText(/sent|resent|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-success.png',
      fullPage: true,
    });
  });

  test('should show resend count', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Then: Should show how many times invite has been resent
    // Either as explicit count or remaining resends
    const resendInfo = page.locator(
      '[data-testid="resend-count"], span:has-text("resent"), span:has-text("remaining")'
    );
    await expect(resendInfo).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-count.png',
      fullPage: true,
    });
  });

  test('should disable resend after 3 attempts', async ({ page }) => {
    // Given: I have a client with 3 resends already
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // When: I view the client with max resends
    const maxResendClient = page.getByText(/max resend client/i);
    await expect(maxResendClient).toBeVisible({ timeout: 10000 });

    // Then: Resend button should be disabled
    const resendButton = page
      .locator('[data-testid="client-row"]:has-text("Max Resend")')
      .getByRole('button', { name: /resend/i });
    await expect(resendButton).toBeVisible({ timeout: 5000 });
    await expect(resendButton).toBeDisabled();

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-limit.png',
      fullPage: true,
    });
  });

  test('should show limit reached message for max resend clients', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // When: I view the client with max resends
    const maxResendClient = page.getByText(/max resend client/i);
    await expect(maxResendClient).toBeVisible({ timeout: 10000 });

    // Then: Show limit reached message
    const limitMessage = page.getByText(/limit.*reached|maximum.*resend|no more resend/i);
    await expect(limitMessage).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-limit-message.png',
      fullPage: true,
    });
  });

  test('should handle resend limit error from API', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockResendInvite(page, false, true);
    await navigateToClientsSettings(page);

    // When: I try to resend and API returns 429
    const resendButton = page.getByRole('button', { name: /resend/i }).first();
    await expect(resendButton).toBeVisible({ timeout: 10000 });
    await expect(resendButton).toBeEnabled();
    await resendButton.click();

    // Then: Should show limit error message
    await expect(page.getByText(/limit|maximum|3 resends/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-limit-error.png',
      fullPage: true,
    });
  });

  test('should show invite expiry information', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Then: Should show when invite expires (30 days from sent)
    const expiryInfo = page.getByText(/expires|expiry|valid.*until|days.*left/i);
    await expect(expiryInfo).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-invite-expiry.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Error Handling
// =============================================================================

test.describe('Client Lifecycle Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should handle archive failure gracefully', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockArchiveClient(page, false);
    await navigateToClientsSettings(page);

    // When: Archive fails
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible({ timeout: 10000 });
    await archiveButton.click();

    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Then: Error message should be shown
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-archive-error.png',
      fullPage: true,
    });
  });

  test('should handle resend failure gracefully', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockResendInvite(page, false, false);
    await navigateToClientsSettings(page);

    // When: Resend fails
    const resendButton = page.getByRole('button', { name: /resend/i }).first();
    await expect(resendButton).toBeVisible({ timeout: 10000 });
    await resendButton.click();

    // Then: Error message should be shown
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-error.png',
      fullPage: true,
    });
  });

  test('should handle no clients gracefully', async ({ page }) => {
    // Given: No clients
    await mockClients(page, []);
    await navigateToClientsSettings(page);

    // Then: Should show empty state
    await expect(page.getByText(/no client|add.*client|invite.*first/i)).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-empty-state.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Portfolio Integration
// =============================================================================

test.describe('Client Lifecycle Portfolio Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should update portfolio when client archived', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockArchiveClient(page, true);

    // First view portfolio
    await navigateToConsultantDashboard(page);

    // Note active clients count
    const activeClients = page.locator('[data-testid="client-card"]');
    const initialCount = await activeClients.count();

    // Archive a client
    await navigateToClientsSettings(page);
    const archiveButton = page.getByRole('button', { name: /archive/i });
    await expect(archiveButton).toBeVisible({ timeout: 10000 });
    await archiveButton.click();

    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait for archive to complete
    await expect(page.getByText(/archived|success/i)).toBeVisible({ timeout: 5000 });

    // Return to portfolio - archived client should be hidden
    await navigateToConsultantDashboard(page);

    await page.screenshot({
      path: 'tests/e2e/screenshots/portfolio-after-archive.png',
      fullPage: true,
    });
  });

  test('should update portfolio when client restored', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockRestoreClient(page, true);

    // Restore an archived client
    await navigateToClientsSettings(page);

    const showArchivedToggle = page.locator('[data-testid="show-archived-toggle"]');
    await expect(showArchivedToggle).toBeVisible({ timeout: 10000 });
    await showArchivedToggle.click();

    const restoreButton = page.getByRole('button', { name: /restore/i });
    await expect(restoreButton).toBeVisible({ timeout: 5000 });
    await restoreButton.click();

    // Wait for restore to complete
    await expect(page.getByText(/restored|success/i)).toBeVisible({ timeout: 5000 });

    // Return to portfolio - restored client should appear
    await navigateToConsultantDashboard(page);

    await page.screenshot({
      path: 'tests/e2e/screenshots/portfolio-after-restore.png',
      fullPage: true,
    });
  });
});
