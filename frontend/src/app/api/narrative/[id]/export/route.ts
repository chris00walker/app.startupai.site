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
import React, { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { computeNarrativeHash } from '@/lib/narrative/hash';
import { trackNarrativeFunnelEvent } from '@/lib/narrative/access-tracking';
import { NarrativePdfDocument } from '@/lib/narrative/pdf-document';
import type { PitchNarrativeContent } from '@/lib/narrative/types';

// Ensure fonts are registered at module load
import '@/lib/narrative/pdf-fonts';

const SIGNED_URL_EXPIRY_SECONDS = 86400; // 24 hours

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

  // Phase 1: Only PDF is supported
  if (format !== 'pdf') {
    return narrativeError('FORMAT_NOT_SUPPORTED', `Export format '${format}' is not yet supported. Only 'pdf' is available.`);
  }

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

  // Create export record first to get verification_token for the PDF
  const adminClient = createAdminClient();
  const exportId = crypto.randomUUID();
  const storagePath = `exports/${id}/${exportId}.pdf`;

  // Insert with a placeholder storage_path; we update after upload
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

  const verificationToken = exportRow.verification_token as string;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.startupai.site';
  const verificationUrl = `${baseUrl}/verify/${verificationToken}`;
  const verificationShort = `verify.startupai.com/${verificationToken.substring(0, 8)}`;

  // Generate QR code as data URL (PNG embedded)
  let qrDataUrl: string | null = null;
  if (include_qr_code) {
    try {
      qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 192,
        margin: 1,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (qrError) {
      // QR code generation failure is non-fatal; proceed without it
      console.error('QR code generation failed:', qrError);
    }
  }

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    const documentElement = createElement(NarrativePdfDocument, {
      content: narrativeData,
      verificationShort,
      qrDataUrl,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfBuffer = await renderToBuffer(documentElement as any);
  } catch (pdfError) {
    console.error('PDF generation failed:', pdfError);
    // Clean up the export record on failure
    await adminClient
      .from('narrative_exports')
      .delete()
      .eq('id', exportRow.id);
    return narrativeError('INTERNAL_ERROR', 'Failed to generate PDF');
  }

  // Upload PDF to Supabase Storage
  const { error: uploadError } = await adminClient
    .storage
    .from('narrative-exports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading PDF:', uploadError);
    // Clean up the export record on failure
    await adminClient
      .from('narrative_exports')
      .delete()
      .eq('id', exportRow.id);
    return narrativeError('INTERNAL_ERROR', 'Failed to upload export');
  }

  // Generate signed download URL (24 hour expiry)
  const { data: signedUrl } = await adminClient
    .storage
    .from('narrative-exports')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  // Track funnel event (fire-and-forget)
  trackNarrativeFunnelEvent(narrative.project_id, user.id, 'narrative_exported', {
    narrative_id: id,
    export_id: exportRow.id,
    format,
    include_qr_code,
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    export_id: exportRow.id,
    verification_token: verificationToken,
    generation_hash: generationHash,
    verification_url: verificationUrl,
    download_url: signedUrl?.signedUrl ?? '',
    expires_at: new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString(),
  });
}
