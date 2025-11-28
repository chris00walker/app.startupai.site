/**
 * useVPC Hook
 *
 * Hook for fetching and managing Value Proposition Canvas data.
 * Supports multiple segments per project with CRUD operations
 * for each VPC section (jobs, pains, gains, etc.)
 *
 * Features:
 * - Fetch all VPC segments for a project
 * - Multi-segment support with active segment selection
 * - CRUD operations for all VPC blocks
 * - Initialize from CrewAI data
 * - Reset to original CrewAI data
 * - Source tracking (crewai/manual/hybrid)
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';
import type {
  ValuePropositionCanvas,
  VPCJobItem,
  VPCPainItem,
  VPCGainItem,
  VPCItem,
  VPCPainRelieverItem,
  VPCGainCreatorItem,
  VPCSource,
  VPCBlockKey,
} from '@/db/schema/value-proposition-canvas';

// ============================================================================
// TYPES
// ============================================================================

export interface UseVPCOptions {
  projectId?: string;
  autoInitialize?: boolean; // Auto-initialize from CrewAI if no data exists
}

export interface UseVPCResult {
  // Data
  segments: ValuePropositionCanvas[];
  activeSegment: ValuePropositionCanvas | null;
  activeSegmentKey: string | null;

  // State
  isLoading: boolean;
  isSaving: boolean;
  isInitializing: boolean;
  error: Error | null;
  hasData: boolean;

  // Segment selection
  setActiveSegmentKey: (key: string | null) => void;
  segmentKeys: string[];

  // Data fetching
  refetch: () => Promise<void>;
  initializeFromCrewAI: (force?: boolean) => Promise<boolean>;

  // Jobs CRUD
  addJob: (job: Omit<VPCJobItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJob: (jobId: string, updates: Partial<VPCJobItem>) => Promise<void>;
  removeJob: (jobId: string) => Promise<void>;

  // Pains CRUD
  addPain: (pain: Omit<VPCPainItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePain: (painId: string, updates: Partial<VPCPainItem>) => Promise<void>;
  removePain: (painId: string) => Promise<void>;

  // Gains CRUD
  addGain: (gain: Omit<VPCGainItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGain: (gainId: string, updates: Partial<VPCGainItem>) => Promise<void>;
  removeGain: (gainId: string) => Promise<void>;

  // Products & Services CRUD
  addProductOrService: (text: string) => Promise<void>;
  updateProductOrService: (itemId: string, text: string) => Promise<void>;
  removeProductOrService: (itemId: string) => Promise<void>;

  // Pain Relievers CRUD
  addPainReliever: (
    painReliever: Omit<VPCPainRelieverItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updatePainReliever: (itemId: string, updates: Partial<VPCPainRelieverItem>) => Promise<void>;
  removePainReliever: (itemId: string) => Promise<void>;

  // Gain Creators CRUD
  addGainCreator: (
    gainCreator: Omit<VPCGainCreatorItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateGainCreator: (itemId: string, updates: Partial<VPCGainCreatorItem>) => Promise<void>;
  removeGainCreator: (itemId: string) => Promise<void>;

  // Differentiators CRUD
  addDifferentiator: (text: string) => Promise<void>;
  updateDifferentiator: (itemId: string, text: string) => Promise<void>;
  removeDifferentiator: (itemId: string) => Promise<void>;

  // Reset
  resetToCrewAI: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useVPC(options: UseVPCOptions = {}): UseVPCResult {
  const { projectId, autoInitialize = false } = options;
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [segments, setSegments] = useState<ValuePropositionCanvas[]>([]);
  const [activeSegmentKey, setActiveSegmentKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Derived state
  const hasData = segments.length > 0;
  const segmentKeys = useMemo(() => segments.map((s) => s.segmentKey), [segments]);
  const activeSegment = useMemo(
    () => segments.find((s) => s.segmentKey === activeSegmentKey) || null,
    [segments, activeSegmentKey]
  );

  // ============================================================================
  // FETCH VPC DATA
  // ============================================================================

  const fetchVPC = useCallback(async () => {
    if (!projectId) {
      setSegments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/vpc/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch VPC data');
      }

      const fetchedSegments = data.data?.segments || [];
      setSegments(fetchedSegments);

      // Auto-select first segment if none selected
      if (fetchedSegments.length > 0 && !activeSegmentKey) {
        setActiveSegmentKey(fetchedSegments[0].segmentKey);
      }
    } catch (err) {
      console.error('[useVPC] Error fetching VPC:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeSegmentKey]);

  // ============================================================================
  // INITIALIZE FROM CREWAI
  // ============================================================================

  const initializeFromCrewAI = useCallback(
    async (force = false): Promise<boolean> => {
      if (!projectId) return false;

      try {
        setIsInitializing(true);
        setError(null);

        const response = await fetch(`/api/vpc/${projectId}/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        });

        const data = await response.json();

        if (!response.ok) {
          // 409 Conflict means data already exists - not a real error if not forcing
          if (response.status === 409 && !force) {
            return false;
          }
          throw new Error(data.error || 'Failed to initialize VPC');
        }

        // Refetch to get the new data
        await fetchVPC();
        return true;
      } catch (err) {
        console.error('[useVPC] Error initializing from CrewAI:', err);
        setError(err as Error);
        return false;
      } finally {
        setIsInitializing(false);
      }
    },
    [projectId, fetchVPC]
  );

  // ============================================================================
  // SAVE SEGMENT (internal helper)
  // ============================================================================

  const saveSegment = useCallback(
    async (segmentData: Partial<ValuePropositionCanvas> & { segmentKey: string; segmentName: string }) => {
      if (!projectId || !user) {
        throw new Error('Project ID and user required');
      }

      const response = await fetch(`/api/vpc/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save VPC segment');
      }

      return data.data?.segment;
    },
    [projectId, user]
  );

  // ============================================================================
  // UPDATE BLOCK (internal helper)
  // ============================================================================

  const updateBlock = useCallback(
    async <T extends object>(
      blockKey: VPCBlockKey,
      items: T[]
    ) => {
      if (!activeSegment) {
        setError(new Error('No active segment selected'));
        return;
      }

      try {
        setIsSaving(true);
        setError(null);

        // Determine new source based on items
        const hasCrewAI = items.some((item: any) => item.source === 'crewai');
        const hasManual = items.some((item: any) => item.source === 'manual');
        const newSource: VPCSource = hasCrewAI && hasManual ? 'hybrid' : hasManual ? 'manual' : 'crewai';

        await saveSegment({
          segmentKey: activeSegment.segmentKey,
          segmentName: activeSegment.segmentName,
          source: newSource,
          [blockKey]: items,
        });

        // Refetch to get updated data
        await fetchVPC();
      } catch (err) {
        console.error(`[useVPC] Error updating ${blockKey}:`, err);
        setError(err as Error);
      } finally {
        setIsSaving(false);
      }
    },
    [activeSegment, saveSegment, fetchVPC]
  );

  // ============================================================================
  // JOBS CRUD
  // ============================================================================

  const addJob = useCallback(
    async (job: Omit<VPCJobItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => {
      const currentJobs = (activeSegment?.jobs as VPCJobItem[]) || [];
      const newJob: VPCJobItem = {
        ...job,
        id: generateId(),
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('jobs', [...currentJobs, newJob]);
    },
    [activeSegment, updateBlock]
  );

  const updateJob = useCallback(
    async (jobId: string, updates: Partial<VPCJobItem>) => {
      const currentJobs = (activeSegment?.jobs as VPCJobItem[]) || [];
      const updatedJobs = currentJobs.map((job) =>
        job.id === jobId
          ? { ...job, ...updates, source: 'manual' as const, updatedAt: now() }
          : job
      );
      await updateBlock('jobs', updatedJobs);
    },
    [activeSegment, updateBlock]
  );

  const removeJob = useCallback(
    async (jobId: string) => {
      const currentJobs = (activeSegment?.jobs as VPCJobItem[]) || [];
      const filteredJobs = currentJobs.filter((job) => job.id !== jobId);
      await updateBlock('jobs', filteredJobs);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // PAINS CRUD
  // ============================================================================

  const addPain = useCallback(
    async (pain: Omit<VPCPainItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => {
      const currentPains = (activeSegment?.pains as VPCPainItem[]) || [];
      const newPain: VPCPainItem = {
        ...pain,
        id: generateId(),
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('pains', [...currentPains, newPain]);
    },
    [activeSegment, updateBlock]
  );

  const updatePain = useCallback(
    async (painId: string, updates: Partial<VPCPainItem>) => {
      const currentPains = (activeSegment?.pains as VPCPainItem[]) || [];
      const updatedPains = currentPains.map((pain) =>
        pain.id === painId
          ? { ...pain, ...updates, source: 'manual' as const, updatedAt: now() }
          : pain
      );
      await updateBlock('pains', updatedPains);
    },
    [activeSegment, updateBlock]
  );

  const removePain = useCallback(
    async (painId: string) => {
      const currentPains = (activeSegment?.pains as VPCPainItem[]) || [];
      const filteredPains = currentPains.filter((pain) => pain.id !== painId);
      await updateBlock('pains', filteredPains);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // GAINS CRUD
  // ============================================================================

  const addGain = useCallback(
    async (gain: Omit<VPCGainItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => {
      const currentGains = (activeSegment?.gains as VPCGainItem[]) || [];
      const newGain: VPCGainItem = {
        ...gain,
        id: generateId(),
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('gains', [...currentGains, newGain]);
    },
    [activeSegment, updateBlock]
  );

  const updateGain = useCallback(
    async (gainId: string, updates: Partial<VPCGainItem>) => {
      const currentGains = (activeSegment?.gains as VPCGainItem[]) || [];
      const updatedGains = currentGains.map((gain) =>
        gain.id === gainId
          ? { ...gain, ...updates, source: 'manual' as const, updatedAt: now() }
          : gain
      );
      await updateBlock('gains', updatedGains);
    },
    [activeSegment, updateBlock]
  );

  const removeGain = useCallback(
    async (gainId: string) => {
      const currentGains = (activeSegment?.gains as VPCGainItem[]) || [];
      const filteredGains = currentGains.filter((gain) => gain.id !== gainId);
      await updateBlock('gains', filteredGains);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // PRODUCTS & SERVICES CRUD
  // ============================================================================

  const addProductOrService = useCallback(
    async (text: string) => {
      const currentItems = (activeSegment?.productsAndServices as VPCItem[]) || [];
      const newItem: VPCItem = {
        id: generateId(),
        text,
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('productsAndServices', [...currentItems, newItem]);
    },
    [activeSegment, updateBlock]
  );

  const updateProductOrService = useCallback(
    async (itemId: string, text: string) => {
      const currentItems = (activeSegment?.productsAndServices as VPCItem[]) || [];
      const updatedItems = currentItems.map((item) =>
        item.id === itemId
          ? { ...item, text, source: 'manual' as const, updatedAt: now() }
          : item
      );
      await updateBlock('productsAndServices', updatedItems);
    },
    [activeSegment, updateBlock]
  );

  const removeProductOrService = useCallback(
    async (itemId: string) => {
      const currentItems = (activeSegment?.productsAndServices as VPCItem[]) || [];
      const filteredItems = currentItems.filter((item) => item.id !== itemId);
      await updateBlock('productsAndServices', filteredItems);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // PAIN RELIEVERS CRUD
  // ============================================================================

  const addPainReliever = useCallback(
    async (painReliever: Omit<VPCPainRelieverItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => {
      const currentItems = (activeSegment?.painRelievers as VPCPainRelieverItem[]) || [];
      const newItem: VPCPainRelieverItem = {
        ...painReliever,
        id: generateId(),
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('painRelievers', [...currentItems, newItem]);
    },
    [activeSegment, updateBlock]
  );

  const updatePainReliever = useCallback(
    async (itemId: string, updates: Partial<VPCPainRelieverItem>) => {
      const currentItems = (activeSegment?.painRelievers as VPCPainRelieverItem[]) || [];
      const updatedItems = currentItems.map((item) =>
        item.id === itemId
          ? { ...item, ...updates, source: 'manual' as const, updatedAt: now() }
          : item
      );
      await updateBlock('painRelievers', updatedItems);
    },
    [activeSegment, updateBlock]
  );

  const removePainReliever = useCallback(
    async (itemId: string) => {
      const currentItems = (activeSegment?.painRelievers as VPCPainRelieverItem[]) || [];
      const filteredItems = currentItems.filter((item) => item.id !== itemId);
      await updateBlock('painRelievers', filteredItems);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // GAIN CREATORS CRUD
  // ============================================================================

  const addGainCreator = useCallback(
    async (gainCreator: Omit<VPCGainCreatorItem, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => {
      const currentItems = (activeSegment?.gainCreators as VPCGainCreatorItem[]) || [];
      const newItem: VPCGainCreatorItem = {
        ...gainCreator,
        id: generateId(),
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('gainCreators', [...currentItems, newItem]);
    },
    [activeSegment, updateBlock]
  );

  const updateGainCreator = useCallback(
    async (itemId: string, updates: Partial<VPCGainCreatorItem>) => {
      const currentItems = (activeSegment?.gainCreators as VPCGainCreatorItem[]) || [];
      const updatedItems = currentItems.map((item) =>
        item.id === itemId
          ? { ...item, ...updates, source: 'manual' as const, updatedAt: now() }
          : item
      );
      await updateBlock('gainCreators', updatedItems);
    },
    [activeSegment, updateBlock]
  );

  const removeGainCreator = useCallback(
    async (itemId: string) => {
      const currentItems = (activeSegment?.gainCreators as VPCGainCreatorItem[]) || [];
      const filteredItems = currentItems.filter((item) => item.id !== itemId);
      await updateBlock('gainCreators', filteredItems);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // DIFFERENTIATORS CRUD
  // ============================================================================

  const addDifferentiator = useCallback(
    async (text: string) => {
      const currentItems = (activeSegment?.differentiators as VPCItem[]) || [];
      const newItem: VPCItem = {
        id: generateId(),
        text,
        source: 'manual',
        createdAt: now(),
        updatedAt: now(),
      };
      await updateBlock('differentiators', [...currentItems, newItem]);
    },
    [activeSegment, updateBlock]
  );

  const updateDifferentiator = useCallback(
    async (itemId: string, text: string) => {
      const currentItems = (activeSegment?.differentiators as VPCItem[]) || [];
      const updatedItems = currentItems.map((item) =>
        item.id === itemId
          ? { ...item, text, source: 'manual' as const, updatedAt: now() }
          : item
      );
      await updateBlock('differentiators', updatedItems);
    },
    [activeSegment, updateBlock]
  );

  const removeDifferentiator = useCallback(
    async (itemId: string) => {
      const currentItems = (activeSegment?.differentiators as VPCItem[]) || [];
      const filteredItems = currentItems.filter((item) => item.id !== itemId);
      await updateBlock('differentiators', filteredItems);
    },
    [activeSegment, updateBlock]
  );

  // ============================================================================
  // RESET TO CREWAI
  // ============================================================================

  const resetToCrewAI = useCallback(async () => {
    if (!activeSegment?.originalCrewaiData) {
      setError(new Error('No original CrewAI data available'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const original = activeSegment.originalCrewaiData as any;

      await saveSegment({
        segmentKey: activeSegment.segmentKey,
        segmentName: activeSegment.segmentName,
        source: 'crewai',
        jobs: original.jobs || [],
        pains: original.pains || [],
        gains: original.gains || [],
        productsAndServices: original.productsAndServices || [],
        painRelievers: original.painRelievers || [],
        gainCreators: original.gainCreators || [],
        differentiators: original.differentiators || [],
        resonanceScore: original.resonanceScore,
      });

      await fetchVPC();
    } catch (err) {
      console.error('[useVPC] Error resetting to CrewAI:', err);
      setError(err as Error);
    } finally {
      setIsSaving(false);
    }
  }, [activeSegment, saveSegment, fetchVPC]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch
  useEffect(() => {
    fetchVPC();
  }, [fetchVPC]);

  // Auto-initialize if enabled and no data
  useEffect(() => {
    if (autoInitialize && !isLoading && !hasData && projectId) {
      initializeFromCrewAI();
    }
  }, [autoInitialize, isLoading, hasData, projectId, initializeFromCrewAI]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    segments,
    activeSegment,
    activeSegmentKey,
    isLoading,
    isSaving,
    isInitializing,
    error,
    hasData,
    setActiveSegmentKey,
    segmentKeys,
    refetch: fetchVPC,
    initializeFromCrewAI,

    // Jobs
    addJob,
    updateJob,
    removeJob,

    // Pains
    addPain,
    updatePain,
    removePain,

    // Gains
    addGain,
    updateGain,
    removeGain,

    // Products & Services
    addProductOrService,
    updateProductOrService,
    removeProductOrService,

    // Pain Relievers
    addPainReliever,
    updatePainReliever,
    removePainReliever,

    // Gain Creators
    addGainCreator,
    updateGainCreator,
    removeGainCreator,

    // Differentiators
    addDifferentiator,
    updateDifferentiator,
    removeDifferentiator,

    // Reset
    resetToCrewAI,
  };
}

export default useVPC;
