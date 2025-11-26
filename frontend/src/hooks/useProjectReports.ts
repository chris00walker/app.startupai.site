/**
 * useProjectReports Hook
 *
 * Fetches AI analysis reports from the database for a project.
 * Supports real-time updates via Supabase subscriptions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ValidationReport {
  id: string;
  title: string;
  reportType: string;
  content: {
    validation_outcome?: string;
    evidence_summary?: string;
    pivot_recommendation?: string;
    next_steps?: string[];
    value_proposition_canvas?: Record<string, {
      customer_profile?: {
        jobs?: string[];
        pains?: string[];
        gains?: string[];
      };
      value_map?: {
        products_services?: string[];
        pain_relievers?: string[];
        gain_creators?: string[];
      };
    }>;
    qa_report?: {
      status?: string;
      issues?: string[];
      recommendations?: string[];
      framework_compliance?: number;
      logical_consistency?: number;
      completeness?: number;
    };
  };
  aiModel: string;
  generatedAt: string;
  metadata?: {
    kind?: string;
    validation_id?: string;
    kickoff_id?: string;
    completed_at?: string;
    evidence_phases?: {
      desirability?: boolean;
      feasibility?: boolean;
      viability?: boolean;
    };
  };
}

export interface ProjectReportsResult {
  reports: ValidationReport[];
  latestReport: ValidationReport | null;
  hasValidationResults: boolean;
}

interface DbReport {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  report_type: string;
  content: Record<string, unknown>;
  ai_model: string | null;
  generation_metadata: Record<string, unknown> | null;
  generated_at: string;
  created_at: string;
}

function transformReport(dbReport: DbReport): ValidationReport {
  return {
    id: dbReport.id,
    title: dbReport.title,
    reportType: dbReport.report_type,
    content: dbReport.content as ValidationReport['content'],
    aiModel: dbReport.ai_model || 'unknown',
    generatedAt: dbReport.generated_at,
    metadata: dbReport.generation_metadata as ValidationReport['metadata'],
  };
}

export function useProjectReports(projectId: string | undefined) {
  const [data, setData] = useState<ProjectReportsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    if (!projectId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false });

      if (reportsError) throw reportsError;

      const reports = ((reportsData || []) as DbReport[]).map(transformReport);

      // Find the latest validation report (crew_validation or value_proposition_analysis)
      const latestReport = reports.find(r =>
        r.metadata?.kind === 'crew_validation' ||
        r.reportType === 'value_proposition_analysis'
      ) || reports[0] || null;

      // Check if we have meaningful validation results
      const hasValidationResults = reports.some(r =>
        r.content?.validation_outcome ||
        r.content?.evidence_summary ||
        r.metadata?.evidence_phases
      );

      setData({
        reports,
        latestReport,
        hasValidationResults,
      });
    } catch (err) {
      console.error('Error fetching project reports:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Subscribe to report changes
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-reports-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Re-fetch when new report is added
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchReports, supabase]);

  return {
    ...data,
    reports: data?.reports || [],
    latestReport: data?.latestReport || null,
    hasValidationResults: data?.hasValidationResults || false,
    isLoading,
    error,
    refetch: fetchReports,
  };
}

export function useLatestValidationReport(projectId: string | undefined) {
  const { latestReport, isLoading, error, refetch } = useProjectReports(projectId);

  return {
    report: latestReport,
    isLoading,
    error,
    refetch,
    // Convenience accessors
    validationOutcome: latestReport?.content?.validation_outcome || null,
    evidenceSummary: latestReport?.content?.evidence_summary || null,
    pivotRecommendation: latestReport?.content?.pivot_recommendation || null,
    nextSteps: latestReport?.content?.next_steps || [],
    qaReport: latestReport?.content?.qa_report || null,
  };
}
