/**
 * 22-consultant-trial.spec.ts
 *
 * Consultant Trial E2E Tests
 *
 * Covers user stories:
 * - US-CT01: Complete Consultant Trial Onboarding
 * - US-CT02: Explore Portfolio with Mock Clients
 * - US-CT03: Attempt Real Client Invite (Upgrade Prompt)
 * - US-CT04: View Consultant Trial Limits and Status
 * - US-CT05: Upgrade to Consultant Plan
 *
 * Story Reference: docs/user-experience/user-stories.md
 * Journey Reference: docs/user-experience/consultant-trial-journey-map.md
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Consultant trial user credentials
 */
const CONSULTANT_TRIAL_USER = {
  email: 'consultant-trial@startupai.com',
  password: 'ConsultantTrialTest123!',
  type: 'consultant_trial' as const,
};

/**
 * Login as consultant trial user
 */
async function loginAsConsultantTrial(page: Page): Promise<void> {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
    await emailInput.fill(CONSULTANT_TRIAL_USER.email);
    await passwordInput.fill(CONSULTANT_TRIAL_USER.password);

    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    await submitButton.click();

    await page.waitForLoadState('networkidle');
  }
}

/**
 * Mock consultant trial user with mock clients
 */
async function mockConsultantTrialUser(
  page: Page,
  options: {
    daysRemaining?: number;
    mockClientsCount?: number;
    expired?: boolean;
  } = {}
): Promise<void> {
  const { daysRemaining = 14, mockClientsCount = 2, expired = false } = options;

  await page.route('**/api/user/trial-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        is_trial: true,
        trial_type: 'consultant',
        days_remaining: expired ? 0 : daysRemaining,
        mock_clients_count: mockClientsCount,
        mock_clients_max: 2,
        expires_at: expired
          ? new Date(Date.now() - 86400000).toISOString()
          : new Date(Date.now() + daysRemaining * 86400000).toISOString(),
      }),
    });
  });

  // Mock mock clients data
  await page.route('**/api/consultant/clients', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        clients: [
          {
            id: 'mock-client-1',
            name: 'Mock Client - AI Meal Planning',
            business_idea: 'AI-powered meal planning app for busy professionals',
            is_mock: true,
            validation_stage: 'phase_2',
            signals: { desirability: 'strong', feasibility: 'unknown', viability: 'unknown' },
          },
          {
            id: 'mock-client-2',
            name: 'Mock Client - Construction SaaS',
            business_idea: 'B2B SaaS for construction scheduling',
            is_mock: true,
            validation_stage: 'phase_1',
            signals: { desirability: 'moderate', feasibility: 'unknown', viability: 'unknown' },
          },
        ],
      }),
    });
  });
}

// =============================================================================
// US-CT01: Complete Consultant Trial Onboarding
// =============================================================================

test.describe('US-CT01: Complete Consultant Trial Onboarding', () => {
  test('should redirect consultant intent signup to consultant onboarding', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Sign up with consultant intent, verify redirect to /onboarding/consultant
    test.skip();
  });

  test('should complete consultant trial onboarding', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Fill practice setup form, verify redirect to dashboard with mock clients
    test.skip();
  });

  test('should display practice setup form with required fields', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Verify specializations, industries, experience fields present
    test.skip();
  });

  test('should receive 2 mock clients after onboarding', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Complete onboarding, verify 2 mock clients in portfolio
    test.skip();
  });
});

// =============================================================================
// US-CT02: Explore Portfolio with Mock Clients
// =============================================================================

test.describe('US-CT02: Explore Portfolio with Mock Clients', () => {
  test.beforeEach(async ({ page }) => {
    await mockConsultantTrialUser(page);
    await loginAsConsultantTrial(page);
  });

  test('should display mock clients in portfolio', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Verify 2 mock client cards visible with different stages
    test.skip();
  });

  test('should display mock client detail page', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Click mock client, verify D-F-V signals and canvases visible
    test.skip();
  });

  test('should show realistic sample data in mock clients', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Verify data is not placeholder text
    test.skip();
  });

  test('should display trial badge with days remaining', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    test.skip();
  });
});

// =============================================================================
// US-CT03: Attempt Real Client Invite (Upgrade Prompt)
// =============================================================================

test.describe('US-CT03: Attempt Real Client Invite (Upgrade Prompt)', () => {
  test.beforeEach(async ({ page }) => {
    await mockConsultantTrialUser(page);
    await loginAsConsultantTrial(page);
  });

  test('should show upgrade prompt on real invite attempt', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Click Add Client, fill email, submit, verify upgrade modal appears
    test.skip();
  });

  test('should display feature comparison in upgrade modal', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Verify trial vs paid features shown
    test.skip();
  });

  test('should display correct pricing in upgrade modal', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Verify $149/mo shown
    test.skip();
  });

  test('should preserve mock clients after dismissing upgrade modal', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Dismiss modal, verify mock clients still visible
    test.skip();
  });
});

// =============================================================================
// US-CT04: View Consultant Trial Limits and Status
// =============================================================================

test.describe('US-CT04: View Consultant Trial Limits and Status', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsConsultantTrial(page);
  });

  test('should display trial status card', async ({ page }) => {
    await mockConsultantTrialUser(page, { daysRemaining: 14 });
    // TODO: Implement when consultant trial flow is built
    // Verify days remaining, mock clients used, locked features shown
    test.skip();
  });

  test('should display urgent badge when trial ending soon', async ({ page }) => {
    await mockConsultantTrialUser(page, { daysRemaining: 3 });
    // TODO: Implement when consultant trial flow is built
    // Verify "3 days left" urgent badge
    test.skip();
  });

  test('should display full-page upgrade prompt when trial expired', async ({ page }) => {
    await mockConsultantTrialUser(page, { expired: true });
    // TODO: Implement when consultant trial flow is built
    // Navigate to dashboard, verify full-page upgrade prompt
    test.skip();
  });
});

// =============================================================================
// US-CT05: Upgrade to Consultant Plan
// =============================================================================

test.describe('US-CT05: Upgrade to Consultant Plan', () => {
  test.beforeEach(async ({ page }) => {
    await mockConsultantTrialUser(page);
    await loginAsConsultantTrial(page);
  });

  test('should navigate to Stripe checkout on upgrade click', async ({ page }) => {
    // TODO: Implement when consultant trial flow is built
    // Click upgrade, verify Stripe checkout with $149/mo
    test.skip();
  });

  test('should upgrade to consultant plan', async ({ page }) => {
    // TODO: Implement when payment integration is built
    // Complete Stripe checkout (mock), verify role changes to consultant
    test.skip();
  });

  test('should remove trial badge after upgrade', async ({ page }) => {
    // TODO: Implement when payment integration is built
    // After upgrade, verify trial badge removed
    test.skip();
  });

  test('should convert mock clients to archivable sample clients', async ({ page }) => {
    // TODO: Implement when payment integration is built
    // After upgrade, verify mock clients still visible but archivable
    test.skip();
  });

  test('should enable real client invites after upgrade', async ({ page }) => {
    // TODO: Implement when payment integration is built
    // After upgrade, click Add Client, verify invite sends successfully
    test.skip();
  });
});
