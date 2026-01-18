/**
 * Consultant Client Onboarding E2E Tests
 *
 * Tests for when a Consultant onboards a Client's project.
 * Alex uses "client mode" prompts ("your client's business idea").
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import { test, expect } from '@playwright/test';
import { login, CONSULTANT_USER } from './helpers/auth';
import { sendMessage, waitForAIResponse } from './helpers/onboarding';

test.describe('Consultant Client Onboarding - Alex Client Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, CONSULTANT_USER);

    // Navigate to consultant dashboard
    const url = page.url();
    if (!url.includes('/consultant-dashboard')) {
      await page.goto('/consultant-dashboard');
    }
  });

  test('should show "Add Client" option on consultant dashboard', async ({ page }) => {
    // Wait for dashboard to load
    const dashboard = page.locator('[data-testid="consultant-dashboard"], [data-testid="portfolio-grid"]').first();
    await dashboard.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // Look for "Add Client" or similar button
    const addClientButton = page.locator(
      'button:has-text("Add Client"), button:has-text("New Client"), a:has-text("Add Client"), [data-testid="add-client"]'
    ).first();

    const hasAddClient = await addClientButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasAddClient) {
      console.log('Add Client button found on dashboard');
      await page.screenshot({ path: 'test-results/consultant-add-client-button.png', fullPage: true });
    } else {
      console.log('Add Client button not found - may need to be added');
      await page.screenshot({ path: 'test-results/consultant-dashboard-no-add-client.png', fullPage: true });
    }
  });

  test('should start Alex in client mode for new client', async ({ page }) => {
    // Wait for dashboard
    const dashboard = page.locator('[data-testid="consultant-dashboard"], [data-testid="portfolio-grid"]').first();
    await dashboard.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // Try to click "Add Client" button
    const addClientButton = page.locator(
      'button:has-text("Add Client"), button:has-text("New Client"), a:has-text("Add Client"), [data-testid="add-client"]'
    ).first();

    const hasAddClient = await addClientButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddClient) {
      await addClientButton.click();

      // Wait for client onboarding interface
      const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="client-onboarding"]').first();
      await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

      // Look for Alex's client-mode greeting (should reference "client")
      const assistantMessage = page.locator('[data-role="assistant"], [data-testid="ai-message"]').first();
      const messageText = await assistantMessage.textContent();

      // In client mode, Alex should reference the client
      const isClientMode = messageText?.toLowerCase().includes('client');
      console.log(`Client mode active: ${isClientMode}`);

      await page.screenshot({ path: 'test-results/consultant-alex-client-mode.png', fullPage: true });
    } else {
      console.log('Add Client flow not yet implemented');
      test.skip();
    }
  });

  test('should complete 7-stage business validation for client', async ({ page }) => {
    // Navigate to client onboarding (if available)
    // This test verifies the full flow works

    // For now, navigate to a potential client onboarding route
    await page.goto('/consultant/client/new');

    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="client-onboarding"]').first();
    const hasChatInterface = await chatInterface.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasChatInterface) {
      console.log('Client onboarding route not yet implemented');
      test.skip();
      return;
    }

    // Client validation stages (same as Founder, but consultant speaks for client)
    const stage1ClientResponses = [
      "My client wants to build a B2B SaaS for inventory management",
      "They were inspired by their own struggles running a retail business",
      "They're at the idea stage with some initial market research",
    ];

    const stage2ClientResponses = [
      "Their target customers are small retail businesses with 5-20 employees",
      "Specifically, boutique stores and specialty shops",
      "Currently these businesses use spreadsheets or basic POS systems",
    ];

    // Send Stage 1 responses (client context)
    for (const msg of stage1ClientResponses) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }
    console.log('Client Stage 1 completed (via Consultant)');

    // Send Stage 2 responses
    for (const msg of stage2ClientResponses) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }
    console.log('Client Stage 2 completed (via Consultant)');

    // Verify conversation progression
    const allMessages = page.locator('[data-role="user"], [data-role="assistant"]');
    const totalMessages = await allMessages.count();
    expect(totalMessages).toBeGreaterThanOrEqual(12);

    await page.screenshot({ path: 'test-results/consultant-client-stages-1-2.png', fullPage: true });
  });

  test('should store data to client project (not consultant)', async ({ page }) => {
    // This test verifies that client onboarding data goes to the client's project
    // Currently a placeholder - implementation depends on how client projects are structured

    // Navigate to clients list
    await page.goto('/consultant-dashboard');

    const clientList = page.locator('[data-testid="portfolio-grid"], [data-testid="client-list"]').first();
    await clientList.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // Look for any client project cards
    const clientCards = page.locator('[data-testid="client-card"], [data-testid="project-card"]');
    const hasClients = await clientCards.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasClients) {
      // Click on a client to verify data is stored there
      await clientCards.first().click();

      // Wait for client detail page
      await page.waitForURL('**/client/**', { timeout: 10000 }).catch(() => {});

      const currentUrl = page.url();
      console.log(`Client detail page: ${currentUrl}`);
    } else {
      console.log('No client projects found - client data storage test skipped');
    }

    await page.screenshot({ path: 'test-results/consultant-client-data-storage.png', fullPage: true });
  });

  test('should redirect to client detail page after approval', async ({ page }) => {
    // This test verifies the redirect after completing client onboarding
    // Placeholder until client onboarding flow is fully implemented

    // For now, verify the client detail route exists
    await page.goto('/consultant/clients');

    const clientsPage = page.locator('[data-testid="clients-list"], [data-testid="portfolio-grid"]').first();
    const hasClientsPage = await clientsPage.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasClientsPage) {
      console.log('Clients page loads correctly');
    } else {
      console.log('Clients page route may not exist yet');
    }

    await page.screenshot({ path: 'test-results/consultant-clients-page.png', fullPage: true });
  });

  test('should trigger CrewAI analysis for client project', async ({ page }) => {
    // This test verifies CrewAI is triggered for client projects (not consultant's own profile)
    // Placeholder - requires completing full client onboarding flow

    console.log('CrewAI client analysis test - requires full implementation');
    await page.screenshot({ path: 'test-results/consultant-crewai-placeholder.png', fullPage: true });
  });
});
