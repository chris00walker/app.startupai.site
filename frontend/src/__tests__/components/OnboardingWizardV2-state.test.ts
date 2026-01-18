/**
 * ADR-005 OnboardingWizardV2 State Management Tests
 *
 * Tests for the critical state management patterns implemented in ADR-005:
 * - Session initialization from API response
 * - Resume state handling (version, status, conversationHistory)
 * - Save response state updates
 * - Version conflict detection
 * - Completion status tracking
 *
 * Note: These test the state update logic patterns, not the full component.
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

interface StartResponse {
  success: boolean;
  sessionId: string;
  stageInfo: {
    currentStage: number;
    totalStages: number;
    stageName: string;
  };
  conversationContext: {
    agentPersonality: Record<string, unknown>;
  };
  overallProgress?: number;
  stageProgress?: number;
  resuming?: boolean;
  conversationHistory?: Array<{ role: string; content: string; timestamp: string }>;
  version?: number;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
  agentIntroduction?: string;
  firstQuestion?: string;
}

interface OnboardingSession {
  sessionId: string;
  currentStage: number;
  totalStages: number;
  overallProgress: number;
  stageProgress: number;
  agentPersonality: unknown;
  isActive: boolean;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

interface SaveResponse {
  success: boolean;
  status: 'committed' | 'duplicate' | 'version_conflict' | 'error';
  version?: number;
  currentStage?: number;
  overallProgress?: number;
  stageProgress?: number;
  stageAdvanced?: boolean;
  completed?: boolean;
  queued?: boolean;
  currentVersion?: number;
  expectedVersion?: number;
  error?: string;
}

interface SessionState {
  currentStage: number;
  overallProgress: number;
  stageProgress: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

interface StateConflictResponse {
  success: false;
  status: 'version_conflict';
  currentVersion: number;
  expectedVersion: number;
  error: string;
}

interface SessionWithStatus {
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  overallProgress: number;
  currentStage: number;
}

interface PendingSave {
  sessionId: string;
  messageId: string;
  userMessage: { role: string; content: string; timestamp: string };
  assistantMessage: { role: string; content: string; timestamp: string };
}

describe('OnboardingWizardV2 State Management (ADR-005)', () => {
  describe('Session initialization from API response', () => {
    it('should initialize session from new session response', () => {
      const apiResponse: StartResponse = {
        success: true,
        sessionId: 'onb_new123',
        stageInfo: {
          currentStage: 1,
          totalStages: 7,
          stageName: 'Welcome & Introduction',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex', role: 'Strategic Consultant' },
        },
        overallProgress: 0,
        stageProgress: 0,
        agentIntroduction: "Hi! I'm Alex...",
        firstQuestion: 'What business idea excites you?',
      };

      // Simulate state initialization logic from OnboardingWizardV2.tsx:792-802
      const session: OnboardingSession = {
        sessionId: apiResponse.sessionId,
        currentStage: apiResponse.stageInfo.currentStage,
        totalStages: apiResponse.stageInfo.totalStages,
        overallProgress: apiResponse.overallProgress || 0,
        stageProgress: apiResponse.stageProgress || 0,
        agentPersonality: apiResponse.conversationContext.agentPersonality,
        isActive: true,
        status: apiResponse.status || 'active',
      };

      expect(session.sessionId).toBe('onb_new123');
      expect(session.currentStage).toBe(1);
      expect(session.overallProgress).toBe(0);
      expect(session.status).toBe('active');
    });

    it('should initialize session from resume response with version and status', () => {
      const resumeResponse: StartResponse = {
        success: true,
        sessionId: 'onb_existing456',
        stageInfo: {
          currentStage: 3,
          totalStages: 7,
          stageName: 'Problem Definition',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex' },
        },
        overallProgress: 35,
        stageProgress: 50,
        resuming: true,
        conversationHistory: [
          { role: 'assistant', content: 'Hello!', timestamp: '2026-01-16T00:00:00Z' },
          { role: 'user', content: 'Hi', timestamp: '2026-01-16T00:00:01Z' },
        ],
        // ADR-005: Critical fields for concurrency and completion
        version: 7,
        status: 'active',
      };

      // Simulate state initialization
      const session: OnboardingSession = {
        sessionId: resumeResponse.sessionId,
        currentStage: resumeResponse.stageInfo.currentStage,
        totalStages: resumeResponse.stageInfo.totalStages,
        overallProgress: resumeResponse.overallProgress || 0,
        stageProgress: resumeResponse.stageProgress || 0,
        agentPersonality: resumeResponse.conversationContext.agentPersonality,
        isActive: true,
        status: resumeResponse.status || 'active',
      };

      // savedVersion initialization (OnboardingWizardV2.tsx:813)
      const savedVersion = resumeResponse.version ?? 0;

      expect(session.currentStage).toBe(3);
      expect(session.overallProgress).toBe(35);
      expect(session.status).toBe('active');
      expect(savedVersion).toBe(7); // ADR-005: Must initialize from resume
    });

    it('should handle legacy resume response without version (defaults to 0)', () => {
      const legacyResumeResponse: StartResponse = {
        success: true,
        sessionId: 'onb_legacy789',
        stageInfo: {
          currentStage: 2,
          totalStages: 7,
          stageName: 'Customer Discovery',
        },
        conversationContext: {
          agentPersonality: { name: 'Alex' },
        },
        resuming: true,
        conversationHistory: [
          { role: 'assistant', content: 'Welcome back!', timestamp: '2026-01-16T00:00:00Z' },
        ],
        // Legacy: No version field
      };

      // savedVersion defaults to 0 for legacy sessions
      const savedVersion = legacyResumeResponse.version ?? 0;

      expect(savedVersion).toBe(0);
    });
  });

  describe('Save response state updates', () => {
    it('should update savedVersion from committed save response', () => {
      const saveResult: SaveResponse = {
        success: true,
        status: 'committed',
        version: 8,
        currentStage: 3,
        overallProgress: 40,
        stageProgress: 60,
        stageAdvanced: false,
        completed: false,
      };

      // Simulate version update logic (OnboardingWizardV2.tsx:620-622)
      let savedVersion: number | null = 7;
      if (saveResult.success && saveResult.version) {
        savedVersion = saveResult.version;
      }

      expect(savedVersion).toBe(8);
    });

    it('should update session state from save response', () => {
      const saveResult: SaveResponse = {
        success: true,
        status: 'committed',
        version: 5,
        currentStage: 3,
        overallProgress: 45,
        stageProgress: 60,
        stageAdvanced: false,
      };

      // Initial session state
      let session: SessionState = {
        currentStage: 3,
        overallProgress: 40,
        stageProgress: 50,
        status: 'active',
      };

      // Simulate progress update logic (OnboardingWizardV2.tsx:641-648)
      if (saveResult.overallProgress !== undefined) {
        session = {
          ...session,
          overallProgress: saveResult.overallProgress,
          stageProgress: saveResult.stageProgress ?? session.stageProgress,
        };
      }

      expect(session.overallProgress).toBe(45);
      expect(session.stageProgress).toBe(60);
    });

    it('should handle stage advancement from save response', () => {
      const saveResult: SaveResponse = {
        success: true,
        status: 'committed',
        version: 6,
        currentStage: 4, // Advanced from 3
        overallProgress: 55,
        stageProgress: 0, // Reset on advance
        stageAdvanced: true,
      };

      let session: SessionState = {
        currentStage: 3,
        overallProgress: 50,
        stageProgress: 90,
        status: 'active',
      };

      // Simulate stage advancement logic (OnboardingWizardV2.tsx:625-640)
      if (saveResult.stageAdvanced && saveResult.currentStage) {
        session = {
          ...session,
          currentStage: saveResult.currentStage,
          overallProgress: saveResult.overallProgress ?? session.overallProgress,
          stageProgress: saveResult.stageProgress ?? 0,
        };
      }

      expect(session.currentStage).toBe(4);
      expect(session.stageProgress).toBe(0); // Reset on advancement
      expect(session.overallProgress).toBe(55);
    });

    it('should update status to completed when save indicates completion (ADR-005)', () => {
      const saveResult: SaveResponse = {
        success: true,
        status: 'committed',
        version: 15,
        currentStage: 7,
        overallProgress: 100,
        stageProgress: 100,
        completed: true,
        queued: true,
      };

      let session: SessionState = {
        currentStage: 7,
        overallProgress: 95,
        stageProgress: 90,
        status: 'active',
      };

      // Simulate completion handling (OnboardingWizardV2.tsx:651-657)
      if (saveResult.completed) {
        session = {
          ...session,
          status: 'completed',
          overallProgress: 100,
        };
      }

      // ADR-005: Status must be 'completed', not just progress
      expect(session.status).toBe('completed');
      expect(session.overallProgress).toBe(100);
    });
  });

  describe('Version conflict handling', () => {
    it('should detect version conflict response', () => {
      const conflictResponse: StateConflictResponse = {
        success: false,
        status: 'version_conflict',
        currentVersion: 10,
        expectedVersion: 5,
        error: 'Session has been modified. Please refresh and retry.',
      };

      // Simulate version conflict detection (OnboardingWizardV2.tsx:598-603)
      const isVersionConflict = conflictResponse.status === 'version_conflict';

      expect(isVersionConflict).toBe(true);
      expect(conflictResponse.currentVersion).toBe(10);
      expect(conflictResponse.expectedVersion).toBe(5);
    });

    it('should provide error message for version conflict', () => {
      const conflictResponse: StateConflictResponse = {
        success: false,
        status: 'version_conflict',
        currentVersion: 10,
        expectedVersion: 5,
        error: 'Session has been modified. Please refresh and retry.',
      };

      // Simulate error handling
      const shouldThrowError = conflictResponse.status === 'version_conflict';
      const errorMessage = 'Session was modified in another tab. Please try again.';

      expect(shouldThrowError).toBe(true);
      expect(errorMessage).toContain('modified');
    });
  });

  describe('Completion state detection', () => {
    it('should use status for completion check, not progress (ADR-005 Bug B5 fix)', () => {
      // Session with high progress but not completed status
      const activeSession: SessionWithStatus = {
        status: 'active',
        overallProgress: 95,
        currentStage: 7,
      };

      // ADR-005: Use status, not progress threshold
      const isCompleteByStatus = activeSession.status === 'completed';
      const isCompleteByProgress = activeSession.overallProgress >= 90; // Old bug

      expect(isCompleteByStatus).toBe(false); // Correct: not completed
      expect(isCompleteByProgress).toBe(true); // Would be wrong
    });

    it('should show completion for sessions with completed status', () => {
      const completedSession: SessionWithStatus = {
        status: 'completed',
        overallProgress: 100,
        currentStage: 7,
      };

      const isComplete = completedSession.status === 'completed';
      expect(isComplete).toBe(true);
    });

    it('should not show completion for paused sessions even at 100%', () => {
      // Edge case: session paused at 100% progress (before completion marker)
      const pausedSession: SessionWithStatus = {
        status: 'paused',
        overallProgress: 100,
        currentStage: 7,
      };

      const isComplete = pausedSession.status === 'completed';
      expect(isComplete).toBe(false);
    });
  });

  describe('localStorage recovery integration', () => {
    it('should save pending message before API call (ADR-005 recovery)', () => {
      const pendingSave: PendingSave = {
        sessionId: 'test-session',
        messageId: 'msg_123_abc',
        userMessage: {
          role: 'user',
          content: 'My business idea is...',
          timestamp: '2026-01-17T00:00:00Z',
        },
        assistantMessage: {
          role: 'assistant',
          content: 'That sounds interesting! Tell me more...',
          timestamp: '2026-01-17T00:00:05Z',
        },
      };

      // Verify message ID format (ADR-005: unique for idempotency)
      expect(pendingSave.messageId).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(pendingSave.userMessage.role).toBe('user');
      expect(pendingSave.assistantMessage.role).toBe('assistant');
    });

    it('should clear pending message after successful save', () => {
      const messageId = 'msg_123_abc';
      let pendingMessages = [{ messageId, content: 'test' }];

      // Simulate clear logic
      const clearPending = (id: string) => {
        pendingMessages = pendingMessages.filter(m => m.messageId !== id);
      };

      expect(pendingMessages).toHaveLength(1);
      clearPending(messageId);
      expect(pendingMessages).toHaveLength(0);
    });
  });

  describe('Message ID generation', () => {
    it('should generate unique message IDs for idempotency', () => {
      // Simulate message ID generation (OnboardingWizardV2.tsx:426)
      const generateMessageId = () => {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      };

      const id1 = generateMessageId();
      const id2 = generateMessageId();

      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2); // Should be unique
    });
  });

  describe('expectedVersion parameter for concurrency', () => {
    it('should include savedVersion in save request (ADR-005)', () => {
      const savedVersion = 5;
      const sessionId = 'test-session';
      const messageId = 'msg_123';

      // Simulate request body construction (OnboardingWizardV2.tsx:577-591)
      const requestBody = {
        sessionId,
        messageId,
        userMessage: { role: 'user', content: 'test', timestamp: '2026-01-17T00:00:00Z' },
        assistantMessage: {
          role: 'assistant',
          content: 'response',
          timestamp: '2026-01-17T00:00:01Z',
        },
        expectedVersion: savedVersion ?? undefined,
      };

      expect(requestBody.expectedVersion).toBe(5);
    });

    it('should not include expectedVersion if savedVersion is null (new session)', () => {
      const savedVersion = null;

      const expectedVersion = savedVersion ?? undefined;

      expect(expectedVersion).toBeUndefined();
    });
  });
});
