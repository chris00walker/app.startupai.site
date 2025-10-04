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

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000)

export default defineConfig({
  // Test directory structure
  testDir: 'src/__tests__/e2e',
  testMatch: ['**/*.spec.ts'],
  testIgnore: [
    '**/*.test.*',
    '**/node_modules/**',
    '**/__tests__/components/**',
    '**/__tests__/integration/**',
  ],
  
  // Timeouts
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  
  // Execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  
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
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Accessibility testing
    bypassCSP: false,
  },
  
  // Development server
  webServer: {
    command: `pnpm dev -- --hostname 0.0.0.0 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
  
  // Multi-browser testing
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific settings
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile viewports (optional - uncomment to enable)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
  
  // Output directory for test artifacts
  outputDir: 'test-results/playwright/artifacts',
})
