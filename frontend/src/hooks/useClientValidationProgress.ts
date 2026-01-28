/**
 * @story US-C03
 */
/**
 * useClientValidationProgress Hook
 *
 * Fetches validation progress for all clients of a consultant.
 * Joins clients with their projects and reports to show validation status.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';

// Validation progress for a single client
export interface ClientValidationProgress {
  clientId: string;
  clientName: string;
  clientEmail: string;
  company: string | null;
  // Project info
  projectId: string | null;
  projectName: string | null;
  // Validation status
  currentPhase: 'IDEATION' | 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'VALIDATED' | null;
  gateStatus: 'Pending' | 'Passed' | 'Failed' | null;
  // Evidence metrics
  evidenceCount: number;
  evidenceQuality: number;
  // Report status
  hasReport: boolean;
  reportId: string | null;
  reportOutcome: string | null;
  pivotRecommendation: string | null;
  // Timestamps
  lastActivity: string;
  createdAt: string;
}

export interface UseClientValidationProgressResult {
  clients: ClientValidationProgress[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useClientValidationProgress(): UseClientValidationProgressResult {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientValidationProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchClientProgress = async () => {
    if (authLoading) return;

    if (!user) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Fetch clients (user_profiles linked to this consultant)
      const { data: clientsData, error: clientsError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          company,
          created_at,
          updated_at
        `)
        .eq('consultant_id', user.id)
        .order('updated_at', { ascending: false });

      if (clientsError) throw clientsError;

      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        setIsLoading(false);
        return;
      }

      // 2. For each client, fetch their projects and reports
      const clientProgress: ClientValidationProgress[] = await Promise.all(
        clientsData.map(async (client) => {
          // Fetch client's projects
          const { data: projects } = await supabase
            .from('projects')
            .select(`
              id,
              name,
              stage,
              gate_status,
              evidence_quality,
              evidence_count,
              updated_at
            `)
            .eq('user_id', client.id)
            .order('updated_at', { ascending: false })
            .limit(1);

          const project = projects?.[0] || null;

          // Fetch latest validation report for the project
          let report: { id: string; validation_outcome: string | null; pivot_recommendation: string | null; created_at: string } | null = null;
          if (project) {
            const { data: reports } = await supabase
              .from('reports')
              .select(`
                id,
                validation_outcome,
                pivot_recommendation,
                created_at
              `)
              .eq('project_id', project.id)
              .order('created_at', { ascending: false })
              .limit(1);

            report = reports?.[0] || null;
          }

          return {
            clientId: client.id,
            clientName: client.full_name || client.email,
            clientEmail: client.email,
            company: client.company,
            projectId: project?.id || null,
            projectName: project?.name || null,
            currentPhase: project?.stage || null,
            gateStatus: project?.gate_status || null,
            evidenceCount: project?.evidence_count || 0,
            evidenceQuality: project?.evidence_quality || 0,
            hasReport: !!report,
            reportId: report?.id || null,
            reportOutcome: report?.validation_outcome || null,
            pivotRecommendation: report?.pivot_recommendation || null,
            lastActivity: project?.updated_at || client.updated_at,
            createdAt: client.created_at,
          };
        })
      );

      setClients(clientProgress);
      setError(null);

    } catch (err) {
      console.error('[useClientValidationProgress] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientProgress();
  }, [user, authLoading]);

  return {
    clients,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchClientProgress,
  };
}

/**
 * Hook to get validation progress for a specific client.
 */
export function useClientProgress(clientId: string | null) {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<ClientValidationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProgress() {
      if (authLoading || !user || !clientId) {
        setProgress(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Verify this client belongs to the consultant
        const { data: client, error: clientError } = await supabase
          .from('user_profiles')
          .select(`
            id,
            email,
            full_name,
            company,
            consultant_id,
            created_at,
            updated_at
          `)
          .eq('id', clientId)
          .eq('consultant_id', user.id)
          .single();

        if (clientError || !client) {
          throw new Error('Client not found or not authorized');
        }

        // Fetch client's project
        const { data: projects } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            stage,
            gate_status,
            evidence_quality,
            evidence_count,
            updated_at
          `)
          .eq('user_id', clientId)
          .order('updated_at', { ascending: false })
          .limit(1);

        const project = projects?.[0] || null;

        // Fetch latest report
        let report: { id: string; validation_outcome: string | null; pivot_recommendation: string | null; evidence_summary: Record<string, unknown> | null; next_steps: string[] | null; created_at: string } | null = null;
        if (project) {
          const { data: reports } = await supabase
            .from('reports')
            .select(`
              id,
              validation_outcome,
              pivot_recommendation,
              evidence_summary,
              next_steps,
              created_at
            `)
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(1);

          report = reports?.[0] || null;
        }

        setProgress({
          clientId: client.id,
          clientName: client.full_name || client.email,
          clientEmail: client.email,
          company: client.company,
          projectId: project?.id || null,
          projectName: project?.name || null,
          currentPhase: project?.stage || null,
          gateStatus: project?.gate_status || null,
          evidenceCount: project?.evidence_count || 0,
          evidenceQuality: project?.evidence_quality || 0,
          hasReport: !!report,
          reportId: report?.id || null,
          reportOutcome: report?.validation_outcome || null,
          pivotRecommendation: report?.pivot_recommendation || null,
          lastActivity: project?.updated_at || client.updated_at,
          createdAt: client.created_at,
        });
        setError(null);

      } catch (err) {
        console.error('[useClientProgress] Error:', err);
        setError(err as Error);
        setProgress(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [user, authLoading, clientId, supabase]);

  return {
    progress,
    isLoading: isLoading || authLoading,
    error,
  };
}
