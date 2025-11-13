/**
 * useClients Hook
 *
 * Hook for fetching and managing consultant clients with Supabase auth integration
 * Transforms clients into PortfolioProject format for display on consultant dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';
import type { PortfolioProject } from '@/types/portfolio';

// Database client type (snake_case from Supabase)
interface DbClient {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  consultant_id: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Transform client to PortfolioProject for dashboard display
function transformClient(dbClient: DbClient): PortfolioProject {
  // Map client status to project stage
  const stageMap: Record<string, 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE'> = {
    'discovery': 'DESIRABILITY',
    'validation': 'FEASIBILITY',
    'scaling': 'VIABILITY',
    'optimization': 'SCALE'
  };

  return {
    id: dbClient.id,
    clientName: dbClient.company,
    stage: stageMap[dbClient.status] || 'DESIRABILITY',
    gateStatus: 'Pending',
    riskBudget: {
      planned: 100,
      actual: 0,
      delta: 0,
    },
    lastActivity: formatRelativeTime(new Date(dbClient.updated_at)),
    assignedConsultant: 'You',
    evidenceQuality: 0,
    nextGateDate: undefined,
    hypothesesCount: 0,
    experimentsCount: 0,
    evidenceCount: 0,
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

export function useClients() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchClients() {
      if (authLoading) return;

      if (!user) {
        setClients([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('consultant_id', user.id)
          .order('updated_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform database clients to PortfolioProject type for display
        const transformedClients = (data as DbClient[] || []).map(transformClient);
        setClients(transformedClients);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, [user, authLoading, supabase]);

  const refetch = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('consultant_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedClients = (data as DbClient[] || []).map(transformClient);
      setClients(transformedClients);
    } catch (err) {
      console.error('Error refetching clients:', err);
      setError(err as Error);
    }
  };

  return {
    projects: clients, // Return as 'projects' for compatibility with dashboard
    isLoading: isLoading || authLoading,
    error,
    refetch
  };
}
