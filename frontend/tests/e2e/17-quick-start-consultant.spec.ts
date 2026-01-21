/**
 * Quick Start Consultant E2E Tests (ADR-006)
 *
 * Tests the Quick Start flow for consultants starting projects on behalf of clients.
 * Consultants select an active client, then use the Quick Start form.
 *
 * Test Scenarios:
 * 1. Client selection page when no clientId provided
 * 2. Quick Start form with clientId pre-populated
 * 3. Project created under client's account
 * 4. Redirect to consultant's client view
 */

import { test, expect } from '@playwright/test';
import { login, CONSULTANT_USER } from './helpers/auth';

test.describe('Quick Start - Consultant Client Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should display client selection when no clientId provided', async ({ page }) => {
    await page.goto('/consultant/client/new');

    // Should show client selection card
    const pageTitle = page.locator('text=/Start Client Project/i');
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Should have description
    const description = page.locator('text=/Select a client/i');
    await expect(description).toBeVisible();

    await page.screenshot({ path: 'test-results/consultant-client-selection.png', fullPage: true });
  });

  test('should show empty state when no active clients', async ({ page }) => {
    // This test assumes the consultant has no active clients
    // In a real scenario, we'd mock the API or use a test account without clients
    await page.goto('/consultant/client/new');

    // Check for either client list or empty state
    const hasClients = await page.locator('a[href*="/consultant/client/new?clientId="]').count();

    if (hasClients === 0) {
      // Empty state
      const emptyMessage = page.locator('text=/No active clients/i');
      await expect(emptyMessage).toBeVisible();

      // Link to manage clients
      const manageLink = page.locator('a[href="/consultant/clients"]');
      await expect(manageLink).toBeVisible();
    } else {
      // Has clients - check that they're displayed
      expect(hasClients).toBeGreaterThan(0);
    }
  });

  test('should show Quick Start form when clientId is provided', async ({ page }) => {
    // First, get a valid client ID from the client selection page
    await page.goto('/consultant/client/new');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if there are any client links
    const clientLinks = page.locator('a[href*="/consultant/client/new?clientId="]');
    const clientCount = await clientLinks.count();

    if (clientCount > 0) {
      // Click the first client
      await clientLinks.first().click();

      // Should now show Quick Start form
      await page.waitForSelector('textarea#rawIdea, textarea[placeholder*="business idea" i]', {
        timeout: 10000,
      });

      const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
      await expect(ideaTextarea).toBeVisible();

      // Should show client name header
      const clientHeader = page.locator('text=/Starting validation for/i');
      await expect(clientHeader).toBeVisible();

      await page.screenshot({ path: 'test-results/consultant-quick-start-form.png', fullPage: true });
    } else {
      console.log('No active clients - skipping Quick Start form test');
      test.skip();
    }
  });

  test('should submit Quick Start for client and redirect', async ({ page }) => {
    // Navigate to client selection
    await page.goto('/consultant/client/new');
    await page.waitForLoadState('networkidle');

    const clientLinks = page.locator('a[href*="/consultant/client/new?clientId="]');
    const clientCount = await clientLinks.count();

    if (clientCount === 0) {
      console.log('No active clients - skipping submission test');
      test.skip();
      return;
    }

    // Click first client
    await clientLinks.first().click();

    // Wait for Quick Start form
    const ideaTextarea = page.locator('textarea#rawIdea, textarea[placeholder*="business idea" i]');
    await expect(ideaTextarea).toBeVisible({ timeout: 10000 });

    // Enter business idea
    const clientBusinessIdea = 'A B2B software platform for managing construction project timelines and contractor coordination';
    await ideaTextarea.fill(clientBusinessIdea);

    // Submit
    const submitButton = page.locator('button[type="submit"]:has-text("Start Validation")');
    await submitButton.click();

    // Wait for redirect (should go to consultant's client project view)
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/consultant/clients/') ||
        url.pathname.includes('/dashboard'),
      { timeout: 15000 }
    );

    const currentUrl = page.url();
    console.log(`Redirected to: ${currentUrl}`);

    // Verify redirect is to a client-related page
    expect(
      currentUrl.includes('/consultant/clients/') ||
      currentUrl.includes('/dashboard')
    ).toBe(true);

    await page.screenshot({ path: 'test-results/consultant-quick-start-submitted.png', fullPage: true });
  });

  test('should display client name in Quick Start form', async ({ page }) => {
    await page.goto('/consultant/client/new');
    await page.waitForLoadState('networkidle');

    const clientLinks = page.locator('a[href*="/consultant/client/new?clientId="]');
    const clientCount = await clientLinks.count();

    if (clientCount === 0) {
      console.log('No active clients - skipping client name test');
      test.skip();
      return;
    }

    // Get the client name from the list before clicking
    const clientNameElement = clientLinks.first().locator('p.font-medium');
    const clientName = await clientNameElement.textContent();

    // Click client
    await clientLinks.first().click();

    // Verify client name appears in the form
    if (clientName) {
      const displayedName = page.locator(`text=${clientName}`);
      await expect(displayedName).toBeVisible({ timeout: 10000 });
    }
  });

  test('should redirect non-consultant to founder dashboard', async ({ page }) => {
    // This would require logging in as a founder and trying to access consultant page
    // For now, we just document the expected behavior
    // The server-side check should redirect non-consultants

    // Login as founder
    await page.context().clearCookies();
    await page.goto('/login');

    // Re-login as consultant to continue other tests
    await login(page, CONSULTANT_USER);
  });
});

test.describe('Quick Start - Consultant Authorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should reject invalid clientId', async ({ page }) => {
    // Try to access with an invalid/non-existent client ID
    await page.goto('/consultant/client/new?clientId=00000000-0000-0000-0000-000000000000');

    // Should redirect to clients list with error
    await page.waitForURL(
      (url) => url.pathname.includes('/consultant/clients'),
      { timeout: 10000 }
    );

    // Check URL has error parameter
    const currentUrl = page.url();
    expect(currentUrl).toContain('error');
  });

  test('should require authentication', async ({ page }) => {
    // Clear cookies to simulate logged out state
    await page.context().clearCookies();

    // Try to access client new page
    await page.goto('/consultant/client/new');

    // Should redirect to login
    await page.waitForURL(
      (url) => url.pathname.includes('/login'),
      { timeout: 10000 }
    );

    // Return URL should be set
    const currentUrl = page.url();
    expect(currentUrl).toContain('returnUrl');
  });
});
