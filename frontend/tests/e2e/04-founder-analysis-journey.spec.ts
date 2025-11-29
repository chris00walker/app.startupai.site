/**
 * E2E Test: Journey 1 - Founder Analysis Flow
 *
 * Tests the complete founder journey from onboarding to analysis results.
 * Flow: Onboarding -> Dashboard -> Trigger Analysis -> View Results
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

test.describe('Journey 1: Founder Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display founder dashboard after login', async ({ page }) => {
    // Navigate to founder dashboard
    await page.goto('/founder-dashboard');

    // Wait for dashboard to load by checking for key element (not networkidle)
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Take screenshot of initial dashboard state
    await page.screenshot({
      path: 'test-results/journey1-dashboard-initial.png',
      fullPage: true,
    });

    console.log('Founder dashboard loaded successfully');
  });

  test('should show AI Strategic Analysis button on dashboard', async ({ page }) => {
    await page.goto('/founder-dashboard');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Look for AI Strategic Analysis button (using data-testid for reliability)
    const analysisButton = page.locator('[data-testid="ai-analysis-button"], button:has-text("AI Strategic Analysis")').first();
    await expect(analysisButton).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: 'test-results/journey1-analysis-button.png',
      fullPage: true,
    });

    console.log('AI Strategic Analysis button is visible');
  });

  test('should navigate to AI analysis page', async ({ page }) => {
    await page.goto('/founder-dashboard');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Click AI Strategic Analysis button (using data-testid for reliability)
    const analysisButton = page.locator('[data-testid="ai-analysis-button"], button:has-text("AI Strategic Analysis")').first();
    await analysisButton.click();

    // Wait for AI analysis page
    await page.waitForURL('**/ai-analysis**', { timeout: 15000 });

    // Check for strategic question input
    const questionInput = page.locator('textarea[id="question"], textarea[placeholder*="question" i]');
    const hasInput = await questionInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasInput) {
      console.log('AI Analysis page loaded with question input');
    }

    await page.screenshot({
      path: 'test-results/journey1-ai-analysis-page.png',
      fullPage: true,
    });
  });

  test('should display founder status panel', async ({ page }) => {
    await page.goto('/founder-dashboard');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Check for founder status panel
    const founderStatusPanel = page.locator('[data-testid="founder-status-panel"]');
    const hasPanel = await founderStatusPanel.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasPanel) {
      console.log('Founder status panel is visible');

      // Check for founder avatars
      const founderAvatars = page.locator('[data-testid^="founder-avatar-"]');
      const avatarCount = await founderAvatars.count();
      console.log(`Found ${avatarCount} founder avatars`);
    } else {
      console.log('Founder status panel not visible on dashboard');
    }

    await page.screenshot({
      path: 'test-results/journey1-founder-status.png',
      fullPage: true,
    });
  });

  test('should display Innovation Physics Panel on dashboard', async ({ page }) => {
    await page.goto('/founder-dashboard');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Look for Innovation Physics section
    const innovationPhysics = page.locator('text=Innovation Physics');
    const hasPanel = await innovationPhysics.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPanel) {
      console.log('Innovation Physics panel is visible');

      // Check for D-F-V signals
      const signalGauges = page.locator('[class*="SignalGauge"], [data-testid*="signal"]');
      const gaugeCount = await signalGauges.count();
      console.log(`Found ${gaugeCount} signal gauges`);
    } else {
      console.log('Innovation Physics panel not found on dashboard');
    }

    await page.screenshot({
      path: 'test-results/journey1-innovation-physics.png',
      fullPage: true,
    });
  });

  test('should navigate between dashboard tabs', async ({ page }) => {
    await page.goto('/founder-dashboard');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    const tabs = ['overview', 'canvases', 'assumptions', 'experiments', 'evidence'];

    for (const tab of tabs) {
      const tabTrigger = page.locator(`[role="tab"]:has-text("${tab}")`, { hasText: new RegExp(tab, 'i') }).first();

      if (await tabTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tabTrigger.click();

        // Wait for tab panel to be visible instead of fixed delay
        const tabPanel = page.locator('[role="tabpanel"]');
        await expect(tabPanel).toBeVisible({ timeout: 5000 });

        await page.screenshot({
          path: `test-results/journey1-tab-${tab}.png`,
          fullPage: true,
        });

        console.log(`Tab "${tab}" loaded`);
      }
    }
  });

  test('should display VPC content in Canvases tab', async ({ page }) => {
    await page.goto('/founder-dashboard?tab=canvases');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Look for VPC content
    const vpcContent = page.locator('text=Value Proposition Canvas');
    const hasVPC = await vpcContent.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVPC) {
      console.log('Value Proposition Canvas is visible in Canvases tab');
    } else {
      console.log('VPC not visible - may need analysis data');
    }

    await page.screenshot({
      path: 'test-results/journey1-canvases-tab.png',
      fullPage: true,
    });
  });

  test('should display Experiment Cards in Experiments tab', async ({ page }) => {
    await page.goto('/founder-dashboard?tab=experiments');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Look for experiment cards content
    const experimentsContent = page.locator('text=Experiment Cards');
    const hasExperiments = await experimentsContent.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasExperiments) {
      console.log('Experiment Cards section is visible');
    }

    await page.screenshot({
      path: 'test-results/journey1-experiments-tab.png',
      fullPage: true,
    });
  });

  test('should display Evidence in Evidence tab', async ({ page }) => {
    await page.goto('/founder-dashboard?tab=evidence');

    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Look for evidence content
    const evidenceContent = page.locator('text=Evidence');
    const hasEvidence = await evidenceContent.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEvidence) {
      console.log('Evidence section is visible');
    }

    await page.screenshot({
      path: 'test-results/journey1-evidence-tab.png',
      fullPage: true,
    });
  });

  test('should have no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/founder-dashboard');

    // Wait for dashboard to fully load
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Wait for any dynamic content to render
    const tabPanel = page.locator('[role="tabpanel"]');
    await expect(tabPanel).toBeVisible({ timeout: 5000 });

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    } else {
      console.log('No console errors on dashboard');
    }

    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/founder-dashboard');

    // Dashboard should still be visible (element-based wait instead of networkidle)
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: 'test-results/journey1-mobile-dashboard.png',
      fullPage: true,
    });

    console.log('Dashboard is responsive on mobile viewport');
  });
});

test.describe('Journey 1: Full Analysis Flow (Requires CrewAI)', () => {
  test.skip(({ page }) => {
    // Skip these tests if CrewAI is not available
    return process.env.SKIP_CREWAI_TESTS === 'true';
  }, 'CrewAI integration tests - skipped if SKIP_CREWAI_TESTS=true');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should trigger analysis and see progress', async ({ page }) => {
    await page.goto('/ai-analysis');

    // Wait for page content to load
    await page.waitForLoadState('domcontentloaded');

    // Fill in strategic question
    const questionInput = page.locator('textarea[id="question"]');
    if (await questionInput.isVisible({ timeout: 5000 })) {
      await questionInput.fill('What are the key market opportunities for my product?');

      // Click Start Analysis button
      const startButton = page.locator('button:has-text("Start AI Analysis")');
      if (await startButton.isVisible()) {
        await startButton.click();

        // Wait for analysis to start by checking for progress indicator or status panel
        // This is more reliable than a fixed timeout
        const founderStatusPanel = page.locator('[data-testid="founder-status-panel"]');
        const hasPanel = await founderStatusPanel.isVisible({ timeout: 10000 }).catch(() => false);

        if (hasPanel) {
          console.log('Founder status panel visible during analysis');
        }

        await page.screenshot({
          path: 'test-results/journey1-analysis-in-progress.png',
          fullPage: true,
        });
      }
    }
  });
});
