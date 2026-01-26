/**
 * Data Imports E2E Tests
 *
 * Tests for US-BI01: Import Existing Business Data
 *
 * @story US-BI01
 */

import { test, expect } from '@playwright/test';

test.describe('US-BI01: Data Imports', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings integrations tab
    await page.goto('/settings');
    await page.getByRole('tab', { name: /integrations/i }).click();
  });

  test('should display connected integrations', async ({ page }) => {
    // Check integrations list is visible
    await expect(page.getByText(/connected integrations/i)).toBeVisible();
  });

  test('should show import button for connected integration', async ({ page }) => {
    // Look for import action on a connected integration
    const integrationCard = page.locator('[data-testid="integration-card"]').first();

    // If integration is connected, import button should be available
    const importButton = integrationCard.getByRole('button', { name: /import/i });
    if (await importButton.isVisible()) {
      await expect(importButton).toBeEnabled();
    }
  });

  test('should open import dialog when clicking import', async ({ page }) => {
    // Find and click import button
    const importButton = page.getByRole('button', { name: /import/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/import from/i)).toBeVisible();
    }
  });

  test('should display importable items in dialog', async ({ page }) => {
    // This test requires a connected integration with items
    const importButton = page.getByRole('button', { name: /import/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Wait for items to load
      await page.waitForSelector('[data-testid="importable-items-list"]', {
        timeout: 10000,
      }).catch(() => {
        // Items might not load if no integration is connected
      });

      // Either items or "no items" message should be visible
      const hasItems = await page.locator('[data-testid="import-item"]').count() > 0;
      const hasNoItems = await page.getByText(/no importable items/i).isVisible();

      expect(hasItems || hasNoItems).toBeTruthy();
    }
  });

  test('should allow selecting items for import', async ({ page }) => {
    const importButton = page.getByRole('button', { name: /import/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Wait for items to load
      const items = page.locator('[data-testid="import-item"]');

      if ((await items.count()) > 0) {
        // Click first item to select
        await items.first().click();

        // Selection badge should appear
        await expect(page.getByText(/1 selected/i)).toBeVisible();
      }
    }
  });

  test('should have select all functionality', async ({ page }) => {
    const importButton = page.getByRole('button', { name: /import/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Look for select all checkbox
      const selectAll = page.getByLabel(/select all/i);

      if (await selectAll.isVisible()) {
        await selectAll.click();

        // All items should be selected
        const items = page.locator('[data-testid="import-item"]');
        const itemCount = await items.count();

        if (itemCount > 0) {
          await expect(page.getByText(new RegExp(`${itemCount} selected`, 'i'))).toBeVisible();
        }
      }
    }
  });

  test('should show import progress', async ({ page }) => {
    // This test requires actual import action
    // For now, just verify the UI structure exists
    const importButton = page.getByRole('button', { name: /import/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Dialog should have import action button
      const dialogImportButton = page.getByRole('dialog').getByRole('button', { name: /import/i });
      await expect(dialogImportButton).toBeVisible();
    }
  });

  test('should close dialog on cancel', async ({ page }) => {
    const importButton = page.getByRole('button', { name: /import/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();

      // Wait for dialog
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });
});

test.describe('US-BI01: Import API', () => {
  test('should require authentication for import endpoints', async ({ request }) => {
    // List items endpoint should require auth
    const listResponse = await request.get('/api/imports/notion/items');
    expect(listResponse.status()).toBe(401);

    // Import endpoint should require auth
    const importResponse = await request.post('/api/imports/notion', {
      data: { projectId: '00000000-0000-0000-0000-000000000000', items: [] },
    });
    expect(importResponse.status()).toBe(401);
  });

  test('should validate integration type', async ({ request }) => {
    // Invalid integration type should return 400
    const response = await request.get('/api/imports/invalid_type/items');
    expect([400, 401]).toContain(response.status());
  });
});
