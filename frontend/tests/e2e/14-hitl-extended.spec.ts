/**
 * 14-hitl-extended.spec.ts
 *
 * Extended HITL (Human-in-the-Loop) Approval Flow E2E Tests
 *
 * Covers user stories:
 * - US-H01: Review Founder's Brief (approve_founders_brief)
 * - US-H02: Approve Experiment Plan (approve_experiment_plan)
 * - US-H04: Approve Campaign Launch (campaign_launch)
 * - US-H05: Approve Budget Increase (spend_increase)
 * - US-H06: Review Desirability Gate (gate_progression D)
 * - US-H07: Review Feasibility Gate (gate_progression F)
 * - US-H08: Review Viability Gate (gate_progression V)
 * - US-H09: Make Final Decision (final_decision)
 *
 * Spec Reference: docs/specs/hitl-approval-ui.md
 * Story Reference: docs/user-experience/stories/README.md
 *
 * @story US-F03, US-H01, US-H02, US-H04, US-H05, US-H06, US-H07, US-H08, US-H09
 */

import { test, expect, Page } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';

// =============================================================================
// Test Data & Helpers
// =============================================================================

interface HITLCheckpoint {
  type: string;
  phase: number;
  title: string;
  description: string;
}

const CHECKPOINT_TYPES: Record<string, HITLCheckpoint> = {
  approve_founders_brief: {
    type: 'approve_founders_brief',
    phase: 0,
    title: "Founder's Brief Review",
    description: 'Review and approve the AI-generated brief',
  },
  approve_experiment_plan: {
    type: 'approve_experiment_plan',
    phase: 1,
    title: 'Experiment Plan Approval',
    description: 'Review and approve the experiment design',
  },
  approve_pricing_test: {
    type: 'approve_pricing_test',
    phase: 1,
    title: 'Pricing Test Approval',
    description: 'Approve the pricing experiment before execution',
  },
  approve_vpc_completion: {
    type: 'approve_vpc_completion',
    phase: 1,
    title: 'VPC Completion Review',
    description: 'Review completed Value Proposition Canvas',
  },
  campaign_launch: {
    type: 'campaign_launch',
    phase: 2,
    title: 'Campaign Launch Approval',
    description: 'Approve ad campaign before going live',
  },
  spend_increase: {
    type: 'spend_increase',
    phase: 2,
    title: 'Budget Increase Request',
    description: 'Approve additional spend for campaigns',
  },
  gate_progression_d: {
    type: 'gate_progression',
    phase: 2,
    title: 'Desirability Gate Review',
    description: 'Review evidence for Desirability gate',
  },
  gate_progression_f: {
    type: 'gate_progression',
    phase: 3,
    title: 'Feasibility Gate Review',
    description: 'Review evidence for Feasibility gate',
  },
  gate_progression_v: {
    type: 'gate_progression',
    phase: 4,
    title: 'Viability Gate Review',
    description: 'Review evidence for Viability gate',
  },
  final_decision: {
    type: 'final_decision',
    phase: 4,
    title: 'Final Decision',
    description: 'Make the final validation decision',
  },
};

/**
 * Navigate to the approvals page and wait for content to load
 * Uses strict assertions - FAILS if approvals are not accessible
 */
async function navigateToApprovals(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Click on approvals tab/link - MUST exist
  const approvalsLink = page.getByRole('link', { name: /approvals/i });
  await expect(approvalsLink).toBeVisible({ timeout: 10000 });
  await approvalsLink.click();

  await page.waitForLoadState('networkidle');
}

/**
 * Mock HITL request API response
 */
async function mockHITLRequest(
  page: Page,
  checkpoint: HITLCheckpoint,
  additionalData: Record<string, unknown> = {}
): Promise<void> {
  await page.route('**/api/approvals*', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/approvals') && route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'test-hitl-request-1',
              checkpoint_type: checkpoint.type,
              phase: checkpoint.phase,
              status: 'pending',
              created_at: new Date().toISOString(),
              context: {
                title: checkpoint.title,
                description: checkpoint.description,
                ...additionalData,
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
 * Mock approval submission
 */
async function mockApprovalSubmission(page: Page): Promise<void> {
  await page.route('**/api/hitl/approve', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Approval submitted successfully',
        }),
      });
    } else {
      await route.continue();
    }
  });
}

// =============================================================================
// Test Suite: Phase 0 - Onboarding Checkpoints
// =============================================================================

test.describe('Phase 0: Onboarding HITL Checkpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('US-H01: should display Founders Brief for review', async ({ page }) => {
    // Given: I have completed onboarding with a pending brief approval
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief, {
      founders_brief: {
        the_idea: 'AI-powered startup validation platform',
        problem_hypothesis: 'Founders waste time on ideas that fail',
        customer_hypothesis: 'Early-stage founders seeking validation',
        solution_hypothesis: 'AI agents that validate business models',
        key_assumptions: ['Founders want AI help', 'Evidence-based decisions work'],
        success_criteria: ['80% of users complete validation', 'NPS > 50'],
      },
    });

    await navigateToApprovals(page);

    // When: I view the approval queue
    // Then: I see the Founder's Brief approval card
    const briefCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /founder.*brief/i,
    });
    await expect(briefCard).toBeVisible({ timeout: 10000 });

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-founders-brief-card.png',
      fullPage: true,
    });
  });

  test('US-H01: should show brief content in approval modal', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief, {
      founders_brief: {
        the_idea: 'AI-powered startup validation platform',
        problem_hypothesis: 'Founders waste time on ideas that fail',
        customer_hypothesis: 'Early-stage founders seeking validation',
        solution_hypothesis: 'AI agents that validate business models',
      },
    });

    await navigateToApprovals(page);

    // When: I click on the Founder's Brief approval
    const briefCard = page.locator('[data-testid="approval-card"]').first();
    await expect(briefCard).toBeVisible({ timeout: 10000 });
    await briefCard.click();

    // Then: I see the brief content in the modal
    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify key brief fields are displayed
    await expect(modal.getByText(/problem.*hypothesis/i)).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/customer.*hypothesis/i)).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/solution.*hypothesis/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-founders-brief-modal.png',
      fullPage: true,
    });
  });

  test('US-H01: should allow approving the brief', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);
    await mockApprovalSubmission(page);

    await navigateToApprovals(page);

    // When: I approve the brief
    const briefCard = page.locator('[data-testid="approval-card"]').first();
    await expect(briefCard).toBeVisible({ timeout: 10000 });
    await briefCard.click();

    const approveButton = page.getByRole('button', { name: /approve/i });
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await approveButton.click();

    // Then: The approval is submitted successfully
    await expect(page.getByText(/success|approved/i)).toBeVisible({ timeout: 5000 });
  });

  test('US-H01: should allow requesting revisions', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);

    await navigateToApprovals(page);

    // When: I request revisions
    const briefCard = page.locator('[data-testid="approval-card"]').first();
    await expect(briefCard).toBeVisible({ timeout: 10000 });
    await briefCard.click();

    const reviseButton = page.getByRole('button', { name: /revise|request.*change/i });
    await expect(reviseButton).toBeVisible({ timeout: 5000 });
    await reviseButton.click();

    // Then: I can provide revision notes
    const notesInput = page.locator('textarea[name="notes"], [data-testid="revision-notes"]');
    await expect(notesInput).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// Test Suite: Phase 1 - VPC Discovery Checkpoints
// =============================================================================

test.describe('Phase 1: VPC Discovery HITL Checkpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('US-H02: should display experiment plan for approval', async ({ page }) => {
    // Given: AI has designed test cards for validation
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_experiment_plan, {
      experiment_plan: {
        test_cards: [
          {
            id: 'tc-1',
            hypothesis: 'Early founders want AI validation',
            test_method: 'Landing page signup',
            success_metric: '10% conversion rate',
            budget: '$500',
          },
        ],
        total_budget: '$500',
        timeline: '2 weeks',
      },
    });

    await navigateToApprovals(page);

    // When: I view the approval queue
    // Then: I see the experiment plan approval
    const planCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /experiment.*plan/i,
    });
    await expect(planCard).toBeVisible({ timeout: 10000 });
    await planCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-experiment-plan.png',
      fullPage: true,
    });
  });

  test('US-H03: should display VPC completion for review', async ({ page }) => {
    // Given: VPC has been completed with fit score >= 70
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_vpc_completion, {
      vpc_data: {
        customer_profile: {
          jobs: ['Validate business ideas', 'Make data-driven decisions'],
          pains: ['Wasted time on bad ideas', 'Expensive pivots'],
          gains: ['Confidence in direction', 'Evidence-based strategy'],
        },
        value_map: {
          products_services: ['AI validation platform'],
          pain_relievers: ['Automated validation', 'Early feedback'],
          gain_creators: ['Clear evidence', 'Actionable insights'],
        },
        fit_score: 78,
      },
    });

    await navigateToApprovals(page);

    // Then: I see VPC completion in approvals
    const vpcCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /vpc|value.*proposition/i,
    });
    await expect(vpcCard).toBeVisible({ timeout: 10000 });
    await vpcCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify fit score is displayed
    await expect(modal.getByText(/fit.*score|score.*\d+/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-vpc-completion.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Phase 2 - Desirability Checkpoints
// =============================================================================

test.describe('Phase 2: Desirability HITL Checkpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('US-H04: should display campaign launch approval', async ({ page }) => {
    // Given: AI has prepared ad campaign for launch
    await mockHITLRequest(page, CHECKPOINT_TYPES.campaign_launch, {
      campaign: {
        platform: 'Google Ads',
        budget: '$1,000',
        duration: '14 days',
        creative_assets: [
          { type: 'headline', content: 'Validate Your Startup Idea with AI' },
          { type: 'description', content: 'Get evidence-based validation in days' },
        ],
        target_audience: 'Early-stage founders, 25-45, US',
      },
    });

    await navigateToApprovals(page);

    // Then: I see campaign launch approval
    const campaignCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /campaign.*launch/i,
    });
    await expect(campaignCard).toBeVisible({ timeout: 10000 });
    await campaignCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify campaign details are shown
    await expect(modal.getByText(/budget|spend/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-campaign-launch.png',
      fullPage: true,
    });
  });

  test('US-H05: should display budget increase request', async ({ page }) => {
    // Given: Campaign is performing well and needs more budget
    await mockHITLRequest(page, CHECKPOINT_TYPES.spend_increase, {
      current_spend: '$500',
      requested_increase: '$500',
      new_total: '$1,000',
      performance_metrics: {
        ctr: '3.2%',
        conversions: 45,
        cpa: '$11.11',
      },
      justification: 'Strong CTR and conversion rates warrant increased spend',
    });

    await navigateToApprovals(page);

    // Then: I see budget increase request
    const budgetCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /budget|spend.*increase/i,
    });
    await expect(budgetCard).toBeVisible({ timeout: 10000 });
    await budgetCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-budget-increase.png',
      fullPage: true,
    });
  });

  test('US-H06: should display Desirability gate review', async ({ page }) => {
    // Given: Desirability evidence has been collected
    await mockHITLRequest(page, CHECKPOINT_TYPES.gate_progression_d, {
      gate: 'desirability',
      evidence: {
        problem_resonance: 0.72,
        zombie_ratio: 0.15,
        commitment_signals: ['signups', 'waitlist', 'email_opens'],
        sample_size: 500,
      },
      recommendation: 'proceed',
      signal: 'GREEN',
    });

    await navigateToApprovals(page);

    // Then: I see Desirability gate review
    const gateCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /desirability|gate/i,
    });
    await expect(gateCard).toBeVisible({ timeout: 10000 });
    await gateCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify D-F-V signal indicator
    await expect(modal.locator('[data-testid="signal-indicator"], .signal-badge')).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-desirability-gate.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Phase 3 - Feasibility Checkpoints
// =============================================================================

test.describe('Phase 3: Feasibility HITL Checkpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('US-H07: should display Feasibility gate review', async ({ page }) => {
    // Given: Feasibility assessment is complete
    await mockHITLRequest(page, CHECKPOINT_TYPES.gate_progression_f, {
      gate: 'feasibility',
      evidence: {
        technical_feasibility: 'GREEN',
        resource_requirements: {
          team_size: 3,
          timeline_months: 6,
          tech_stack: ['Next.js', 'Supabase', 'Modal'],
        },
        risk_factors: [{ risk: 'AI model costs', severity: 'medium', mitigation: 'Usage caps' }],
      },
      recommendation: 'proceed',
      signal: 'GREEN',
    });

    await navigateToApprovals(page);

    // Then: I see Feasibility gate review
    const gateCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /feasibility|gate/i,
    });
    await expect(gateCard).toBeVisible({ timeout: 10000 });
    await gateCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify feasibility signal is shown
    await expect(modal.getByText(/green|orange|red/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-feasibility-gate.png',
      fullPage: true,
    });
  });

  test('US-H07: should handle ORANGE feasibility signal', async ({ page }) => {
    // Given: Feasibility has constraints
    await mockHITLRequest(page, CHECKPOINT_TYPES.gate_progression_f, {
      gate: 'feasibility',
      evidence: {
        technical_feasibility: 'ORANGE',
        constraints: ['Limited AI API budget', 'Complex integrations'],
      },
      recommendation: 'downgrade_and_retest',
      signal: 'ORANGE',
    });

    await navigateToApprovals(page);

    const gateCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /feasibility/i,
    });
    await expect(gateCard).toBeVisible({ timeout: 10000 });
    await gateCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // When: I view an ORANGE feasibility result
    // Then: I see downgrade options
    const downgradeOption = modal.getByRole('button', { name: /downgrade|reduce.*scope/i });
    await expect(downgradeOption).toBeVisible({ timeout: 5000 });
    await expect(downgradeOption).toBeEnabled();

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-feasibility-orange.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Phase 4 - Viability Checkpoints
// =============================================================================

test.describe('Phase 4: Viability HITL Checkpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('US-H08: should display Viability gate review', async ({ page }) => {
    // Given: Viability analysis is complete
    await mockHITLRequest(page, CHECKPOINT_TYPES.gate_progression_v, {
      gate: 'viability',
      evidence: {
        unit_economics: {
          ltv: 2400,
          cac: 600,
          ltv_cac_ratio: 4.0,
          payback_months: 3,
        },
        market_sizing: {
          tam: '$50B',
          sam: '$5B',
          som: '$500M',
        },
      },
      recommendation: 'proceed',
      signal: 'GREEN',
    });

    await navigateToApprovals(page);

    // Then: I see Viability gate review
    const gateCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /viability|gate/i,
    });
    await expect(gateCard).toBeVisible({ timeout: 10000 });
    await gateCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify unit economics are displayed
    await expect(modal.getByText(/ltv|cac|ratio/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-viability-gate.png',
      fullPage: true,
    });
  });

  test('US-H09: should display final decision checkpoint', async ({ page }) => {
    // Given: All phases are complete
    await mockHITLRequest(page, CHECKPOINT_TYPES.final_decision, {
      summary: {
        desirability: { signal: 'GREEN', score: 85 },
        feasibility: { signal: 'GREEN', score: 78 },
        viability: { signal: 'GREEN', score: 82 },
        overall_recommendation: 'VALIDATED',
      },
      validation_timeline: '45 days',
      total_spend: '$2,500',
      key_learnings: [
        'Strong problem-solution fit confirmed',
        'Target audience engaged at 3x expected rate',
        'Unit economics support scale',
      ],
    });

    await navigateToApprovals(page);

    // Then: I see final decision checkpoint
    const finalCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /final.*decision|validation.*complete/i,
    });
    await expect(finalCard).toBeVisible({ timeout: 10000 });
    await finalCard.click();

    const modal = page.locator('[data-testid="approval-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify all three signals are shown
    await expect(modal.getByText(/desirability/i)).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/feasibility/i)).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/viability/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-final-decision.png',
      fullPage: true,
    });
  });

  test('US-H09: should allow final validation decision', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.final_decision, {
      summary: {
        desirability: { signal: 'GREEN', score: 85 },
        feasibility: { signal: 'GREEN', score: 78 },
        viability: { signal: 'GREEN', score: 82 },
        overall_recommendation: 'VALIDATED',
      },
    });
    await mockApprovalSubmission(page);

    await navigateToApprovals(page);

    const finalCard = page.locator('[data-testid="approval-card"]').filter({
      hasText: /final|decision/i,
    });
    await expect(finalCard).toBeVisible({ timeout: 10000 });
    await finalCard.click();

    // When: I make the final decision
    const validateButton = page.getByRole('button', { name: /validate|approve|confirm/i });
    await expect(validateButton).toBeVisible({ timeout: 5000 });
    await validateButton.click();

    // Then: The project is marked as validated
    await expect(page.getByText(/validated|complete|success/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-final-validated.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Approval Flow Mechanics
// =============================================================================

test.describe('HITL Approval Flow Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display approval stats summary', async ({ page }) => {
    // Mock approvals to ensure stats are populated
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);
    await navigateToApprovals(page);

    // Then: I see approval statistics
    const statsSection = page.locator('[data-testid="approval-stats"]');
    await expect(statsSection).toBeVisible({ timeout: 10000 });
    await expect(statsSection.getByText(/pending|approved|total/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-approval-stats.png',
      fullPage: true,
    });
  });

  test('should filter approvals by status', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);
    await navigateToApprovals(page);

    // When: I filter by pending status
    const filterDropdown = page.locator('[data-testid="status-filter"], select[name="status"]');
    await expect(filterDropdown).toBeVisible({ timeout: 10000 });
    await filterDropdown.selectOption('pending');

    // Then: Only pending approvals are shown
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-filtered-pending.png',
      fullPage: true,
    });
  });

  test('should show approval history', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);
    await navigateToApprovals(page);

    // When: I view completed approvals
    const historyTab = page.getByRole('tab', { name: /history|completed/i });
    await expect(historyTab).toBeVisible({ timeout: 10000 });
    await historyTab.click();

    // Then: I see past approval decisions
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-approval-history.png',
      fullPage: true,
    });
  });

  test('should handle approval with comment', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);
    await mockApprovalSubmission(page);

    await navigateToApprovals(page);

    const card = page.locator('[data-testid="approval-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // When: I add a comment before approving
    const commentInput = page.locator('textarea[name="comment"], [data-testid="approval-comment"]');
    await expect(commentInput).toBeVisible({ timeout: 5000 });
    await commentInput.fill('Looks good, approved with confidence.');

    const approveButton = page.getByRole('button', { name: /approve/i });
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await approveButton.click();

    // Then: Approval is submitted with comment
    await expect(page.getByText(/success|approved/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-approval-with-comment.png',
      fullPage: true,
    });
  });
});

// =============================================================================
// Test Suite: Error Handling & Edge Cases
// =============================================================================

test.describe('HITL Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should handle no pending approvals gracefully', async ({ page }) => {
    // Given: No pending approvals exist
    await page.route('**/api/approvals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await navigateToApprovals(page);

    // Then: I see an empty state message
    await expect(page.getByText(/no.*pending|nothing.*review|all.*caught.*up/i)).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-empty-state.png',
      fullPage: true,
    });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Given: API returns an error
    await page.route('**/api/approvals*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await navigateToApprovals(page);

    // Then: I see an error message
    await expect(page.getByText(/error|failed|try.*again/i)).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-error-state.png',
      fullPage: true,
    });
  });

  test('should handle stale approval submission', async ({ page }) => {
    await mockHITLRequest(page, CHECKPOINT_TYPES.approve_founders_brief);

    // Mock a conflict error on submission
    await page.route('**/api/hitl/approve', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Approval already processed',
          code: 'ALREADY_APPROVED',
        }),
      });
    });

    await navigateToApprovals(page);

    const card = page.locator('[data-testid="approval-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    const approveButton = page.getByRole('button', { name: /approve/i });
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await approveButton.click();

    // Then: I see appropriate feedback
    await expect(page.getByText(/already|processed|conflict/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/hitl-conflict-error.png',
      fullPage: true,
    });
  });
});
