/**
 * Public Metrics API
 *
 * GET /api/v1/public/metrics
 *
 * Returns platform-wide and per-founder statistics.
 * No authentication required - data is aggregate/anonymized.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

// Cache control: 5 minutes
const CACHE_MAX_AGE = 300;

// Response types matching the API contract
interface PlatformMetrics {
  validations_completed: number;
  projects_analyzed: number;
  hypotheses_tested: number;
  evidence_collected: number;
  updated_at: string;
}

interface FounderStats {
  founder_id: string;
  analyses_completed: number;
  specialty: string;
  updated_at: string;
}

// Map founder IDs to their specialties
const FOUNDER_SPECIALTIES: Record<string, string> = {
  sage: 'Strategy & Analysis',
  forge: 'Technical Feasibility',
  pulse: 'Growth & Testing',
  compass: 'Synthesis & Balance',
  guardian: 'Governance & QA',
  ledger: 'Finance & Viability',
};

export async function GET() {
  try {
    const admin = createClient();
    const now = new Date().toISOString();

    // Execute all count queries in parallel for performance
    const [validationsResult, projectsResult, hypothesesResult, evidenceResult, founderActivityResult] =
      await Promise.all([
        // Count completed validations (from crewai_validation_states)
        admin.from('crewai_validation_states').select('id', { count: 'exact', head: true }),

        // Count analyzed projects (active status)
        admin.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),

        // Count tested hypotheses (validated or invalidated)
        admin
          .from('hypotheses')
          .select('id', { count: 'exact', head: true })
          .in('status', ['validated', 'invalidated']),

        // Count evidence collected
        admin.from('evidence').select('id', { count: 'exact', head: true }),

        // Get activities per founder for stats
        admin.from('public_activity_log').select('founder_id'),
      ]);

    // Check for critical errors
    if (
      validationsResult.error ||
      projectsResult.error ||
      hypothesesResult.error ||
      evidenceResult.error
    ) {
      console.error('[api/v1/public/metrics] Query errors:', {
        validations: validationsResult.error,
        projects: projectsResult.error,
        hypotheses: hypothesesResult.error,
        evidence: evidenceResult.error,
      });
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Build platform metrics
    const platformMetrics: PlatformMetrics = {
      validations_completed: validationsResult.count || 0,
      projects_analyzed: projectsResult.count || 0,
      hypotheses_tested: hypothesesResult.count || 0,
      evidence_collected: evidenceResult.count || 0,
      updated_at: now,
    };

    // Aggregate founder activity counts
    const founderCounts: Record<string, number> = {};
    if (founderActivityResult.data) {
      for (const row of founderActivityResult.data) {
        const fid = row.founder_id as string;
        founderCounts[fid] = (founderCounts[fid] || 0) + 1;
      }
    }

    // Build per-founder stats (all 6 founders, even if 0 activities)
    const founderStats: FounderStats[] = Object.entries(FOUNDER_SPECIALTIES).map(
      ([founder_id, specialty]) => ({
        founder_id,
        analyses_completed: founderCounts[founder_id] || 0,
        specialty,
        updated_at: now,
      })
    );

    // Return with CORS and caching headers
    return NextResponse.json(
      {
        success: true,
        data: {
          platform: platformMetrics,
          founders: founderStats,
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/public/metrics] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
