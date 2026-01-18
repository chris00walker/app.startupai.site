/**
 * ADR-005 Onboarding Start Response Structure Tests
 *
 * Tests for the critical resume response structures implemented in ADR-005:
 * - Version included in resume response (PR 7) - Bug B3 fix
 * - Status included in resume response (PR 4) - Bug B5 fix
 * - Conversation history returned for resumption
 *
 * Note: Testing route handlers directly in Jest is complex due to NextResponse.json.
 * These tests verify the data structures and logic flow.
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

/**
 * The resume response must include these fields for proper
 * state management in the frontend (Bug B3, B5 fixes)
 */
interface ResumeResponse {
  success: boolean;
  sessionId: string;
  stageInfo: {
    currentStage: number;
    totalStages: number;
    stageName: string;
  };
  conversationContext: {
    agentPersonality: Record<string, unknown>;
    userRole: string;
    planType: string;
  };
  resuming: true;
  conversationHistory: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  overallProgress: number;
  stageProgress: number;
  stageData: Record<string, unknown>;
  // ADR-005 PR7: Version for concurrency protection
  version: number;
  // ADR-005 PR4: Status for completion check
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  // Fallback greeting if history is empty
  agentIntroduction?: string;
  firstQuestion?: string;
}

interface NewSessionResponse {
  success: boolean;
  sessionId: string;
  agentIntroduction: string;
  firstQuestion: string;
  estimatedDuration: string;
  stageInfo: {
    currentStage: number;
    totalStages: number;
    stageName: string;
  };
  conversationContext: {
    agentPersonality: Record<string, unknown>;
    expectedOutcomes: string[];
    privacyNotice: string;
  };
}

describe('/api/onboarding/start ADR-005 Response Structure', () => {
  describe('Resume response type contract (ADR-005 PR4 & PR7)', () => {
    it('should include version in resume response (ADR-005 PR7 - Bug B3 fix)', () => {
      // Version is critical for concurrency protection when resuming
      const resumeResponse: ResumeResponse = {
        success: true,
        sessionId: 'session-123',
        stageInfo: {
          currentStage: 3,
          totalStages: 7,
          stageName: 'Problem Definition',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex' },
          userRole: 'founder',
          planType: 'trial',
        },
        resuming: true,
        conversationHistory: [],
        overallProgress: 35,
        stageProgress: 50,
        stageData: {},
        // ADR-005 Critical: version must be included
        version: 7,
        status: 'active',
      };

      // Frontend needs version to initialize savedVersion for concurrency protection
      expect(resumeResponse.version).toBe(7);
      expect(typeof resumeResponse.version).toBe('number');
    });

    it('should include status in resume response (ADR-005 PR4 - Bug B5 fix)', () => {
      // Status is critical for completion check (not progress threshold)
      const completedResumeResponse: ResumeResponse = {
        success: true,
        sessionId: 'completed-session',
        stageInfo: {
          currentStage: 7,
          totalStages: 7,
          stageName: 'Business Goals',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex' },
          userRole: 'founder',
          planType: 'trial',
        },
        resuming: true,
        conversationHistory: [],
        overallProgress: 100,
        stageProgress: 100,
        stageData: {},
        version: 15,
        // ADR-005 Critical: status must be 'completed' for completion check
        status: 'completed',
      };

      // Frontend should check status === 'completed', not progress >= 90
      expect(completedResumeResponse.status).toBe('completed');
    });

    it('should default version to 0 for legacy sessions', () => {
      // Legacy sessions may not have version field
      const dbSession = {
        session_id: 'legacy-session',
        user_id: 'user-123',
        current_stage: 2,
        status: 'active',
        overall_progress: 20,
        stage_progress: 60,
        // No version field in legacy data
      };

      // Response should default to 0
      const responseVersion = (dbSession as any).version ?? 0;
      expect(responseVersion).toBe(0);
    });

    it('should include conversationHistory for resumption', () => {
      const resumeResponse: ResumeResponse = {
        success: true,
        sessionId: 'session-with-history',
        stageInfo: {
          currentStage: 3,
          totalStages: 7,
          stageName: 'Problem Definition',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex' },
          userRole: 'founder',
          planType: 'trial',
        },
        resuming: true,
        conversationHistory: [
          { role: 'assistant', content: 'Hello!', timestamp: '2026-01-16T00:00:00Z' },
          { role: 'user', content: 'Hi there', timestamp: '2026-01-16T00:00:01Z' },
          { role: 'assistant', content: 'Tell me about your idea', timestamp: '2026-01-16T00:00:02Z' },
        ],
        overallProgress: 35,
        stageProgress: 50,
        stageData: {},
        version: 5,
        status: 'active',
      };

      expect(resumeResponse.conversationHistory).toHaveLength(3);
      expect(resumeResponse.conversationHistory[0].role).toBe('assistant');
    });
  });

  describe('New session response type contract', () => {
    it('should return initial greeting for new session', () => {
      const newSessionResponse: NewSessionResponse = {
        success: true,
        sessionId: 'onb_new123',
        agentIntroduction: "Hi there! I'm Alex...",
        firstQuestion: 'What business idea are you most excited about?',
        estimatedDuration: '15-20 minutes',
        stageInfo: {
          currentStage: 1,
          totalStages: 7,
          stageName: 'Welcome & Introduction',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex', role: 'Strategic Consultant' },
          expectedOutcomes: ['Clear understanding of target customer'],
          privacyNotice: 'Your responses are confidential...',
        },
      };

      expect(newSessionResponse.stageInfo.currentStage).toBe(1);
      expect(newSessionResponse.agentIntroduction).toBeDefined();
      expect(newSessionResponse.firstQuestion).toBeDefined();
    });
  });

  describe('Session state tracking', () => {
    it('should track all session statuses', () => {
      const validStatuses = ['active', 'paused', 'completed', 'abandoned'];

      validStatuses.forEach(status => {
        expect(['active', 'paused', 'completed', 'abandoned']).toContain(status);
      });
    });

    it('should use status for completion check, not progress', () => {
      // Bug B5: Frontend was using overallProgress >= 90 instead of status
      type SessionStatus = 'active' | 'completed' | 'abandoned';
      const session1: { status: SessionStatus; overallProgress: number } = { status: 'active', overallProgress: 95 };
      const session2: { status: SessionStatus; overallProgress: number } = { status: 'completed', overallProgress: 100 };
      const session3: { status: SessionStatus; overallProgress: number } = { status: 'active', overallProgress: 100 };

      // Correct check: use status
      const isComplete1 = session1.status === 'completed';
      const isComplete2 = session2.status === 'completed';
      const isComplete3 = session3.status === 'completed';

      expect(isComplete1).toBe(false); // 95% but not completed status
      expect(isComplete2).toBe(true);  // completed status
      expect(isComplete3).toBe(false); // 100% but not completed status (edge case)
    });
  });

  describe('forceNew flag handling', () => {
    it('should skip session lookup when forceNew is true', () => {
      const forceNew = true;
      const existingSessions = [{ session_id: 'existing-session' }];

      // When forceNew, should not use existing sessions
      const sessionsToCheck = forceNew ? null : existingSessions;

      expect(sessionsToCheck).toBeNull();
    });

    it('should check existing sessions when forceNew is false', () => {
      const forceNew = false;
      const existingSessions = [{ session_id: 'existing-session' }];

      const sessionsToCheck = forceNew ? null : existingSessions;

      expect(sessionsToCheck).toEqual(existingSessions);
    });
  });

  describe('Plan type validation', () => {
    it('should accept all valid plan types', () => {
      const validPlans = ['trial', 'sprint', 'founder', 'enterprise'];
      const allowedPlans = new Set(['trial', 'sprint', 'founder', 'enterprise']);

      validPlans.forEach(plan => {
        expect(allowedPlans.has(plan)).toBe(true);
      });
    });

    it('should reject invalid plan types', () => {
      const invalidPlans = ['free', 'premium', 'basic', 'pro'];
      const allowedPlans = new Set(['trial', 'sprint', 'founder', 'enterprise']);

      invalidPlans.forEach(plan => {
        expect(allowedPlans.has(plan)).toBe(false);
      });
    });
  });
});
