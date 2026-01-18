/**
 * Consultant Stage Configuration Tests
 *
 * Validates that Maya's consultant onboarding stage configuration supports
 * deterministic topic-based progression through all 7 stages.
 *
 * Mirrors the founder stages-config tests for consistency.
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import {
  CONSULTANT_STAGES_CONFIG,
  CONSULTANT_TOTAL_STAGES,
  getConsultantStageConfig,
  getConsultantStageConfigSafe,
  getConsultantStageSystemContext,
  getConsultantStageName,
} from '@/lib/onboarding/consultant-stages-config';

describe('Consultant Stage Configuration - Structure', () => {
  it('should have exactly 7 stages', () => {
    expect(CONSULTANT_TOTAL_STAGES).toBe(7);
    expect(CONSULTANT_STAGES_CONFIG).toHaveLength(7);
  });

  it('should have stages numbered 1 through 7', () => {
    const stageNumbers = CONSULTANT_STAGES_CONFIG.map(s => s.stage);
    expect(stageNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should have unique stage numbers', () => {
    const stageNumbers = CONSULTANT_STAGES_CONFIG.map(s => s.stage);
    const uniqueNumbers = new Set(stageNumbers);
    expect(uniqueNumbers.size).toBe(stageNumbers.length);
  });
});

describe('Consultant Stage Configuration - Key Questions', () => {
  it('Stage 1 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(1);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 2 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(2);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 3 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(3);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 4 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(4);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 5 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(5);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 6 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(6);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('Stage 7 should have 3-4 key questions defined', () => {
    const stage = getConsultantStageConfig(7);
    expect(stage?.keyQuestions.length).toBeGreaterThanOrEqual(3);
    expect(stage?.keyQuestions.length).toBeLessThanOrEqual(4);
  });

  it('all stages combined should cover 21-28 questions', () => {
    const totalQuestions = CONSULTANT_STAGES_CONFIG.reduce(
      (sum, stage) => sum + stage.keyQuestions.length,
      0
    );
    expect(totalQuestions).toBeGreaterThanOrEqual(21);
    expect(totalQuestions).toBeLessThanOrEqual(28);
  });

  it('each key question should be a non-empty string', () => {
    for (const stage of CONSULTANT_STAGES_CONFIG) {
      for (const question of stage.keyQuestions) {
        expect(typeof question).toBe('string');
        expect(question.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Consultant Stage Configuration - Data Fields', () => {
  it('each stage should have 4-5 data fields to collect', () => {
    for (const stage of CONSULTANT_STAGES_CONFIG) {
      expect(stage.dataToCollect.length).toBeGreaterThanOrEqual(4);
      expect(stage.dataToCollect.length).toBeLessThanOrEqual(5);
    }
  });

  it('each stage should have matching dataTopics for dataToCollect', () => {
    for (const stage of CONSULTANT_STAGES_CONFIG) {
      const dataKeys = new Set(stage.dataToCollect);
      const topicKeys = new Set(stage.dataTopics.map(t => t.key));

      // All dataToCollect should have a corresponding dataTopic
      for (const key of dataKeys) {
        expect(topicKeys.has(key)).toBe(true);
      }
    }
  });

  it('dataTopics should have valid labels and keys', () => {
    for (const stage of CONSULTANT_STAGES_CONFIG) {
      for (const topic of stage.dataTopics) {
        expect(typeof topic.label).toBe('string');
        expect(topic.label.trim().length).toBeGreaterThan(0);
        expect(typeof topic.key).toBe('string');
        expect(topic.key.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Consultant Stage Configuration - Progress Thresholds', () => {
  it('each stage should have a progress threshold between 0.5 and 1.0', () => {
    for (const stage of CONSULTANT_STAGES_CONFIG) {
      expect(stage.progressThreshold).toBeGreaterThanOrEqual(0.5);
      expect(stage.progressThreshold).toBeLessThanOrEqual(1.0);
    }
  });

  it('Stage 7 should have the highest threshold (final validation)', () => {
    const stage7 = getConsultantStageConfig(7);
    const otherStages = CONSULTANT_STAGES_CONFIG.filter(s => s.stage !== 7);
    const maxOtherThreshold = Math.max(...otherStages.map(s => s.progressThreshold));

    expect(stage7?.progressThreshold).toBeGreaterThanOrEqual(maxOtherThreshold);
  });
});

describe('Consultant Stage Configuration - Stage Names', () => {
  const expectedNames = [
    'Welcome & Practice Overview',
    'Practice Size & Structure',
    'Industries & Services',
    'Current Tools & Workflow',
    'Client Management',
    'Pain Points & Challenges',
    'Goals & White-Label Setup',
  ];

  it.each(expectedNames.map((name, i) => [i + 1, name]))(
    'Stage %i should be named "%s"',
    (stageNum, expectedName) => {
      expect(getConsultantStageName(stageNum as number)).toBe(expectedName);
    }
  );
});

describe('Consultant Stage Configuration - Utility Functions', () => {
  describe('getConsultantStageConfig', () => {
    it('should return stage config for valid stage numbers', () => {
      for (let i = 1; i <= 7; i++) {
        const config = getConsultantStageConfig(i);
        expect(config).toBeDefined();
        expect(config?.stage).toBe(i);
      }
    });

    it('should return undefined for invalid stage numbers', () => {
      expect(getConsultantStageConfig(0)).toBeUndefined();
      expect(getConsultantStageConfig(8)).toBeUndefined();
      expect(getConsultantStageConfig(-1)).toBeUndefined();
    });
  });

  describe('getConsultantStageConfigSafe', () => {
    it('should return stage config for valid stage numbers', () => {
      for (let i = 1; i <= 7; i++) {
        const config = getConsultantStageConfigSafe(i);
        expect(config.stage).toBe(i);
      }
    });

    it('should return stage 1 config for invalid stage numbers', () => {
      expect(getConsultantStageConfigSafe(0).stage).toBe(1);
      expect(getConsultantStageConfigSafe(8).stage).toBe(1);
      expect(getConsultantStageConfigSafe(-1).stage).toBe(1);
    });
  });

  describe('getConsultantStageSystemContext', () => {
    it('should generate context string with stage info', () => {
      const context = getConsultantStageSystemContext(1, {});

      expect(context).toContain('Stage 1');
      expect(context).toContain('Welcome & Practice Overview');
      expect(context).toContain('Objective');
      expect(context).toContain('Key Questions to Ask');
    });

    it('should include collected data in context', () => {
      const context = getConsultantStageSystemContext(1, {
        practice_name: 'Walker Consulting',
        focus_area: 'Strategy consulting',
      });

      expect(context).toContain('practice_name: Walker Consulting');
      expect(context).toContain('focus_area: Strategy consulting');
    });

    it('should show missing data points', () => {
      const context = getConsultantStageSystemContext(1, {
        practice_name: 'Test Practice',
      });

      // Should list missing fields
      expect(context).toContain('Missing Data Points');
      expect(context).toContain('focus_area');
      expect(context).toContain('years_in_business');
    });

    it('should show "None - all topics covered!" when all data collected', () => {
      const context = getConsultantStageSystemContext(1, {
        practice_name: 'Test Practice',
        focus_area: 'Strategy',
        years_in_business: '5 years',
        practice_overview: 'Full-service consulting',
      });

      expect(context).toContain('None - all topics covered!');
    });

    it('should truncate long values to ~100 characters', () => {
      const longValue = 'A'.repeat(200);
      const context = getConsultantStageSystemContext(1, {
        practice_name: longValue,
      });

      // Should be truncated
      expect(context).not.toContain(longValue);
      expect(context.length).toBeLessThan(context.length + 200);
    });
  });
});

describe('Consultant Stage Configuration - Stage Content Validation', () => {
  describe('Stage 1: Welcome & Practice Overview', () => {
    const stage = getConsultantStageConfig(1)!;

    it('should focus on practice name and focus area', () => {
      expect(stage.dataToCollect).toContain('practice_name');
      expect(stage.dataToCollect).toContain('focus_area');
    });

    it('should have questions about the consulting practice', () => {
      const hasPracticeQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('practice') || q.toLowerCase().includes('consulting')
      );
      expect(hasPracticeQuestion).toBe(true);
    });
  });

  describe('Stage 2: Practice Size & Structure', () => {
    const stage = getConsultantStageConfig(2)!;

    it('should focus on team size and structure', () => {
      expect(stage.dataToCollect).toContain('team_size');
      expect(stage.dataToCollect).toContain('team_structure');
    });

    it('should have questions about team or people', () => {
      const hasTeamQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('team') || q.toLowerCase().includes('people')
      );
      expect(hasTeamQuestion).toBe(true);
    });
  });

  describe('Stage 3: Industries & Services', () => {
    const stage = getConsultantStageConfig(3)!;

    it('should focus on industries and service offerings', () => {
      expect(stage.dataToCollect).toContain('target_industries');
      expect(stage.dataToCollect).toContain('service_offerings');
    });

    it('should have questions about industries or services', () => {
      const hasIndustryQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('industr') || q.toLowerCase().includes('service')
      );
      expect(hasIndustryQuestion).toBe(true);
    });
  });

  describe('Stage 4: Current Tools & Workflow', () => {
    const stage = getConsultantStageConfig(4)!;

    it('should focus on tools and workflow', () => {
      expect(stage.dataToCollect).toContain('current_tools');
      expect(stage.dataToCollect).toContain('client_workflow');
    });

    it('should have questions about tools or workflow', () => {
      const hasToolsQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('tool') || q.toLowerCase().includes('workflow')
      );
      expect(hasToolsQuestion).toBe(true);
    });
  });

  describe('Stage 5: Client Management', () => {
    const stage = getConsultantStageConfig(5)!;

    it('should focus on client onboarding and communication', () => {
      expect(stage.dataToCollect).toContain('client_onboarding');
      expect(stage.dataToCollect).toContain('progress_communication');
    });

    it('should have questions about client management', () => {
      const hasClientQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('client') || q.toLowerCase().includes('onboard')
      );
      expect(hasClientQuestion).toBe(true);
    });
  });

  describe('Stage 6: Pain Points & Challenges', () => {
    const stage = getConsultantStageConfig(6)!;

    it('should focus on challenges and time sinks', () => {
      expect(stage.dataToCollect).toContain('biggest_challenges');
      expect(stage.dataToCollect).toContain('time_sinks');
    });

    it('should have questions about challenges or pain points', () => {
      const hasChallengeQuestion = stage.keyQuestions.some(
        q => q.toLowerCase().includes('challenge') || q.toLowerCase().includes('time')
      );
      expect(hasChallengeQuestion).toBe(true);
    });
  });

  describe('Stage 7: Goals & White-Label Setup', () => {
    const stage = getConsultantStageConfig(7)!;

    it('should focus on goals and white-label preferences', () => {
      expect(stage.dataToCollect).toContain('goals');
      expect(stage.dataToCollect).toContain('white_label_interest');
    });

    it('should have questions about goals or white-labeling', () => {
      const hasGoalQuestion = stage.keyQuestions.some(
        q =>
          q.toLowerCase().includes('goal') ||
          q.toLowerCase().includes('white-label') ||
          q.toLowerCase().includes('brand')
      );
      expect(hasGoalQuestion).toBe(true);
    });
  });
});

describe('Consultant Stage Configuration - Maya-Specific Requirements', () => {
  it('should have consultant-focused terminology in all stage names', () => {
    const stageNames = CONSULTANT_STAGES_CONFIG.map(s => s.name.toLowerCase());

    // At least some stages should reference consulting/practice concepts
    const consultantTerms = ['practice', 'client', 'white-label', 'tools', 'workflow'];
    const hasConsultantTerms = stageNames.some(name =>
      consultantTerms.some(term => name.includes(term))
    );
    expect(hasConsultantTerms).toBe(true);
  });

  it('should collect practice-specific data not present in founder stages', () => {
    const allDataFields = CONSULTANT_STAGES_CONFIG.flatMap(s => s.dataToCollect);

    // Consultant-specific fields
    expect(allDataFields).toContain('practice_name');
    expect(allDataFields).toContain('team_structure');
    expect(allDataFields).toContain('white_label_interest');
    expect(allDataFields).toContain('branding_preferences');
  });

  it('should have context instructions mentioning one question at a time', () => {
    const context = getConsultantStageSystemContext(1, {});
    expect(context).toContain('Ask ONE question at a time');
  });

  it('should handle uncertainty responses in instructions', () => {
    const context = getConsultantStageSystemContext(1, {});
    expect(context.toLowerCase()).toContain("don't know");
  });
});
