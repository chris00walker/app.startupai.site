/**
 * 25-billing.spec.ts
 *
 * Billing & Payment E2E Tests
 *
 * Covers user stories:
 * - US-B01: View Billing History
 * - US-B02: Download Invoice
 * - US-B03: Update Payment Method
 * - US-B04: Handle Payment Failure (Dunning)
 * - US-B05: Request Refund
 * - US-B06: Change Plan (Upgrade/Downgrade)
 * - US-B07: View Tax Invoice (VAT/GST)
 * - US-B08: Apply Promo Code
 * - US-B09: Switch Billing Cycle
 * - US-B10: Resume After Payment Recovery
 *
 * Story Reference: docs/user-experience/user-stories.md
 * Journey Reference: docs/user-experience/billing-journey-map.md
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Test user credentials
 */
const TEST_USER = {
  email: 'billing-test@startupai.com',
  password: 'BillingTest123!',
};

/**
 * Login as test user
 */
async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);

    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    await submitButton.click();

    await page.waitForLoadState('networkidle');
  }
}

/**
 * Mock billing history API
 */
async function mockBillingHistory(page: Page): Promise<void> {
  await page.route('**/api/billing/history**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        invoices: [
          {
            id: 'inv_001',
            date: '2024-01-15',
            amount: 4900,
            currency: 'usd',
            status: 'paid',
            pdf_url: 'https://stripe.com/invoice/inv_001.pdf',
          },
          {
            id: 'inv_002',
            date: '2024-02-15',
            amount: 4900,
            currency: 'usd',
            status: 'paid',
            pdf_url: 'https://stripe.com/invoice/inv_002.pdf',
          },
        ],
      }),
    });
  });
}

/**
 * Mock subscription with payment failure
 */
async function mockPaymentFailure(page: Page): Promise<void> {
  await page.route('**/api/subscription**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'past_due',
        plan: 'founder',
        last_payment_error: 'card_declined',
        grace_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });
}

/**
 * Mock active subscription
 */
async function mockActiveSubscription(page: Page): Promise<void> {
  await page.route('**/api/subscription**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'active',
        plan: 'founder',
        billing_cycle: 'monthly',
        amount: 4900,
        currency: 'usd',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });
}

// =============================================================================
// US-B01: View Billing History
// =============================================================================

test.describe('US-B01: View Billing History', () => {
  test.beforeEach(async ({ page }) => {
    await mockBillingHistory(page);
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display billing history in settings', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Navigate to Settings > Billing, verify history table
    test.skip();
  });

  test('should show invoice date, amount, and status', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify columns: Date, Amount, Status displayed
    test.skip();
  });

  test('should paginate large billing history', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Mock many invoices, verify pagination controls
    test.skip();
  });

  test('should filter by date range', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Select date range, verify filtered results
    test.skip();
  });
});

// =============================================================================
// US-B02: Download Invoice
// =============================================================================

test.describe('US-B02: Download Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await mockBillingHistory(page);
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should show download link for each invoice', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify download icon/link on each invoice row
    test.skip();
  });

  test('should download PDF invoice', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Click download, verify PDF download initiated
    test.skip();
  });

  test('should open invoice in Stripe portal', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Click "View in Stripe", verify redirect to Stripe
    test.skip();
  });
});

// =============================================================================
// US-B03: Update Payment Method
// =============================================================================

test.describe('US-B03: Update Payment Method', () => {
  test.beforeEach(async ({ page }) => {
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display current payment method', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify card ending in XXXX shown
    test.skip();
  });

  test('should open Stripe Elements for card update', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Click "Update", verify Stripe card input appears
    test.skip();
  });

  test('should validate card before saving', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Enter invalid card, verify error message
    test.skip();
  });

  test('should confirm card update success', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Enter valid card, verify success message
    test.skip();
  });

  test('should redirect to Stripe Billing Portal', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Click "Manage in Stripe", verify redirect
    test.skip();
  });
});

// =============================================================================
// US-B04: Handle Payment Failure (Dunning)
// =============================================================================

test.describe('US-B04: Handle Payment Failure (Dunning)', () => {
  test.beforeEach(async ({ page }) => {
    await mockPaymentFailure(page);
    await loginAsTestUser(page);
  });

  test('should display payment failure banner', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify prominent banner with "Payment failed" message
    test.skip();
  });

  test('should show grace period remaining', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify "X days to resolve" countdown
    test.skip();
  });

  test('should explain what happens if not resolved', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify suspension warning text
    test.skip();
  });

  test('should provide quick update payment link', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Click "Update payment", verify Stripe Elements opens
    test.skip();
  });

  test('should retry payment after card update', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Update card, verify retry triggered automatically
    test.skip();
  });
});

// =============================================================================
// US-B05: Request Refund
// =============================================================================

test.describe('US-B05: Request Refund', () => {
  test.beforeEach(async ({ page }) => {
    await mockBillingHistory(page);
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display refund policy', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Navigate to billing, verify refund policy visible
    test.skip();
  });

  test('should show request refund option for eligible invoices', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify "Request refund" only on invoices within policy window
    test.skip();
  });

  test('should collect refund reason', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Click request refund, verify reason selection
    test.skip();
  });

  test('should submit refund request', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Complete form, verify "Request submitted" confirmation
    test.skip();
  });

  test('should show refund request status', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify pending refund shown in billing history
    test.skip();
  });
});

// =============================================================================
// US-B06: Change Plan (Upgrade/Downgrade)
// =============================================================================

test.describe('US-B06: Change Plan (Upgrade/Downgrade)', () => {
  test.beforeEach(async ({ page }) => {
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display current plan and alternatives', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Navigate to plan settings, verify current plan highlighted
    test.skip();
  });

  test('should show feature comparison between plans', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify feature matrix comparing plans
    test.skip();
  });

  test('should calculate prorated amount for upgrade', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Select higher plan, verify proration shown
    test.skip();
  });

  test('should explain credit for downgrade', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Select lower plan, verify credit explanation
    test.skip();
  });

  test('should complete plan change', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Confirm change, verify new plan active
    test.skip();
  });
});

// =============================================================================
// US-B07: View Tax Invoice (VAT/GST)
// =============================================================================

test.describe('US-B07: View Tax Invoice (VAT/GST)', () => {
  test.beforeEach(async ({ page }) => {
    await mockBillingHistory(page);
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display tax ID input in billing settings', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Navigate to billing, verify VAT ID field
    test.skip();
  });

  test('should validate tax ID format', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Enter invalid VAT, verify format error
    test.skip();
  });

  test('should show tax breakdown on invoices', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify subtotal + tax + total breakdown
    test.skip();
  });

  test('should generate compliant tax invoice', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Download invoice, verify tax ID and breakdown included
    test.skip();
  });
});

// =============================================================================
// US-B08: Apply Promo Code
// =============================================================================

test.describe('US-B08: Apply Promo Code', () => {
  test.beforeEach(async ({ page }) => {
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display promo code input at checkout', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Navigate to upgrade flow, verify promo code field
    test.skip();
  });

  test('should validate promo code', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Enter invalid code, verify "Invalid code" error
    test.skip();
  });

  test('should apply valid promo code discount', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Enter valid code, verify discount shown
    test.skip();
  });

  test('should show original and discounted price', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify strikethrough original, new price displayed
    test.skip();
  });

  test('should handle expired promo code', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Enter expired code, verify friendly error message
    test.skip();
  });
});

// =============================================================================
// US-B09: Switch Billing Cycle
// =============================================================================

test.describe('US-B09: Switch Billing Cycle', () => {
  test.beforeEach(async ({ page }) => {
    await mockActiveSubscription(page);
    await loginAsTestUser(page);
  });

  test('should display current billing cycle', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify "Monthly" or "Annual" shown
    test.skip();
  });

  test('should show annual savings', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify "Save X%" for annual displayed
    test.skip();
  });

  test('should calculate prorated switch to annual', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Select annual, verify proration calculation
    test.skip();
  });

  test('should confirm billing cycle change', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Confirm switch, verify new cycle active
    test.skip();
  });

  test('should handle switch back to monthly', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Switch from annual to monthly, verify applied at renewal
    test.skip();
  });
});

// =============================================================================
// US-B10: Resume After Payment Recovery
// =============================================================================

test.describe('US-B10: Resume After Payment Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should show restricted access during suspension', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Mock suspended state, verify feature restrictions
    test.skip();
  });

  test('should provide payment recovery link', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify "Update payment to resume" CTA
    test.skip();
  });

  test('should restore access immediately after payment', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Complete payment, verify full access restored
    test.skip();
  });

  test('should preserve data during suspension period', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify existing projects still accessible after recovery
    test.skip();
  });

  test('should send recovery confirmation email', async ({ page }) => {
    // TODO: Implement when billing flow is built
    // Verify email sent confirming restored access
    test.skip();
  });
});
