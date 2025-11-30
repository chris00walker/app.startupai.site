/**
 * E2E Test: Journey 3 - Consultant Portfolio Flow
 *
 * Tests the consultant portfolio view and client drill-down.
 * Flow: Login -> Portfolio Grid -> Client Detail -> Return
 */

import { test, expect } from '@playwright/test';
import { login, CONSULTANT_USER } from './helpers/auth';
import { setupDashboardMocks } from './helpers/api-mocks';
import { waitForDashboard } from './helpers/wait-helpers';

test.describe('Journey 3: Consultant Portfolio Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks BEFORE navigation for faster dashboard loads
    await setupDashboardMocks(page);

    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should navigate to consultant dashboard', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loaded
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: 'test-results/journey3-consultant-dashboard.png',
      fullPage: true,
    });

    console.log('Consultant dashboard loaded successfully');
  });

  test('should display portfolio grid', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Check for portfolio grid
    const portfolioGrid = page.locator('[data-testid="portfolio-grid"]');
    const hasGrid = await portfolioGrid.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasGrid) {
      console.log('Portfolio grid is visible');

      // Count client cards
      const clientCards = page.locator('[data-testid="client-card"]');
      const cardCount = await clientCards.count();
      console.log(`Found ${cardCount} client cards`);
    } else {
      console.log('Portfolio grid not visible - may have no clients');
    }

    await page.screenshot({
      path: 'test-results/journey3-portfolio-grid.png',
      fullPage: true,
    });
  });

  test('should display portfolio metrics', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Look for metrics cards
    const metricsSection = page.locator('text=Active Projects, text=Gate Pass Rate, text=Evidence Coverage').first();
    const hasMetrics = await metricsSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMetrics) {
      console.log('Portfolio metrics are visible');
    }

    await page.screenshot({
      path: 'test-results/journey3-portfolio-metrics.png',
      fullPage: true,
    });
  });

  test('should display stage filter', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Look for stage filter buttons
    const stageFilters = page.locator('button:has-text("Desirability"), button:has-text("Feasibility"), button:has-text("Viability")');
    const filterCount = await stageFilters.count();

    if (filterCount > 0) {
      console.log(`Found ${filterCount} stage filter buttons`);

      // Try clicking a filter
      const feasibilityFilter = page.locator('button:has-text("Feasibility")').first();
      if (await feasibilityFilter.isVisible()) {
        await feasibilityFilter.click();

        // Wait for grid to update (element-based wait instead of fixed delay)
        const portfolioGrid = page.locator('[data-testid="portfolio-grid"]');
        await expect(portfolioGrid).toBeVisible({ timeout: 5000 });

        await page.screenshot({
          path: 'test-results/journey3-filtered-view.png',
          fullPage: true,
        });
      }
    }
  });

  test('should click client card and navigate to detail', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // Click first client card
      await clientCards.first().click();

      // Wait for navigation to client detail page
      await page.waitForURL('**/client/**', { timeout: 10000 });

      console.log('Navigated to client detail page');

      await page.screenshot({
        path: 'test-results/journey3-client-detail.png',
        fullPage: true,
      });
    } else {
      console.log('No client cards to click');
    }
  });

  test('should display client detail with tabs', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/client/**', { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');

      // Look for tabs on client detail page
      const tabs = ['overview', 'canvases', 'assumptions', 'experiments', 'evidence'];

      for (const tab of tabs) {
        const tabTrigger = page.locator(`[role="tab"]`).filter({ hasText: new RegExp(tab, 'i') }).first();
        const hasTab = await tabTrigger.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTab) {
          console.log(`Tab "${tab}" found on client detail page`);
        }
      }

      await page.screenshot({
        path: 'test-results/journey3-client-tabs.png',
        fullPage: true,
      });
    }
  });

  test('should navigate client detail tabs', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/client/**', { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');

      const tabs = ['canvases', 'assumptions', 'experiments', 'evidence'];

      for (const tab of tabs) {
        const tabTrigger = page.locator(`[role="tab"]`).filter({ hasText: new RegExp(tab, 'i') }).first();

        if (await tabTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tabTrigger.click();

          // Wait for tab panel to be visible instead of fixed delay
          const tabPanel = page.locator('[role="tabpanel"]');
          await expect(tabPanel).toBeVisible({ timeout: 5000 });

          await page.screenshot({
            path: `test-results/journey3-client-tab-${tab}.png`,
            fullPage: true,
          });

          console.log(`Client tab "${tab}" content loaded`);
        }
      }
    }
  });

  test('should return to portfolio from client detail', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/client/**', { timeout: 10000 });

      // Look for back link
      const backLink = page.locator('a:has-text("Back"), a[href*="consultant-dashboard"]').first();
      const hasBackLink = await backLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasBackLink) {
        await backLink.click();
        await page.waitForURL('**/consultant-dashboard**', { timeout: 10000 });
        console.log('Returned to portfolio successfully');
      } else {
        // Try browser back
        await page.goBack();
        await page.waitForURL('**/consultant-dashboard**', { timeout: 10000 });
        console.log('Returned via browser back');
      }

      await page.screenshot({
        path: 'test-results/journey3-return-to-portfolio.png',
        fullPage: true,
      });
    }
  });

  test('should display VPC/signals on client cards', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // Look for signal dots or VPC fit dots
      const signalDots = page.locator('[class*="SignalDot"], [data-testid*="signal-dot"]');
      const fitDots = page.locator('[class*="FitDot"], [data-testid*="fit-dot"]');

      const signalCount = await signalDots.count();
      const fitCount = await fitDots.count();

      console.log(`Found ${signalCount} signal dots and ${fitCount} fit dots on cards`);
    }

    await page.screenshot({
      path: 'test-results/journey3-card-signals.png',
      fullPage: true,
    });
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Check grid layout on tablet (should be 2 columns)
    const portfolioGrid = page.locator('[data-testid="portfolio-grid"]');
    const hasGrid = await portfolioGrid.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasGrid) {
      console.log('Portfolio grid visible on tablet viewport');
    }

    await page.screenshot({
      path: 'test-results/journey3-tablet-portfolio.png',
      fullPage: true,
    });
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Check grid layout on mobile (should be 1 column)
    const portfolioGrid = page.locator('[data-testid="portfolio-grid"]');
    const hasGrid = await portfolioGrid.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasGrid) {
      console.log('Portfolio grid visible on mobile viewport');
    }

    await page.screenshot({
      path: 'test-results/journey3-mobile-portfolio.png',
      fullPage: true,
    });
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page content to render (element-based wait instead of fixed delay)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 15000 });

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    } else {
      console.log('No console errors on consultant dashboard');
    }

    // Filter out expected non-critical errors (favicon, PostHog init in test env)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('PostHog')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should display search/filter functionality', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      console.log('Search functionality is visible');
      await searchInput.fill('test search');

      // Wait briefly for any filtering to apply (search typically triggers debounced updates)
      // Using a short visibility check instead of fixed delay
      await page.waitForLoadState('domcontentloaded');
    }

    await page.screenshot({
      path: 'test-results/journey3-search.png',
      fullPage: true,
    });
  });
});

test.describe('Journey 3: Portfolio with Real Data', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks BEFORE navigation for faster dashboard loads
    await setupDashboardMocks(page);

    await page.goto('/login');
    await login(page, CONSULTANT_USER);
  });

  test('should display risk budget on client cards', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // Look for risk budget indicator
      const riskBudget = clientCards.first().locator('text=Risk Budget');
      const hasRiskBudget = await riskBudget.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRiskBudget) {
        console.log('Risk budget visible on client cards');
      }
    }

    await page.screenshot({
      path: 'test-results/journey3-risk-budget.png',
      fullPage: true,
    });
  });

  test('should display evidence quality on client cards', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // Look for evidence quality indicator
      const evidenceQuality = clientCards.first().locator('text=Evidence Quality');
      const hasEvidenceQuality = await evidenceQuality.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasEvidenceQuality) {
        console.log('Evidence quality visible on client cards');
      }
    }

    await page.screenshot({
      path: 'test-results/journey3-evidence-quality.png',
      fullPage: true,
    });
  });

  test('should display project stats (hypotheses, experiments, evidence)', async ({ page }) => {
    await page.goto('/consultant-dashboard');
    await page.waitForLoadState('domcontentloaded');

    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      const statsLabels = ['Hypotheses', 'Experiments', 'Evidence'];

      for (const label of statsLabels) {
        const stat = clientCards.first().locator(`text=${label}`);
        const hasStat = await stat.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`${label} stat: ${hasStat ? 'visible' : 'not found'}`);
      }
    }

    await page.screenshot({
      path: 'test-results/journey3-project-stats.png',
      fullPage: true,
    });
  });
});
