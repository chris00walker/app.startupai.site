/**
 * useGatePolicies Hook
 *
 * Fetches and manages gate policies for the current user.
 * Provides CRUD operations for configurable phase gate criteria.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import type { GateType, GateThresholds } from '@/db/schema/gate-policies';

export interface GatePolicyData {
  id: string | null;
  gate: GateType;
  isCustom: boolean;
  minExperiments: number;
  requiredFitTypes: string[];
  minWeakEvidence: number;
  minMediumEvidence: number;
  minStrongEvidence: number;
  thresholds: GateThresholds;
  overrideRoles: string[];
  requiresApproval: boolean;
}

export interface GatePolicyDefaults {
  minExperiments: number;
  requiredFitTypes: string[];
  minWeakEvidence: number;
  minMediumEvidence: number;
  minStrongEvidence: number;
  thresholds: GateThresholds;
  requiresApproval: boolean;
}

export interface UseGatePoliciesResult {
  policies: Record<GateType, GatePolicyData> | null;
  defaults: Record<GateType, GatePolicyDefaults> | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updatePolicy: (gate: GateType, data: Partial<GatePolicyData>) => Promise<boolean>;
  resetPolicy: (gate: GateType) => Promise<boolean>;
}

export function useGatePolicies(): UseGatePoliciesResult {
  const { user, loading: authLoading } = useAuth();
  const [policies, setPolicies] = useState<Record<GateType, GatePolicyData> | null>(null);
  const [defaults, setDefaults] = useState<Record<GateType, GatePolicyDefaults> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (authLoading || !user) {
      setPolicies(null);
      setDefaults(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/settings/gate-policies');

      if (!response.ok) {
        throw new Error(`Failed to fetch gate policies: ${response.status}`);
      }

      const data = await response.json();

      setPolicies(data.policies);
      setDefaults(data.defaults);
      setError(null);

    } catch (err) {
      console.error('[useGatePolicies] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Initial fetch
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const updatePolicy = async (
    gate: GateType,
    data: Partial<GatePolicyData>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/settings/gate-policies/${gate.toLowerCase()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update policy: ${response.status}`);
      }

      // Refetch policies to get updated state
      await fetchPolicies();
      return true;

    } catch (err) {
      console.error('[useGatePolicies] Update error:', err);
      setError(err as Error);
      return false;
    }
  };

  const resetPolicy = async (gate: GateType): Promise<boolean> => {
    try {
      const response = await fetch(`/api/settings/gate-policies/${gate.toLowerCase()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to reset policy: ${response.status}`);
      }

      // Refetch policies to get updated state
      await fetchPolicies();
      return true;

    } catch (err) {
      console.error('[useGatePolicies] Reset error:', err);
      setError(err as Error);
      return false;
    }
  };

  return {
    policies,
    defaults,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchPolicies,
    updatePolicy,
    resetPolicy,
  };
}

/**
 * Hook to fetch a single gate policy.
 */
export function useGatePolicy(gate: GateType | null) {
  const { user, loading: authLoading } = useAuth();
  const [policy, setPolicy] = useState<GatePolicyData | null>(null);
  const [defaults, setDefaults] = useState<GatePolicyDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPolicy() {
      if (authLoading || !user || !gate) {
        setPolicy(null);
        setDefaults(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch(`/api/settings/gate-policies/${gate.toLowerCase()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch gate policy: ${response.status}`);
        }

        const data = await response.json();
        setPolicy(data.policy);
        setDefaults(data.defaults);
        setError(null);

      } catch (err) {
        console.error('[useGatePolicy] Error:', err);
        setError(err as Error);
        setPolicy(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPolicy();
  }, [user, authLoading, gate]);

  return {
    policy,
    defaults,
    isLoading: isLoading || authLoading,
    error,
  };
}
