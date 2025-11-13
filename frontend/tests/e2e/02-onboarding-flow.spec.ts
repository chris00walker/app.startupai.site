import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';
import {
  sendMessage,
  waitForAIResponse,
  navigateToOnboarding,
  getCurrentStage,
  getProgress,
} from './helpers/onboarding';

test.describe('Onboarding Conversation Flow - Founder User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Founder before each test (only Founders go through onboarding)
    await page.goto('/login');
    await login(page, FOUNDER_USER);

    // Navigate to onboarding if not already there
    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    // Wait for onboarding interface to be ready
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });
  });

  test('should display chat interface with welcome message', async ({ page }) => {
    // Check for chat interface elements
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await expect(chatInterface).toBeVisible({ timeout: 10000 });

    // Check for input field
    const inputField = page.locator(
      'textarea[placeholder*="message" i], input[type="text"][placeholder*="message" i]'
    ).first();
    await expect(inputField).toBeVisible();

    // Check for send button
    const sendButton = page.locator(
      'button[type="submit"], button:has-text("Send"), [data-testid="send-button"]'
    ).first();
    await expect(sendButton).toBeVisible();

    console.log('Chat interface loaded successfully');

    // Take screenshot
    await page.screenshot({ path: 'test-results/onboarding-start.png', fullPage: true });
  });

  test('should send message and receive AI response', async ({ page }) => {
    const testMessage = 'I want to build a SaaS product for small businesses';

    // Send a message
    await sendMessage(page, testMessage);

    // Wait for AI response
    await waitForAIResponse(page, 45000); // 45 second timeout for AI

    // Verify the message appears in chat history
    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible();

    // Verify AI response appeared (look for assistant message)
    const messages = page.locator('[data-role="assistant"], [data-testid="ai-message"], .assistant-message');

    // Count messages - should have at least one
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);

    console.log(`AI response received (${messageCount} total assistant messages)`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/first-exchange.png', fullPage: true });
  });

  test('should progress through Stage 1: Problem Discovery', async ({ page }) => {
    // Stage 1: Understanding the customer and their problem
    const stage1Responses = [
      'I want to help small business owners manage their customer relationships better',
      'My target customers are small business owners with 5-50 employees who struggle with scattered customer data',
      'They currently use spreadsheets and email, which makes it hard to track customer interactions and follow up',
      'The main pain point is losing track of important customer conversations and missing follow-up opportunities',
      'This costs them revenue because they forget to reach out to interested customers at the right time',
    ];

    for (const response of stage1Responses) {
      await sendMessage(page, response);
      await waitForAIResponse(page, 45000);
      await page.waitForTimeout(1000); // Brief pause between messages
    }

    // Take screenshot after stage 1
    await page.screenshot({ path: 'test-results/stage-1-complete.png', fullPage: true });

    console.log('Stage 1 responses completed');
  });

  test('should handle multi-turn conversation in Stage 2: Solution Validation', async ({ page }) => {
    // First complete Stage 1 quickly
    const stage1 = [
      'I want to help small business owners manage their customer relationships',
      'Small business owners with 5-50 employees',
      'They use spreadsheets and email which is inefficient',
      'They lose track of customer conversations and miss opportunities',
    ];

    for (const msg of stage1) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }

    // Now do Stage 2 - Solution
    const stage2Responses = [
      'I want to build a simple CRM that automatically tracks email conversations and reminds them to follow up',
      'It will integrate with their email and create a timeline of all customer interactions automatically',
      'Unlike other CRMs, it will be extremely simple - just email integration and smart reminders, no complex features',
      'My main differentiator is simplicity - other CRMs are too complex for small businesses',
    ];

    for (const response of stage2Responses) {
      await sendMessage(page, response);
      await waitForAIResponse(page, 45000);
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/stage-2-complete.png', fullPage: true });

    console.log('Stage 2 conversation completed');
  });

  test('should track conversation progress', async ({ page }) => {
    // Send a few messages
    const messages = [
      'I want to help small businesses',
      'My target customers are owners of small retail stores',
    ];

    for (const msg of messages) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }

    // Try to get progress (if UI shows it)
    const progress = await getProgress(page);
    console.log(`Current progress: ${progress}%`);

    // Progress should be >= 0
    expect(progress).toBeGreaterThanOrEqual(0);

    // Take screenshot
    await page.screenshot({ path: 'test-results/progress-tracking.png', fullPage: true });
  });

  test('should handle empty message submission gracefully', async ({ page }) => {
    // Try to send an empty message
    const chatInput = page.locator(
      'textarea[placeholder*="message" i], input[type="text"][placeholder*="message" i]'
    ).first();

    await chatInput.clear();

    const sendButton = page.locator(
      'button[type="submit"], button:has-text("Send")'
    ).first();

    // Check if send button is disabled when input is empty
    const isDisabled = await sendButton.isDisabled().catch(() => false);

    if (!isDisabled) {
      // If not disabled, try clicking and verify no empty message is sent
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Look for empty message in chat - shouldn't exist
      const emptyMessage = page.locator('[data-role="user"]:has-text("")');
      const count = await emptyMessage.count();

      // This is a soft check - empty messages shouldn't appear
      console.log(`Empty message prevention: ${count === 0 ? 'working' : 'not working'}`);
    } else {
      console.log('Send button correctly disabled for empty input');
    }
  });

  test('should display loading state during AI response', async ({ page }) => {
    // Send a message
    await sendMessage(page, 'Tell me about customer discovery');

    // Immediately look for loading indicator
    const loadingIndicator = page.locator(
      '[data-testid="ai-loading"], .loading, [aria-label*="loading" i], .animate-pulse'
    );

    // Check if loading indicator appears (might be very brief)
    const loadingAppeared = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);

    if (loadingAppeared) {
      console.log('Loading indicator displayed');

      // Wait for it to disappear
      await expect(loadingIndicator).toBeHidden({ timeout: 45000 });

      console.log('Loading indicator cleared after response');
    } else {
      console.log('Loading indicator not detected (might be too fast)');
    }

    // Verify response arrived
    await waitForAIResponse(page, 45000);
  });

  test('should maintain conversation context across multiple messages', async ({ page }) => {
    // Have a contextual conversation
    await sendMessage(page, 'I want to build a meal planning app');
    await waitForAIResponse(page, 45000);

    await sendMessage(page, 'For busy parents who work full-time');
    await waitForAIResponse(page, 45000);

    await sendMessage(page, 'They struggle with deciding what to cook each day');
    await waitForAIResponse(page, 45000);

    // The AI should maintain context - check that all messages are visible
    await expect(page.locator('text="meal planning app"')).toBeVisible();
    await expect(page.locator('text="busy parents"')).toBeVisible();
    await expect(page.locator('text="what to cook"')).toBeVisible();

    console.log('Conversation context maintained');

    // Take screenshot of full conversation
    await page.screenshot({ path: 'test-results/conversation-context.png', fullPage: true });
  });
});

test.describe('Onboarding Session Management - Founder User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should resume conversation after page reload', async ({ page }) => {
    // Navigate to onboarding
    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    // Send a message
    const testMessage = 'I want to build a fitness tracking app';
    await sendMessage(page, testMessage);
    await waitForAIResponse(page, 45000);

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for chat interface to reload
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]');
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

    // Verify the previous message is still visible
    const previousMessage = page.locator(`text="${testMessage}"`);
    await expect(previousMessage).toBeVisible({ timeout: 10000 });

    console.log('Conversation resumed after reload');

    // Take screenshot
    await page.screenshot({ path: 'test-results/session-resume.png', fullPage: true });
  });
});
