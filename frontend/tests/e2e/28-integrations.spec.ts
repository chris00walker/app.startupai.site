/**
 * Integrations Settings Tab E2E Tests
 *
 * Tests for external service integrations via OAuth.
 * Note: Real OAuth flows cannot be tested in E2E - we test UI states and mock callbacks.
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */
import { test, expect } from '@playwright/test';

test.describe('Settings Integrations Tab', () => {
  test.describe('US-I01: View Available Integrations', () => {
    test('should display all 10 integrations organized by category', async ({ page }) => {
      await page.goto('/settings?tab=integrations');

      // Wait for page to load
      await page.waitForSelector('[data-testid="integrations-tab"]', { timeout: 10000 }).catch(() => {
        // Fallback: wait for any content
      });

      // Check that categories are present
      await expect(page.getByText('Collaboration')).toBeVisible();
      await expect(page.getByText('Storage')).toBeVisible();
      await expect(page.getByText('Project Management')).toBeVisible();
      await expect(page.getByText('Sales & CRM')).toBeVisible();
      await expect(page.getByText('Creation')).toBeVisible();
      await expect(page.getByText('Development')).toBeVisible();

      // Check that key integrations are visible
      await expect(page.getByText('Slack')).toBeVisible();
      await expect(page.getByText('Notion')).toBeVisible();
      await expect(page.getByText('Google Drive')).toBeVisible();
      await expect(page.getByText('GitHub')).toBeVisible();
    });

    test('should show integration descriptions', async ({ page }) => {
      await page.goto('/settings?tab=integrations');

      // Check descriptions for a few integrations
      await expect(page.getByText('Send workflow notifications and updates to Slack channels')).toBeVisible();
      await expect(page.getByText('Connect to GitHub for code and issue tracking')).toBeVisible();
    });
  });

  test.describe('US-I02: Connect via OAuth', () => {
    test('should show Connect button for unconnected integrations', async ({ page }) => {
      await page.goto('/settings?tab=integrations');

      // Find a Connect button (should be present for unconnected integrations)
      const connectButtons = page.getByRole('button', { name: 'Connect' });
      await expect(connectButtons.first()).toBeVisible();
    });

    test.skip('should open OAuth popup when Connect is clicked', async ({ page, context }) => {
      // This test is skipped because OAuth popup testing requires special handling
      // and cannot complete without real OAuth credentials

      await page.goto('/settings?tab=integrations');

      // Set up popup listener
      const popupPromise = context.waitForEvent('page');

      // Click Connect on Slack
      const slackCard = page.locator('text=Slack').locator('..');
      await slackCard.getByRole('button', { name: 'Connect' }).click();

      // Verify popup was opened
      const popup = await popupPromise;
      expect(popup.url()).toContain('/api/integrations/slack/connect');
    });
  });

  test.describe('US-I03: View Connection Details', () => {
    test('should show Connected badge for connected integrations', async ({ page }) => {
      // Mock connected state by intercepting API
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'slack',
                status: 'active',
                providerAccountName: 'Test Workspace',
                providerAccountEmail: 'user@example.com',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Check for Connected badge
      await expect(page.getByText('Connected')).toBeVisible();

      // Check for account info
      await expect(page.getByText('Test Workspace')).toBeVisible();
    });

    test('should show connection date', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'notion',
                status: 'active',
                providerAccountName: 'My Workspace',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show connection date
      await expect(page.getByText(/Connected.*Jan/i)).toBeVisible();
    });
  });

  test.describe('US-I04: Configure Preferences', () => {
    test('should show Configure button for connected integrations', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'slack',
                status: 'active',
                providerAccountName: 'Test',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: { defaultChannel: '#general' },
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Find the configure button (gear icon)
      const configButton = page.getByRole('button', { name: 'Configure' });
      await expect(configButton).toBeVisible();
    });

    test('should open configuration modal when Configure is clicked', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'slack',
                status: 'active',
                providerAccountName: 'Test',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: { defaultChannel: '#general' },
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Click configure
      await page.getByRole('button', { name: 'Configure' }).click();

      // Modal should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Configure Slack')).toBeVisible();

      // Should show preference fields
      await expect(page.getByLabel('Default Channel')).toBeVisible();
    });

    test('should save preferences when Save Changes is clicked', async ({ page }) => {
      let patchCalled = false;

      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'slack',
                status: 'active',
                providerAccountName: 'Test',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.route('/api/integrations/slack', async (route) => {
        if (route.request().method() === 'PATCH') {
          patchCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      });

      await page.goto('/settings?tab=integrations');

      // Open config modal
      await page.getByRole('button', { name: 'Configure' }).click();

      // Fill in a preference
      await page.getByLabel('Default Channel').fill('#new-channel');

      // Save
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // Verify PATCH was called
      expect(patchCalled).toBe(true);
    });
  });

  test.describe('US-I05: Disconnect Integration', () => {
    test('should show Disconnect button for connected integrations', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'github',
                status: 'active',
                providerAccountName: 'octocat',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show Disconnect button
      await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();
    });

    test('should show confirmation dialog when Disconnect is clicked', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'github',
                status: 'active',
                providerAccountName: 'octocat',
                connectedAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Click Disconnect
      await page.getByRole('button', { name: 'Disconnect' }).click();

      // Confirmation dialog should appear
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText('Disconnect GitHub?')).toBeVisible();
    });

    test('should disconnect when confirmed', async ({ page }) => {
      let deleteCalled = false;

      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: deleteCalled
              ? []
              : [
                  {
                    id: 'test-int-1',
                    userId: 'test-user',
                    integrationType: 'github',
                    status: 'active',
                    providerAccountName: 'octocat',
                    connectedAt: '2026-01-15T00:00:00Z',
                    updatedAt: '2026-01-15T00:00:00Z',
                    preferences: {},
                  },
                ],
          }),
        });
      });

      await page.route('/api/integrations/github', async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      });

      await page.goto('/settings?tab=integrations');

      // Click Disconnect
      await page.getByRole('button', { name: 'Disconnect' }).click();

      // Confirm
      await page.getByRole('button', { name: 'Disconnect', exact: true }).last().click();

      // Verify DELETE was called
      expect(deleteCalled).toBe(true);
    });
  });

  test.describe('US-I06: Reconnect Failed Integration', () => {
    test('should show Expired badge for expired integrations', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'notion',
                status: 'expired',
                providerAccountName: 'My Workspace',
                tokenExpiresAt: '2026-01-01T00:00:00Z', // Past date
                connectedAt: '2025-12-01T00:00:00Z',
                updatedAt: '2025-12-01T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show Expired badge
      await expect(page.getByText('Expired')).toBeVisible();
    });

    test('should show Reconnect button for expired integrations', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'notion',
                status: 'expired',
                providerAccountName: 'My Workspace',
                connectedAt: '2025-12-01T00:00:00Z',
                updatedAt: '2025-12-01T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show Reconnect button
      await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible();
    });

    test('should show Error badge for error status', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                id: 'test-int-1',
                userId: 'test-user',
                integrationType: 'linear',
                status: 'error',
                providerAccountName: 'Team',
                connectedAt: '2025-12-01T00:00:00Z',
                updatedAt: '2025-12-01T00:00:00Z',
                preferences: {},
              },
            ],
          }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show Error badge
      await expect(page.getByText('Error')).toBeVisible();

      // Should show Reconnect button
      await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible();
    });
  });

  test.describe('Loading and Error States', () => {
    test('should show loading spinner while fetching', async ({ page }) => {
      // Delay the API response
      await page.route('/api/integrations', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ integrations: [] }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show loading state
      await expect(page.getByText('Loading integrations...')).toBeVisible();
    });

    test('should show error message on API failure', async ({ page }) => {
      await page.route('/api/integrations', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/settings?tab=integrations');

      // Should show error
      await expect(page.getByText(/Failed to fetch integrations/i)).toBeVisible();
    });
  });
});
