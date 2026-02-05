/**
 * useNarrative Hook
 *
 * Client-side hook for narrative generation, fetching, and management.
 * Uses fetch() to call narrative API routes.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PitchNarrative, PitchNarrativeContent } from '@/lib/narrative/types';

// --- Types ---

interface NarrativeState {
  narrative: PitchNarrative | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generatedFrom: 'cache' | 'generation' | null;
}

interface GenerateOptions {
  force_regenerate?: boolean;
  preserve_edits?: boolean;
}

interface UseNarrativeOptions {
  projectId: string | undefined;
  autoFetch?: boolean;
}

interface NarrativeGenerateResponse {
  narrative_id: string;
  pitch_narrative: PitchNarrative;
  is_fresh: boolean;
  generated_from: 'cache' | 'generation';
}

interface NarrativeErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// --- Hook ---

export function useNarrative({ projectId, autoFetch = true }: UseNarrativeOptions) {
  const [state, setState] = useState<NarrativeState>({
    narrative: null,
    isLoading: false,
    isGenerating: false,
    error: null,
    generatedFrom: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  // Fetch existing narrative (read-only, no generation)
  const fetchNarrative = useCallback(async () => {
    if (!projectId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try to get cached narrative via generate endpoint with no force
      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (response.status === 404) {
        // Feature not enabled
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Narrative layer is not enabled',
        }));
        return;
      }

      if (response.status === 400) {
        const data = await response.json() as NarrativeErrorResponse;
        if (data.error?.code === 'INSUFFICIENT_EVIDENCE') {
          // Not enough evidence yet - expected state
          setState(prev => ({
            ...prev,
            isLoading: false,
            narrative: null,
            error: null,
          }));
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json() as NarrativeErrorResponse;
        throw new Error(data.error?.message || 'Failed to fetch narrative');
      }

      const data = await response.json() as NarrativeGenerateResponse;
      setState({
        narrative: data.pitch_narrative,
        isLoading: false,
        isGenerating: false,
        error: null,
        generatedFrom: data.generated_from,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [projectId]);

  // Generate or regenerate narrative
  const generate = useCallback(async (options: GenerateOptions = {}) => {
    if (!projectId) return;

    // Cancel any pending request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const endpoint = options.force_regenerate
        ? '/api/narrative/regenerate'
        : '/api/narrative/generate';

      const body = options.force_regenerate
        ? { project_id: projectId, preserve_edits: options.preserve_edits ?? false }
        : { project_id: projectId, force_regenerate: true };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json() as NarrativeErrorResponse;
        throw new Error(data.error?.message || 'Failed to generate narrative');
      }

      const data = await response.json() as NarrativeGenerateResponse;
      setState({
        narrative: data.pitch_narrative,
        isLoading: false,
        isGenerating: false,
        error: null,
        generatedFrom: data.generated_from,
      });

      return data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err instanceof Error ? err.message : 'Generation failed',
      }));
    }
  }, [projectId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && projectId) {
      fetchNarrative();
    }
  }, [autoFetch, projectId, fetchNarrative]);

  // Cleanup abort controller
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    ...state,
    fetchNarrative,
    generate,
  };
}

// --- Prerequisites Hook ---

interface PrerequisiteStatus {
  project: boolean;
  hypothesis: boolean;
  customer_profile: boolean;
  vpc: boolean;
}

export function useNarrativePrerequisites(projectId: string | undefined) {
  const [prerequisites, setPrerequisites] = useState<PrerequisiteStatus>({
    project: false,
    hypothesis: false,
    customer_profile: false,
    vpc: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    async function check() {
      setIsLoading(true);
      try {
        // Try generating — if INSUFFICIENT_EVIDENCE, parse missing items
        const response = await fetch('/api/narrative/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId }),
        });

        if (response.ok) {
          // All prerequisites met
          setPrerequisites({
            project: true,
            hypothesis: true,
            customer_profile: true,
            vpc: true,
          });
        } else {
          const data = await response.json() as NarrativeErrorResponse;
          if (data.error?.code === 'INSUFFICIENT_EVIDENCE') {
            const missing = (data.error.details?.missing as string[]) || [];
            setPrerequisites({
              project: !missing.includes('project'),
              hypothesis: !missing.includes('hypothesis'),
              customer_profile: !missing.includes('customer_profile'),
              vpc: !missing.includes('vpc'),
            });
          }
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [projectId]);

  const allMet = Object.values(prerequisites).every(Boolean);
  const completedCount = Object.values(prerequisites).filter(Boolean).length;

  return {
    prerequisites,
    allMet,
    completedCount,
    total: 4,
    isLoading,
  };
}

// --- Founder Profile Hook ---

interface FounderProfile {
  id: string;
  user_id: string;
  professional_summary: string | null;
  domain_expertise: string[];
  previous_ventures: unknown[];
  linkedin_url: string | null;
  company_website: string | null;
  years_experience: number | null;
}

interface FounderProfileResponse {
  profile: FounderProfile | null;
  completeness: number;
  missing_fields: string[];
}

export function useFounderProfile() {
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [completeness, setCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/founder/profile');
      if (response.status === 404) {
        // Feature not enabled
        setIsLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json() as FounderProfileResponse;
      setProfile(data.profile);
      setCompleteness(data.completeness);
      setMissingFields(data.missing_fields);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<FounderProfile>) => {
    try {
      const response = await fetch('/api/founder/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json() as FounderProfileResponse;
      setProfile(data.profile);
      setCompleteness(data.completeness);
      setMissingFields(data.missing_fields);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    completeness,
    missingFields,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}

// --- Export Hook ---

interface ExportResult {
  success: boolean;
  export_id: string;
  verification_token: string;
  generation_hash: string;
  verification_url: string;
  download_url: string;
  expires_at: string;
}

export function useNarrativeExport(narrativeId: string | undefined) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async (includeQrCode = true) => {
    if (!narrativeId) return;

    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/narrative/${narrativeId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          include_qr_code: includeQrCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as NarrativeErrorResponse;
        throw new Error(data.error?.message || 'Export failed');
      }

      const data = await response.json() as ExportResult;
      setLastExport(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [narrativeId]);

  return {
    exportPdf,
    isExporting,
    lastExport,
    error,
  };
}
