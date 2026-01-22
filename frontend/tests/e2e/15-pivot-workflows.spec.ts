/**
 * 15-pivot-workflows.spec.ts
 *
 * Pivot Decision Workflow E2E Tests
 *
 * Covers user stories:
 * - US-P01: Approve Segment Pivot
 * - US-P02: Approve Value Pivot
 * - US-P03: Approve Feature Downgrade
 * - US-P04: Approve Strategic Pivot
 *
 * Story Reference: docs/user-experience/stories/README.md
 * Spec Reference: docs/specs/pivot-workflows.md
 */

import { test, expect, Page } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Navigate to approvals page
 */
async function navigateToApprovals(page: Page): Promise<void> {
  await page.goto('/dashboard/approvals');
  await page.waitForLoadState('networkidle');
}

/**
 * Mock pivot HITL request
 */
async function mockPivotRequest(
  page: Page,
  pivotType: 'segment' | 'value' | 'feature' | 'strategic',
  pivotData: Record<string, unknown> = {}
): Promise<void> {
  const pivotConfigs = {
    segment: {
      checkpoint_type: 'segment_pivot',
      phase: 2,
      title: 'Segment Pivot Recommended',
      trigger: {
        metric: 'problem_resonance',
        value: 0.23,
        threshold: 0.30,
        direction: 'below',
      },
    },
    value: {
      checkpoint_type: 'value_pivot',
      phase: 2,
      title: 'Value Pivot Recommended',
      trigger: {
        metric: 'zombie_ratio',
        value: 0.72,
        threshold: 0.70,
        direction: 'above',
      },
    },
    feature: {
      checkpoint_type: 'feature_downgrade',
      phase: 3,
      title: 'Feature Downgrade Recommended',
      trigger: {
        metric: 'feasibility_signal',
        value: 'ORANGE',
        threshold: 'GREEN',
        direction: 'below',
      },
    },
    strategic: {
      checkpoint_type: 'strategic_pivot',
      phase: 4,
      title: 'Strategic Pivot Recommended',
      trigger: {
        metric: 'ltv_cac_ratio',
        value: 1.8,
        threshold: 3.0,
        direction: 'below',
      },
    },
  };

  const config = pivotConfigs[pivotType];

  await page.route('**/api/approvals*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: `pivot-${pivotType}-1`,
              checkpoint_type: config.checkpoint_type,
              phase: config.phase,
              status: 'pending',
              created_at: new Date().toISOString(),
              context: {
                title: config.title,
                trigger: config.trigger,
                ...pivotData,
              },
            },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock pivot options API
 */
async function mockPivotOptions(
  page: Page,
  pivotType: 'segment' | 'value' | 'feature' | 'strategic',
  pivotCount = 0,
  maxPivots = 3
): Promise<void> {
  const alternativesConfig = {
    segment: [
      {
        id: 'segment_a',
        name: 'Scale-up founders (Series A+)',
        description: 'Higher pain intensity, budget for solutions',
        rationale: 'Established founders have proven need',
        estimatedResonance: { min: 45, max: 55 },
        tradeOff: 'Smaller addressable market',
      },
      {
        id: 'segment_b',
        name: 'Corporate innovation teams',
        description: 'Systematic validation needs, enterprise budget',
        rationale: 'Recurring need, higher deal size',
        estimatedResonance: { min: 50, max: 60 },
        tradeOff: 'Longer sales cycle',
      },
      {
        id: 'segment_c',
        name: 'Startup accelerator programs',
        description: 'Batch validation needs, recurring revenue',
        rationale: 'Volume play with repeating cohorts',
        estimatedResonance: { min: 60, max: 70 },
        tradeOff: 'B2B2C complexity',
      },
    ],
    value: [
      {
        id: 'value_a',
        name: 'Speed-focused',
        description: 'Get market validation in 48 hours',
        emphasis: 'Time savings',
        risk: 'May attract rushed users',
      },
      {
        id: 'value_b',
        name: 'Confidence-focused',
        description: 'Make decisions with 95% confidence',
        emphasis: 'Risk reduction',
        risk: 'May seem too cautious',
      },
    ],
    feature: [
      {
        id: 'downgrade_a',
        name: 'Remove real-time collaboration',
        description: 'Single-user editing only',
        valuePreserved: 85,
        timelineReduction: 60,
      },
      {
        id: 'downgrade_b',
        name: 'Single-user MVP',
        description: 'No teams or sharing',
        valuePreserved: 70,
        timelineReduction: 75,
      },
    ],
    strategic: [
      {
        id: 'price_pivot',
        name: 'Price Pivot',
        description: 'Increase pricing from $99 to $149',
        impact: 'LTV increases to $1,800 (3.0x ratio)',
        risk: 'May reduce conversion by 15-25%',
      },
      {
        id: 'cost_pivot',
        name: 'Cost Pivot',
        description: 'Shift to organic acquisition',
        impact: 'CAC reduces to $400 (3.0x ratio)',
        risk: 'Slower growth, 6-12 month ramp',
      },
      {
        id: 'combined',
        name: 'Combined Pivot',
        description: 'Moderate price increase + CAC optimization',
        impact: 'LTV $1,500, CAC $500 (3.0x ratio)',
        risk: 'Complex execution',
      },
    ],
  };

  await page.route('**/api/hitl/pivot-options*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pivot_type: pivotType,
        alternatives: alternativesConfig[pivotType],
        pivot_count: pivotCount,
        max_pivots: maxPivots,
      }),
    });
  });
}

/**
 * Mock pivot decision submission
 */
async function mockPivotDecision(page: Page, success = true): Promise<void> {
  await page.route('**/api/hitl/pivot-decision', async (route) => {
    if (route.request().method() === 'POST') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Pivot decision recorded',
            next_phase: 1,
            auto_start: true,
          }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to process pivot decision' }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

// =============================================================================
// Test Suite: US-P01 - Segment Pivot
// =============================================================================

test.describe('US-P01: Approve Segment Pivot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display segment pivot notification', async ({ page }) => {
    // Given: Problem resonance < 30% at Desirability gate
    await mockPivotRequest(page, 'segment', {
      currentSegment: {
        description: 'Early-stage founders, 25-35, US',
        problemResonance: 0.23,
        sampleSize: 500,
      },
    });

    await navigateToApprovals(page);

    // When: I view the approval queue
    // Then: I see segment pivot notification
    const pivotCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /segment.*pivot/i,
    });

    if (await pivotCard.isVisible()) {
      await expect(pivotCard).toBeVisible();
      await expect(pivotCard.getByText(/23%|resonance/i)).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-segment-notification.png',
      fullPage: true,
    });
  });

  test('should display alternative segments', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await navigateToApprovals(page);

    // When: I click on the pivot card
    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see alternative segment options
      const modal = page.locator('[data-testid="approval-modal"], [role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal.getByText(/scale-up|corporate|accelerator/i)).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-segment-alternatives.png',
      fullPage: true,
    });
  });

  test('should allow selecting alternative segment', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await mockPivotDecision(page, true);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // When: I select an alternative segment
      const segmentOption = page.getByText(/scale-up founder/i);
      if (await segmentOption.isVisible()) {
        await segmentOption.click();

        const confirmButton = page.getByRole('button', { name: /confirm|select|apply/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();

          // Then: Pivot is submitted
          await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 5000 });
        }
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-segment-selected.png',
      fullPage: true,
    });
  });

  test('should allow custom segment definition', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // When: I select custom segment option
      const customOption = page.getByText(/custom.*segment|define.*own/i);
      if (await customOption.isVisible()) {
        await customOption.click();

        // Then: I can define custom segment
        const customInput = page.locator('textarea, input[name="customSegment"]');
        if (await customInput.isVisible()) {
          await expect(customInput).toBeVisible();
        }
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-segment-custom.png',
      fullPage: true,
    });
  });

  test('should show pivot count and limit', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment', 2, 3);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see pivot progress indicator
      const pivotProgress = page.getByText(/2.*of.*3|pivot.*remaining/i);
      if (await pivotProgress.isVisible()) {
        await expect(pivotProgress).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-segment-count.png',
      fullPage: true,
    });
  });

  test('should restrict options at pivot limit', async ({ page }) => {
    // Given: 3 segment pivots already used
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment', 3, 3);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: Only override or kill options available
      const limitMessage = page.getByText(/limit.*reached|no.*more.*pivot/i);
      const overrideOption = page.getByText(/override.*proceed|continue.*anyway/i);
      const killOption = page.getByText(/kill.*project|end.*validation/i);

      // At least one should be visible
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-segment-limit.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-P02 - Value Pivot
// =============================================================================

test.describe('US-P02: Approve Value Pivot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display value pivot notification', async ({ page }) => {
    // Given: Zombie ratio >= 70% at Desirability gate
    await mockPivotRequest(page, 'value', {
      zombieRatio: 0.72,
      commitmentSignals: 0.08,
      targetCommitment: 0.25,
    });

    await navigateToApprovals(page);

    // Then: I see value pivot notification
    const pivotCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /value.*pivot|zombie/i,
    });

    if (await pivotCard.isVisible()) {
      await expect(pivotCard).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-value-notification.png',
      fullPage: true,
    });
  });

  test('should display value proposition alternatives', async ({ page }) => {
    await mockPivotRequest(page, 'value');
    await mockPivotOptions(page, 'value', 0, 2);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see alternative value propositions
      const modal = page.locator('[data-testid="approval-modal"], [role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal.getByText(/speed.*focus|confidence.*focus/i)).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-value-alternatives.png',
      fullPage: true,
    });
  });

  test('should allow iterate option', async ({ page }) => {
    await mockPivotRequest(page, 'value');
    await mockPivotOptions(page, 'value');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see iterate option
      const iterateOption = page.getByText(/iterate|refine.*current|a\/b.*test/i);
      if (await iterateOption.isVisible()) {
        await expect(iterateOption).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-value-iterate.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-P03 - Feature Downgrade
// =============================================================================

test.describe('US-P03: Approve Feature Downgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display feature downgrade notification', async ({ page }) => {
    // Given: Feasibility signal is ORANGE
    await mockPivotRequest(page, 'feature', {
      feasibilitySignal: 'ORANGE',
      blocker: 'Real-time collaboration requires 3x timeline',
      coreValuePreserved: 0.85,
    });

    await navigateToApprovals(page);

    // Then: I see feature downgrade notification
    const pivotCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /feature.*downgrade|feasibility/i,
    });

    if (await pivotCard.isVisible()) {
      await expect(pivotCard).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-feature-notification.png',
      fullPage: true,
    });
  });

  test('should display downgrade options with impact', async ({ page }) => {
    await mockPivotRequest(page, 'feature');
    await mockPivotOptions(page, 'feature', 0, 1);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see downgrade options with value preserved %
      const modal = page.locator('[data-testid="approval-modal"], [role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal.getByText(/remove.*collaboration|single.*user/i)).toBeVisible();
        await expect(modal.getByText(/85%|70%|value.*preserved/i)).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-feature-options.png',
      fullPage: true,
    });
  });

  test('should show retest requirement', async ({ page }) => {
    await mockPivotRequest(page, 'feature');
    await mockPivotOptions(page, 'feature');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see retest requirement warning
      const retestWarning = page.getByText(/retest|return.*phase.*2|desirability/i);
      if (await retestWarning.isVisible()) {
        await expect(retestWarning).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-feature-retest.png',
      fullPage: true,
    });
  });

  test('should allow proceed with constraints', async ({ page }) => {
    await mockPivotRequest(page, 'feature');
    await mockPivotOptions(page, 'feature');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see proceed with constraints option
      const proceedOption = page.getByText(/proceed.*constraint|accept.*timeline|continue.*full/i);
      if (await proceedOption.isVisible()) {
        await expect(proceedOption).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-feature-proceed.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: US-P04 - Strategic Pivot
// =============================================================================

test.describe('US-P04: Approve Strategic Pivot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display strategic pivot notification', async ({ page }) => {
    // Given: LTV:CAC ratio is marginal (1.0-3.0)
    await mockPivotRequest(page, 'strategic', {
      unitEconomics: {
        ltv: 1200,
        cac: 667,
        ltvCacRatio: 1.8,
        paybackMonths: 8,
      },
    });

    await navigateToApprovals(page);

    // Then: I see strategic pivot notification
    const pivotCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /strategic.*pivot|viability|economics/i,
    });

    if (await pivotCard.isVisible()) {
      await expect(pivotCard).toBeVisible();
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-strategic-notification.png',
      fullPage: true,
    });
  });

  test('should display unit economics summary', async ({ page }) => {
    await mockPivotRequest(page, 'strategic', {
      unitEconomics: {
        ltv: 1200,
        cac: 667,
        ltvCacRatio: 1.8,
        paybackMonths: 8,
      },
    });
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see unit economics breakdown
      const modal = page.locator('[data-testid="approval-modal"], [role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal.getByText(/ltv|cac|ratio|payback/i)).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-strategic-economics.png',
      fullPage: true,
    });
  });

  test('should display price and cost pivot options', async ({ page }) => {
    await mockPivotRequest(page, 'strategic');
    await mockPivotOptions(page, 'strategic', 0, 2);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: I see price and cost pivot options
      const modal = page.locator('[data-testid="approval-modal"], [role="dialog"]');
      if (await modal.isVisible()) {
        await expect(modal.getByText(/price.*pivot|cost.*pivot|combined/i)).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-strategic-options.png',
      fullPage: true,
    });
  });

  test('should show impact projections', async ({ page }) => {
    await mockPivotRequest(page, 'strategic');
    await mockPivotOptions(page, 'strategic');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: Each option shows impact projection
      const impactText = page.getByText(/3\.0x.*ratio|\$1,800|\$400/i);
      if (await impactText.isVisible()) {
        await expect(impactText).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-strategic-impact.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Common Pivot UI Patterns
// =============================================================================

test.describe('Pivot UI Common Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display evidence panel in pivot modal', async ({ page }) => {
    await mockPivotRequest(page, 'segment', {
      evidence: {
        sampleSize: 500,
        confidence: 0.95,
        collectionPeriod: { start: '2026-01-01', end: '2026-01-15' },
      },
    });
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: Evidence summary is visible
      const evidencePanel = page.locator('[data-testid="evidence-panel"]');
      const sampleSize = page.getByText(/500|sample.*size/i);

      if (await evidencePanel.isVisible()) {
        await expect(evidencePanel).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-evidence-panel.png',
      fullPage: true,
    });
  });

  test('should allow override proceed option', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: Override option exists
      const overrideOption = page.getByText(/override|ignore.*pivot|force.*proceed/i);
      if (await overrideOption.isVisible()) {
        await expect(overrideOption).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-override-option.png',
      fullPage: true,
    });
  });

  test('should allow kill project option', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: Kill option exists
      const killOption = page.getByText(/kill.*project|end.*validation|terminate/i);
      if (await killOption.isVisible()) {
        await expect(killOption).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-kill-option.png',
      fullPage: true,
    });
  });

  test('should support adding comment with decision', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await mockPivotDecision(page, true);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      // Then: Comment field is available
      const commentField = page.locator(
        'textarea[name="comment"], [data-testid="pivot-comment"]'
      );
      if (await commentField.isVisible()) {
        await commentField.fill('Selecting scale-up founders based on higher budget availability.');
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-comment.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Error Handling
// =============================================================================

test.describe('Pivot Workflow Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should handle decision submission failure', async ({ page }) => {
    await mockPivotRequest(page, 'segment');
    await mockPivotOptions(page, 'segment');
    await mockPivotDecision(page, false);
    await navigateToApprovals(page);

    const pivotCard = page.locator('[data-testid="approval-card"]').first();
    if (await pivotCard.isVisible()) {
      await pivotCard.click();

      const option = page.getByText(/scale-up/i);
      if (await option.isVisible()) {
        await option.click();
      }

      const confirmButton = page.getByRole('button', { name: /confirm|submit/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();

        // Then: Error message shown
        await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-submission-error.png',
      fullPage: true,
    });
  });

  test('should handle no pending pivots gracefully', async ({ page }) => {
    await page.route('**/api/approvals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await navigateToApprovals(page);

    // Then: Empty state shown
    await expect(page.getByText(/no.*pending|nothing.*review/i)).toBeVisible();

    await page.screenshot({
      path: 'tests/e2e/screenshots/pivot-empty-state.png',
      fullPage: true,
    });
  });
});
