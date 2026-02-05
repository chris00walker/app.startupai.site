/**
 * Evidence Packages List API
 *
 * GET /api/evidence-packages?project_id&latest&primary - List evidence packages
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';

export async function GET(request: NextRequest) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');
  const latest = searchParams.get('latest') === 'true';
  const primary = searchParams.get('primary') === 'true';

  // Build query
  let query = supabase
    .from('evidence_packages')
    .select('id, project_id, founder_id, pitch_narrative_id, integrity_hash, is_public, is_primary, founder_consent, created_at, updated_at', { count: 'exact' });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (primary) {
    query = query.eq('is_primary', true);
  }

  query = query.order('created_at', { ascending: false });

  if (latest) {
    query = query.limit(1);
  }

  const { data: packages, error: fetchError, count } = await query;

  if (fetchError) {
    console.error('Error fetching evidence packages:', fetchError);
    return narrativeError('INTERNAL_ERROR', 'Failed to fetch packages');
  }

  return NextResponse.json({
    packages: packages ?? [],
    total: count ?? 0,
  });
}
