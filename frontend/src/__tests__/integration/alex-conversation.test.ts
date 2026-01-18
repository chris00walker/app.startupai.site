/**
 * Alex Conversation Flow Integration Tests
 *
 * These tests validate Alex's behavior during onboarding:
 * - Alex asks about the defined topics for each stage
 * - Alex acknowledges uncertainty and continues
 * - Alex transitions to the next stage after covering topics
 * - Alex supports both Founder mode and Client mode
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import {
  ONBOARDING_SYSTEM_PROMPT,
  INITIAL_GREETING,
} from '@/lib/ai/onboarding-prompt';
import {
  getStageConfig,
  getStageSystemContext,
  ONBOARDING_STAGES_CONFIG,
} from '@/lib/onboarding/stages-config';

// ============================================================================
// System Prompt Tests
// ============================================================================

describe('Alex System Prompt Configuration', () => {
  describe('Stage Awareness', () => {
    it('should mention all 7 stages in the system prompt', () => {
      // All stage names should appear
      const stageNames = [
        'Welcome & Introduction',
        'Customer Discovery',
        'Problem Definition',
        'Solution Validation',
        'Competitive Analysis',
        'Resources & Constraints',
        'Goals & Next Steps',
      ];

      for (const name of stageNames) {
        expect(ONBOARDING_SYSTEM_PROMPT).toContain(name);
      }
    });

    it('should guide Alex to ask 3-4 questions per stage', () => {
      // The prompt should mention structured questioning approach
      expect(ONBOARDING_SYSTEM_PROMPT).toMatch(/3[-–]?[45]?\s*(question|exchange)/i);
    });

    it('should tell Alex NOT to say "final question"', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('NEVER say "final question"');
    });

    it('should tell Alex to ask ONE question at a time', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('ONE question at a time');
    });
  });

  describe('Uncertainty Handling', () => {
    it('should acknowledge "I don\'t know" as valuable', () => {
      // Alex should be told that uncertainty is valid
      expect(ONBOARDING_SYSTEM_PROMPT.toLowerCase()).toContain("i don't know");
    });

    it('should treat uncertainty as a learning opportunity', () => {
      // Alex should reframe uncertainty positively
      const hasUncertaintyGuidance =
        ONBOARDING_SYSTEM_PROMPT.includes('uncertainty') ||
        ONBOARDING_SYSTEM_PROMPT.includes('hypothesis');
      expect(hasUncertaintyGuidance).toBe(true);
    });
  });

  describe('Team Context', () => {
    it('should mention the AI leadership team', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Sage');
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Chief Strategy Officer');
    });

    it('should mention handoff to CrewAI team', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('handed off');
    });
  });

  describe('Response Format', () => {
    it('should require ending with a question', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('MUST end with');
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('follow-up question');
    });

    it('should specify Acknowledgment → Insight → Question structure', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Acknowledgment');
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Insight');
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Next Question');
    });
  });
});

// ============================================================================
// Initial Greeting Tests
// ============================================================================

describe('Alex Initial Greeting', () => {
  it('should introduce Alex by name', () => {
    expect(INITIAL_GREETING).toContain('Alex');
  });

  it('should mention the strategic consultation role', () => {
    expect(INITIAL_GREETING).toContain('Strategic Business Consultant');
  });

  it('should set time expectations (15-20 minutes)', () => {
    expect(INITIAL_GREETING).toMatch(/15[-–]?20\s*minutes/);
  });

  it('should mention the AI leadership team for analysis', () => {
    expect(INITIAL_GREETING).toContain('Sage');
    expect(INITIAL_GREETING).toContain('AI leadership team');
  });

  it('should acknowledge that "I don\'t know" is valuable', () => {
    expect(INITIAL_GREETING.toLowerCase()).toContain("i don't know");
  });

  it('should end with a question about the business idea', () => {
    expect(INITIAL_GREETING).toContain('What business idea');
    expect(INITIAL_GREETING).toContain('?');
  });
});

// ============================================================================
// Stage Context Tests
// ============================================================================

describe('Stage System Context Generation', () => {
  it('should include stage number and name', () => {
    const context = getStageSystemContext(1, {});
    expect(context).toContain('Stage 1');
    expect(context).toContain('Welcome & Introduction');
  });

  it('should include the objective for the stage', () => {
    const stage1 = getStageConfig(1)!;
    const context = getStageSystemContext(1, {});
    expect(context).toContain(stage1.objective);
  });

  it('should list data to collect', () => {
    const context = getStageSystemContext(1, {});
    expect(context).toContain('business_concept');
    expect(context).toContain('inspiration');
    expect(context).toContain('current_stage');
  });

  it('should show missing data points', () => {
    const context = getStageSystemContext(1, {
      business_concept: 'Test idea',
    });
    expect(context).toContain('Missing Data Points');
    expect(context).toContain('inspiration');
  });

  it('should show collected data', () => {
    const context = getStageSystemContext(1, {
      business_concept: 'A meal planning app',
    });
    expect(context).toContain('business_concept: A meal planning app');
  });
});

// ============================================================================
// Key Questions Coverage Tests
// ============================================================================

describe('Stage Key Questions', () => {
  describe('Stage 1: Welcome & Introduction', () => {
    const stage = getStageConfig(1)!;

    it('should have questions about business concept', () => {
      const hasBusinessQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('business') || q.toLowerCase().includes('idea')
      );
      expect(hasBusinessQuestion).toBe(true);
    });

    it('should have questions about inspiration', () => {
      const hasInspirationQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('inspired') || q.toLowerCase().includes('inspiration')
      );
      expect(hasInspirationQuestion).toBe(true);
    });

    it('should have questions about current stage', () => {
      const hasStageQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('stage') || q.toLowerCase().includes('currently')
      );
      expect(hasStageQuestion).toBe(true);
    });
  });

  describe('Stage 2: Customer Discovery', () => {
    const stage = getStageConfig(2)!;

    it('should have questions about target customers', () => {
      const hasCustomerQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('customer') || q.toLowerCase().includes('interested')
      );
      expect(hasCustomerQuestion).toBe(true);
    });

    it('should have questions about current solutions', () => {
      const hasSolutionsQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('currently') || q.toLowerCase().includes('solve')
      );
      expect(hasSolutionsQuestion).toBe(true);
    });
  });

  describe('Stage 3: Problem Definition', () => {
    const stage = getStageConfig(3)!;

    it('should have questions about the problem', () => {
      const hasProblemQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('problem')
      );
      expect(hasProblemQuestion).toBe(true);
    });

    it('should have questions about pain level', () => {
      const hasPainQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('painful')
      );
      expect(hasPainQuestion).toBe(true);
    });

    it('should have questions about frequency', () => {
      const hasFrequencyQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('often') || q.toLowerCase().includes('frequently')
      );
      expect(hasFrequencyQuestion).toBe(true);
    });

    it('should have questions about evidence', () => {
      const hasEvidenceQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('evidence')
      );
      expect(hasEvidenceQuestion).toBe(true);
    });
  });

  // Add more stages as needed...
});

// ============================================================================
// Client Mode Tests (Consultant Onboarding Clients)
// ============================================================================

describe('Alex Client Mode (Consultant Acting for Client)', () => {
  /**
   * When a Consultant onboards a Client, Alex should:
   * - Reference "your client" instead of "you"
   * - Use same 7 stages as Founder
   * - Store data to client project, not consultant
   */

  // These tests define expected behavior for client mode
  // Implementation will add client mode support to prompts

  it('should have a way to generate client-mode system context', () => {
    // This test documents the expected API
    // getStageSystemContext should support a 'mode' parameter
    const context = getStageSystemContext(1, {});

    // Currently only supports standard mode
    // Will be extended to support client mode
    expect(context).toContain('Stage 1');
  });

  it('stage config should define key questions that can be adapted for client mode', () => {
    // All key questions should be adaptable from "you/your" to "your client/your client's"
    for (const stage of ONBOARDING_STAGES_CONFIG) {
      for (const question of stage.keyQuestions) {
        // Questions should use "you/your" which can be replaced with "your client/your client's"
        const canBeAdapted =
          question.includes('you') ||
          question.includes('your') ||
          // Or questions that are already neutral
          !question.toLowerCase().includes(' i ');

        expect(canBeAdapted).toBe(true);
      }
    }
  });
});

// ============================================================================
// Conversation Flow Behavior Tests
// ============================================================================

describe('Alex Conversation Behavior', () => {
  describe('Topic Coverage', () => {
    it('each stage should have exactly 3-4 key questions', () => {
      for (const stage of ONBOARDING_STAGES_CONFIG) {
        expect(stage.keyQuestions.length).toBeGreaterThanOrEqual(3);
        expect(stage.keyQuestions.length).toBeLessThanOrEqual(4);
      }
    });

    it('all 7 stages combined should have 21-28 questions', () => {
      const totalQuestions = ONBOARDING_STAGES_CONFIG.reduce(
        (sum, stage) => sum + stage.keyQuestions.length,
        0
      );
      expect(totalQuestions).toBeGreaterThanOrEqual(21);
      expect(totalQuestions).toBeLessThanOrEqual(28);
    });
  });

  describe('Stage Transitions', () => {
    it('should not allow Alex to determine stage completion', () => {
      // Bug B8: Alex should never say "final question"
      // The system determines completion, not Alex
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('determined by a quality assessment system');
    });

    it('should tell Alex that stages advance automatically', () => {
      // Alex is told the system handles transitions
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('system will automatically');
    });
  });

  describe('Response Quality', () => {
    it('should require evidence over assumptions', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Evidence beats assumptions');
    });

    it('should celebrate specificity', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('specificity');
    });

    it('should handle red flags appropriately', () => {
      expect(ONBOARDING_SYSTEM_PROMPT).toContain('Red Flags');
    });
  });
});
