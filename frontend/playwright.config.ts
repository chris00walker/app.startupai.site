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
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3001)

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
  timeout: 60_000, // Increased for AI responses
  expect: {
    timeout: 10_000,
  },

  // Execution settings
  fullyParallel: false, // Sequential execution for onboarding tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 1 retry locally catches transient failures
  workers: 1, // Single worker for sequential execution
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  
  // Global test configuration
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // Timeout settings for reliable test execution
    actionTimeout: 10_000,      // 10s for clicks, fills, etc.
    navigationTimeout: 30_000,  // 30s for page navigations

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Accessibility testing
    bypassCSP: false,
  },
  
  // Development server - auto-starts Next.js for E2E tests
  webServer: {
    command: 'pnpm dev',
    port,
    reuseExistingServer: !process.env.CI, // Reuse if already running locally
    timeout: 120_000, // 2 min for Next.js to start
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
