/**
 * Verification API
 *
 * GET /api/verify/:verification_token - Public verification endpoint
 *
 * No auth required. Uses service role for token lookup.
 * Rate limited: 30/min burst per IP (in-memory; upgrade to Upstash Redis for multi-instance).
 *
 * Response per spec :3092-3105:
 * - status, exported_at, venture_name, evidence_id, generation_hash,
 *   current_hash, current_hash_matches, evidence_generated_at,
 *   validation_stage_at_export, is_edited, alignment_status, request_access_url
 * - fit_score_at_export intentionally excluded (spec :3114)
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3092-3105
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { computeNarrativeHash } from '@/lib/narrative/hash';
import { createRateLimiter } from '@/lib/security/rate-limit';
import type { PitchNarrativeContent, VerificationResponse } from '@/lib/narrative/types';

// Rate limiting: 30 requests per minute per IP (burst protection)
const verifyRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limiting by IP address
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? _request.headers.get('x-real-ip')
    ?? 'unknown';
  const rateLimit = verifyRateLimiter(`verify:${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { status: 'rate_limited', message: 'Too many verification requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) },
      }
    );
  }

  const adminClient = createAdminClient();

  // Lookup export by verification token (service role bypasses RLS)
  const { data: exportRow, error: lookupError } = await adminClient
    .from('narrative_exports')
    .select(`
      id,
      narrative_id,
      verification_token,
      generation_hash,
      evidence_package_id,
      venture_name_at_export,
      validation_stage_at_export,
      export_format,
      exported_at
    `)
    .eq('verification_token', token)
    .single();

  if (lookupError || !exportRow) {
    const response: VerificationResponse = {
      status: 'not_found',
    };
    return NextResponse.json(response, { status: 404 });
  }

  // Fetch current narrative to compare hash
  const { data: narrative } = await adminClient
    .from('pitch_narratives')
    .select('narrative_data, is_edited, alignment_status, created_at, verification_request_count')
    .eq('id', exportRow.narrative_id)
    .single();

  // Increment verification request count
  if (narrative) {
    await adminClient
      .from('pitch_narratives')
      .update({
        verification_request_count: (narrative.verification_request_count ?? 0) + 1,
      })
      .eq('id', exportRow.narrative_id);
  }

  // Compute current hash and compare
  let currentHash: string | undefined;
  let currentHashMatches: boolean | undefined;

  if (narrative?.narrative_data) {
    currentHash = computeNarrativeHash(narrative.narrative_data as PitchNarrativeContent);
    currentHashMatches = currentHash === exportRow.generation_hash;
  }

  // Get evidence package for evidence_id
  const { data: evidencePackage } = await adminClient
    .from('evidence_packages')
    .select('integrity_hash')
    .eq('id', exportRow.evidence_package_id)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.startupai.site';
  const status = currentHashMatches === false ? 'outdated' : 'verified';

  const response: VerificationResponse = {
    status,
    exported_at: exportRow.exported_at,
    venture_name: exportRow.venture_name_at_export,
    evidence_id: evidencePackage?.integrity_hash?.substring(0, 12),
    generation_hash: exportRow.generation_hash,
    current_hash: currentHash,
    current_hash_matches: currentHashMatches,
    evidence_generated_at: narrative?.created_at,
    validation_stage_at_export: exportRow.validation_stage_at_export,
    is_edited: narrative?.is_edited ?? false,
    alignment_status: narrative?.alignment_status ?? 'verified',
    request_access_url: `${baseUrl}/connect`,
  };

  return NextResponse.json(response);
}
