import { Page, expect } from '@playwright/test';

// Timeout constants for dashboard loading
const LOADING_STATE_TIMEOUT = 10_000; // 10s for loading indicator
const CONTENT_LOAD_TIMEOUT = 30_000; // 30s for full content

/**
 * Wait for dashboard to load with progressive detection
 * First waits for any dashboard element (loading or content), then waits for full content
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 */
export async function waitForDashboard(
  page: Page,
  options: {
    loadingTimeout?: number;
    contentTimeout?: number;
    requireFullLoad?: boolean;
  } = {}
): Promise<void> {
  const {
    loadingTimeout = LOADING_STATE_TIMEOUT,
    contentTimeout = CONTENT_LOAD_TIMEOUT,
    requireFullLoad = true,
  } = options;

  // Phase 1: Wait for any dashboard element (loading spinner or content)
  // This confirms the page is at least responding
  const anyDashboard = page.locator(
    '[data-testid="dashboard"], [data-testid="dashboard-loading"]'
  );

  await expect(anyDashboard.first()).toBeVisible({ timeout: loadingTimeout });

  if (!requireFullLoad) {
    return;
  }

  // Phase 2: Wait for actual content to be visible (not just loading spinner)
  const loadedDashboard = page.locator('[data-testid="dashboard"]');
  await expect(loadedDashboard).toBeVisible({ timeout: contentTimeout });
}

/**
 * Wait for founder dashboard specifically
 * Includes waiting for tabs to be interactive
 */
export async function waitForFounderDashboard(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = CONTENT_LOAD_TIMEOUT } = options;

  // Wait for main dashboard element
  await waitForDashboard(page, { contentTimeout: timeout });

  // Wait for tabs to be visible (indicates full interactivity)
  const tabs = page.locator('[role="tablist"]');
  await expect(tabs).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for consultant dashboard specifically
 * Includes waiting for portfolio grid
 */
export async function waitForConsultantDashboard(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = CONTENT_LOAD_TIMEOUT } = options;

  // Wait for main dashboard element
  await waitForDashboard(page, { contentTimeout: timeout });

  // Wait for portfolio content to appear
  const portfolioContent = page.locator('[data-testid="portfolio-grid"], .space-y-6').first();
  await expect(portfolioContent).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for a specific tab content to be visible
 */
export async function waitForTabContent(
  page: Page,
  tabName: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10_000 } = options;

  // Click the tab
  const tabTrigger = page.locator(`[role="tab"]:has-text("${tabName}")`).first();
  await tabTrigger.click();

  // Wait for tab panel to be visible
  const tabPanel = page.locator('[role="tabpanel"]');
  await expect(tabPanel).toBeVisible({ timeout });
}
