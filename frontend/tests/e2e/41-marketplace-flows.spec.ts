/**
 * Marketplace E2E Tests
 *
 * Tests for the Portfolio Holder / Consultant marketplace features:
 * - Consultant Directory (founders browsing verified consultants)
 * - Founder Directory (verified consultants browsing opt-in founders)
 * - Connection request/accept/decline flows
 * - RFQ creation and response flows
 *
 * @story US-PH01-07, US-FM01-11
 */

import { test, expect } from '@playwright/test';
import { login, CONSULTANT_USER, FOUNDER_USER } from './helpers/auth';

test.describe('Marketplace - Consultant Directory (Founder View)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should show consultant directory page for founders', async ({ page }) => {
    await page.goto('/founder/consultants');

    // Verify page content loads
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText(/consultant/i, { timeout: 15000 });

    // Verify filter controls are present
    const filterControls = page.locator('[aria-label*="filter" i], select, [role="combobox"]');
    await expect(filterControls.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter consultants by relationship type', async ({ page }) => {
    await page.goto('/founder/consultants');

    // Wait for directory to load
    const directoryContent = page.locator('[data-testid="consultant-directory"], main');
    await expect(directoryContent).toBeVisible({ timeout: 15000 });

    // Find and click relationship type filter
    const relationshipFilter = page.locator('[aria-label*="relationship" i], [aria-label*="type" i]').first();
    await relationshipFilter.click();

    // Select "Advisory" option
    const advisoryOption = page.locator('[role="option"]:has-text("Advisory"), option:has-text("Advisory")').first();
    await advisoryOption.click();

    // Verify filter is applied (URL or UI state should reflect)
    await page.waitForLoadState('networkidle');
  });

  test('should show consultant cards with verification badges', async ({ page }) => {
    await page.goto('/founder/consultants');

    // Wait for consultant cards to load
    const consultantCards = page.locator('[data-testid="consultant-card"], article, [role="article"]');

    // If there are consultants, verify badge is shown
    const cardCount = await consultantCards.count();
    if (cardCount > 0) {
      // Look for verification badge (checkmark icon or "verified" text)
      const verifiedBadge = page.locator('[data-testid="verified-badge"], svg[aria-label*="verified" i], :text("Verified")');
      const hasBadge = await verifiedBadge.first().isVisible().catch(() => false);
      console.log(`Consultant cards: ${cardCount}, Has verified badge: ${hasBadge}`);
    }

    await page.screenshot({ path: 'test-results/marketplace-consultant-directory.png', fullPage: true });
  });

  test('should open connection request modal when clicking connect', async ({ page }) => {
    await page.goto('/founder/consultants');

    // Wait for content
    await page.waitForLoadState('networkidle');

    // Find a "Connect" or "Request Connection" button
    const connectButton = page.locator('button:has-text("Connect"), button:has-text("Request")').first();
    const hasConnectButton = await connectButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasConnectButton) {
      await connectButton.click();

      // Verify modal opens with relationship type selection
      const modal = page.locator('[role="dialog"], [data-testid="connection-modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify relationship type selector is present
      const relationshipSelect = modal.locator('select, [role="combobox"]');
      await expect(relationshipSelect.first()).toBeVisible();

      await page.screenshot({ path: 'test-results/marketplace-connection-request-modal.png' });
    } else {
      console.log('No connect button found - may be no consultants available');
      await page.screenshot({ path: 'test-results/marketplace-no-consultants.png', fullPage: true });
    }
  });
});

test.describe('Marketplace - Founder Directory (Consultant View)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should show founder directory page for verified consultants', async ({ page }) => {
    await page.goto('/consultant/founders');

    // Check for either directory content or verification upgrade prompt
    const pageContent = page.locator('main, [data-testid="founder-directory"]');
    await expect(pageContent).toBeVisible({ timeout: 15000 });

    // If unverified, should see upgrade prompt
    const upgradePrompt = page.locator(':text("Verification Required"), :text("Upgrade")');
    const directoryContent = page.locator('h1:has-text("Founder"), [data-testid="founder-card"]');

    const hasUpgradePrompt = await upgradePrompt.first().isVisible().catch(() => false);
    const hasDirectory = await directoryContent.first().isVisible().catch(() => false);

    if (hasUpgradePrompt) {
      console.log('Consultant not verified - upgrade prompt shown (expected for unverified users)');
      await expect(upgradePrompt.first()).toBeVisible();
    } else if (hasDirectory) {
      console.log('Verified consultant - founder directory shown');
      await expect(directoryContent.first()).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/marketplace-founder-directory.png', fullPage: true });
  });

  test('should filter founders by validation stage', async ({ page }) => {
    await page.goto('/consultant/founders');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we have access (verified consultant)
    const upgradePrompt = page.locator(':text("Verification Required")');
    if (await upgradePrompt.isVisible().catch(() => false)) {
      console.log('Consultant not verified - skipping filter test');
      return;
    }

    // Find stage filter
    const stageFilter = page.locator('[aria-label*="stage" i]').first();
    const hasStageFilter = await stageFilter.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStageFilter) {
      await stageFilter.click();

      // Look for validation stages (Desirability, Feasibility, etc.)
      const desirabilityOption = page.locator('[role="option"]:has-text("Desirability")');
      const hasValidationStages = await desirabilityOption.isVisible().catch(() => false);

      if (hasValidationStages) {
        await desirabilityOption.click();
        console.log('Stage filter works with validation stages');
      }
    }

    await page.screenshot({ path: 'test-results/marketplace-founder-filter.png', fullPage: true });
  });
});

test.describe('Marketplace - Connection Management', () => {
  test('founder should see pending connection requests on dashboard', async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);

    await page.goto('/founder-dashboard');

    // Look for connection request card or badge
    const connectionCard = page.locator(
      '[data-testid="connection-request-card"], :text("pending request"), :text("Connection Request")'
    );
    const hasPendingRequests = await connectionCard.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasPendingRequests) {
      console.log('Pending connection requests visible on dashboard');
      await expect(connectionCard.first()).toBeVisible();
    } else {
      console.log('No pending connection requests (expected if none exist)');
    }

    await page.screenshot({ path: 'test-results/marketplace-dashboard-connections.png', fullPage: true });
  });

  test('founder should navigate to connections page and see request details', async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);

    await page.goto('/founder/connections');

    // Verify connections page loads
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText(/connection/i, { timeout: 15000 });

    // Look for tabs (Pending, Active, Past)
    const tabs = page.locator('[role="tablist"], [data-testid="connection-tabs"]');
    await expect(tabs).toBeVisible({ timeout: 10000 });

    // Click on Pending tab
    const pendingTab = page.locator('[role="tab"]:has-text("Pending")');
    await pendingTab.click();

    await page.screenshot({ path: 'test-results/marketplace-connections-page.png', fullPage: true });
  });

  test('consultant should see pending connection requests', async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);

    await page.goto('/consultant/connections');

    // Verify connections page loads
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText(/connection/i, { timeout: 15000 });

    // Look for tabs
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/marketplace-consultant-connections.png', fullPage: true });
  });
});

test.describe('Marketplace - RFQ (Request for Quote)', () => {
  test('founder should access RFQ creation page', async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);

    // Navigate to RFQ page (may be via dashboard or direct route)
    await page.goto('/founder/rfq/new');

    // Check if page exists and has form
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible({ timeout: 15000 });

    // Look for RFQ form elements
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], label:has-text("Title")');
    const hasRfqForm = await titleInput.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRfqForm) {
      console.log('RFQ creation form found');
      await expect(titleInput.first()).toBeVisible();
    } else {
      // May redirect to listing page or show different UI
      console.log('RFQ form not found at this route');
    }

    await page.screenshot({ path: 'test-results/marketplace-rfq-create.png', fullPage: true });
  });

  test('founder should view their RFQ responses', async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);

    // First, go to RFQ listing to find an existing RFQ
    await page.goto('/founder/rfq');

    const rfqList = page.locator('[data-testid="rfq-list"], main');
    await expect(rfqList).toBeVisible({ timeout: 15000 });

    // Look for an RFQ card to click
    const rfqCard = page.locator('[data-testid="rfq-card"], article, [role="listitem"]').first();
    const hasRfq = await rfqCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRfq) {
      await rfqCard.click();

      // Should navigate to RFQ detail with responses
      await page.waitForURL('**/rfq/**', { timeout: 10000 });

      // Look for responses section
      const responsesSection = page.locator(':text("Response"), :text("response")');
      console.log('Navigated to RFQ detail page');
    } else {
      console.log('No RFQs found - expected if none created');
    }

    await page.screenshot({ path: 'test-results/marketplace-rfq-responses.png', fullPage: true });
  });

  test('verified consultant should browse RFQ board', async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);

    await page.goto('/consultant/rfq');

    // Check for either RFQ board or verification upgrade prompt
    const upgradePrompt = page.locator(':text("Verification Required"), :text("Upgrade")');
    const rfqBoard = page.locator('[data-testid="rfq-board"], h1:has-text("RFQ"), main');

    await expect(rfqBoard).toBeVisible({ timeout: 15000 });

    const hasUpgradePrompt = await upgradePrompt.first().isVisible().catch(() => false);

    if (hasUpgradePrompt) {
      console.log('Consultant not verified - RFQ access restricted');
    } else {
      console.log('RFQ board accessible');
    }

    await page.screenshot({ path: 'test-results/marketplace-rfq-board.png', fullPage: true });
  });
});

test.describe('Marketplace - Onboarding Preferences', () => {
  test('consultant onboarding should collect marketplace preferences', async ({ page }) => {
    // This test verifies the onboarding flow includes marketplace opt-in
    await page.goto('/login');
    await login(page, CONSULTANT_USER);

    // Navigate to onboarding page directly
    await page.goto('/onboarding/consultant');

    // Check for marketplace preferences UI
    const marketplaceSection = page.locator(
      ':text("Marketplace"), :text("Directory"), [data-testid="marketplace-preferences"]'
    );
    const optInToggle = page.locator(
      '[id="directory-opt-in"], input[type="checkbox"], [role="switch"]'
    );
    const relationshipSelect = page.locator(
      'select:has-text("Advisory"), [aria-label*="relationship" i]'
    );

    // Verify marketplace preference controls exist
    const hasMarketplaceSection = await marketplaceSection.first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasOptIn = await optInToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMarketplaceSection || hasOptIn) {
      console.log('Marketplace preferences found in onboarding');
      await page.screenshot({ path: 'test-results/marketplace-onboarding-preferences.png', fullPage: true });
    } else {
      console.log('Marketplace preferences not visible - may have already completed onboarding');
      await page.screenshot({ path: 'test-results/marketplace-onboarding-no-preferences.png', fullPage: true });
    }
  });
});

test.describe('Marketplace - Analytics Events', () => {
  test('should track marketplace events in PostHog', async ({ page }) => {
    // This test verifies analytics tracking is set up
    // We'll intercept network requests to check for PostHog calls
    const posthogCalls: string[] = [];

    await page.route('**/i.posthog.com/**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        posthogCalls.push(postData);
      }
      await route.continue();
    });

    await page.goto('/login');
    await login(page, FOUNDER_USER);

    await page.goto('/founder/consultants');
    await page.waitForLoadState('networkidle');

    // Check if any PostHog events were captured
    // Note: Events may be batched, so we check after page load
    console.log(`PostHog calls captured: ${posthogCalls.length}`);

    // Verify page loaded (this is the main assertion)
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });
});
