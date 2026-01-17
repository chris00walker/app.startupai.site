/**
 * Tests for useOnboardingRecovery hook
 *
 * Part of ADR-005 Split API Architecture:
 * Tests localStorage fallback and recovery logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingRecovery } from '../useOnboardingRecovery';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useOnboardingRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('savePending', () => {
    it('should save pending message to localStorage', () => {
      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

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
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(savedData).toHaveLength(1);
      expect(savedData[0].messageId).toBe('msg_123');
    });

    it('should not save duplicate messageIds', () => {
      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

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
      const lastSavedData = JSON.parse(
        allCalls[allCalls.length - 1][1]
      );
      expect(lastSavedData).toHaveLength(1);
    });
  });

  describe('clearPending', () => {
    it('should remove pending message from localStorage', () => {
      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

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
        const lastSavedData = JSON.parse(
          allCalls[allCalls.length - 1][1]
        );
        expect(lastSavedData).toHaveLength(0);
      } else {
        // removeItem was called instead
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      }
    });
  });

  describe('hasPending', () => {
    it('should return false when no pending saves', () => {
      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

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
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

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
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      // Mock successful save response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: 'committed',
          version: 1,
        }),
      });

      const onRecovered = vi.fn();

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

    it('should call onRecovered callback with version after successful recovery', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: 'committed',
          version: 5,
        }),
      });

      const onRecovered = vi.fn();

      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecovered,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // onRecovered is called with just the version number
      expect(onRecovered).toHaveBeenCalledWith(5);
    });

    it('should clear pending after successful recovery', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: 'committed',
          version: 1,
        }),
      });

      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // After recovery, pending should be cleared
      expect(result.current.hasPending).toBe(false);
    });

    it('should handle recovery failure gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      // Mock failed save response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Server error',
        }),
      });

      const onRecovered = vi.fn();
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

    it('should handle version conflict during recovery', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      // Mock version conflict response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          status: 'version_conflict',
          currentVersion: 10,
          expectedVersion: 5,
        }),
      });

      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // Version conflict should clear the pending (outdated data)
      expect(result.current.hasPending).toBe(false);
    });

    it('should recover multiple pending messages in order', async () => {
      const pendingMessages = [
        {
          sessionId: 'test-session',
          messageId: 'msg_1',
          userMessage: { role: 'user', content: 'First', timestamp: '2026-01-16T00:00:00Z' },
          assistantMessage: { role: 'assistant', content: 'Response 1', timestamp: '2026-01-16T00:00:01Z' },
          createdAt: '2026-01-16T00:00:00Z',
          attempts: 0,
        },
        {
          sessionId: 'test-session',
          messageId: 'msg_2',
          userMessage: { role: 'user', content: 'Second', timestamp: '2026-01-16T00:01:00Z' },
          assistantMessage: { role: 'assistant', content: 'Response 2', timestamp: '2026-01-16T00:01:01Z' },
          createdAt: '2026-01-16T00:01:00Z',
          attempts: 0,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingMessages));

      let callCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: 'committed',
            version: callCount,
          }),
        });
      });

      const onRecovered = vi.fn();
      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecovered,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // Should have called save for both messages
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // onRecovered is called once per recovered message with version
      expect(onRecovered).toHaveBeenCalledTimes(2);
      expect(onRecovered).toHaveBeenCalledWith(1);
      expect(onRecovered).toHaveBeenCalledWith(2);
    });
  });

  describe('version tracking (ADR-005)', () => {
    it('should track latest version from recovered saves', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_1',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: 'committed',
          version: 4, // New version after save
        }),
      });

      const onRecovered = vi.fn();
      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecovered,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // onRecovered is called with just the version number
      expect(onRecovered).toHaveBeenCalledWith(4);
    });
  });

  describe('stale pending cleanup', () => {
    it('should filter out pending saves for different sessions', () => {
      // Pending saves include one for a different session
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'different-session',
            messageId: 'msg_other',
            userMessage: { role: 'user', content: 'Other', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Response', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

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
            assistantMessage: { role: 'assistant', content: 'Response', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
          {
            sessionId: 'other-session',
            messageId: 'msg_other',
            userMessage: { role: 'user', content: 'Other', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Response', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

      // Should have pending for test-session (hasPending checks sessionId match)
      expect(result.current.hasPending).toBe(true);
    });
  });

  describe('max attempts handling', () => {
    it('should call onRecoveryFailed when max attempts exceeded', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify([
          {
            sessionId: 'test-session',
            messageId: 'msg_123',
            userMessage: { role: 'user', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
            assistantMessage: { role: 'assistant', content: 'Hi!', timestamp: '2026-01-16T00:00:01Z' },
            createdAt: new Date().toISOString(),
            attempts: 3, // Already at max attempts
          },
        ])
      );

      const onRecoveryFailed = vi.fn();

      const { result } = renderHook(() =>
        useOnboardingRecovery({
          sessionId: 'test-session',
          onRecoveryFailed,
        })
      );

      await act(async () => {
        await result.current.recoverPending();
      });

      // Should not call fetch (max attempts exceeded)
      expect(global.fetch).not.toHaveBeenCalled();
      // Should call onRecoveryFailed
      expect(onRecoveryFailed).toHaveBeenCalledWith(expect.any(Error));
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
            assistantMessage: { role: 'assistant', content: 'Response', timestamp: '2026-01-15T00:00:01Z' },
            createdAt: expiredDate,
            attempts: 0,
          },
        ])
      );

      const { result } = renderHook(() =>
        useOnboardingRecovery({ sessionId: 'test-session' })
      );

      // Should not have pending (expired)
      expect(result.current.hasPending).toBe(false);
    });
  });
});
