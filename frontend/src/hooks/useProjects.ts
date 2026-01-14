/**
 * useProjects Hook
 * 
 * Hook for fetching and managing user projects with Supabase auth integration
 * Uses Supabase client for browser-compatible queries
 * Returns full PortfolioProject structure from database
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';
import type { PortfolioProject } from '@/types/portfolio';

// Database project type (snake_case from Supabase)
interface DbProject {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  status: string;
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE';
  gate_status: 'Pending' | 'Passed' | 'Failed';
  risk_budget_planned: number;
  risk_budget_actual: number;
  risk_budget_delta: number;
  assigned_consultant: string | null;
  last_activity: string;
  next_gate_date: string | null;
  evidence_quality: number;
  hypotheses_count: number;
  experiments_count: number;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

// Transform database project to PortfolioProject
function transformProject(dbProject: DbProject): PortfolioProject {
  return {
    id: dbProject.id,
    clientName: dbProject.name,
    stage: dbProject.stage,
    gateStatus: dbProject.gate_status,
    riskBudget: {
      planned: Number(dbProject.risk_budget_planned),
      actual: Number(dbProject.risk_budget_actual),
      delta: Number(dbProject.risk_budget_delta),
    },
    lastActivity: formatRelativeTime(new Date(dbProject.last_activity)),
    assignedConsultant: dbProject.assigned_consultant || 'Unassigned',
    evidenceQuality: Number(dbProject.evidence_quality),
    nextGateDate: dbProject.next_gate_date 
      ? formatGateDate(new Date(dbProject.next_gate_date))
      : undefined,
    hypothesesCount: dbProject.hypotheses_count,
    experimentsCount: dbProject.experiments_count,
    evidenceCount: dbProject.evidence_count,
  };
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

// Format gate date (e.g., "Dec 15")
function formatGateDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

interface UseProjectsOptions {
  includeArchived?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { includeArchived = false } = options;
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProjects() {
      if (authLoading) return;

      if (!user) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let query = supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);

        // Filter out archived unless explicitly requested
        if (!includeArchived) {
          query = query.neq('status', 'archived');
        }

        const { data, error: fetchError } = await query
          .order('last_activity', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform database projects to PortfolioProject type
        const transformedProjects = (data as DbProject[] || []).map(transformProject);
        setProjects(transformedProjects);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [user, authLoading, supabase, includeArchived]);

  const refetch = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }

      const { data, error: fetchError } = await query
        .order('last_activity', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedProjects = (data as DbProject[] || []).map(transformProject);
      setProjects(transformedProjects);
    } catch (err) {
      console.error('Error refetching projects:', err);
      setError(err as Error);
    }
  };

  /**
   * Archive a project (soft delete)
   */
  const archiveProject = async (projectId: string): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to archive project');
    }

    await refetch();
  };

  /**
   * Unarchive a project (restore to active)
   */
  const unarchiveProject = async (projectId: string): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to unarchive project');
    }

    await refetch();
  };

  /**
   * Permanently delete a project
   * WARNING: This cascades to all related data (hypotheses, evidence, etc.)
   */
  const deleteProject = async (projectId: string): Promise<void> => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete project');
    }

    await refetch();
  };

  return {
    projects,
    isLoading: isLoading || authLoading,
    error,
    refetch,
    archiveProject,
    unarchiveProject,
    deleteProject,
  };
}

export function useActiveProjects() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProjects() {
      if (authLoading) return;
      
      if (!user) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('last_activity', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform database projects to PortfolioProject type
        const transformedProjects = (data as DbProject[] || []).map(transformProject);
        setProjects(transformedProjects);
        setError(null);
      } catch (err) {
        console.error('Error fetching active projects:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [user, authLoading, supabase]);

  return {
    projects,
    isLoading: isLoading || authLoading,
    error
  };
}
