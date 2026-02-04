/**
 * useBMC Hook
 *
 * Hook for fetching and managing Business Model Canvas data.
 * Supports both viewing and editing BMC blocks, with tracking of
 * source (crewai/manual/hybrid) for each item.
 *
 * Features:
 * - Fetch BMC data for a project
 * - Update individual blocks
 * - Add/remove items
 * - Reset to original CrewAI data
 * - Track edit source
 *
 * @story US-F12
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';
import type {
  BMCItem,
  BMCSource,
  BMCBlockKey,
  BusinessModelCanvas,
} from '@/db/schema/business-model-canvas';

// ============================================================================
// TYPES
// ============================================================================

export interface UseBMCOptions {
  projectId?: string;
  autoRefresh?: boolean;
}

export interface UseBMCResult {
  bmc: BusinessModelCanvas | null;
  isLoading: boolean;
  error: Error | null;
  hasData: boolean;
  dataSource: BMCSource;

  // Block data accessors
  customerSegments: BMCItem[];
  valuePropositions: BMCItem[];
  channels: BMCItem[];
  customerRelationships: BMCItem[];
  revenueStreams: BMCItem[];
  keyResources: BMCItem[];
  keyActivities: BMCItem[];
  keyPartners: BMCItem[];
  costStructure: BMCItem[];

  // Actions
  refetch: () => Promise<void>;
  updateBlock: (blockKey: BMCBlockKey, items: BMCItem[]) => Promise<void>;
  addItem: (blockKey: BMCBlockKey, text: string) => Promise<void>;
  removeItem: (blockKey: BMCBlockKey, itemId: string) => Promise<void>;
  updateItem: (blockKey: BMCBlockKey, itemId: string, text: string) => Promise<void>;
  resetToCrewAI: () => Promise<void>;
  isSaving: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useBMC(options: UseBMCOptions = {}): UseBMCResult {
  const { projectId, autoRefresh = false } = options;
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [bmc, setBmc] = useState<BusinessModelCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch BMC data
  const fetchBMC = useCallback(async () => {
    if (!projectId) {
      setBmc(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('business_model_canvas')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (fetchError) {
        // No BMC exists yet - that's OK
        if (fetchError.code === 'PGRST116') {
          setBmc(null);
        } else {
          throw fetchError;
        }
      } else {
        setBmc(data as BusinessModelCanvas);
      }
    } catch (err) {
      console.error('[useBMC] Error fetching BMC:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchBMC();
  }, [fetchBMC]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const intervalId = setInterval(fetchBMC, 30000);
    return () => clearInterval(intervalId);
  }, [autoRefresh, projectId, fetchBMC]);

  // Update a block
  const updateBlock = useCallback(
    async (blockKey: BMCBlockKey, items: BMCItem[]) => {
      if (!projectId || !user) {
        setError(new Error('Project ID and user required'));
        return;
      }

      try {
        setIsSaving(true);
        setError(null);

        // Determine new source based on items
        const hasCrewAI = items.some((item) => item.source === 'crewai');
        const hasManual = items.some((item) => item.source === 'manual');
        const newSource: BMCSource = hasCrewAI && hasManual ? 'hybrid' : hasManual ? 'manual' : 'crewai';

        // Map block key to snake_case column name
        const columnMap: Record<BMCBlockKey, string> = {
          customerSegments: 'customer_segments',
          valuePropositions: 'value_propositions',
          channels: 'channels',
          customerRelationships: 'customer_relationships',
          revenueStreams: 'revenue_streams',
          keyResources: 'key_resources',
          keyActivities: 'key_activities',
          keyPartners: 'key_partners',
          costStructure: 'cost_structure',
        };

        const updateData = {
          [columnMap[blockKey]]: items,
          source: newSource,
          updated_at: new Date().toISOString(),
        };

        if (bmc) {
          // Update existing BMC
          const { error: updateError } = await supabase
            .from('business_model_canvas')
            .update(updateData)
            .eq('id', bmc.id);

          if (updateError) throw updateError;
        } else {
          // Create new BMC
          const { error: insertError } = await supabase.from('business_model_canvas').insert({
            project_id: projectId,
            user_id: user.id,
            source: newSource,
            [columnMap[blockKey]]: items,
          });

          if (insertError) throw insertError;
        }

        // Refetch to get updated data
        await fetchBMC();
      } catch (err) {
        console.error('[useBMC] Error updating block:', err);
        setError(err as Error);
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, user, bmc, supabase, fetchBMC]
  );

  // Add item to a block
  const addItem = useCallback(
    async (blockKey: BMCBlockKey, text: string) => {
      const currentItems = bmc?.[blockKey] || [];
      const newItem: BMCItem = {
        id: crypto.randomUUID(),
        text,
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await updateBlock(blockKey, [...(currentItems as BMCItem[]), newItem]);
    },
    [bmc, updateBlock]
  );

  // Remove item from a block
  const removeItem = useCallback(
    async (blockKey: BMCBlockKey, itemId: string) => {
      const currentItems = bmc?.[blockKey] || [];
      const updatedItems = (currentItems as BMCItem[]).filter((item) => item.id !== itemId);
      await updateBlock(blockKey, updatedItems);
    },
    [bmc, updateBlock]
  );

  // Update item text
  const updateItem = useCallback(
    async (blockKey: BMCBlockKey, itemId: string, text: string) => {
      const currentItems = bmc?.[blockKey] || [];
      const updatedItems = (currentItems as BMCItem[]).map((item) =>
        item.id === itemId
          ? { ...item, text, source: 'manual' as const, updatedAt: new Date().toISOString() }
          : item
      );
      await updateBlock(blockKey, updatedItems);
    },
    [bmc, updateBlock]
  );

  // Reset to original CrewAI data
  const resetToCrewAI = useCallback(async () => {
    if (!bmc?.originalCrewaiData) {
      setError(new Error('No original CrewAI data available'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const original = bmc.originalCrewaiData;

      const { error: updateError } = await supabase
        .from('business_model_canvas')
        .update({
          customer_segments: original.customerSegments || [],
          value_propositions: original.valuePropositions || [],
          channels: original.channels || [],
          customer_relationships: original.customerRelationships || [],
          revenue_streams: original.revenueStreams || [],
          key_resources: original.keyResources || [],
          key_activities: original.keyActivities || [],
          key_partners: original.keyPartners || [],
          cost_structure: original.costStructure || [],
          source: 'crewai',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bmc.id);

      if (updateError) throw updateError;

      await fetchBMC();
    } catch (err) {
      console.error('[useBMC] Error resetting to CrewAI:', err);
      setError(err as Error);
    } finally {
      setIsSaving(false);
    }
  }, [bmc, supabase, fetchBMC]);

  // Derived values
  const hasData = !!bmc;
  const dataSource: BMCSource = bmc?.dataSource || 'crewai';

  return {
    bmc,
    isLoading,
    error,
    hasData,
    dataSource,

    // Block data - cast to BMCItem[] with defaults
    customerSegments: (bmc?.customerSegments as BMCItem[]) || [],
    valuePropositions: (bmc?.valuePropositions as BMCItem[]) || [],
    channels: (bmc?.channels as BMCItem[]) || [],
    customerRelationships: (bmc?.customerRelationships as BMCItem[]) || [],
    revenueStreams: (bmc?.revenueStreams as BMCItem[]) || [],
    keyResources: (bmc?.keyResources as BMCItem[]) || [],
    keyActivities: (bmc?.keyActivities as BMCItem[]) || [],
    keyPartners: (bmc?.keyPartners as BMCItem[]) || [],
    costStructure: (bmc?.costStructure as BMCItem[]) || [],

    // Actions
    refetch: fetchBMC,
    updateBlock,
    addItem,
    removeItem,
    updateItem,
    resetToCrewAI,
    isSaving,
  };
}

export default useBMC;
