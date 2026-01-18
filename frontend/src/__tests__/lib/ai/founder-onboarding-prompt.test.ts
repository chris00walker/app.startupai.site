/**
 * Onboarding Prompt Content Tests
 *
 * Tests that the onboarding prompt includes proper team awareness,
 * stage information, and Alex's personality configuration.
 */

import {
  FOUNDER_SYSTEM_PROMPT,
  FOUNDER_INITIAL_GREETING,
  FOUNDER_ONBOARDING_STAGES,
  getFounderStageInfo,
  getFounderStageSystemContext,
} from '@/lib/ai/founder-onboarding-prompt';

describe('FOUNDER_INITIAL_GREETING', () => {
  it('should mention Sage as Chief Strategy Officer', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain('Sage');
    expect(FOUNDER_INITIAL_GREETING).toContain('Chief Strategy Officer');
  });

  it('should mention AI leadership team', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain('AI leadership team');
  });

  it('should mention handoff to team for analysis', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain('hand everything off to Sage');
  });

  it('should mention Fortune 500-quality analysis', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain('Fortune 500-quality');
  });

  it('should introduce Alex by name', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain("I'm Alex");
  });

  it('should mention strategic conversation purpose', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain('Strategic Business Consultant');
  });

  it('should end with the opening question about business idea', () => {
    expect(FOUNDER_INITIAL_GREETING).toContain('What business idea are you most excited about');
  });
});

describe('FOUNDER_SYSTEM_PROMPT', () => {
  /**
   * Two-Pass Architecture Tests
   *
   * The prompt should NOT mention tools. Stage progression is now handled
   * by deterministic backend assessment (Pass 2) after each LLM response.
   *
   * @see Plan: /home/chris/.claude/plans/async-mixing-ritchie.md
   */
  describe('no tools (backend handles assessment)', () => {
    it('should NOT mention assessQuality tool', () => {
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('assessQuality');
    });

    it('should NOT mention advanceStage tool', () => {
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('advanceStage');
    });

    it('should NOT mention completeOnboarding tool', () => {
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('completeOnboarding');
    });

    it('should NOT contain tool execution instructions', () => {
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('Tool Execution');
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('FIRST**: Call appropriate tools');
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('THEN**: Write a conversational response');
    });
  });

  describe('team context section', () => {
    it('should contain team context section', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('## Your Team Context');
    });

    it('should mention Sage as supervisor', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('Sage (Chief Strategy Officer)');
      expect(FOUNDER_SYSTEM_PROMPT).toContain('Your supervisor');
    });

    it('should include all 6 AI founders', () => {
      const founders = [
        'Sage',
        'Forge',
        'Pulse',
        'Compass',
        'Guardian',
        'Ledger',
      ];

      founders.forEach((founder) => {
        expect(FOUNDER_SYSTEM_PROMPT).toContain(founder);
      });
    });

    it('should include founder roles', () => {
      const roles = [
        'Chief Strategy Officer', // Sage
        'CTO',                    // Forge
        'CGO',                    // Pulse (Growth)
        'CPO',                    // Compass
        'CCO',                    // Guardian
        'CFO',                    // Ledger
      ];

      roles.forEach((role) => {
        expect(FOUNDER_SYSTEM_PROMPT).toContain(role);
      });
    });

    it('should include example phrases for mentioning team', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain(
        "I'll pass this to Sage and our AI leadership team"
      );
    });

    it('should caution against over-mentioning team', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('DO NOT over-mention the team');
    });
  });

  describe('Alex personality', () => {
    it('should define Alex as the consultant name', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('**Name**: Alex');
    });

    it('should define role as Strategic Business Consultant', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('**Role**: Strategic Business Consultant');
    });

    it('should define tone as friendly and professional', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('Friendly, encouraging, but professionally direct');
    });

    it('should include Lean Startup expertise', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('Lean Startup');
    });
  });

  describe('conversation structure', () => {
    it('should define 7 stages', () => {
      expect(FOUNDER_SYSTEM_PROMPT).toContain('7 stages');
    });

    it('should list all stage names', () => {
      const stageNames = [
        'Welcome & Introduction',
        'Customer Discovery',
        'Problem Definition',
        'Solution Validation',
        'Competitive Analysis',
        'Resources & Constraints',
        'Goals & Next Steps',
      ];

      stageNames.forEach((name) => {
        expect(FOUNDER_SYSTEM_PROMPT).toContain(name);
      });
    });

    it('should NOT mention any tools (backend handles progression)', () => {
      // Two-pass architecture: LLM handles conversation, backend handles assessment
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('assessQuality');
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('advanceStage');
      expect(FOUNDER_SYSTEM_PROMPT).not.toContain('completeOnboarding');
    });
  });
});

describe('FOUNDER_ONBOARDING_STAGES', () => {
  it('should have exactly 7 stages', () => {
    expect(FOUNDER_ONBOARDING_STAGES).toHaveLength(7);
  });

  it('should have stages numbered 1 through 7', () => {
    const stageNumbers = FOUNDER_ONBOARDING_STAGES.map((s) => s.stage);
    expect(stageNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should have all required properties for each stage', () => {
    FOUNDER_ONBOARDING_STAGES.forEach((stage) => {
      expect(stage).toHaveProperty('stage');
      expect(stage).toHaveProperty('name');
      expect(stage).toHaveProperty('description');
      expect(stage).toHaveProperty('objective');
      expect(stage).toHaveProperty('keyQuestions');
      expect(stage).toHaveProperty('dataToCollect');
      expect(stage).toHaveProperty('progressThreshold');
    });
  });

  it('should have progress thresholds between 0 and 1', () => {
    FOUNDER_ONBOARDING_STAGES.forEach((stage) => {
      expect(stage.progressThreshold).toBeGreaterThan(0);
      expect(stage.progressThreshold).toBeLessThanOrEqual(1);
    });
  });

  it('should have at least 2 key questions per stage', () => {
    FOUNDER_ONBOARDING_STAGES.forEach((stage) => {
      expect(stage.keyQuestions.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should have at least 2 data points to collect per stage', () => {
    FOUNDER_ONBOARDING_STAGES.forEach((stage) => {
      expect(stage.dataToCollect.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('getFounderStageInfo', () => {
  it('should return correct stage for valid stage number', () => {
    const stage1 = getFounderStageInfo(1);
    expect(stage1.name).toBe('Welcome & Introduction');

    const stage4 = getFounderStageInfo(4);
    expect(stage4.name).toBe('Solution Validation');

    const stage7 = getFounderStageInfo(7);
    expect(stage7.name).toBe('Goals & Next Steps');
  });

  it('should return first stage for invalid stage number', () => {
    const invalid = getFounderStageInfo(99);
    expect(invalid.stage).toBe(1);
    expect(invalid.name).toBe('Welcome & Introduction');
  });

  it('should return first stage for stage 0', () => {
    const stage0 = getFounderStageInfo(0);
    expect(stage0.stage).toBe(1);
  });

  it('should return first stage for negative numbers', () => {
    const negative = getFounderStageInfo(-1);
    expect(negative.stage).toBe(1);
  });
});

describe('getFounderStageSystemContext', () => {
  it('should include current stage name and number', () => {
    const context = getFounderStageSystemContext(3, {});
    expect(context).toContain('Problem Definition');
    expect(context).toContain('Stage 3/7');
  });

  it('should include stage objective', () => {
    const context = getFounderStageSystemContext(2, {});
    expect(context).toContain('Identify and validate target customer segments');
  });

  it('should include data to collect', () => {
    const context = getFounderStageSystemContext(1, {});
    expect(context).toContain('business_concept');
    expect(context).toContain('inspiration');
  });

  it('should show already collected data', () => {
    const collectedData = {
      business_concept: 'A SaaS tool for managing customer relationships',
      inspiration: 'Personal experience with scattered customer data',
    };
    const context = getFounderStageSystemContext(1, collectedData);
    expect(context).toContain('business_concept: A SaaS tool');
    expect(context).toContain('inspiration: Personal experience');
  });

  it('should truncate long collected data values', () => {
    const longValue = 'A'.repeat(200);
    const collectedData = {
      business_concept: longValue,
    };
    const context = getFounderStageSystemContext(1, collectedData);
    // Should be truncated to ~100 chars
    expect(context).not.toContain(longValue);
    // Context includes stage info, key questions, and instructions, so just verify truncation happened
    expect(context).toContain('business_concept: ' + 'A'.repeat(100));
  });

  it('should identify missing data points', () => {
    const collectedData = {
      business_concept: 'Test idea',
    };
    const context = getFounderStageSystemContext(1, collectedData);
    expect(context).toContain('inspiration');
    expect(context).toContain('current_stage');
    expect(context).toContain('founder_background');
  });

  it('should show "None - all topics covered!" when all data collected', () => {
    const collectedData = {
      business_concept: 'Test',
      inspiration: 'Test',
      current_stage: 'Test',
      founder_background: 'Test',
    };
    const context = getFounderStageSystemContext(1, collectedData);
    expect(context).toContain('None - all topics covered!');
  });
});
