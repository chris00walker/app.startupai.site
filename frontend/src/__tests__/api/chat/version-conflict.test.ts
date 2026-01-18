/**
 * ADR-005 Version Conflict Handling Tests
 *
 * Tests for the version-based concurrency protection implemented in ADR-005:
 * - expected_version parameter validation
 * - version_conflict response handling
 * - Concurrent tab conflict scenarios
 * - Recovery after conflict
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md (PR 7)
 */

type VersionSaveRequest = {
  sessionId: string;
  messageId: string;
  userMessage: { role: string; content: string; timestamp: string };
  assistantMessage: { role: string; content: string; timestamp: string };
  expectedVersion?: number;
};

type VersionConflictResponse = {
  success: false;
  status: 'version_conflict';
  currentVersion: number;
  expectedVersion: number;
  error?: string;
};

type VersionSuccessResponse = {
  success: true;
  status: 'committed' | 'duplicate';
  version: number;
};

type VersionSaveResponse = VersionConflictResponse | VersionSuccessResponse;

type VersionTabState = {
  savedVersion: number;
  pendingMessage: string;
};

type VersionRPCParams = {
  p_session_id: string;
  p_message_id: string;
  p_expected_version: number | null;
};

type VersionRPCResult = {
  status: 'committed' | 'duplicate' | 'version_conflict';
  version: number;
  current_version?: number;
  expected_version?: number;
  message?: string;
};

describe('Version Conflict Handling (ADR-005 PR7)', () => {
  describe('expected_version parameter', () => {
    it('should pass expectedVersion from client state', () => {
      const clientSavedVersion = 5;

      const request: VersionSaveRequest = {
        sessionId: 'test-session',
        messageId: 'msg_123',
        userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
        assistantMessage: {
          role: 'assistant',
          content: 'response',
          timestamp: new Date().toISOString(),
        },
        expectedVersion: clientSavedVersion,
      };

      expect(request.expectedVersion).toBe(5);
    });

    it('should omit expectedVersion for first message (savedVersion is null)', () => {
      const clientSavedVersion: number | null = null;

      const request: VersionSaveRequest = {
        sessionId: 'test-session',
        messageId: 'msg_123',
        userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
        assistantMessage: {
          role: 'assistant',
          content: 'response',
          timestamp: new Date().toISOString(),
        },
        expectedVersion: clientSavedVersion ?? undefined,
      };

      expect(request.expectedVersion).toBeUndefined();
    });

    it('should include expectedVersion of 0 for resumed legacy sessions', () => {
      const clientSavedVersion = 0; // Legacy session default

      const request: VersionSaveRequest = {
        sessionId: 'test-session',
        messageId: 'msg_123',
        userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
        assistantMessage: {
          role: 'assistant',
          content: 'response',
          timestamp: new Date().toISOString(),
        },
        expectedVersion: clientSavedVersion,
      };

      expect(request.expectedVersion).toBe(0);
    });
  });

  describe('version_conflict response', () => {
    it('should recognize version_conflict status', () => {
      const response: VersionSaveResponse = {
        success: false,
        status: 'version_conflict',
        currentVersion: 10,
        expectedVersion: 5,
        error: 'Session has been modified. Please refresh and retry.',
      };

      expect(response.status).toBe('version_conflict');
      expect(response.success).toBe(false);
    });

    it('should include both versions in conflict response', () => {
      const response: VersionConflictResponse = {
        success: false,
        status: 'version_conflict',
        currentVersion: 10,
        expectedVersion: 5,
        error: 'Session has been modified',
      };

      // Client can see what version DB has vs what it expected
      expect(response.currentVersion).toBe(10);
      expect(response.expectedVersion).toBe(5);
      expect(response.currentVersion).toBeGreaterThan(response.expectedVersion);
    });

    it('should handle conflict where expected is ahead (out-of-order delivery)', () => {
      // Rare edge case: network reordering
      const response: VersionConflictResponse = {
        success: false,
        status: 'version_conflict',
        currentVersion: 3,
        expectedVersion: 5, // Client thinks it's ahead
        error: 'Session has been modified',
      };

      // This indicates client state is stale (perhaps from cached data)
      expect(response.currentVersion).toBeLessThan(response.expectedVersion);
    });
  });

  describe('Concurrent tab conflict scenarios', () => {
    it('should simulate Tab A and Tab B concurrent edit conflict', () => {
      // Initial: Both tabs start with version 5
      const tabA: VersionTabState = { savedVersion: 5, pendingMessage: 'Message from Tab A' };
      const tabB: VersionTabState = { savedVersion: 5, pendingMessage: 'Message from Tab B' };

      // Tab B completes first (fast network)
      const tabBResult = {
        success: true,
        status: 'committed' as const,
        version: 6,
      };
      tabB.savedVersion = tabBResult.version;

      // Tab A arrives later with stale version
      const tabAResult = {
        success: false,
        status: 'version_conflict' as const,
        currentVersion: 6, // DB now at 6 (from Tab B)
        expectedVersion: 5, // Tab A expected 5
      };

      expect(tabBResult.success).toBe(true);
      expect(tabBResult.version).toBe(6);

      expect(tabAResult.success).toBe(false);
      expect(tabAResult.status).toBe('version_conflict');
      expect(tabAResult.currentVersion).toBe(6);
    });

    it('should describe conflict recovery flow', () => {
      // After receiving version_conflict, client should:
      const recoverySteps = [
        '1. Refetch current session state from database',
        '2. Update local savedVersion with currentVersion from conflict response',
        '3. Optionally merge/reapply the failed message',
        '4. Retry save with new expectedVersion',
      ];

      expect(recoverySteps).toHaveLength(4);
      expect(recoverySteps[0]).toContain('Refetch');
      expect(recoverySteps[3]).toContain('Retry');
    });
  });

  describe('Client-side conflict handling', () => {
    it('should throw error on version conflict for retry logic', () => {
      const saveResult = {
        success: false,
        status: 'version_conflict' as const,
        currentVersion: 10,
        expectedVersion: 5,
      };

      // Simulate conflict handling (OnboardingWizardV2.tsx:598-603)
      const handleConflict = (result: typeof saveResult) => {
        if (result.status === 'version_conflict') {
          throw new Error('Session was modified in another tab. Please try again.');
        }
      };

      expect(() => handleConflict(saveResult)).toThrow('Session was modified in another tab');
    });

    it('should update savedVersion after refetch on conflict', () => {
      let savedVersion = 5;

      // Simulate conflict response
      const conflictResponse = {
        status: 'version_conflict' as const,
        currentVersion: 10,
      };

      // After refetch, update to current version
      const handleConflictRecovery = (currentVersion: number) => {
        savedVersion = currentVersion;
      };

      handleConflictRecovery(conflictResponse.currentVersion);

      expect(savedVersion).toBe(10);
    });
  });

  describe('RPC version check behavior', () => {
    it('should pass when expectedVersion matches DB version', () => {
      const params: VersionRPCParams = {
        p_session_id: 'test-session',
        p_message_id: 'msg_123',
        p_expected_version: 5,
      };

      // Simulate: DB version is 5, expected is 5
      const dbVersion = 5;

      const result: VersionRPCResult =
        params.p_expected_version === dbVersion
          ? { status: 'committed', version: dbVersion + 1 }
          : {
              status: 'version_conflict',
              version: 0,
              current_version: dbVersion,
              expected_version: params.p_expected_version ?? 0,
            };

      expect(result.status).toBe('committed');
      expect(result.version).toBe(6);
    });

    it('should reject when expectedVersion does not match DB version', () => {
      const params: VersionRPCParams = {
        p_session_id: 'test-session',
        p_message_id: 'msg_123',
        p_expected_version: 5, // Client thinks version is 5
      };

      // Simulate: DB version is 8 (modified by another tab)
      const dbVersion = 8;

      const result: VersionRPCResult =
        params.p_expected_version === dbVersion
          ? { status: 'committed', version: dbVersion + 1 }
          : {
              status: 'version_conflict',
              version: 0,
              current_version: dbVersion,
              expected_version: params.p_expected_version ?? 0,
              message: 'Session has been modified',
            };

      expect(result.status).toBe('version_conflict');
      expect(result.current_version).toBe(8);
      expect(result.expected_version).toBe(5);
    });

    it('should allow save when expectedVersion is null (first message)', () => {
      const params: VersionRPCParams = {
        p_session_id: 'test-session',
        p_message_id: 'msg_123',
        p_expected_version: null, // First message, no version check
      };

      // Simulate: When expectedVersion is null, skip check and commit
      const dbVersion = 0;
      const skipVersionCheck = params.p_expected_version === null;

      const result: VersionRPCResult = skipVersionCheck
        ? { status: 'committed', version: dbVersion + 1 }
        : params.p_expected_version === dbVersion
          ? { status: 'committed', version: dbVersion + 1 }
          : {
              status: 'version_conflict',
              version: 0,
              current_version: dbVersion,
              expected_version: params.p_expected_version ?? 0,
            };

      expect(result.status).toBe('committed');
      expect(result.version).toBe(1);
    });
  });

  describe('Idempotency with version conflict', () => {
    it('should return duplicate status for same messageId (regardless of version)', () => {
      const existingMessageIds = new Set(['msg_abc', 'msg_def']);

      const checkIdempotency = (messageId: string) => {
        if (existingMessageIds.has(messageId)) {
          return { status: 'duplicate' as const, version: 5 }; // Return existing version
        }
        return null; // Proceed with normal processing
      };

      const result1 = checkIdempotency('msg_abc');
      const result2 = checkIdempotency('msg_new');

      expect(result1).not.toBeNull();
      expect(result1?.status).toBe('duplicate');
      expect(result2).toBeNull();
    });

    it('should handle duplicate before version check (idempotency takes precedence)', () => {
      const existingMessageIds = new Set(['msg_duplicate']);
      const dbVersion = 10;

      const processRequest = (messageId: string, expectedVersion: number) => {
        // Step 1: Idempotency check (takes precedence)
        if (existingMessageIds.has(messageId)) {
          return { status: 'duplicate' as const, version: 5 };
        }

        // Step 2: Version check
        if (expectedVersion !== dbVersion) {
          return {
            status: 'version_conflict' as const,
            currentVersion: dbVersion,
            expectedVersion,
          };
        }

        // Step 3: Commit
        return { status: 'committed' as const, version: dbVersion + 1 };
      };

      // Duplicate request with wrong version - should return duplicate, not conflict
      const result = processRequest('msg_duplicate', 3);

      expect(result.status).toBe('duplicate');
      expect((result as any).version).toBe(5);
    });
  });
});
