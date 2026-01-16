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
  });
});
