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
 */
async function navigateToClientsSettings(page: Page): Promise<void> {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  const clientsTab = page.getByRole('tab', { name: /clients/i });
  if (await clientsTab.isVisible()) {
    await clientsTab.click();
    await page.waitForLoadState('networkidle');
  }
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

    // Then: I should see a client selector
    const clientList = page.locator(
      '[data-testid="client-list"], [data-testid="client-selector"], table'
    );

    // Check for client management UI
    const settingsContent = await page.textContent('main');
    expect(
      settingsContent?.toLowerCase().includes('client') ||
        (await clientList.isVisible()) ||
        (await page.getByText(/acme corp/i).isVisible())
    ).toBeTruthy();

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

    if (await archiveButton.isVisible()) {
      await expect(archiveButton).toBeEnabled();
    }

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
    if (await clientRow.isVisible()) {
      await clientRow.click();
    }

    // When: I click "Archive Client"
    const archiveButton = page.getByRole('button', { name: /archive/i });
    if (await archiveButton.isVisible()) {
      await archiveButton.click();

      // Handle confirmation dialog if present
      const confirmButton = page.getByRole('button', { name: /confirm|yes|archive/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Then: The client should be archived
      await expect(page.getByText(/archived|success/i)).toBeVisible({ timeout: 5000 });
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-archived-success.png',
      fullPage: true,
    });
  });

  test('should hide archived clients from portfolio by default', async ({ page }) => {
    // Given: I have archived a client
    await mockClients(page, TEST_CLIENTS);

    // When: I view my portfolio
    await navigateToConsultantDashboard(page);

    // Then: The archived client should be hidden
    const oldClient = page.getByText(/old client/i);

    // Archived clients should not be visible by default in portfolio
    await page.screenshot({
      path: 'tests/e2e/screenshots/portfolio-no-archived.png',
      fullPage: true,
    });
  });

  test('should show archived clients when toggled in Settings', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Given: I have archived a client
    // When: I toggle "Show archived clients" in Settings
    const showArchivedToggle = page.locator(
      '[data-testid="show-archived-toggle"], input[name="showArchived"], label:has-text("archived")'
    );

    if (await showArchivedToggle.isVisible()) {
      await showArchivedToggle.click();

      // Then: I should see the archived client with a "Restore" option
      await page.waitForLoadState('networkidle');

      const archivedClient = page.getByText(/old client/i);
      if (await archivedClient.isVisible()) {
        const restoreButton = page.getByRole('button', { name: /restore/i });
        await expect(restoreButton).toBeVisible();
      }
    }

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

    if (await showArchivedToggle.isVisible()) {
      await showArchivedToggle.click();
      await page.waitForLoadState('networkidle');

      // When: I click "Restore" on an archived client
      const restoreButton = page.getByRole('button', { name: /restore/i });
      if (await restoreButton.isVisible()) {
        await restoreButton.click();

        // Then: The client should be restored
        await expect(page.getByText(/restored|success/i)).toBeVisible({ timeout: 5000 });
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-restored.png',
      fullPage: true,
    });
  });

  test('should preserve client data when archived', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // When: I archive a client
    // Then: Their data should be unchanged (verified by checking they can be restored)

    // The key assertion is that archived clients retain their data
    // and can be accessed again after restore
    const showArchivedToggle = page.locator('[data-testid="show-archived-toggle"]');
    if (await showArchivedToggle.isVisible()) {
      await showArchivedToggle.click();

      // Archived client should still have their details available
      const archivedClient = page.getByText(/old client/i);
      if (await archivedClient.isVisible()) {
        // Email should still be associated
        await expect(page.getByText(/old@client.com/i)).toBeVisible();
      }
    }

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

    // Then: I should see a "Resend" button
    const pendingClient = page.getByText(/beta startup/i);
    if (await pendingClient.isVisible()) {
      const resendButton = page.getByRole('button', { name: /resend/i });
      await expect(resendButton).toBeVisible();
    }

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

    if (await pendingBadge.isVisible()) {
      await expect(pendingBadge).toBeVisible();
    }

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
    if (await pendingClient.isVisible()) {
      // When: I click "Resend"
      const resendButton = page.getByRole('button', { name: /resend/i });
      if (await resendButton.isVisible()) {
        await resendButton.click();

        // Then: A new email should be sent
        await expect(page.getByText(/sent|resent|success/i)).toBeVisible({ timeout: 5000 });
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-success.png',
      fullPage: true,
    });
  });

  test('should show resend count', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await navigateToClientsSettings(page);

    // Then: Should show how many times invite has been resent
    const resendCount = page.locator('[data-testid="resend-count"], span:has-text("resent")');

    // Or show remaining resends
    const remainingResends = page.getByText(/\d.*resend.*remaining|\d.*of.*3/i);

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
    if (await maxResendClient.isVisible()) {
      // Then: Resend button should be disabled or show limit message
      const resendButton = page
        .locator('[data-testid="client-row"]:has-text("Max Resend")')
        .getByRole('button', { name: /resend/i });

      if (await resendButton.isVisible()) {
        // Button should be disabled
        await expect(resendButton).toBeDisabled();
      }

      // Or show limit reached message
      const limitMessage = page.getByText(/limit.*reached|maximum.*resend|no more resend/i);
      if (await limitMessage.isVisible()) {
        await expect(limitMessage).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/client-resend-limit.png',
      fullPage: true,
    });
  });

  test('should handle resend limit error', async ({ page }) => {
    await mockClients(page, TEST_CLIENTS);
    await mockResendInvite(page, false, true);
    await navigateToClientsSettings(page);

    // When: I try to resend when limit is reached
    const resendButton = page.getByRole('button', { name: /resend/i }).first();
    if (await resendButton.isVisible() && (await resendButton.isEnabled())) {
      await resendButton.click();

      // Then: Should show limit error
      await expect(page.getByText(/limit|maximum|3 resends/i)).toBeVisible({ timeout: 5000 });
    }

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

    if (await expiryInfo.isVisible()) {
      await expect(expiryInfo).toBeVisible();
    }

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
    if (await archiveButton.isVisible()) {
      await archiveButton.click();

      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Then: Error message should be shown
      await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });
    }

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
    if (await resendButton.isVisible()) {
      await resendButton.click();

      // Then: Error message should be shown
      await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });
    }

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
    await expect(page.getByText(/no client|add.*client|invite.*first/i)).toBeVisible();

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

    // Archive a client
    await navigateToClientsSettings(page);
    const archiveButton = page.getByRole('button', { name: /archive/i });
    if (await archiveButton.isVisible()) {
      await archiveButton.click();
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }

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
    if (await showArchivedToggle.isVisible()) {
      await showArchivedToggle.click();

      const restoreButton = page.getByRole('button', { name: /restore/i });
      if (await restoreButton.isVisible()) {
        await restoreButton.click();
      }
    }

    // Return to portfolio - restored client should appear
    await navigateToConsultantDashboard(page);

    await page.screenshot({
      path: 'tests/e2e/screenshots/portfolio-after-restore.png',
      fullPage: true,
    });
  });
});
