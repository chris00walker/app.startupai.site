/**
 * useClients Hook
 *
 * Hook for fetching and managing consultant clients with Supabase auth integration.
 * Clients are user_profiles with consultant_id set - they are founders working with a consultant.
 *
 * This hook fetches:
 * 1. User profiles (clients) assigned to the consultant
 * 2. Their projects
 * 3. CrewAI validation state for real metrics (signals, evidence, etc.)
 *
 * Transforms the data into PortfolioProject format for consultant dashboard display.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';
import type { PortfolioProject, ValidationStage, GateStatus } from '@/types/portfolio';
import type { DesirabilitySignal, FeasibilitySignal, ViabilitySignal } from '@/types/crewai';

// Database client type - user_profiles with consultant_id set
interface DbClient {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: string;
  consultant_id: string | null;
  created_at: string;
  updated_at: string;
}

// Project from database
interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Validation state from database
interface DbValidationState {
  id: string;
  project_id: string;
  phase: string;
  desirability_signal: string;
  feasibility_signal: string;
  viability_signal: string;
  human_approval_status: string;
  ad_spend: number | null;
  campaign_spend_usd: number | null;
  synthesis_confidence: number | null;
  updated_at: string;
}

// Map phase/signals to validation stage
function mapToValidationStage(
  phase: string | null,
  desirabilitySignal: DesirabilitySignal | null,
  feasibilitySignal: FeasibilitySignal | null,
  viabilitySignal: ViabilitySignal | null
): ValidationStage {
  // If we have viability data, we're in viability stage
  if (viabilitySignal && viabilitySignal !== 'unknown') {
    return 'VIABILITY';
  }

  // If we have feasibility data, we're in feasibility stage
  if (feasibilitySignal && feasibilitySignal !== 'unknown') {
    return 'FEASIBILITY';
  }

  // If we have desirability data, we're in desirability stage
  if (desirabilitySignal && desirabilitySignal !== 'no_signal') {
    return 'DESIRABILITY';
  }

  // Map phase string to stage
  const phaseMap: Record<string, ValidationStage> = {
    ideation: 'DESIRABILITY',
    desirability: 'DESIRABILITY',
    feasibility: 'FEASIBILITY',
    viability: 'VIABILITY',
    validated: 'VIABILITY',
    killed: 'DESIRABILITY',
  };

  return phaseMap[phase || 'ideation'] || 'DESIRABILITY';
}

// Map signals to gate status
function mapToGateStatus(
  desirabilitySignal: DesirabilitySignal | null,
  feasibilitySignal: FeasibilitySignal | null,
  viabilitySignal: ViabilitySignal | null,
  humanApprovalStatus: string | null
): GateStatus {
  // Check for pending human approval
  if (humanApprovalStatus === 'pending') {
    return 'Pending';
  }

  // Check for critical signals
  if (
    desirabilitySignal === 'no_interest' ||
    feasibilitySignal === 'red_impossible' ||
    viabilitySignal === 'underwater'
  ) {
    return 'At Risk';
  }

  // Check for warning signals
  if (
    desirabilitySignal === 'weak_interest' ||
    feasibilitySignal === 'orange_constrained' ||
    viabilitySignal === 'marginal' ||
    viabilitySignal === 'zombie_market'
  ) {
    return 'At Risk';
  }

  // Check for positive signals
  if (
    desirabilitySignal === 'strong_commitment' ||
    feasibilitySignal === 'green' ||
    viabilitySignal === 'profitable'
  ) {
    return 'Passed';
  }

  return 'Pending';
}

// Calculate evidence quality from synthesis confidence
function calculateEvidenceQuality(confidence: number | null): number {
  if (!confidence) return 0;
  // Confidence is 0-1, convert to 0-100
  return Math.round(confidence * 100);
}

// Format date as relative time (e.g., "2 hours ago")
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
}

export function useClients() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchClients = useCallback(async () => {
    if (authLoading) {
      console.log('[useClients] Still loading auth...');
      return;
    }

    if (!user) {
      console.log('[useClients] No user found, returning empty clients');
      setClients([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[useClients] Fetching clients for user:', user.id, user.email);
      setIsLoading(true);

      // Step 1: Get all clients (user_profiles) assigned to this consultant
      const { data: clientData, error: clientError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, company, role, consultant_id, created_at, updated_at')
        .eq('consultant_id', user.id)
        .order('updated_at', { ascending: false });

      if (clientError) throw clientError;

      const dbClients = clientData as DbClient[] || [];
      console.log('[useClients] Fetched clients:', dbClients.length);

      if (dbClients.length === 0) {
        setClients([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Step 2: Get all projects for these clients
      const clientIds = dbClients.map(c => c.id);
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id, name, description, status, created_at, updated_at')
        .in('user_id', clientIds);

      if (projectError) throw projectError;

      const dbProjects = projectData as DbProject[] || [];
      console.log('[useClients] Fetched projects:', dbProjects.length);

      // Step 3: Get validation states for these projects
      const projectIds = dbProjects.map(p => p.id);
      let validationStates: DbValidationState[] = [];

      if (projectIds.length > 0) {
        const { data: stateData, error: stateError } = await supabase
          .from('crewai_validation_states')
          .select(`
            id, project_id, phase,
            desirability_signal, feasibility_signal, viability_signal,
            human_approval_status, ad_spend, campaign_spend_usd,
            synthesis_confidence, updated_at
          `)
          .in('project_id', projectIds);

        if (stateError) {
          console.warn('[useClients] Error fetching validation states:', stateError);
          // Continue without validation states
        } else {
          validationStates = stateData as DbValidationState[] || [];
          console.log('[useClients] Fetched validation states:', validationStates.length);
        }
      }

      // Create lookup maps
      const projectsByUser = new Map<string, DbProject[]>();
      for (const project of dbProjects) {
        const existing = projectsByUser.get(project.user_id) || [];
        existing.push(project);
        projectsByUser.set(project.user_id, existing);
      }

      const stateByProject = new Map<string, DbValidationState>();
      for (const state of validationStates) {
        stateByProject.set(state.project_id, state);
      }

      // Transform to PortfolioProject
      const portfolioProjects: PortfolioProject[] = [];

      for (const client of dbClients) {
        const clientProjects = projectsByUser.get(client.id) || [];

        if (clientProjects.length === 0) {
          // Client has no projects yet - show placeholder
          portfolioProjects.push({
            id: client.id,
            clientName: client.company || client.full_name || client.email,
            stage: 'DESIRABILITY',
            gateStatus: 'Pending',
            riskBudget: { planned: 100, actual: 0, delta: 0 },
            lastActivity: formatRelativeTime(new Date(client.updated_at)),
            assignedConsultant: 'You',
            evidenceQuality: 0,
            hypothesesCount: 0,
            experimentsCount: 0,
            evidenceCount: 0,
          });
        } else {
          // Create an entry for each project
          for (const project of clientProjects) {
            const state = stateByProject.get(project.id);

            const desirabilitySignal = (state?.desirability_signal as DesirabilitySignal) || null;
            const feasibilitySignal = (state?.feasibility_signal as FeasibilitySignal) || null;
            const viabilitySignal = (state?.viability_signal as ViabilitySignal) || null;

            const stage = mapToValidationStage(
              state?.phase || null,
              desirabilitySignal,
              feasibilitySignal,
              viabilitySignal
            );

            const gateStatus = mapToGateStatus(
              desirabilitySignal,
              feasibilitySignal,
              viabilitySignal,
              state?.human_approval_status || null
            );

            // Calculate actual spend from validation state
            const actualSpend = (state?.ad_spend || 0) + (state?.campaign_spend_usd || 0);

            portfolioProjects.push({
              id: project.id,
              clientName: `${client.company || client.full_name || client.email} - ${project.name}`,
              stage,
              gateStatus,
              riskBudget: {
                planned: 100, // Default budget - could be stored per-project
                actual: actualSpend,
                delta: actualSpend - 100,
              },
              lastActivity: formatRelativeTime(
                new Date(state?.updated_at || project.updated_at)
              ),
              assignedConsultant: 'You',
              evidenceQuality: calculateEvidenceQuality(state?.synthesis_confidence || null),
              hypothesesCount: 0, // TODO: Add hypotheses count when table is available
              experimentsCount: 0, // TODO: Add experiments count when table is available
              evidenceCount: 0, // TODO: Add evidence count when table is available
            });
          }
        }
      }

      setClients(portfolioProjects);
      setError(null);
    } catch (err) {
      console.error('[useClients] Error fetching clients:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, supabase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    projects: clients, // Return as 'projects' for compatibility with dashboard
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchClients,
  };
}
