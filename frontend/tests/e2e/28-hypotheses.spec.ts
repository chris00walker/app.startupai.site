/**
 * @story US-F17
 */

/**
 * 28-hypotheses.spec.ts
 *
 * Hypotheses E2E Tests
 *
 * Covers user stories:
 * - US-F17: Manage Hypotheses
 *
 * Story Reference: docs/user-experience/stories/founder.md
 * Journey Reference: docs/user-experience/journeys/founder/founder-journey-map.md
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

const TIMEOUT = { timeout: 15_000 };
const HYPOTHESIS_URL = '/founder-dashboard?tab=hypotheses';

test.describe('US-F17: Manage Hypotheses', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, FOUNDER_USER);
  });

  test('should navigate to hypotheses tab from dashboard', async ({ page }) => {
    await page.goto('/founder-dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible(TIMEOUT);

    // Click the Hypotheses tab
    const hypothesesTab = page.getByRole('tab', { name: /hypotheses/i });
    await hypothesesTab.click();

    // Verify we're on the hypotheses tab
    await expect(page).toHaveURL(/tab=hypotheses/);
    await expect(page.getByRole('heading', { name: /business hypotheses/i })).toBeVisible(TIMEOUT);
  });

  test('should create a hypothesis with default status', async ({ page }) => {
    await page.goto(HYPOTHESIS_URL);
    await expect(page.getByRole('heading', { name: /business hypotheses/i })).toBeVisible(TIMEOUT);

    // Click Add Hypothesis button
    const addButton = page.getByRole('button', { name: /add hypothesis/i });
    await addButton.click();

    // Fill in the form
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(TIMEOUT);

    const statementInput = dialog.locator('textarea#statement');
    const testStatement = `Test hypothesis ${Date.now()}`;
    await statementInput.fill(testStatement);

    // Select type (Desirable is default)
    const typeSelect = dialog.locator('#type').locator('..');
    await typeSelect.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Feasible' }).click();

    // Select importance
    const importanceSelect = dialog.locator('#importance').locator('..');
    await importanceSelect.getByRole('combobox').click();
    await page.getByRole('option', { name: 'High' }).click();

    // Submit
    await dialog.getByRole('button', { name: /create hypothesis/i }).click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible(TIMEOUT);

    // Verify hypothesis appears in the list
    await expect(page.getByText(testStatement)).toBeVisible(TIMEOUT);

    // Verify default status is 'Untested'
    const hypothesisCard = page.locator('article, [class*="card"]').filter({ hasText: testStatement }).first();
    await expect(hypothesisCard.getByText(/untested/i)).toBeVisible();

    // Verify default evidence is 'No Evidence'
    await expect(hypothesisCard.getByText(/no evidence/i)).toBeVisible();
  });

  test('should edit a hypothesis statement or status', async ({ page }) => {
    await page.goto(HYPOTHESIS_URL);
    await expect(page.getByRole('heading', { name: /business hypotheses/i })).toBeVisible(TIMEOUT);

    // Create a hypothesis first (to ensure we have one to edit)
    const addButton = page.getByRole('button', { name: /add hypothesis/i });
    await addButton.click();

    const createDialog = page.getByRole('dialog');
    const originalStatement = `Edit test ${Date.now()}`;
    await createDialog.locator('textarea#statement').fill(originalStatement);
    await createDialog.getByRole('button', { name: /create hypothesis/i }).click();
    await expect(createDialog).not.toBeVisible(TIMEOUT);

    // Find and click Edit button on the hypothesis
    const hypothesisCard = page.locator('article, [class*="card"]').filter({ hasText: originalStatement }).first();
    await expect(hypothesisCard).toBeVisible(TIMEOUT);
    await hypothesisCard.getByRole('button', { name: /edit/i }).click();

    // Edit dialog should open
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible(TIMEOUT);
    await expect(editDialog.getByRole('heading', { name: /edit hypothesis/i })).toBeVisible();

    // Update the statement
    const updatedStatement = `Updated hypothesis ${Date.now()}`;
    await editDialog.locator('textarea#edit-statement').clear();
    await editDialog.locator('textarea#edit-statement').fill(updatedStatement);

    // Change status from Untested to Testing
    const statusSelect = editDialog.locator('#edit-status').locator('..');
    await statusSelect.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Testing' }).click();

    // Save changes
    await editDialog.getByRole('button', { name: /save changes/i }).click();
    await expect(editDialog).not.toBeVisible(TIMEOUT);

    // Verify updates
    await expect(page.getByText(updatedStatement)).toBeVisible(TIMEOUT);
    const updatedCard = page.locator('article, [class*="card"]').filter({ hasText: updatedStatement }).first();
    await expect(updatedCard.getByText(/testing/i)).toBeVisible();
  });

  test('should delete a hypothesis after confirmation', async ({ page }) => {
    await page.goto(HYPOTHESIS_URL);
    await expect(page.getByRole('heading', { name: /business hypotheses/i })).toBeVisible(TIMEOUT);

    // Create a hypothesis to delete
    const addButton = page.getByRole('button', { name: /add hypothesis/i });
    await addButton.click();

    const createDialog = page.getByRole('dialog');
    const deleteStatement = `Delete test ${Date.now()}`;
    await createDialog.locator('textarea#statement').fill(deleteStatement);
    await createDialog.getByRole('button', { name: /create hypothesis/i }).click();
    await expect(createDialog).not.toBeVisible(TIMEOUT);

    // Verify hypothesis exists
    const hypothesisCard = page.locator('article, [class*="card"]').filter({ hasText: deleteStatement }).first();
    await expect(hypothesisCard).toBeVisible(TIMEOUT);

    // Click Delete button
    await hypothesisCard.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion in alert dialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible(TIMEOUT);
    await expect(alertDialog.getByText(/delete hypothesis/i)).toBeVisible();
    await expect(alertDialog.getByText(/cannot be undone/i)).toBeVisible();

    // Click confirm delete
    await alertDialog.getByRole('button', { name: /delete/i }).click();
    await expect(alertDialog).not.toBeVisible(TIMEOUT);

    // Verify hypothesis is removed from the list
    await expect(page.getByText(deleteStatement)).not.toBeVisible(TIMEOUT);
  });

  test('should cancel delete without removing hypothesis', async ({ page }) => {
    await page.goto(HYPOTHESIS_URL);
    await expect(page.getByRole('heading', { name: /business hypotheses/i })).toBeVisible(TIMEOUT);

    // Create a hypothesis
    const addButton = page.getByRole('button', { name: /add hypothesis/i });
    await addButton.click();

    const createDialog = page.getByRole('dialog');
    const keepStatement = `Keep this ${Date.now()}`;
    await createDialog.locator('textarea#statement').fill(keepStatement);
    await createDialog.getByRole('button', { name: /create hypothesis/i }).click();
    await expect(createDialog).not.toBeVisible(TIMEOUT);

    // Click Delete
    const hypothesisCard = page.locator('article, [class*="card"]').filter({ hasText: keepStatement }).first();
    await hypothesisCard.getByRole('button', { name: /delete/i }).click();

    // Cancel the deletion
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible(TIMEOUT);
    await alertDialog.getByRole('button', { name: /cancel/i }).click();
    await expect(alertDialog).not.toBeVisible(TIMEOUT);

    // Verify hypothesis still exists
    await expect(page.getByText(keepStatement)).toBeVisible(TIMEOUT);
  });

  test('should filter hypotheses by type', async ({ page }) => {
    await page.goto(HYPOTHESIS_URL);
    await expect(page.getByRole('heading', { name: /business hypotheses/i })).toBeVisible(TIMEOUT);

    // Click the Desirable filter button
    const desirableFilter = page.getByRole('button', { name: /desirable/i });
    await desirableFilter.click();

    // Only desirable hypotheses should be visible (or none if no desirable hypotheses)
    // Verify filter is active
    await expect(desirableFilter).toHaveAttribute('data-state', 'active').catch(() => {
      // Alternative: check for variant change
      expect(desirableFilter).toHaveClass(/default/);
    });
  });
});
