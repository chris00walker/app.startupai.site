/**
 * useFeatureFlag Hook
 *
 * Client-side feature flag evaluation with caching and loading states.
 * Evaluates flags based on: user-specific → percentage rollout → global → false.
 *
 * @story US-A06
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled_globally: boolean;
  percentage_rollout: number;
  target_user_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagState {
  flags: Map<string, FeatureFlag>;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

// Global cache for feature flags (shared across hook instances)
let globalFlagsCache: Map<string, FeatureFlag> = new Map();
let globalLastFetched: Date | null = null;
let globalFetchPromise: Promise<void> | null = null;

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

/**
 * Deterministic hash function for percentage rollout
 * Uses userId + flagKey to ensure consistent evaluation
 */
function hashUserForFlag(userId: string, flagKey: string): number {
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Evaluate a feature flag for a specific user
 * Priority: user-specific → percentage rollout → global → false
 */
function evaluateFlag(flag: FeatureFlag | undefined, userId?: string): boolean {
  if (!flag) return false;

  // 1. User-specific override (highest priority)
  if (userId && flag.target_user_ids?.includes(userId)) {
    return true;
  }

  // 2. Percentage rollout (deterministic hash)
  if (flag.percentage_rollout > 0 && userId) {
    const userHash = hashUserForFlag(userId, flag.key);
    if (userHash < flag.percentage_rollout) {
      return true;
    }
  }

  // 3. Global enable
  if (flag.enabled_globally) {
    return true;
  }

  // 4. Default: disabled
  return false;
}

/**
 * Hook to check if a specific feature flag is enabled
 */
export function useFeatureFlag(flagKey: string): {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const [state, setState] = useState<FeatureFlagState>({
    flags: globalFlagsCache,
    isLoading: globalFlagsCache.size === 0,
    error: null,
    lastFetched: globalLastFetched,
  });
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Get current user ID
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  // Fetch flags if cache is stale
  const fetchFlags = useCallback(async () => {
    // Check if cache is still valid
    if (
      globalLastFetched &&
      Date.now() - globalLastFetched.getTime() < CACHE_DURATION_MS
    ) {
      setState((prev) => ({
        ...prev,
        flags: globalFlagsCache,
        isLoading: false,
        lastFetched: globalLastFetched,
      }));
      return;
    }

    // Dedupe concurrent requests
    if (globalFetchPromise) {
      await globalFetchPromise;
      setState((prev) => ({
        ...prev,
        flags: globalFlagsCache,
        isLoading: false,
        lastFetched: globalLastFetched,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    globalFetchPromise = (async () => {
      try {
        const response = await fetch('/api/admin/features');
        if (!response.ok) {
          // Non-admin users may not have access - use empty flags
          if (response.status === 403) {
            globalFlagsCache = new Map();
            globalLastFetched = new Date();
            return;
          }
          throw new Error(`Failed to fetch flags: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          globalFlagsCache = new Map(
            data.data.map((flag: FeatureFlag) => [flag.key, flag])
          );
          globalLastFetched = new Date();
        }
      } catch (error) {
        console.error('[useFeatureFlag] Error fetching flags:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch flags',
        }));
      } finally {
        globalFetchPromise = null;
      }
    })();

    await globalFetchPromise;
    setState((prev) => ({
      ...prev,
      flags: globalFlagsCache,
      isLoading: false,
      lastFetched: globalLastFetched,
    }));
  }, []);

  // Fetch on mount and when flagKey changes
  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Evaluate the specific flag
  const isEnabled = useMemo(() => {
    const flag = state.flags.get(flagKey);
    return evaluateFlag(flag, userId);
  }, [state.flags, flagKey, userId]);

  return {
    isEnabled,
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Hook to get all feature flags (for admin management)
 */
export function useFeatureFlags(): {
  flags: FeatureFlag[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/features');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error(`Failed to fetch flags: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setFlags(data.data);
        // Update global cache
        globalFlagsCache = new Map(
          data.data.map((flag: FeatureFlag) => [flag.key, flag])
        );
        globalLastFetched = new Date();
      }
    } catch (err) {
      console.error('[useFeatureFlags] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    isLoading,
    error,
    refetch: fetchFlags,
  };
}

/**
 * Utility to invalidate the feature flag cache
 * Call this after updating a flag in the admin UI
 */
export function invalidateFeatureFlagCache(): void {
  globalFlagsCache = new Map();
  globalLastFetched = null;
}
