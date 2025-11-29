import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';

interface A11yCheckOptions {
  /**
   * Context description for error messages (e.g., "login page", "after form submission")
   */
  context?: string;
  /**
   * WCAG tags to check against (default: WCAG 2.1 AA)
   */
  tags?: string[];
  /**
   * Rule IDs to exclude from the check
   */
  disableRules?: string[];
  /**
   * CSS selector to limit the check to a specific element
   */
  include?: string;
  /**
   * CSS selectors to exclude from the check
   */
  exclude?: string[];
}

/**
 * Run axe accessibility checks on the current page
 *
 * @example
 * ```ts
 * // Basic usage - check entire page for WCAG 2.1 AA compliance
 * await checkA11y(page, 'login page');
 *
 * // Check specific element
 * await checkA11y(page, 'main form', { include: 'form[data-testid="login-form"]' });
 *
 * // Exclude known issues temporarily
 * await checkA11y(page, 'dashboard', {
 *   disableRules: ['color-contrast'], // TODO: Fix contrast in dark mode
 * });
 * ```
 */
export async function checkA11y(
  page: Page,
  context?: string,
  options: Omit<A11yCheckOptions, 'context'> = {}
): Promise<void> {
  const {
    tags = ['wcag2a', 'wcag2aa', 'wcag21aa'],
    disableRules = [],
    include,
    exclude = [],
  } = options;

  let builder = new AxeBuilder({ page }).withTags(tags);

  if (disableRules.length > 0) {
    builder = builder.disableRules(disableRules);
  }

  if (include) {
    builder = builder.include(include);
  }

  if (exclude.length > 0) {
    for (const selector of exclude) {
      builder = builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  // Format violations for readable error messages
  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((violation) => {
      const nodes = violation.nodes
        .slice(0, 3) // Limit to first 3 nodes to avoid overwhelming output
        .map((node) => `  - ${node.html.substring(0, 100)}${node.html.length > 100 ? '...' : ''}`);

      return `
[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}
  Help: ${violation.helpUrl}
  Affected elements (${violation.nodes.length} total):
${nodes.join('\n')}`;
    });

    const contextLabel = context ? ` (${context})` : '';
    throw new Error(
      `Accessibility violations found${contextLabel}:\n${violationMessages.join('\n\n')}`
    );
  }

  // Assertion passes - no violations found
  expect(results.violations).toEqual([]);
}

/**
 * Check keyboard navigation accessibility
 * Verifies that Tab navigation works and focus is visible
 */
export async function checkKeyboardNavigation(
  page: Page,
  expectedFocusableElements: number
): Promise<void> {
  let focusableCount = 0;
  const maxTabs = expectedFocusableElements + 5; // Safety limit

  for (let i = 0; i < maxTabs && focusableCount < expectedFocusableElements; i++) {
    await page.keyboard.press('Tab');

    // Check if an element has focus
    const hasFocus = await page.evaluate(() => {
      const active = document.activeElement;
      return active && active !== document.body;
    });

    if (hasFocus) {
      focusableCount++;

      // Verify focus indicator is visible (has outline or ring)
      const hasVisibleFocus = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return false;

        const styles = window.getComputedStyle(active);
        const outline = styles.outlineWidth;
        const boxShadow = styles.boxShadow;

        // Check for visible outline or box-shadow (ring)
        return (
          (outline && outline !== '0px') ||
          (boxShadow && boxShadow !== 'none' && !boxShadow.includes('rgba(0, 0, 0, 0)'))
        );
      });

      expect(hasVisibleFocus).toBe(true);
    }
  }

  expect(focusableCount).toBeGreaterThanOrEqual(expectedFocusableElements);
}

/**
 * Check that aria-live regions are present for dynamic content
 */
export async function checkLiveRegions(page: Page): Promise<void> {
  const liveRegions = await page.locator('[aria-live]').count();
  expect(liveRegions).toBeGreaterThan(0);
}

/**
 * Verify proper heading structure (no skipped levels)
 */
export async function checkHeadingStructure(page: Page): Promise<void> {
  const headingLevels = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.map((h) => parseInt(h.tagName.charAt(1)));
  });

  if (headingLevels.length === 0) return;

  // Check for skipped levels
  for (let i = 1; i < headingLevels.length; i++) {
    const prev = headingLevels[i - 1];
    const current = headingLevels[i];

    // Heading level can stay same, go down by 1, or go up (back to higher level)
    // Invalid: skipping levels when going down (e.g., h1 -> h3)
    if (current > prev && current - prev > 1) {
      throw new Error(
        `Heading structure invalid: skipped from h${prev} to h${current}. ` +
          `All heading levels: ${headingLevels.join(', ')}`
      );
    }
  }
}
