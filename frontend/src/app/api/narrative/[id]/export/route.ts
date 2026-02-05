/**
 * Narrative Export API
 *
 * POST /api/narrative/:id/export - Generate PDF export with verification QR code
 *
 * Flow:
 * 1. Verify ownership
 * 2. Resolve evidence_package_id (prefer narrative-linked, fallback primary, 422 if none)
 * 3. Generate PDF with @react-pdf/renderer
 * 4. Upload to Supabase Storage (narrative-exports bucket)
 * 5. Create narrative_exports row with verification_token
 * 6. Return export metadata
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3196-3199
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { computeNarrativeHash } from '@/lib/narrative/hash';
import type { PitchNarrativeContent } from '@/lib/narrative/types';

const exportSchema = z.object({
  format: z.enum(['pdf', 'json']).default('pdf'),
  include_qr_code: z.boolean().optional().default(true),
});

export async function POST(
  request: NextRequest,
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

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return narrativeError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const result = exportSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid export request', {
      issues: result.error.issues,
    });
  }

  const { format, include_qr_code } = result.data;

  // Fetch narrative
  const { data: narrative, error: fetchError } = await supabase
    .from('pitch_narratives')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized to export this narrative');
  }

  // Resolve evidence_package_id per spec :3196-3199
  // 1. Prefer evidence_packages WHERE pitch_narrative_id = :narrative_id
  let { data: evidencePackage } = await supabase
    .from('evidence_packages')
    .select('id')
    .eq('pitch_narrative_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 2. Fallback to is_primary = TRUE for project
  if (!evidencePackage) {
    const { data: primaryPackage } = await supabase
      .from('evidence_packages')
      .select('id')
      .eq('project_id', narrative.project_id)
      .eq('is_primary', true)
      .single();

    evidencePackage = primaryPackage;
  }

  // 3. If none found, return 422
  if (!evidencePackage) {
    return narrativeError('EVIDENCE_PACKAGE_MISSING', 'No evidence package found for this narrative. Generate a narrative first to create one.');
  }

  // Compute generation hash
  const narrativeData = narrative.narrative_data as PitchNarrativeContent;
  const generationHash = computeNarrativeHash(narrativeData);

  // Get project info for snapshot
  const { data: project } = await supabase
    .from('projects')
    .select('name, validation_stage')
    .eq('id', narrative.project_id)
    .single();

  const ventureName = narrativeData.cover?.venture_name ?? project?.name ?? 'Untitled';
  const validationStage = project?.validation_stage ?? 'DESIRABILITY';

  // Generate export content
  let storagePath: string;
  const adminClient = createAdminClient();

  if (format === 'pdf') {
    // TODO: Implement full PDF generation with @react-pdf/renderer
    // For Phase 1, create a JSON placeholder stored as the export
    const exportContent = JSON.stringify({
      type: 'pdf_placeholder',
      narrative: narrativeData,
      generated_at: new Date().toISOString(),
    });

    storagePath = `narrative-exports/${id}/${crypto.randomUUID()}.json`;

    const { error: uploadError } = await adminClient
      .storage
      .from('narrative-exports')
      .upload(storagePath, exportContent, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading export:', uploadError);
      return narrativeError('INTERNAL_ERROR', 'Failed to upload export');
    }
  } else {
    // JSON export
    storagePath = `narrative-exports/${id}/${crypto.randomUUID()}.json`;

    const { error: uploadError } = await adminClient
      .storage
      .from('narrative-exports')
      .upload(storagePath, JSON.stringify(narrativeData), {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading JSON export:', uploadError);
      return narrativeError('INTERNAL_ERROR', 'Failed to upload export');
    }
  }

  // Create narrative_exports row (service role to bypass RLS for INSERT)
  const { data: exportRow, error: insertError } = await adminClient
    .from('narrative_exports')
    .insert({
      narrative_id: id,
      generation_hash: generationHash,
      evidence_package_id: evidencePackage.id,
      venture_name_at_export: ventureName,
      validation_stage_at_export: validationStage,
      export_format: format,
      storage_path: storagePath,
      qr_code_included: include_qr_code,
    })
    .select('id, verification_token, exported_at')
    .single();

  if (insertError || !exportRow) {
    console.error('Error creating export record:', insertError);
    return narrativeError('INTERNAL_ERROR', 'Failed to create export record');
  }

  // Generate signed download URL (1 hour expiry)
  const { data: signedUrl } = await adminClient
    .storage
    .from('narrative-exports')
    .createSignedUrl(storagePath, 3600);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.startupai.site';
  const verificationUrl = `${baseUrl}/verify/${exportRow.verification_token}`;

  return NextResponse.json({
    success: true,
    export_id: exportRow.id,
    verification_token: exportRow.verification_token,
    generation_hash: generationHash,
    verification_url: verificationUrl,
    download_url: signedUrl?.signedUrl ?? '',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
}
