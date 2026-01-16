/**
 * Onboarding Recovery Hook
 *
 * Part of ADR-005 Split API Architecture:
 * Provides localStorage fallback for pending saves to handle:
 * - Tab close before save completes
 * - Network failures
 * - Browser crash recovery
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface PendingSave {
  sessionId: string;
  messageId: string;
  userMessage: {
    role: 'user';
    content: string;
    timestamp: string;
  };
  assistantMessage: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
  createdAt: string;
  attempts: number;
}

interface UseOnboardingRecoveryOptions {
  sessionId: string | null;
  onRecovered?: (version: number) => void;
  onRecoveryFailed?: (error: Error) => void;
}

interface UseOnboardingRecoveryReturn {
  savePending: (save: Omit<PendingSave, 'createdAt' | 'attempts'>) => void;
  clearPending: (messageId: string) => void;
  hasPending: boolean;
  recoverPending: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'startupai:pending_saves';
const MAX_RECOVERY_ATTEMPTS = 3;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// Helpers
// ============================================================================

function getPendingSaves(): PendingSave[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const saves = JSON.parse(stored) as PendingSave[];
    // Filter out expired saves
    const now = Date.now();
    return saves.filter(save => {
      const age = now - new Date(save.createdAt).getTime();
      return age < MAX_AGE_MS;
    });
  } catch (error) {
    console.warn('[useOnboardingRecovery] Failed to read pending saves:', error);
    return [];
  }
}

function setPendingSaves(saves: PendingSave[]): void {
  if (typeof window === 'undefined') return;

  try {
    if (saves.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    }
  } catch (error) {
    console.warn('[useOnboardingRecovery] Failed to write pending saves:', error);
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useOnboardingRecovery({
  sessionId,
  onRecovered,
  onRecoveryFailed,
}: UseOnboardingRecoveryOptions): UseOnboardingRecoveryReturn {
  const recoveryAttemptedRef = useRef(false);

  // Save a pending message to localStorage
  const savePending = useCallback((save: Omit<PendingSave, 'createdAt' | 'attempts'>) => {
    const saves = getPendingSaves();

    // Check if this messageId already exists (avoid duplicates)
    if (saves.some(s => s.messageId === save.messageId)) {
      return;
    }

    const newSave: PendingSave = {
      ...save,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    saves.push(newSave);
    setPendingSaves(saves);

    console.log('[useOnboardingRecovery] Saved pending:', save.messageId);
  }, []);

  // Clear a pending save after successful commit
  const clearPending = useCallback((messageId: string) => {
    const saves = getPendingSaves();
    const filtered = saves.filter(s => s.messageId !== messageId);
    setPendingSaves(filtered);

    console.log('[useOnboardingRecovery] Cleared pending:', messageId);
  }, []);

  // Check if there are pending saves for the current session
  const hasPending = sessionId
    ? getPendingSaves().some(s => s.sessionId === sessionId)
    : false;

  // Attempt to recover pending saves
  const recoverPending = useCallback(async () => {
    if (!sessionId) return;

    const saves = getPendingSaves();
    const sessionSaves = saves.filter(s => s.sessionId === sessionId);

    if (sessionSaves.length === 0) return;

    console.log('[useOnboardingRecovery] Attempting recovery of', sessionSaves.length, 'pending saves');

    for (const save of sessionSaves) {
      if (save.attempts >= MAX_RECOVERY_ATTEMPTS) {
        console.warn('[useOnboardingRecovery] Max attempts exceeded for:', save.messageId);
        clearPending(save.messageId);
        onRecoveryFailed?.(new Error(`Recovery failed after ${MAX_RECOVERY_ATTEMPTS} attempts`));
        continue;
      }

      // Increment attempts before trying
      save.attempts += 1;
      setPendingSaves(saves);

      try {
        const response = await fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: save.sessionId,
            messageId: save.messageId,
            userMessage: save.userMessage,
            assistantMessage: save.assistantMessage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Save API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          clearPending(save.messageId);

          if (result.status === 'duplicate') {
            console.log('[useOnboardingRecovery] Already saved (duplicate):', save.messageId);
          } else {
            console.log('[useOnboardingRecovery] Recovered:', save.messageId, 'v' + result.version);
            toast.success('Recovered unsaved message');
            onRecovered?.(result.version);
          }
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error) {
        console.error('[useOnboardingRecovery] Recovery failed:', save.messageId, error);

        if (save.attempts >= MAX_RECOVERY_ATTEMPTS) {
          clearPending(save.messageId);
          toast.error('Could not recover some messages. They may have been lost.');
          onRecoveryFailed?.(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }, [sessionId, clearPending, onRecovered, onRecoveryFailed]);

  // Attempt recovery on mount (once per session)
  useEffect(() => {
    if (!sessionId || recoveryAttemptedRef.current) return;

    recoveryAttemptedRef.current = true;

    // Delay recovery slightly to ensure auth is ready
    const timer = setTimeout(() => {
      recoverPending();
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessionId, recoverPending]);

  return {
    savePending,
    clearPending,
    hasPending,
    recoverPending,
  };
}
