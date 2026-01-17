/**
 * ADR-005 Onboarding Recovery Hook Tests
 *
 * Tests for localStorage fallback and recovery logic implemented in ADR-005:
 * - savePending for persisting unsaved messages
 * - clearPending after successful save
 * - recoverPending for retry logic
 * - Duplicate detection and version tracking
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboardingRecovery } from '@/hooks/useOnboardingRecovery';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // Helper to reset store between tests
    _reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useOnboardingRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock._reset();
    localStorageMock.clear();
  });

  describe('savePending', () => {
    it('should save pending message to localStorage', () => {
      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      act(() => {
        result.current.savePending({
          sessionId: 'test-session',
          messageId: 'msg_123',
          userMessage: {
            role: 'user',
            content: 'Hello',
            timestamp: '2026-01-16T00:00:00Z',
          },
          assistantMessage: {
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2026-01-16T00:00:01Z',
          },
        });
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].messageId).toBe('msg_123');
    });

    it('should not save duplicate messageIds', () => {
      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      const pendingSave = {
        sessionId: 'test-session',
        messageId: 'msg_123',
        userMessage: {
          role: 'user' as const,
          content: 'Hello',
          timestamp: '2026-01-16T00:00:00Z',
        },
        assistantMessage: {
          role: 'assistant' as const,
          content: 'Hi there!',
          timestamp: '2026-01-16T00:00:01Z',
        },
      };

      act(() => {
        result.current.savePending(pendingSave);
      });

      act(() => {
        result.current.savePending(pendingSave);
      });

      // Should only have saved once (check the latest call)
      const allCalls = localStorageMock.setItem.mock.calls;
      const lastSavedData = JSON.parse(allCalls[allCalls.length - 1][1]);
      expect(lastSavedData).toHaveLength(1);
    });
  });

  describe('clearPending', () => {
    it('should remove pending message from localStorage', () => {
      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      // First save
      act(() => {
        result.current.savePending({
          sessionId: 'test-session',
          messageId: 'msg_123',
          userMessage: {
            role: 'user',
            content: 'Hello',
            timestamp: '2026-01-16T00:00:00Z',
          },
          assistantMessage: {
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2026-01-16T00:00:01Z',
          },
        });
      });

      // Then clear
      act(() => {
        result.current.clearPending('msg_123');
      });

      // Check localStorage was cleared
      const allCalls = localStorageMock.setItem.mock.calls;
      if (allCalls.length > 1) {
        const lastSavedData = JSON.parse(allCalls[allCalls.length - 1][1]);
        expect(lastSavedData).toHaveLength(0);
      } else {
        // removeItem was called instead
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      }
    });
  });

  describe('hasPending', () => {
    it('should return false when no pending saves', () => {
      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      expect(result.current.hasPending).toBe(false);
    });

    it('should return true when there are pending saves for the session', () => {
      // Pre-populate localStorage
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Hi!',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      expect(result.current.hasPending).toBe(true);
    });
  });

  describe('recoverPending', () => {
    it('should call /api/chat/save for pending messages', async () => {
      // Pre-populate localStorage with a pending save
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Hi!',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      // Mock successful save response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            status: 'committed',
            version: 1,
          }),
      });

      const onRecovered = jest.fn();

      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecovered,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/save',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('msg_123'),
        })
      );
    });

    it('should call onRecovered callback with version after successful recovery (ADR-005)', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Hi!',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            status: 'committed',
            version: 5, // ADR-005: Version returned from save
          }),
      });

      const onRecovered = jest.fn();

      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecovered,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // ADR-005: onRecovered is called with just the version number
      expect(onRecovered).toHaveBeenCalledWith(5);
    });

    it('should handle recovery failure gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Hi!',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      // Mock failed save response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Server error',
          }),
      });

      const onRecovered = jest.fn();
      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecovered,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // onRecovered should NOT be called on failure
      expect(onRecovered).not.toHaveBeenCalled();
    });
  });

  describe('session filtering', () => {
    it('should filter out pending saves for different sessions', () => {
      // Pending saves include one for a different session
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'different-session',
            messageId: 'msg_other',
            userMessage: { role: 'user', content: 'Other', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Response',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      // Should not have pending for test-session
      expect(result.current.hasPending).toBe(false);
    });

    it('should only include pending saves for current session', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_mine',
            userMessage: { role: 'user', content: 'Mine', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Response',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
          {
            sessionId: 'other-session',
            messageId: 'msg_other',
            userMessage: { role: 'user', content: 'Other', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Response',
              timestamp: '2026-01-16T00:00:01Z',
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      // Should have pending for test-session (hasPending checks sessionId match)
      expect(result.current.hasPending).toBe(true);
    });
  });

  describe('expired pending cleanup', () => {
    it('should filter out pending saves older than 24 hours', () => {
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_old',
            userMessage: { role: 'user', content: 'Old', timestamp: '2026-01-15T00:00:00Z' },
            assistantMessage: {
              role: 'assistant',
              content: 'Response',
              timestamp: '2026-01-15T00:00:01Z',
            },
            createdAt: expiredDate,
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() => useOnboardingRecovery({ sessionId: 'test-session' }));

      // Should not have pending (expired)
      expect(result.current.hasPending).toBe(false);
    });
  });
});
