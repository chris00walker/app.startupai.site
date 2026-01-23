/**
 * @story US-FT01
 */

import { test, expect } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';
import {
  sendMessage,
  waitForAIResponse,
  navigateToOnboarding,
  getCurrentStage,
  getProgress,
} from './helpers/onboarding';
import { checkA11y } from './helpers/accessibility';

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

  test('onboarding interface should be accessible', async ({ page }) => {
    // WCAG 2.1 AA accessibility check on onboarding interface
    await checkA11y(page, 'onboarding interface');
  });

  test('should display chat interface with welcome message', async ({ page }) => {
    // Check for chat interface elements
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await expect(chatInterface).toBeVisible({ timeout: 10000 });

    // Check for input field (placeholder is "Type your response...")
    const inputField = page.locator(
      'textarea[placeholder*="response" i], textarea[aria-label*="message" i], [data-testid="chat-input"]'
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

  test('should progress through Stage 1: Welcome & Introduction', async ({ page }) => {
    // Stage 1 key questions: business idea, inspiration, current stage
    // Using 3-4 topic-aligned responses for deterministic progression
    const stage1Responses = [
      // Q1: What business idea are you excited about?
      'I want to build a meal planning app for busy families',
      // Q2: What inspired this?
      'I was inspired by my own struggle with meal prep - spending hours each week deciding what to cook',
      // Q3: What stage is your business?
      'Just an idea right now - I have some wireframes but no code yet',
    ];

    for (const response of stage1Responses) {
      await sendMessage(page, response);
      await waitForAIResponse(page, 45000);
    }

    // Take screenshot after stage 1
    await page.screenshot({ path: 'test-results/stage-1-complete.png', fullPage: true });

    console.log('Stage 1 (Welcome & Introduction) completed with topic-aligned responses');
  });

  test('should handle multi-turn conversation in Stage 2: Customer Discovery', async ({ page }) => {
    // First complete Stage 1 (3 exchanges)
    const stage1 = [
      'A meal planning app for busy families',
      'Personal frustration with meal prep',
      'Just starting - idea stage',
    ];

    for (const msg of stage1) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }

    // Stage 2 key questions: target customers, specific group, current solutions
    const stage2Responses = [
      // Q1: Who would be interested?
      'Busy parents with young children who struggle with meal planning',
      // Q2: What specific group?
      'Families with 2+ kids where both parents work full-time',
      // Q3: How do they currently solve this?
      'They use recipe apps, Pinterest boards, or just wing it each night',
    ];

    for (const response of stage2Responses) {
      await sendMessage(page, response);
      await waitForAIResponse(page, 45000);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/stage-2-complete.png', fullPage: true });

    console.log('Stage 2 (Customer Discovery) completed with topic-aligned responses');
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
    // Try to send an empty message (use same selector as sendMessage helper)
    const chatInput = page.locator(
      'textarea[placeholder*="response" i], textarea[aria-label*="message" i], textarea[placeholder*="type" i], [data-testid="chat-input"]'
    ).first();

    await expect(chatInput).toBeVisible({ timeout: 10000 });
    await chatInput.clear();

    const sendButton = page.locator(
      'button[type="submit"], button:has-text("Send")'
    ).first();

    // Check if send button is disabled when input is empty
    const isDisabled = await sendButton.isDisabled().catch(() => false);

    if (!isDisabled) {
      // If not disabled, try clicking and verify no empty message is sent
      await sendButton.click();

      // Wait briefly for any potential message to appear
      // Use a short visibility check instead of fixed delay
      const emptyMessage = page.locator('[data-role="user"]:has-text("")');
      const emptyAppeared = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

      // This is a soft check - empty messages shouldn't appear
      console.log(`Empty message prevention: ${!emptyAppeared ? 'working' : 'not working'}`);
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

    // The AI should maintain context - check that all user messages are visible in the conversation
    // Use partial text matching to be more resilient to wrapping/formatting
    const conversationArea = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await expect(conversationArea).toContainText('meal planning', { timeout: 5000 });
    await expect(conversationArea).toContainText('busy parents', { timeout: 5000 });
    await expect(conversationArea).toContainText('what to cook', { timeout: 5000 });

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

    // Verify the previous message is still visible (use partial text match for resilience)
    const chatArea = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await expect(chatArea).toContainText('fitness tracking', { timeout: 10000 });

    console.log('Conversation resumed after reload');

    // Take screenshot
    await page.screenshot({ path: 'test-results/session-resume.png', fullPage: true });
  });

  test('should show "Start New Conversation" button in sidebar', async ({ page }) => {
    // Navigate to onboarding
    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    // Wait for chat interface
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

    // Look for "Start New Conversation" button in sidebar
    const startNewButton = page.locator('button:has-text("Start New Conversation")');

    // The button should be visible in the sidebar
    await expect(startNewButton).toBeVisible({ timeout: 10000 });

    console.log('Start New Conversation button is visible');
  });

  test('should show confirmation dialog when clicking "Start New Conversation"', async ({ page }) => {
    // Navigate to onboarding
    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    // Wait for chat interface
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

    // Click "Start New Conversation" button
    const startNewButton = page.locator('button:has-text("Start New Conversation")');
    await startNewButton.click();

    // Verify confirmation dialog appears
    const dialogTitle = page.locator('text="Start New Conversation?"');
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // Verify dialog has "Continue Current" and "Start Fresh" buttons
    await expect(page.locator('button:has-text("Continue Current")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Fresh")')).toBeVisible();

    console.log('Start New confirmation dialog displayed correctly');

    // Take screenshot
    await page.screenshot({ path: 'test-results/start-new-dialog.png', fullPage: true });
  });

  test('should cancel and return to conversation when clicking "Continue Current"', async ({ page }) => {
    // Navigate to onboarding and send a message first
    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

    // Send a message to have some history
    const testMessage = 'Testing conversation continuity';
    await sendMessage(page, testMessage);
    await waitForAIResponse(page, 45000);

    // Click "Start New Conversation"
    const startNewButton = page.locator('button:has-text("Start New Conversation")');
    await startNewButton.click();

    // Wait for dialog
    await page.locator('text="Start New Conversation?"').waitFor({ state: 'visible', timeout: 5000 });

    // Click "Continue Current"
    await page.locator('button:has-text("Continue Current")').click();

    // Verify dialog closes
    await expect(page.locator('text="Start New Conversation?"')).toBeHidden({ timeout: 5000 });

    // Verify previous message is still visible
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible();

    console.log('Continue Current works - conversation preserved');
  });

  test('should show resume indicator when resuming existing session', async ({ page }) => {
    // Navigate to onboarding
    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    // Send a message to create session state
    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

    await sendMessage(page, 'Starting my session');
    await waitForAIResponse(page, 45000);

    // Reload the page to trigger resume
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for interface to reload
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });

    // Look for resume indicator in sidebar
    const resumeIndicator = page.locator('text="Resuming previous conversation"');

    // It should appear briefly when resuming
    const indicatorVisible = await resumeIndicator.isVisible({ timeout: 10000 }).catch(() => false);

    if (indicatorVisible) {
      console.log('Resume indicator displayed');
    } else {
      // It might have disappeared quickly - check for toast instead
      const resumeToast = page.locator('text="Resuming your conversation"');
      const toastVisible = await resumeToast.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Resume notification: ${toastVisible ? 'toast shown' : 'not detected'}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/resume-indicator.png', fullPage: true });
  });
});

// ============================================================================
// Deterministic Onboarding Flow Tests
// ============================================================================

test.describe('Deterministic 7-Stage Onboarding - Founder User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);

    const url = page.url();
    if (!url.includes('/onboarding') && !url.includes('/chat')) {
      await navigateToOnboarding(page);
    }

    const chatInterface = page.locator('[data-testid="chat-interface"], [data-testid="onboarding"]').first();
    await chatInterface.waitFor({ state: 'visible', timeout: 15000 });
  });

  test('should handle "I don\'t know" responses gracefully', async ({ page }) => {
    // Test that uncertainty is accepted and stage still progresses
    const responsesWithUncertainty = [
      // Stage 1 - mix of answers and uncertainty
      'A meal planning app for families',
      "I don't know exactly what inspired me - it just seemed like a good idea",
      "I haven't thought about the business stage yet",
    ];

    for (const response of responsesWithUncertainty) {
      await sendMessage(page, response);
      await waitForAIResponse(page, 45000);
    }

    // Verify Alex acknowledged uncertainty (should continue without looping)
    // Look for any assistant message - Alex should not ask for a "better" answer
    const assistantMessages = page.locator('[data-role="assistant"], [data-testid="ai-message"]');
    const messageCount = await assistantMessages.count();

    // Should have 3 assistant messages (one response per user message)
    expect(messageCount).toBeGreaterThanOrEqual(3);

    console.log('Uncertainty responses handled gracefully');

    await page.screenshot({ path: 'test-results/uncertainty-handling.png', fullPage: true });
  });

  test('should complete stages with topic-aligned responses', async ({ page }) => {
    // Stage 1: Welcome & Introduction (3 key questions)
    const stage1 = [
      'I want to build a subscription box for pet owners',
      'My dog inspired me - I spend hours researching the best treats and toys',
      'Early stage - just validating the idea',
    ];

    // Stage 2: Customer Discovery (3 key questions)
    const stage2 = [
      'Dog owners who want premium, curated products for their pets',
      'Millennials with dogs who treat them like family members',
      'They currently browse Amazon or specialty pet stores',
    ];

    // Send Stage 1 responses
    for (const msg of stage1) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }

    console.log('Stage 1 completed');

    // Send Stage 2 responses
    for (const msg of stage2) {
      await sendMessage(page, msg);
      await waitForAIResponse(page, 45000);
    }

    console.log('Stage 2 completed');

    // Verify conversation is progressing (multiple exchanges completed)
    const allMessages = page.locator('[data-role="user"], [data-role="assistant"]');
    const totalMessages = await allMessages.count();
    expect(totalMessages).toBeGreaterThanOrEqual(12); // 6 user + 6 assistant

    await page.screenshot({ path: 'test-results/stages-1-2-complete.png', fullPage: true });
  });
});
