/**
 * Quick Start Founder E2E Tests (ADR-006)
 *
 * Tests the Quick Start flow that replaces the 7-stage AI conversation.
 * Founders can now submit their business idea via a simple form and
 * immediately start Phase 1 validation.
 *
 * Test Scenarios:
 * 1. Submit Quick Start form → redirect to dashboard
 * 2. Dashboard shows "Phase 1: Researching..." progress
 * 3. Validation with optional hints
 * 4. Error handling for invalid input
 *
 * @story US-F01, US-F07, US-FT01
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

test.describe('Quick Start - Founder Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display Quick Start form on /onboarding/founder', async ({ page }) => {
    await page.goto('/onboarding/founder');

    // Wait for form to load
    await page.waitForSelector('[data-testid="quick-start-form"], form', { timeout: 10000 });

    // Check for business idea textarea
    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
    await expect(ideaTextarea).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Submit button should be disabled initially (no idea entered)
    await expect(submitButton).toBeDisabled();

    await page.screenshot({ path: 'test-results/quick-start-form.png', fullPage: true });
  });

  test('should enable submit button when idea is entered', async ({ page }) => {
    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter a business idea
    await ideaTextarea.fill('A mobile app for tracking personal carbon footprint');

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should show validation error for short idea', async ({ page }) => {
    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter a too-short idea
    await ideaTextarea.fill('short');

    // Try to submit (force click even if disabled)
    await submitButton.click({ force: true });

    // Check for validation error
    const errorMessage = page.locator('text=/at least 10 characters/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should expand optional hints section', async ({ page }) => {
    await page.goto('/onboarding/founder');

    // Find and click the hints toggle
    const hintsToggle = page.locator('button:has-text("optional hints")');
    await expect(hintsToggle).toBeVisible();
    await hintsToggle.click();

    // Check that hints fields are now visible
    const industrySelect = page.locator('#industry, [id*="industry"]');
    const targetUserSelect = page.locator('#targetUser, [id*="target"]');
    const geographySelect = page.locator('#geography, [id*="geography"]');

    await expect(industrySelect).toBeVisible();
    await expect(targetUserSelect).toBeVisible();
    await expect(geographySelect).toBeVisible();

    await page.screenshot({ path: 'test-results/quick-start-hints-expanded.png', fullPage: true });
  });

  test('should submit Quick Start and redirect to project analysis', async ({ page }) => {
    // Enable mock mode for testing
    await page.addInitScript(() => {
      (window as { MODAL_USE_MOCK?: boolean }).MODAL_USE_MOCK = true;
    });

    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter a valid business idea
    const businessIdea = 'A SaaS platform that helps small restaurants manage their inventory and reduce food waste using AI-powered demand forecasting';
    await ideaTextarea.fill(businessIdea);

    // Submit the form
    await submitButton.click();

    // Wait for redirect to project analysis page
    // The API should redirect to /project/{project_id}/analysis
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/project/') &&
        url.pathname.endsWith('/analysis'),
      { timeout: 15000 }
    );

    const currentUrl = page.url();
    console.log(`Redirected to: ${currentUrl}`);

    // Verify we're on project analysis
    expect(currentUrl.includes('/project/') && currentUrl.endsWith('/analysis')).toBe(true);

    // CRITICAL: Verify the page shows progress tracking, not "No Analysis Available"
    // This catches the bug where validation_runs record isn't created
    // Use .first() because the regex may match multiple elements (heading + phase label)
    const progressIndicator = page.locator(
      'text=/Analysis Processing|Phase 1|VPC Discovery|Researching|Validation in Progress/i'
    ).first();
    const noAnalysisError = page.locator('text=/No Analysis Available/i');

    // Should show progress, not error
    await expect(progressIndicator).toBeVisible({ timeout: 10000 });
    await expect(noAnalysisError).not.toBeVisible();

    await page.screenshot({ path: 'test-results/quick-start-submitted.png', fullPage: true });
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter a valid business idea
    await ideaTextarea.fill('A marketplace connecting local farmers with urban restaurants for fresh produce delivery');

    // Click submit
    await submitButton.click();

    // Check for loading state (button should show "Starting Validation...")
    const loadingButton = page.locator('button:has-text("Starting Validation")');
    await expect(loadingButton).toBeVisible({ timeout: 5000 });

    // Button should be disabled during loading
    await expect(loadingButton).toBeDisabled();
  });

  test('should submit with optional hints filled', async ({ page }) => {
    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');

    // Enter a valid business idea
    await ideaTextarea.fill('An AI-powered tutoring platform for K-12 students that adapts to individual learning styles');

    // Expand hints section
    const hintsToggle = page.locator('button:has-text("optional hints")');
    await hintsToggle.click();

    // Fill in hints
    // Select industry
    const industryTrigger = page.locator('#industry, button:has([data-slot="select-value"])').first();
    await industryTrigger.click();
    await page.locator('[data-slot="select-item"]:has-text("Education")').click();

    // Select target user
    const targetTrigger = page.locator('#targetUser, button:has([data-slot="select-value"])').nth(1);
    await targetTrigger.click();
    await page.locator('[data-slot="select-item"]:has-text("Consumers")').click();

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for redirect
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/project/') &&
        url.pathname.endsWith('/analysis'),
      { timeout: 15000 }
    );

    await page.screenshot({ path: 'test-results/quick-start-with-hints.png', fullPage: true });
  });

  test('should show character count for business idea', async ({ page }) => {
    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');

    // Enter some text
    const testIdea = 'Test business idea for character counting';
    await ideaTextarea.fill(testIdea);

    // Check for character count display
    const charCount = page.locator(`text=/${testIdea.length}/`);
    await expect(charCount).toBeVisible();
  });

  test('should preserve form state on validation error', async ({ page }) => {
    await page.goto('/onboarding/founder');

    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');

    // Enter a short idea that will fail validation
    const shortIdea = 'test';
    await ideaTextarea.fill(shortIdea);

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click({ force: true });

    // Wait for validation error
    await page.waitForSelector('text=/at least 10 characters/i', { timeout: 5000 });

    // Verify the textarea still has the entered text
    await expect(ideaTextarea).toHaveValue(shortIdea);
  });
});

test.describe('Quick Start - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    await page.goto('/onboarding/founder');

    // Check that textarea has associated label
    const ideaTextarea = page.locator('textarea#rawIdea');
    const label = page.locator('label[for="rawIdea"]');
    await expect(label).toBeVisible();

    // Check that submit button has accessible text
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAccessibleName(/start validation/i);
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    await page.goto('/onboarding/founder');

    // Check for skip link (should be sr-only initially)
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Focus the skip link and verify it becomes visible
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });
});
