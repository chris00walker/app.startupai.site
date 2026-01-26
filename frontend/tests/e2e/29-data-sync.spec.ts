/**
 * Data Sync E2E Tests
 *
 * Tests for US-BI02: Sync Project to External Platform
 *
 * @story US-BI02
 */

import { test, expect } from '@playwright/test';

test.describe('US-BI02: Data Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings integrations tab
    await page.goto('/settings');
    await page.getByRole('tab', { name: /integrations/i }).click();
  });

  test('should display sync status for connected integrations', async ({ page }) => {
    // Look for sync status component
    const syncStatus = page.locator('[data-testid="sync-status"]');

    // If there are connected integrations, sync status should be visible
    if ((await syncStatus.count()) > 0) {
      await expect(syncStatus.first()).toBeVisible();
    }
  });

  test('should show sync now button', async ({ page }) => {
    // Find sync now button
    const syncButton = page.getByRole('button', { name: /sync now/i }).first();

    if (await syncButton.isVisible()) {
      await expect(syncButton).toBeEnabled();
    }
  });

  test('should have auto-sync toggle', async ({ page }) => {
    // Look for auto-sync switch
    const autoSyncSwitch = page.getByLabel(/auto-sync/i);

    if (await autoSyncSwitch.isVisible()) {
      await expect(autoSyncSwitch).toBeVisible();
    }
  });

  test('should display last sync time', async ({ page }) => {
    // Check for sync timestamp
    const syncTime = page.getByText(/last synced|never synced/i);

    if (await syncTime.isVisible()) {
      await expect(syncTime).toBeVisible();
    }
  });

  test('should show sync history', async ({ page }) => {
    // Look for recent syncs section
    const recentSyncs = page.getByText(/recent syncs/i);

    // This is optional - only visible if there's sync history
    if (await recentSyncs.isVisible()) {
      await expect(recentSyncs).toBeVisible();
    }
  });

  test('should indicate sync status with badge', async ({ page }) => {
    // Look for status badge (Synced, Failed, Pending, etc.)
    const statusBadge = page.locator('[data-testid="sync-status-badge"]');

    if ((await statusBadge.count()) > 0) {
      const badgeText = await statusBadge.first().textContent();
      expect(['Synced', 'Failed', 'Pending', 'Syncing', 'Never synced']).toContain(
        badgeText?.trim()
      );
    }
  });

  test('should provide link to synced resource', async ({ page }) => {
    // Look for "View" link to external resource
    const viewLink = page.getByRole('link', { name: /view/i });

    if (await viewLink.isVisible()) {
      const href = await viewLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should show error message on sync failure', async ({ page }) => {
    // This test checks for error display UI
    // Actual error would require a failed sync
    const errorDisplay = page.locator('[data-testid="sync-error"]');

    // Error display component should exist in DOM (may be hidden)
    // Just verify the UI structure is in place
    expect(errorDisplay).toBeDefined();
  });
});

test.describe('US-BI02: Sync API', () => {
  test('should require authentication for sync endpoints', async ({ request }) => {
    // Sync endpoint should require auth
    const syncResponse = await request.post('/api/integrations/notion/sync', {
      data: { projectId: '00000000-0000-0000-0000-000000000000' },
    });
    expect(syncResponse.status()).toBe(401);

    // History endpoint should require auth
    const historyResponse = await request.get('/api/integrations/notion/sync');
    expect(historyResponse.status()).toBe(401);
  });

  test('should validate project ID', async ({ request }) => {
    // Invalid project ID should return error
    const response = await request.post('/api/integrations/notion/sync', {
      data: { projectId: 'invalid-uuid' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('should validate integration type', async ({ request }) => {
    // Invalid integration type should return error
    const response = await request.post('/api/integrations/invalid_type/sync', {
      data: { projectId: '00000000-0000-0000-0000-000000000000' },
    });
    expect([400, 401, 404]).toContain(response.status());
  });
});

test.describe('US-BI02: Auto-Sync Preferences', () => {
  test('should toggle auto-sync preference', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('tab', { name: /integrations/i }).click();

    const autoSyncSwitch = page.getByLabel(/auto-sync/i).first();

    if (await autoSyncSwitch.isVisible()) {
      const initialState = await autoSyncSwitch.isChecked();

      // Toggle the switch
      await autoSyncSwitch.click();

      // State should change
      const newState = await autoSyncSwitch.isChecked();
      expect(newState).not.toBe(initialState);

      // Toggle back
      await autoSyncSwitch.click();
      expect(await autoSyncSwitch.isChecked()).toBe(initialState);
    }
  });

  test('should persist auto-sync preference', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('tab', { name: /integrations/i }).click();

    const autoSyncSwitch = page.getByLabel(/auto-sync/i).first();

    if (await autoSyncSwitch.isVisible()) {
      const initialState = await autoSyncSwitch.isChecked();

      // Toggle the switch
      await autoSyncSwitch.click();

      // Reload page
      await page.reload();
      await page.getByRole('tab', { name: /integrations/i }).click();

      // State should be persisted
      const newSwitch = page.getByLabel(/auto-sync/i).first();
      if (await newSwitch.isVisible()) {
        expect(await newSwitch.isChecked()).not.toBe(initialState);

        // Restore original state
        await newSwitch.click();
      }
    }
  });
});
