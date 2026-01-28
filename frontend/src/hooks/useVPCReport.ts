/**
 * @story US-F06
 */
/**
 * useVPCReport Hook
 *
 * Fetches and transforms CrewAI Value Proposition Canvas data for UI display.
 * Composes useProjectReports and useFitData hooks with VPC transformer.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useProjectReports } from './useProjectReports';
import { useFitData, FitDataResult } from './useFitData';
import {
  transformCrewAIToVPC,
  VPCUISegment,
  CrewAIVPCData,
  hasSegmentData,
} from '@/lib/crewai/vpc-transformer';

export interface VPCReportMetadata {
  validationOutcome: string | null;
  evidenceSummary: string | null;
  pivotRecommendation: string | null;
  nextSteps: string[];
  generatedAt: string | null;
  reportId: string | null;
}

export interface UseVPCReportResult {
  // VPC Data
  segments: VPCUISegment[];
  activeSegment: VPCUISegment | null;
  activeSegmentIndex: number;
  setActiveSegmentIndex: (index: number) => void;

  // Fit Scores
  fitScores: FitDataResult | null;

  // Report Metadata
  reportMetadata: VPCReportMetadata;

  // State
  isLoading: boolean;
  error: Error | null;
  hasVPCData: boolean;
  segmentCount: number;

  // Actions
  refetch: () => void;
}

export function useVPCReport(projectId: string | undefined): UseVPCReportResult {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Fetch reports and fit data
  const {
    latestReport,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useProjectReports(projectId);

  const {
    data: fitData,
    isLoading: fitLoading,
    refetch: refetchFit,
  } = useFitData(projectId);

  // Transform CrewAI data to UI format
  const segments = useMemo(() => {
    const vpcData = latestReport?.content?.value_proposition_canvas as CrewAIVPCData | undefined;
    return transformCrewAIToVPC(vpcData);
  }, [latestReport]);

  // Get active segment with bounds checking
  const activeSegment = useMemo(() => {
    if (segments.length === 0) return null;
    const safeIndex = Math.min(activeSegmentIndex, segments.length - 1);
    return segments[safeIndex] || null;
  }, [segments, activeSegmentIndex]);

  // Check if we have meaningful VPC data
  const hasVPCData = useMemo(() => {
    return segments.length > 0 && segments.some(hasSegmentData);
  }, [segments]);

  // Extract report metadata
  const reportMetadata: VPCReportMetadata = useMemo(() => ({
    validationOutcome: latestReport?.content?.validation_outcome || null,
    evidenceSummary: latestReport?.content?.evidence_summary || null,
    pivotRecommendation: latestReport?.content?.pivot_recommendation || null,
    nextSteps: latestReport?.content?.next_steps || [],
    generatedAt: latestReport?.generatedAt || null,
    reportId: latestReport?.id || null,
  }), [latestReport]);

  // Combined refetch function
  const refetch = useCallback(() => {
    refetchReports();
    refetchFit();
  }, [refetchReports, refetchFit]);

  // Safe segment index setter with bounds checking
  const handleSetActiveSegmentIndex = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(index, segments.length - 1));
    setActiveSegmentIndex(safeIndex);
  }, [segments.length]);

  return {
    // VPC Data
    segments,
    activeSegment,
    activeSegmentIndex,
    setActiveSegmentIndex: handleSetActiveSegmentIndex,

    // Fit Scores
    fitScores: fitData,

    // Report Metadata
    reportMetadata,

    // State
    isLoading: reportsLoading || fitLoading,
    error: reportsError,
    hasVPCData,
    segmentCount: segments.length,

    // Actions
    refetch,
  };
}

// Re-export types for convenience
export type { VPCUISegment } from '@/lib/crewai/vpc-transformer';
