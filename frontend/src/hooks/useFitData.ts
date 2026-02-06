/**
 * @story US-C03, US-C04, US-F06, US-F16
 */
/**
 * useFitData Hook
 *
 * Fetches fit assessment data from the database for FitDashboard.
 * Calculates desirability, feasibility, and viability scores from evidence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FitData {
  score: number;
  band: "High Fit" | "Medium Fit" | "Low Fit";
  confidence: "High confidence" | "Medium confidence" | "Low confidence";
  isLocked?: boolean;
  assumptions: Array<{
    id: string;
    description: string;
    strength: "weak" | "medium" | "strong";
    evidenceCount: number;
  }>;
  evidenceCounts: {
    supporting: number;
    contradicting: number;
  };
  qaInsights: Array<{
    id: string;
    type: "satisfaction" | "validation" | "copy";
    title: string;
    description: string;
  }>;
}

export interface FitDataResult {
  desirability: FitData;
  feasibility: FitData;
  viability: FitData;
}

interface EvidenceRecord {
  id: string;
  fit_type: 'Desirability' | 'Feasibility' | 'Viability' | null;
  strength: 'weak' | 'medium' | 'strong' | null;
  is_contradiction: boolean | null;
  content: string;
  title: string | null;
}

interface ReportRecord {
  id: string;
  report_type: string;
  content: Record<string, unknown>;
}

function calculateScore(supporting: number, contradicting: number, total: number): number {
  if (total === 0) return 0;
  // Score based on supporting evidence ratio, penalized by contradictions
  const supportRatio = supporting / total;
  const contradictionPenalty = contradicting * 0.1; // Each contradiction reduces score by 10%
  return Math.max(0, Math.min(100, Math.round(supportRatio * 100 - contradictionPenalty * 100)));
}

function getBand(score: number): "High Fit" | "Medium Fit" | "Low Fit" {
  if (score >= 70) return "High Fit";
  if (score >= 40) return "Medium Fit";
  return "Low Fit";
}

function getConfidence(evidenceCount: number): "High confidence" | "Medium confidence" | "Low confidence" {
  if (evidenceCount >= 10) return "High confidence";
  if (evidenceCount >= 5) return "Medium confidence";
  return "Low confidence";
}

function createEmptyFitData(isLocked = false): FitData {
  return {
    score: 0,
    band: "Low Fit",
    confidence: "Low confidence",
    isLocked,
    assumptions: [],
    evidenceCounts: { supporting: 0, contradicting: 0 },
    qaInsights: [],
  };
}

export function useFitData(projectId: string | undefined) {
  const [data, setData] = useState<FitDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch evidence for this project
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('id, fit_type, strength, is_contradiction, content, title')
        .eq('project_id', projectId);

      if (evidenceError) throw evidenceError;

      // Fetch reports for insights
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id, report_type, content')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false });

      if (reportsError) throw reportsError;

      const evidence = (evidenceData || []) as EvidenceRecord[];
      const reports = (reportsData || []) as ReportRecord[];

      // Process evidence by fit type
      const evidenceByType = {
        Desirability: evidence.filter(e => e.fit_type === 'Desirability'),
        Feasibility: evidence.filter(e => e.fit_type === 'Feasibility'),
        Viability: evidence.filter(e => e.fit_type === 'Viability'),
      };

      // Calculate fit data for each dimension
      const calculateFitDataForType = (
        typeEvidence: EvidenceRecord[],
        isLocked: boolean
      ): FitData => {
        if (isLocked) return createEmptyFitData(true);

        const supporting = typeEvidence.filter(e => !e.is_contradiction).length;
        const contradicting = typeEvidence.filter(e => e.is_contradiction).length;
        const total = typeEvidence.length;

        const score = calculateScore(supporting, contradicting, total);

        // Group evidence by content similarity to create "assumptions"
        const assumptions = typeEvidence
          .filter(e => !e.is_contradiction)
          .slice(0, 5)
          .map((e, i) => ({
            id: e.id,
            description: e.title || e.content.substring(0, 100) + '...',
            strength: e.strength || 'medium' as const,
            evidenceCount: 1,
          }));

        // Extract insights from reports (from content JSONB)
        const qaInsights: FitData['qaInsights'] = [];
        const latestReport = reports[0];
        if (latestReport?.content) {
          const content = latestReport.content as Record<string, unknown>;
          const insights = content.insights as string[] | undefined;
          if (insights) {
            qaInsights.push(...insights.slice(0, 3).map((insight, i) => ({
              id: `insight-${i}`,
              type: 'validation' as const,
              title: insight,
              description: '',
            })));
          }
        }

        return {
          score,
          band: getBand(score),
          confidence: getConfidence(total),
          assumptions,
          evidenceCounts: { supporting, contradicting },
          qaInsights,
        };
      };

      // Determine lock status based on evidence progression
      const hasDesirabilityEvidence = evidenceByType.Desirability.length > 0;
      const hasFeasibilityEvidence = evidenceByType.Feasibility.length > 0;

      // Viability is locked until feasibility has evidence
      // Feasibility is locked until desirability has evidence (commented out for now - less strict)
      const isFeasibilityLocked = false; // !hasDesirabilityEvidence
      const isViabilityLocked = !hasFeasibilityEvidence && !hasDesirabilityEvidence;

      setData({
        desirability: calculateFitDataForType(evidenceByType.Desirability, false),
        feasibility: calculateFitDataForType(evidenceByType.Feasibility, isFeasibilityLocked),
        viability: calculateFitDataForType(evidenceByType.Viability, isViabilityLocked),
      });
    } catch (err) {
      console.error('Error fetching fit data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to evidence changes
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`fit-data-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Re-fetch on any evidence change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchData, supabase]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
