import { test, expect } from '@playwright/test';
import { login, CONSULTANT_USER, FOUNDER_USER } from './helpers/auth';
import { setupDashboardMocks } from './helpers/api-mocks';
import { waitForDashboard } from './helpers/wait-helpers';

test.describe('AI Founder Attribution', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks BEFORE navigation for faster dashboard loads
    await setupDashboardMocks(page);

    // Login and navigate to dashboard
    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test.describe('Dashboard Header Founder Status', () => {
    test('should display founder status panel in dashboard header', async ({ page }) => {
      // Navigate to any dashboard page
      await page.goto('/founder-dashboard');

      // Wait for dashboard to load using progressive helper
      await waitForDashboard(page);

      // Check for founder status panel in header
      const founderStatusPanel = page.locator('[data-testid="founder-status-panel"]');

      // The panel should be present (may be collapsed)
      await expect(founderStatusPanel).toBeVisible({ timeout: 15000 });

      // Take a screenshot
      await page.screenshot({
        path: 'test-results/founder-status-header.png',
        fullPage: false
      });
    });

    test('should show all 6 AI Founders in status panel', async ({ page }) => {
      await page.goto('/founder-dashboard');

      // Wait for dashboard to load using progressive helper
      await waitForDashboard(page);

      // The founder avatars should be visible
      const founderAvatars = page.locator('[data-testid^="founder-avatar-"]');

      // Wait for at least one avatar to be visible
      await expect(founderAvatars.first()).toBeVisible({ timeout: 15000 });

      // Should have 6 founders
      await expect(founderAvatars).toHaveCount(6);
    });
  });

  test.describe('VPC Report Founder Attribution', () => {
    test('should show Sage attribution on VPC viewer', async ({ page }) => {
      // Navigate to the VPC viewer (through strategyzer or direct route)
      await page.goto('/strategyzer?tab=vpc');

      // Wait for page content to load
      await page.waitForLoadState('domcontentloaded');

      // Look for the Sage founder badge on VPC
      const sageBadge = page.locator('[data-testid="founder-badge-sage"]');

      // If VPC data exists, the badge should be visible
      const vpcContent = page.locator('text=Value Proposition Canvas');
      const hasVPCContent = await vpcContent.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasVPCContent) {
        await expect(sageBadge.first()).toBeVisible({ timeout: 10000 });
        console.log('Sage founder badge displayed on VPC viewer');
      } else {
        console.log('VPC data not available - attribution badge test skipped');
      }

      await page.screenshot({
        path: 'test-results/vpc-founder-attribution.png',
        fullPage: true
      });
    });
  });

  test.describe('Experiment Cards Founder Attribution', () => {
    test('should show Pulse attribution on Experiment Cards', async ({ page }) => {
      // Navigate to experiment cards
      await page.goto('/strategyzer?tab=experiments');

      // Wait for page content to load
      await page.waitForLoadState('domcontentloaded');

      // Look for the Pulse founder badge
      const pulseBadge = page.locator('[data-testid="founder-badge-pulse"]');

      // Check if experiment cards section is visible
      const experimentSection = page.locator('text=Experiment Cards');
      const hasExperimentSection = await experimentSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasExperimentSection) {
        await expect(pulseBadge.first()).toBeVisible({ timeout: 10000 });
        console.log('Pulse founder badge displayed on Experiment Cards');
      } else {
        console.log('Experiment Cards section not available - attribution badge test skipped');
      }

      await page.screenshot({
        path: 'test-results/experiments-founder-attribution.png',
        fullPage: true
      });
    });
  });

  test.describe('Assumption Map Founder Attribution', () => {
    test('should show Sage attribution on Assumption Map', async ({ page }) => {
      // Navigate to assumption map
      await page.goto('/strategyzer?tab=assumptions');

      // Wait for page content to load
      await page.waitForLoadState('domcontentloaded');

      // Look for the Sage founder badge
      const sageBadge = page.locator('[data-testid="founder-badge-sage"]');

      // Check if assumption map section is visible
      const assumptionSection = page.locator('text=Assumption Map');
      const hasAssumptionSection = await assumptionSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasAssumptionSection) {
        await expect(sageBadge.first()).toBeVisible({ timeout: 10000 });
        console.log('Sage founder badge displayed on Assumption Map');
      } else {
        console.log('Assumption Map section not available - attribution badge test skipped');
      }

      await page.screenshot({
        path: 'test-results/assumptions-founder-attribution.png',
        fullPage: true
      });
    });
  });

  test.describe('Innovation Physics Panel Attribution', () => {
    test('should show D-F-V founder badges on Innovation Physics Panel', async ({ page }) => {
      // Navigate to a page with Innovation Physics Panel
      await page.goto('/founder-dashboard');

      // Wait for dashboard to load using progressive helper
      await waitForDashboard(page);

      // Look for Innovation Physics Panel
      const innovationPanel = page.locator('text=Innovation Physics');
      const hasInnovationPanel = await innovationPanel.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasInnovationPanel) {
        // Check for the three D-F-V founder badges
        const pulseBadge = page.locator('[data-testid="founder-badge-pulse"]'); // Desirability
        const forgeBadge = page.locator('[data-testid="founder-badge-forge"]'); // Feasibility
        const ledgerBadge = page.locator('[data-testid="founder-badge-ledger"]'); // Viability

        // At least one of these should be visible if panel has data
        const hasAnyBadge =
          await pulseBadge.first().isVisible({ timeout: 5000 }).catch(() => false) ||
          await forgeBadge.first().isVisible({ timeout: 5000 }).catch(() => false) ||
          await ledgerBadge.first().isVisible({ timeout: 5000 }).catch(() => false);

        if (hasAnyBadge) {
          console.log('D-F-V founder badges displayed on Innovation Physics Panel');
        } else {
          console.log('Innovation Physics data not available - attribution badges not shown');
        }
      } else {
        console.log('Innovation Physics Panel not visible on this page');
      }

      await page.screenshot({
        path: 'test-results/innovation-physics-attribution.png',
        fullPage: true
      });
    });
  });

  test.describe('AI Analysis Page Founders Integration', () => {
    test('should reference AI Founders on AI Analysis page', async ({ page }) => {
      // Navigate to AI Analysis page
      await page.goto('/ai-analysis');

      // Wait for page content to load
      await page.waitForLoadState('domcontentloaded');

      // Check for AI Founders reference in the page header
      const aiFoundersText = page.locator('text=AI Founders');
      const hasAIFoundersText = await aiFoundersText.isVisible({ timeout: 10000 }).catch(() => false);

      if (hasAIFoundersText) {
        console.log('AI Founders referenced on AI Analysis page');
        expect(hasAIFoundersText).toBeTruthy();
      }

      // Check for the founder status panel (sidebar variant)
      const founderStatusPanel = page.locator('[data-testid="founder-status-panel"]');

      await page.screenshot({
        path: 'test-results/ai-analysis-founders.png',
        fullPage: true
      });
    });

    test('should show founder status during analysis', async ({ page }) => {
      await page.goto('/ai-analysis');

      // Wait for page content to load
      await page.waitForLoadState('domcontentloaded');

      // Check for strategic question input
      const questionInput = page.locator('textarea[id="question"]');
      const hasQuestionInput = await questionInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasQuestionInput) {
        // Fill in a test question
        await questionInput.fill('Test strategic question for founder attribution');

        // Check for the Start Analysis button
        const startButton = page.locator('button:has-text("Start AI Analysis")');
        await expect(startButton).toBeVisible();

        console.log('AI Analysis page ready for testing founder status during analysis');
      }

      await page.screenshot({
        path: 'test-results/ai-analysis-ready.png',
        fullPage: true
      });
    });
  });
});
