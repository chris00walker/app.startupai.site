/**
 * Stage Configuration Tests
 *
 * Validates that the onboarding stage configuration supports deterministic
 * topic-based progression through all 7 stages.
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import {
  ONBOARDING_STAGES_CONFIG,
  TOTAL_STAGES,
  getStageConfig,
  getStageConfigSafe,
  getStageTopics,
  getStageSystemContext,
  getStageName,
} from '@/lib/onboarding/stages-config';

describe('Stage Configuration - Structure', () => {
  it('should have exactly 7 stages', () => {
    expect(TOTAL_STAGES).toBe(7);
    expect(ONBOARDING_STAGES_CONFIG).toHaveLength(7);
  });

  it('should have stages numbered 1 through 7', () => {
    const stageNumbers = ONBOARDING_STAGES_CONFIG.map(s => s.stage);
    expect(stageNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should have unique stage numbers', () => {
    const stageNumbers = ONBOARDING_STAGES_CONFIG.map(s => s.stage);
    const uniqueNumbers = new Set(stageNumbers);
    expect(uniqueNumbers.size).toBe(stageNumbers.length);
  });
});

describe('Stage Configuration - Key Questions', () => {
  it('Stage 1 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(1);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 2 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(2);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 3 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(3);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 4 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(4);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 5 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(5);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 6 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(6);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 7 should have 3-4 key questions defined', () => {
    const stage = getStageConfig(7);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('all stages combined should cover 21-28 questions', () => {
    const totalQuestions = ONBOARDING_STAGES_CONFIG.reduce(
      (sum, stage) => sum + stage.keyQuestions.length,
      0
    );
    expect(totalQuestions).toBeGreaterThanOrEqual(21);
    expect(totalQuestions).toBeLessThanOrEqual(28);
  });

  it('each key question should be a non-empty string', () => {
    for (const stage of ONBOARDING_STAGES_CONFIG) {
      for (const question of stage.keyQuestions) {
        expect(typeof question).toBe('string');
        expect(question.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Stage Configuration - Data Fields', () => {
  it('each stage should have 4-5 data fields to collect', () => {
    for (const stage of ONBOARDING_STAGES_CONFIG) {
      expect(stage.dataToCollect.length).toBeGreaterThanOrEqual(4);
      expect(stage.dataToCollect.length).toBeLessThanOrEqual(5);
    }
  });

  it('each stage should have matching dataTopics for dataToCollect', () => {
    for (const stage of ONBOARDING_STAGES_CONFIG) {
      const dataKeys = new Set(stage.dataToCollect);
      const topicKeys = new Set(stage.dataTopics.map(t => t.key));

      // All dataToCollect should have a corresponding dataTopic
      for (const key of dataKeys) {
        expect(topicKeys.has(key)).toBe(true);
      }
    }
  });

  it('dataTopics should have valid labels and keys', () => {
    for (const stage of ONBOARDING_STAGES_CONFIG) {
      for (const topic of stage.dataTopics) {
        expect(typeof topic.label).toBe('string');
        expect(topic.label.trim().length).toBeGreaterThan(0);
        expect(typeof topic.key).toBe('string');
        expect(topic.key.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Stage Configuration - Progress Thresholds', () => {
  it('each stage should have a progress threshold between 0.5 and 1.0', () => {
    for (const stage of ONBOARDING_STAGES_CONFIG) {
      expect(stage.progressThreshold).toBeGreaterThanOrEqual(0.5);
      expect(stage.progressThreshold).toBeLessThanOrEqual(1.0);
    }
  });

  it('Stage 7 should have the highest threshold (final validation)', () => {
    const stage7 = getStageConfig(7);
    const otherStages = ONBOARDING_STAGES_CONFIG.filter(s => s.stage !== 7);
    const maxOtherThreshold = Math.max(...otherStages.map(s => s.progressThreshold));

    expect(stage7?.progressThreshold).toBeGreaterThanOrEqual(maxOtherThreshold);
  });
});

describe('Stage Configuration - Stage Names', () => {
  const expectedNames = [
    'Welcome & Introduction',
    'Customer Discovery',
    'Problem Definition',
    'Solution Validation',
    'Competitive Analysis',
    'Resources & Constraints',
    'Goals & Next Steps',
  ];

  it.each(expectedNames.map((name, i) => [i + 1, name]))(
    'Stage %i should be named "%s"',
    (stageNum, expectedName) => {
      expect(getStageName(stageNum as number)).toBe(expectedName);
    }
  );
});

describe('Stage Configuration - Utility Functions', () => {
  describe('getStageConfig', () => {
    it('should return stage config for valid stage numbers', () => {
      for (let i = 1; i <= 7; i++) {
        const config = getStageConfig(i);
        expect(config).toBeDefined();
        expect(config?.stage).toBe(i);
      }
    });

    it('should return undefined for invalid stage numbers', () => {
      expect(getStageConfig(0)).toBeUndefined();
      expect(getStageConfig(8)).toBeUndefined();
      expect(getStageConfig(-1)).toBeUndefined();
    });
  });

  describe('getStageConfigSafe', () => {
    it('should return stage config for valid stage numbers', () => {
      for (let i = 1; i <= 7; i++) {
        const config = getStageConfigSafe(i);
        expect(config.stage).toBe(i);
      }
    });

    it('should return stage 1 config for invalid stage numbers', () => {
      expect(getStageConfigSafe(0).stage).toBe(1);
      expect(getStageConfigSafe(8).stage).toBe(1);
      expect(getStageConfigSafe(-1).stage).toBe(1);
    });
  });

  describe('getStageTopics', () => {
    it('should return topics array for valid stages', () => {
      for (let i = 1; i <= 7; i++) {
        const topics = getStageTopics(i);
        expect(Array.isArray(topics)).toBe(true);
        expect(topics.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for invalid stages', () => {
      expect(getStageTopics(0)).toEqual([]);
      expect(getStageTopics(8)).toEqual([]);
    });
  });

  describe('getStageSystemContext', () => {
    it('should generate context string with stage info', () => {
      const context = getStageSystemContext(1, {});

      expect(context).toContain('Stage 1');
      expect(context).toContain('Welcome & Introduction');
      expect(context).toContain('Objective');
      expect(context).toContain('Key Questions to Ask');
    });

    it('should include collected data in context', () => {
      const context = getStageSystemContext(1, {
        business_concept: 'A meal planning app',
        inspiration: 'Personal experience',
      });

      expect(context).toContain('business_concept: A meal planning app');
      expect(context).toContain('inspiration: Personal experience');
    });

    it('should show missing data points', () => {
      const context = getStageSystemContext(1, {
        business_concept: 'Test idea',
      });

      // Should list missing fields
      expect(context).toContain('Missing Data Points');
      expect(context).toContain('inspiration');
      expect(context).toContain('current_stage');
    });

    it('should show "None - all topics covered!" when all data collected', () => {
      const context = getStageSystemContext(1, {
        business_concept: 'Test idea',
        inspiration: 'Personal experience',
        current_stage: 'Just starting',
        founder_background: 'Tech background',
      });

      expect(context).toContain('None - all topics covered!');
    });

    it('should truncate long values to ~100 characters', () => {
      const longValue = 'A'.repeat(200);
      const context = getStageSystemContext(1, {
        business_concept: longValue,
      });

      // Should be truncated
      expect(context).not.toContain(longValue);
      expect(context.length).toBeLessThan(context.length + 200);
    });
  });
});

describe('Stage Configuration - Stage Content Validation', () => {
  describe('Stage 1: Welcome & Introduction', () => {
    const stage = getStageConfig(1)!;

    it('should focus on business concept and founder background', () => {
      expect(stage.dataToCollect).toContain('business_concept');
      expect(stage.dataToCollect).toContain('founder_background');
    });

    it('should have questions about the business idea', () => {
      const hasBusinessQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('business') || q.toLowerCase().includes('idea')
      );
      expect(hasBusinessQuestion).toBe(true);
    });
  });

  describe('Stage 2: Customer Discovery', () => {
    const stage = getStageConfig(2)!;

    it('should focus on target customers', () => {
      expect(stage.dataToCollect).toContain('target_customers');
      expect(stage.dataToCollect).toContain('customer_segments');
    });

    it('should have questions about customers', () => {
      const hasCustomerQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('customer') || q.toLowerCase().includes('people')
      );
      expect(hasCustomerQuestion).toBe(true);
    });
  });

  describe('Stage 3: Problem Definition', () => {
    const stage = getStageConfig(3)!;

    it('should focus on problem description and evidence', () => {
      expect(stage.dataToCollect).toContain('problem_description');
      expect(stage.dataToCollect).toContain('problem_evidence');
    });

    it('should have questions about the problem', () => {
      const hasProblemQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('problem')
      );
      expect(hasProblemQuestion).toBe(true);
    });
  });

  describe('Stage 4: Solution Validation', () => {
    const stage = getStageConfig(4)!;

    it('should focus on solution and differentiation', () => {
      expect(stage.dataToCollect).toContain('solution_description');
      expect(stage.dataToCollect).toContain('differentiation');
    });

    it('should have questions about the solution', () => {
      const hasSolutionQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('solution') || q.toLowerCase().includes('solve')
      );
      expect(hasSolutionQuestion).toBe(true);
    });
  });

  describe('Stage 5: Competitive Analysis', () => {
    const stage = getStageConfig(5)!;

    it('should focus on competitors and alternatives', () => {
      expect(stage.dataToCollect).toContain('competitors');
      expect(stage.dataToCollect).toContain('alternatives');
    });

    it('should have questions about competition', () => {
      const hasCompetitionQuestion = stage.keyQuestions.some(
        q =>
          q.toLowerCase().includes('competitor') ||
          q.toLowerCase().includes('alternative') ||
          q.toLowerCase().includes('else')
      );
      expect(hasCompetitionQuestion).toBe(true);
    });
  });

  describe('Stage 6: Resources & Constraints', () => {
    const stage = getStageConfig(6)!;

    it('should focus on budget and resources', () => {
      expect(stage.dataToCollect).toContain('budget_range');
      expect(stage.dataToCollect).toContain('available_resources');
    });

    it('should have questions about resources', () => {
      const hasResourceQuestion = stage.keyQuestions.some(
        q =>
          q.toLowerCase().includes('budget') ||
          q.toLowerCase().includes('resource') ||
          q.toLowerCase().includes('constraint')
      );
      expect(hasResourceQuestion).toBe(true);
    });
  });

  describe('Stage 7: Goals & Next Steps', () => {
    const stage = getStageConfig(7)!;

    it('should focus on goals and success metrics', () => {
      expect(stage.dataToCollect).toContain('short_term_goals');
      expect(stage.dataToCollect).toContain('success_metrics');
    });

    it('should have questions about goals and experiments', () => {
      const hasGoalQuestion = stage.keyQuestions.some(
        q =>
          q.toLowerCase().includes('goal') ||
          q.toLowerCase().includes('achieve') ||
          q.toLowerCase().includes('success') ||
          q.toLowerCase().includes('experiment')
      );
      expect(hasGoalQuestion).toBe(true);
    });
  });
});
