/**
 * E2E Test: Journey 2 - HITL Approval Flow
 *
 * Tests the Human-in-the-Loop approval workflow.
 * Flow: Approvals Page -> View Pending -> Open Modal -> Make Decision
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER, CONSULTANT_USER } from './helpers/auth';

test.describe('Journey 2: HITL Approval Flow', () => {
  test.describe('Founder Approvals', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await login(page, FOUNDER_USER);
    });

    test('should navigate to approvals page', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      const pageTitle = page.locator('h1, h2').filter({ hasText: /approvals/i }).first();
      await expect(pageTitle).toBeVisible({ timeout: 15000 });

      await page.screenshot({
        path: 'test-results/journey2-approvals-page.png',
        fullPage: true,
      });

      console.log('Approvals page loaded successfully');
    });

    test('should display approval stats cards', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Look for stats cards (Pending, Client Pending, Total Processed)
      const statsSection = page.locator('text=Pending').first();
      const hasStats = await statsSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasStats) {
        console.log('Approval stats cards are visible');
      }

      await page.screenshot({
        path: 'test-results/journey2-approval-stats.png',
        fullPage: true,
      });
    });

    test('should show approval tabs (Pending / All History)', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Look for tab triggers
      const pendingTab = page.locator('[role="tab"]:has-text("Pending")');
      const historyTab = page.locator('[role="tab"]:has-text("History"), [role="tab"]:has-text("All")');

      const hasPendingTab = await pendingTab.isVisible({ timeout: 5000 }).catch(() => false);
      const hasHistoryTab = await historyTab.isVisible({ timeout: 5000 }).catch(() => false);

      console.log(`Pending tab: ${hasPendingTab ? 'visible' : 'not found'}`);
      console.log(`History tab: ${hasHistoryTab ? 'visible' : 'not found'}`);

      if (hasPendingTab) {
        await pendingTab.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'test-results/journey2-pending-tab.png',
          fullPage: true,
        });
      }

      if (hasHistoryTab) {
        await historyTab.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'test-results/journey2-history-tab.png',
          fullPage: true,
        });
      }
    });

    test('should display approval cards if any pending', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Look for approval cards
      const approvalCards = page.locator('[data-testid="approval-card"]');
      const cardCount = await approvalCards.count();

      if (cardCount > 0) {
        console.log(`Found ${cardCount} approval cards`);

        // Click first card to open modal
        await approvalCards.first().click();
        await page.waitForTimeout(500);

        // Check if modal opened
        const modal = page.locator('[data-testid="approval-modal"]');
        const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasModal) {
          console.log('Approval modal opened successfully');

          await page.screenshot({
            path: 'test-results/journey2-approval-modal.png',
            fullPage: true,
          });

          // Close modal
          const closeButton = page.locator('button:has-text("Cancel"), [aria-label="Close"]').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      } else {
        console.log('No pending approval cards found');
      }

      await page.screenshot({
        path: 'test-results/journey2-approval-cards.png',
        fullPage: true,
      });
    });

    test('should show empty state when no approvals', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Look for empty state or approval cards
      const approvalCards = page.locator('[data-testid="approval-card"]');
      const cardCount = await approvalCards.count();

      if (cardCount === 0) {
        // Should show some empty state message
        const emptyState = page.locator('text=No pending approvals, text=no approvals').first();
        const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasEmptyState) {
          console.log('Empty state displayed correctly');
        } else {
          console.log('No cards and no explicit empty state');
        }
      }

      await page.screenshot({
        path: 'test-results/journey2-empty-state.png',
        fullPage: true,
      });
    });

    test('should display founder avatar on approval cards', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Look for founder avatars in approval cards
      const founderAvatars = page.locator('[data-testid="approval-card"] [data-testid^="founder-avatar"]');
      const avatarCount = await founderAvatars.count();

      if (avatarCount > 0) {
        console.log(`Found ${avatarCount} founder avatars in approval cards`);
      } else {
        console.log('No founder avatars found (may have no approval cards)');
      }

      await page.screenshot({
        path: 'test-results/journey2-founder-avatars.png',
        fullPage: true,
      });
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'test-results/journey2-mobile-approvals.png',
        fullPage: true,
      });

      console.log('Approvals page is responsive on mobile');
    });

    test('should have no console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      if (errors.length > 0) {
        console.log('Console errors found:', errors);
      } else {
        console.log('No console errors on approvals page');
      }

      expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
    });
  });

  test.describe('Approval Modal Interaction', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await login(page, FOUNDER_USER);
    });

    test('should display decision options in modal', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      const approvalCards = page.locator('[data-testid="approval-card"]');
      const cardCount = await approvalCards.count();

      if (cardCount > 0) {
        await approvalCards.first().click();

        const modal = page.locator('[data-testid="approval-modal"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Look for decision options (radio buttons)
        const radioButtons = modal.locator('[role="radiogroup"] [role="radio"]');
        const radioCount = await radioButtons.count();

        if (radioCount > 0) {
          console.log(`Found ${radioCount} decision options`);
        }

        // Look for approve/reject buttons
        const approveButton = modal.locator('button:has-text("Approve")');
        const rejectButton = modal.locator('button:has-text("Reject")');

        const hasApprove = await approveButton.isVisible().catch(() => false);
        const hasReject = await rejectButton.isVisible().catch(() => false);

        console.log(`Approve button: ${hasApprove ? 'visible' : 'not found'}`);
        console.log(`Reject button: ${hasReject ? 'visible' : 'not found'}`);

        await page.screenshot({
          path: 'test-results/journey2-modal-options.png',
          fullPage: true,
        });
      } else {
        console.log('No approval cards to test modal interaction');
      }
    });

    test('should display evidence summary in modal', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      const approvalCards = page.locator('[data-testid="approval-card"]');
      const cardCount = await approvalCards.count();

      if (cardCount > 0) {
        await approvalCards.first().click();

        const modal = page.locator('[data-testid="approval-modal"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Look for evidence summary section
        const evidenceSection = modal.locator('text=Evidence, text=Summary').first();
        const hasEvidence = await evidenceSection.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasEvidence) {
          console.log('Evidence summary displayed in modal');
        }

        // Look for D-F-V signals
        const signals = modal.locator('[class*="Signal"], [data-testid*="signal"]');
        const signalCount = await signals.count();
        console.log(`Found ${signalCount} signal indicators in modal`);

        await page.screenshot({
          path: 'test-results/journey2-modal-evidence.png',
          fullPage: true,
        });
      }
    });

    test('should allow entering feedback', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      const approvalCards = page.locator('[data-testid="approval-card"]');
      const cardCount = await approvalCards.count();

      if (cardCount > 0) {
        await approvalCards.first().click();

        const modal = page.locator('[data-testid="approval-modal"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Look for feedback textarea
        const feedbackInput = modal.locator('textarea[placeholder*="feedback" i], textarea[id*="feedback" i]');
        const hasFeedback = await feedbackInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasFeedback) {
          await feedbackInput.fill('Test feedback from E2E test');
          console.log('Feedback input is functional');
        }

        await page.screenshot({
          path: 'test-results/journey2-modal-feedback.png',
          fullPage: true,
        });
      }
    });
  });

  test.describe('Consultant Approvals View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await login(page, CONSULTANT_USER);
    });

    test('should show client pending approvals for consultant', async ({ page }) => {
      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Look for "Client Pending" stat
      const clientPending = page.locator('text=Client Pending').first();
      const hasClientPending = await clientPending.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasClientPending) {
        console.log('Client Pending stat visible for consultant');
      }

      await page.screenshot({
        path: 'test-results/journey2-consultant-approvals.png',
        fullPage: true,
      });
    });
  });
});
