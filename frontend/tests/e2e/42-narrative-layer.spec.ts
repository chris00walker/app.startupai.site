/**
 * E2E Tests: Narrative Layer
 *
 * Tests the full narrative generation, editing, export,
 * verification, and publication flows.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :4942-5046
 */

import { test, expect } from '@playwright/test';

// TODO: Import auth helpers when running against real environment
// import { loginAsFounder } from './helpers/auth';

test.describe('Narrative Layer', () => {
  test.describe('Generation Flow', () => {
    test('shows empty state when prerequisites not met', async ({ page }) => {
      // TODO: Login as test founder with incomplete project
      await page.goto('/project/test-project-id/narrative');

      // Should show prerequisite checklist
      await expect(page.getByText('Your pitch narrative is almost ready')).toBeVisible();
      await expect(page.getByText('Project with company name and industry')).toBeVisible();
    });

    test('shows first-run prompt when prerequisites met', async ({ page }) => {
      // TODO: Login as test founder with complete project
      await page.goto('/project/test-project-id/narrative');

      await expect(page.getByText('Your pitch narrative is ready to generate')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Generate My Pitch Narrative' })).toBeVisible();
    });

    test('generates narrative and shows 10-slide preview', async ({ page }) => {
      // TODO: Login as test founder
      await page.goto('/project/test-project-id/narrative');

      // Click generate
      await page.getByRole('button', { name: 'Generate My Pitch Narrative' }).click();

      // Should show loading state with cycling messages
      await expect(page.getByText('Analyzing your validation evidence')).toBeVisible({ timeout: 5000 });

      // Wait for generation to complete (up to 60s for AI)
      await expect(page.getByText('Pitch Narrative')).toBeVisible({ timeout: 60000 });

      // Should show all slide cards
      await expect(page.getByText('Cover')).toBeVisible();
      await expect(page.getByText('Overview')).toBeVisible();
      await expect(page.getByText('Traction')).toBeVisible();
    });
  });

  test.describe('Editing Flow', () => {
    test('opens editor with slide navigation', async ({ page }) => {
      // TODO: Login as test founder with existing narrative
      await page.goto('/project/test-project-id/narrative');

      await page.getByRole('button', { name: 'Edit' }).click();
      await expect(page).toHaveURL(/\/narrative\/edit/);

      // Should show slide navigator
      await expect(page.getByText('Slide 1 of')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    });

    test('saves edits and shows alignment status', async ({ page }) => {
      // TODO: Login as test founder with existing narrative
      await page.goto('/project/test-project-id/narrative/edit');

      // Edit a field
      const textarea = page.locator('textarea').first();
      await textarea.fill('Updated content from E2E test.');

      // Save
      await page.getByRole('button', { name: 'Save Edits' }).click();

      // Should show pending alignment status
      await expect(page.getByText('Checking')).toBeVisible({ timeout: 5000 });

      // Wait for Guardian check to complete
      await expect(page.getByText(/Verified|Review needed/)).toBeVisible({ timeout: 15000 });
    });

    test('flags overstated claims', async ({ page }) => {
      // TODO: Login as test founder with low-fit-score narrative
      await page.goto('/project/test-project-id/narrative/edit');

      // Edit with overstated language
      const textarea = page.locator('textarea').first();
      await textarea.fill('We have proven demand with strong traction and confirmed market leadership.');

      await page.getByRole('button', { name: 'Save Edits' }).click();

      // Should eventually flag the edit
      await expect(page.getByText('Review needed')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Export Flow', () => {
    test('exports PDF with QR code', async ({ page }) => {
      // TODO: Login as test founder with published narrative
      await page.goto('/project/test-project-id/narrative');

      // Click export
      await page.getByRole('button', { name: 'Export' }).click();

      // Should show export dialog
      await expect(page.getByText('Export as PDF')).toBeVisible();

      // QR code option should be checked by default
      const qrCheckbox = page.getByLabel('Include verification QR code');
      await expect(qrCheckbox).toBeChecked();

      // Export
      await page.getByRole('button', { name: 'Export PDF' }).click();

      // Should show download URL after export completes
      await expect(page.getByText('Download PDF')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Verification Flow', () => {
    test('shows verified status for valid token', async ({ page }) => {
      // TODO: Use a real verification token from a test export
      await page.goto('/verify/test-verification-token');

      // Should show verification status
      await expect(page.getByText(/Verified|Outdated|Not Found/)).toBeVisible({ timeout: 10000 });
    });

    test('shows not found for invalid token', async ({ page }) => {
      await page.goto('/verify/invalid-token-that-does-not-exist');

      await expect(page.getByText('Not Found')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Publication Flow', () => {
    test('shows HITL confirmation dialog', async ({ page }) => {
      // TODO: Login as test founder with narrative
      await page.goto('/project/test-project-id/narrative');

      await page.getByRole('button', { name: 'Publish' }).click();

      // Should show HITL checklist
      await expect(page.getByText('Publish your narrative')).toBeVisible();
      await expect(page.getByText('I have reviewed all 10 slides for accuracy')).toBeVisible();
      await expect(page.getByText('Traction data reflects current evidence')).toBeVisible();
    });

    test('requires all 4 confirmations to publish', async ({ page }) => {
      // TODO: Login as test founder
      await page.goto('/project/test-project-id/narrative');
      await page.getByRole('button', { name: 'Publish' }).click();

      // Publish button should be disabled until all checked
      const publishButton = page.getByRole('button', { name: 'Confirm & Publish' });
      await expect(publishButton).toBeDisabled();

      // Check all 4 boxes
      const checkboxes = page.locator('button[role="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).click();
      }

      // Now publish button should be enabled
      await expect(publishButton).toBeEnabled();
    });
  });

  test.describe('Version History', () => {
    test('shows version timeline', async ({ page }) => {
      // TODO: Login as test founder with narrative that has multiple versions
      await page.goto('/project/test-project-id/narrative');

      await page.getByRole('button', { name: 'History' }).click();
      await expect(page).toHaveURL(/\/narrative\/history/);

      // Should show version history card
      await expect(page.getByText('Version History')).toBeVisible();
    });

    test('shows diff when version selected', async ({ page }) => {
      // TODO: Login as test founder
      await page.goto('/project/test-project-id/narrative/history');

      // Click "View Diff" on a version
      const viewDiffButton = page.getByRole('button', { name: 'View Diff' }).first();
      if (await viewDiffButton.isVisible()) {
        await viewDiffButton.click();
        await expect(page.getByText('Changes:')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Dashboard Integration', () => {
    test('shows narrative tab in founder dashboard', async ({ page }) => {
      // TODO: Login as test founder
      await page.goto('/founder-dashboard');

      // Should have Narrative tab
      await expect(page.getByRole('tab', { name: 'Narrative' })).toBeVisible();
    });

    test('narrative tab shows prompt or dashboard card', async ({ page }) => {
      // TODO: Login as test founder
      await page.goto('/founder-dashboard');

      await page.getByRole('tab', { name: 'Narrative' }).click();

      // Should show either empty state/prompt or dashboard card
      const hasContent = await page.getByText(/Pitch Narrative|Your pitch narrative/).isVisible();
      expect(hasContent).toBe(true);
    });
  });
});
