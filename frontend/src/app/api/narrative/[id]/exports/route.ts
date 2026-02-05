/**
 * Narrative Exports List API
 *
 * GET /api/narrative/:id/exports - List all exports for a narrative
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3264-3275
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  // Verify narrative ownership
  const { data: narrative } = await supabase
    .from('pitch_narratives')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized');
  }

  // Fetch exports
  const { data: exports, error: fetchError } = await supabase
    .from('narrative_exports')
    .select('id, verification_token, export_format, exported_at, qr_code_included, storage_path')
    .eq('narrative_id', id)
    .order('exported_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching exports:', fetchError);
    return narrativeError('INTERNAL_ERROR', 'Failed to fetch exports');
  }

  // Generate signed URLs for each export
  const adminClient = createAdminClient();
  const exportsWithUrls = await Promise.all(
    (exports ?? []).map(async (exp) => {
      const { data: signedUrl } = await adminClient
        .storage
        .from('narrative-exports')
        .createSignedUrl(exp.storage_path, 3600);

      return {
        export_id: exp.id,
        verification_token: exp.verification_token,
        export_format: exp.export_format,
        exported_at: exp.exported_at,
        qr_code_included: exp.qr_code_included,
        download_url: signedUrl?.signedUrl ?? '',
        download_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      };
    })
  );

  return NextResponse.json({ exports: exportsWithUrls });
}
