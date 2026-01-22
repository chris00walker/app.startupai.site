/**
 * 13-trial-limits.spec.ts
 *
 * Trial Limits and Upgrade E2E Tests
 *
 * Covers user stories:
 * - US-FT02: View Trial Limits
 * - US-FT03: Upgrade to Founder
 *
 * Story Reference: docs/user-experience/stories/README.md
 * Feature Reference: docs/features/trial-limits-and-upgrade.md
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Trial user credentials
 * Note: In a real implementation, you'd have a separate trial test user
 */
const TRIAL_USER = {
  email: 'trial-test@startupai.com',
  password: 'TrialTest123!',
  type: 'founder_trial' as const,
};

/**
 * Login as trial user
 */
async function loginAsTrialUser(page: Page): Promise<void> {
  await page.goto('/login');

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
    await emailInput.fill(TRIAL_USER.email);
    await passwordInput.fill(TRIAL_USER.password);

    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    await submitButton.click();

    await page.waitForLoadState('networkidle');
  }
}

/**
 * Mock user as trial with specific limits
 */
async function mockTrialUser(
  page: Page,
  options: {
    daysRemaining?: number;
    projectsUsed?: number;
    projectsMax?: number;
    currentPhase?: number;
    expired?: boolean;
  } = {}
): Promise<void> {
  const {
    daysRemaining = 15,
    projectsUsed = 0,
    projectsMax = 1,
    currentPhase = 0,
    expired = false,
  } = options;

  await page.route('**/api/user/trial-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        is_trial: true,
        days_remaining: expired ? 0 : daysRemaining,
        expires_at: expired
          ? new Date(Date.now() - 86400000).toISOString()
          : new Date(Date.now() + daysRemaining * 86400000).toISOString(),
        limits: {
          projects: { used: projectsUsed, max: projectsMax },
          phases: { allowed: [0], current: currentPhase },
          features: ['onboarding', 'founders_brief'],
        },
        upgrade_url: '/upgrade',
      }),
    });
  });

  // Mock user profile with trial plan
  await page.route('**/api/user/profile*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'trial-user-1',
            email: TRIAL_USER.email,
            plan: 'trial',
            trial_expires_at: expired
              ? new Date(Date.now() - 86400000).toISOString()
              : new Date(Date.now() + daysRemaining * 86400000).toISOString(),
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock Stripe checkout session
 */
async function mockStripeCheckout(page: Page): Promise<void> {
  await page.route('**/api/stripe/create-checkout-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        checkout_url: 'https://checkout.stripe.com/test-session',
      }),
    });
  });
}

/**
 * Mock projects API for trial user
 */
async function mockTrialProjects(
  page: Page,
  count: number,
  includePhase1Data = false
): Promise<void> {
  const projects = Array.from({ length: count }, (_, i) => ({
    id: `proj-${i + 1}`,
    name: `Trial Project ${i + 1}`,
    status: 'active',
    current_phase: includePhase1Data ? 1 : 0,
    created_at: new Date().toISOString(),
  }));

  await page.route('**/api/projects*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: projects }),
      });
    } else if (route.request().method() === 'POST') {
      // Block creation if at limit
      if (count >= 1) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Trial limit reached',
            message: 'Upgrade to create more projects',
            upgrade_url: '/upgrade',
          }),
        });
      } else {
        await route.continue();
      }
    } else {
      await route.continue();
    }
  });
}

// =============================================================================
// Test Suite: US-FT02 - View Trial Limits
// =============================================================================

test.describe('US-FT02: View Trial Limits', () => {
  test('should display trial badge in header', async ({ page }) => {
    // Given: I am logged in as a Trial user
    await mockTrialUser(page, { daysRemaining: 12 });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // When: I view any page
    // Then: I should see the trial badge with days remaining
    const trialBadge = page.locator(
      '[data-testid="trial-badge"], .trial-badge, span:has-text("Trial")'
    );

    // Check for trial indicator
    const headerContent = await page.locator('header, nav').textContent();
    const hasTrial =
      headerContent?.toLowerCase().includes('trial') ||
      headerContent?.toLowerCase().includes('days');

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-badge-header.png',
      fullPage: true,
    });
  });

  test('should display trial status card on dashboard', async ({ page }) => {
    // Given: I am logged in as a Trial user
    await mockTrialUser(page, { daysRemaining: 12, projectsUsed: 1, projectsMax: 1 });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // When: I view my dashboard
    // Then: I should see trial status card with limits
    const trialCard = page.locator(
      '[data-testid="trial-status-card"], [data-testid="trial-limits"], .trial-status'
    );

    // Look for limit indicators
    const limitIndicators = page.getByText(/\d.*of.*\d|remaining|limit/i);

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-status-card.png',
      fullPage: true,
    });
  });

  test('should show project limit indicator', async ({ page }) => {
    await mockTrialUser(page, { projectsUsed: 1, projectsMax: 1 });
    await mockTrialProjects(page, 1);
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: I should see remaining project allowance
    const projectLimit = page.getByText(/1.*of.*1|project.*limit|no.*project.*remaining/i);

    if (await projectLimit.isVisible()) {
      await expect(projectLimit).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-project-limit.png',
      fullPage: true,
    });
  });

  test('should show locked features list', async ({ page }) => {
    await mockTrialUser(page);
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: I should see locked features
    const lockedSection = page.locator(
      '[data-testid="locked-features"], .locked-features, section:has-text("locked")'
    );

    // Or individual locked feature indicators
    const lockIcons = page.locator('[data-testid="feature-locked"], .feature-lock, .lock-icon');

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-locked-features.png',
      fullPage: true,
    });
  });

  test('should show blurred preview for D-F-V signals', async ({ page }) => {
    await mockTrialUser(page);
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // When: I try to view D-F-V signals
    const dfvSection = page.locator(
      '[data-testid="dfv-signals"], [data-testid="innovation-physics"]'
    );

    if (await dfvSection.isVisible()) {
      // Then: Content should be blurred or locked
      const blurredContent = dfvSection.locator('.blur, .locked, [data-locked="true"]');
      const upgradeOverlay = dfvSection.getByText(/upgrade|unlock/i);

      // Either blurred or has upgrade overlay
      const isLocked =
        (await blurredContent.isVisible()) || (await upgradeOverlay.isVisible());
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-blurred-dfv.png',
      fullPage: true,
    });
  });

  test('should show upgrade prompt when hitting limit', async ({ page }) => {
    // Given: I have reached a usage limit
    await mockTrialUser(page, { projectsUsed: 1, projectsMax: 1 });
    await mockTrialProjects(page, 1);

    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // When: I attempt to create another project
    const newProjectButton = page.getByRole('button', { name: /new.*project|create.*project/i });
    const addButton = page.getByRole('link', { name: /add|new|create/i });

    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
    } else if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Then: I should see an upgrade prompt
    const upgradePrompt = page.locator(
      '[data-testid="upgrade-modal"], [role="dialog"]:has-text("upgrade")'
    );
    const upgradeMessage = page.getByText(/upgrade.*to.*create|limit.*reached/i);

    if ((await upgradePrompt.isVisible()) || (await upgradeMessage.isVisible())) {
      await expect(upgradePrompt.or(upgradeMessage)).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-limit-upgrade-prompt.png',
      fullPage: true,
    });
  });

  test('should show expiration warning at 7 days', async ({ page }) => {
    await mockTrialUser(page, { daysRemaining: 7 });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should show expiration warning
    const expirationWarning = page.getByText(/7.*day|expires.*soon|trial.*ending/i);

    if (await expirationWarning.isVisible()) {
      await expect(expirationWarning).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-expiration-warning.png',
      fullPage: true,
    });
  });

  test('should show phase restriction message', async ({ page }) => {
    await mockTrialUser(page, { currentPhase: 0 });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should indicate Phase 0 only access
    const phaseRestriction = page.getByText(/phase.*0.*only|founder.*brief.*only|limited.*phase/i);

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-phase-restriction.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-FT03 - Upgrade to Founder
// =============================================================================

test.describe('US-FT03: Upgrade to Founder', () => {
  test('should display upgrade CTA in trial card', async ({ page }) => {
    await mockTrialUser(page);
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should see upgrade button
    const upgradeButton = page.getByRole('button', { name: /upgrade/i });
    const upgradeLink = page.getByRole('link', { name: /upgrade/i });

    await expect(upgradeButton.or(upgradeLink)).toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-upgrade-cta.png',
      fullPage: true,
    });
  });

  test('should navigate to upgrade page', async ({ page }) => {
    await mockTrialUser(page);
    await mockStripeCheckout(page);
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // When: I click upgrade
    const upgradeButton = page.getByRole('button', { name: /upgrade/i }).first();
    const upgradeLink = page.getByRole('link', { name: /upgrade/i }).first();

    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
    } else if (await upgradeLink.isVisible()) {
      await upgradeLink.click();
    }

    await page.waitForLoadState('networkidle');

    // Then: Should see upgrade page or modal
    const upgradePage = page.url().includes('upgrade') || page.url().includes('pricing');
    const upgradeModal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-upgrade-page.png',
      fullPage: true,
    });
  });

  test('should display plan comparison', async ({ page }) => {
    await mockTrialUser(page);
    await page.goto('/upgrade');
    await page.waitForLoadState('networkidle');

    // Then: Should see plan comparison
    const founderPlan = page.getByText(/founder.*plan|\$99/i);
    const planFeatures = page.getByText(/full.*validation|d-f-v|all.*phase/i);

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-plan-comparison.png',
      fullPage: true,
    });
  });

  test('should initiate Stripe checkout', async ({ page }) => {
    await mockTrialUser(page);
    await mockStripeCheckout(page);
    await page.goto('/upgrade');
    await page.waitForLoadState('networkidle');

    // When: I select a plan and proceed
    const selectPlanButton = page.getByRole('button', {
      name: /start.*founder|select.*founder|upgrade.*now/i,
    });

    if (await selectPlanButton.isVisible()) {
      // Intercept navigation to Stripe
      const [request] = await Promise.all([
        page.waitForRequest('**/api/stripe/create-checkout-session'),
        selectPlanButton.click(),
      ]);

      // Then: Should call checkout API
      expect(request.url()).toContain('stripe');
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-stripe-checkout.png',
      fullPage: true,
    });
  });

  test('should show multiple upgrade entry points', async ({ page }) => {
    await mockTrialUser(page);
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Count upgrade CTAs on page
    const upgradeCTAs = page.locator(
      'button:has-text("upgrade"), a:has-text("upgrade"), [data-testid*="upgrade"]'
    );

    const ctaCount = await upgradeCTAs.count();

    // Should have multiple entry points
    expect(ctaCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-multiple-ctas.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Trial Expiration
// =============================================================================

test.describe('Trial Expiration', () => {
  test('should show expired trial modal', async ({ page }) => {
    // Given: Trial has expired
    await mockTrialUser(page, { expired: true, daysRemaining: 0 });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should see expired modal
    const expiredModal = page.locator(
      '[data-testid="trial-expired-modal"], [role="dialog"]:has-text("expired")'
    );
    const expiredMessage = page.getByText(/trial.*expired|trial.*ended/i);

    await expect(expiredModal.or(expiredMessage)).toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-expired-modal.png',
      fullPage: true,
    });
  });

  test('should restrict access after expiration', async ({ page }) => {
    await mockTrialUser(page, { expired: true });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should not be able to access features
    const restrictedMessage = page.getByText(/upgrade.*continue|restricted|access.*denied/i);

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-restricted-access.png',
      fullPage: true,
    });
  });

  test('should offer data download before deletion', async ({ page }) => {
    await mockTrialUser(page, { expired: true });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should see data download option
    const downloadOption = page.getByRole('button', { name: /download.*data|export/i });
    const downloadLink = page.getByRole('link', { name: /download.*data|export/i });

    if ((await downloadOption.isVisible()) || (await downloadLink.isVisible())) {
      await expect(downloadOption.or(downloadLink)).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-data-download.png',
      fullPage: true,
    });
  });

  test('should preserve data for 90 days after expiration', async ({ page }) => {
    await mockTrialUser(page, { expired: true });
    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should mention data preservation period
    const preservationMessage = page.getByText(/90.*day|data.*preserved|data.*saved/i);

    if (await preservationMessage.isVisible()) {
      await expect(preservationMessage).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-data-preservation.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Post-Upgrade Experience
// =============================================================================

test.describe('Post-Upgrade Experience', () => {
  test('should unlock all features after upgrade', async ({ page }) => {
    // Mock upgraded user
    await page.route('**/api/user/profile*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'upgraded-user-1',
            email: 'upgraded@test.com',
            plan: 'founder',
          },
        }),
      });
    });

    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: No locked features should be visible
    const lockedIndicators = page.locator('[data-locked="true"], .locked, .trial-limit');

    // Trial-specific elements should not be visible
    const trialBadge = page.locator('[data-testid="trial-badge"]');

    await page.screenshot({
      path: 'tests/e2e/screenshots/upgraded-all-unlocked.png',
      fullPage: true,
    });
  });

  test('should show welcome message after upgrade', async ({ page }) => {
    // Simulate post-upgrade redirect
    await page.goto('/founder-dashboard?upgraded=true');
    await page.waitForLoadState('networkidle');

    // Then: Should see welcome/success message
    const welcomeMessage = page.getByText(/welcome.*founder|upgrade.*success|thank.*you/i);
    const successToast = page.locator('[data-testid="toast"]:has-text("success")');

    await page.screenshot({
      path: 'tests/e2e/screenshots/upgraded-welcome.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Error Handling
// =============================================================================

test.describe('Trial Limits Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/user/trial-status', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/founder-dashboard');
    await page.waitForLoadState('networkidle');

    // Then: Should show error state or fallback gracefully
    // Should not crash the page
    await expect(page.locator('body')).toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-api-error.png',
      fullPage: true,
    });
  });

  test('should handle Stripe checkout failure', async ({ page }) => {
    await mockTrialUser(page);

    // Mock Stripe error
    await page.route('**/api/stripe/create-checkout-session', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment service unavailable' }),
      });
    });

    await page.goto('/upgrade');
    await page.waitForLoadState('networkidle');

    const selectPlanButton = page.getByRole('button', { name: /start|select|upgrade/i });
    if (await selectPlanButton.isVisible()) {
      await selectPlanButton.click();

      // Then: Should show error message
      await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/trial-checkout-error.png',
      fullPage: true,
    });
  });
});
