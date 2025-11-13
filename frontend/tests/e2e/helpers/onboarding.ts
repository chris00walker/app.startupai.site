import { Page, expect } from '@playwright/test';

/**
 * Send a message in the onboarding chat and wait for AI response
 */
export async function sendMessage(page: Page, message: string) {
  // Find the chat input - try various selectors
  const chatInput = page.locator(
    'textarea[placeholder*="message" i], textarea[placeholder*="type" i], input[type="text"][placeholder*="message" i], [data-testid="chat-input"]'
  ).first();

  await expect(chatInput).toBeVisible({ timeout: 10000 });

  // Clear and fill input
  await chatInput.clear();
  await chatInput.fill(message);

  // Find and click send button
  const sendButton = page.locator(
    'button[type="submit"], button:has-text("Send"), button[aria-label*="send" i], [data-testid="send-button"]'
  ).first();

  await expect(sendButton).toBeVisible();
  await sendButton.click();

  // Wait for the message to appear in chat
  await expect(page.locator(`text="${message}"`).first()).toBeVisible({ timeout: 5000 });

  console.log(`Sent message: "${message.substring(0, 50)}..."`);
}

/**
 * Wait for AI response to appear
 */
export async function waitForAIResponse(page: Page, timeout: number = 30000) {
  // Look for loading indicators to disappear
  const loadingIndicator = page.locator('[data-testid="ai-loading"], .loading, [aria-label*="loading" i]');

  // Wait for loading to start (if it appears)
  await page.waitForTimeout(500);

  // Wait for loading to finish
  if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(loadingIndicator).toBeHidden({ timeout });
  }

  // Additional wait to ensure response is rendered
  await page.waitForTimeout(1000);

  console.log('AI response received');
}

/**
 * Get the current stage number from the UI
 */
export async function getCurrentStage(page: Page): Promise<number> {
  // Look for stage indicator in UI
  const stageIndicator = page.locator('[data-testid="current-stage"], [data-stage]').first();

  if (await stageIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
    const stageText = await stageIndicator.textContent();
    const match = stageText?.match(/\d+/);
    if (match) {
      return parseInt(match[0]);
    }
  }

  // Fallback: check for stage-specific text in the UI
  for (let stage = 1; stage <= 7; stage++) {
    const stageMarker = page.locator(`[data-stage="${stage}"]`);
    if (await stageMarker.isVisible({ timeout: 1000 }).catch(() => false)) {
      return stage;
    }
  }

  return 1; // Default to stage 1
}

/**
 * Get progress percentage
 */
export async function getProgress(page: Page): Promise<number> {
  const progressBar = page.locator('[role="progressbar"], [data-testid="progress"]').first();

  if (await progressBar.isVisible({ timeout: 5000 }).catch(() => false)) {
    const ariaValue = await progressBar.getAttribute('aria-valuenow');
    if (ariaValue) {
      return parseInt(ariaValue);
    }
  }

  return 0;
}

/**
 * Complete a full onboarding stage conversation
 */
export async function completeStage(page: Page, stageNumber: number, responses: string[]) {
  console.log(`Completing stage ${stageNumber}...`);

  for (const response of responses) {
    await sendMessage(page, response);
    await waitForAIResponse(page);
  }

  console.log(`Stage ${stageNumber} completed`);
}

/**
 * Navigate to onboarding page
 */
export async function navigateToOnboarding(page: Page) {
  await page.goto('/onboarding');

  // Wait for onboarding interface to load (don't wait for networkidle - too slow with streaming)
  const onboardingElement = page.locator('[data-testid="onboarding"], [data-testid="chat-interface"]').first();
  await expect(onboardingElement).toBeVisible({ timeout: 20000 });

  console.log('Onboarding page loaded');
}
