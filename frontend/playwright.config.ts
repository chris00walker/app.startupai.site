import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Testing Configuration
 * 
 * Best Practices:
 * - Only runs *.spec.ts files (E2E tests)
 * - Excludes *.test.* files (Jest unit tests)
 * - Runs against local dev server
 * - Includes multi-browser testing
 * - Captures artifacts on failure
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001'
const isCI = Boolean(process.env.CI)

const testTimeout = Number(process.env.PLAYWRIGHT_TEST_TIMEOUT_MS ?? 60_000)
const expectTimeout = Number(process.env.PLAYWRIGHT_EXPECT_TIMEOUT_MS ?? 10_000)
const globalTimeout = Number(process.env.PLAYWRIGHT_GLOBAL_TIMEOUT_MS ?? 1_200_000)
const actionTimeout = Number(process.env.PLAYWRIGHT_ACTION_TIMEOUT_MS ?? 10_000)
const navigationTimeout = Number(process.env.PLAYWRIGHT_NAV_TIMEOUT_MS ?? 30_000)
const webServerTimeout = Number(process.env.PLAYWRIGHT_WEBSERVER_TIMEOUT_MS ?? 120_000)
const retries = Number(process.env.PLAYWRIGHT_RETRIES ?? (isCI ? 2 : 0))
const workers = Number(process.env.PLAYWRIGHT_WORKERS ?? 1)

export default defineConfig({
  // Global setup - resets test user onboarding state before test run
  globalSetup: './tests/e2e/global-setup.ts',

  // Test directory structure
  testDir: 'tests/e2e',
  testMatch: ['**/*.spec.ts'],
  testIgnore: [
    '**/*.test.*',
    '**/node_modules/**',
    '**/legacy/**',
  ],

  // Timeouts
  timeout: testTimeout,
  globalTimeout,
  expect: {
    timeout: expectTimeout,
  },

  // Execution settings
  fullyParallel: false, // Sequential execution for onboarding tests
  forbidOnly: isCI,
  retries,
  workers,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['list'],
    ['./tests/e2e/reporters/failure-taxonomy-reporter.ts'],
    ...(isCI ? [['github'] as const] : []),
  ],
  
  // Global test configuration
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // Timeout settings for reliable test execution
    actionTimeout,
    navigationTimeout,

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Accessibility testing
    bypassCSP: false,
  },
  
  // Development server - auto-starts Next.js for E2E tests
  webServer: {
    command: 'pnpm dev',
    url: `${baseURL}/api/health`,
    reuseExistingServer: !isCI,
    timeout: webServerTimeout,
  },

  // Browser testing - using Playwright's bundled Chromium (Chrome-equivalent)
  // Note: Windows Chrome can't be controlled from WSL due to pipe communication issues
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium-specific settings
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },
  ],
  
  // Output directory for test artifacts
  outputDir: 'test-results/playwright/artifacts',
})
