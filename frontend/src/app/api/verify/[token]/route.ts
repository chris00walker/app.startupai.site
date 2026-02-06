/**
 * Verification API
 *
 * GET /api/verify/:verification_token - Public verification endpoint
 *
 * No auth required. Uses service role for token lookup.
 * Rate limited with dual-window policy per IP:
 * - Burst: 30/minute
 * - Sustained: 300/hour
 * Uses Upstash Redis when configured, with in-memory fallback.
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

// Fallback rate limiting (used when Upstash Redis is not configured).
const verifyBurstFallback = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});
const verifySustainedFallback = createRateLimiter({
  maxRequests: 300,
  windowMs: 60 * 60 * 1000, // 1 hour
});

interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function normalizeTtl(ttlSeconds: number, fallback: number): number {
  return ttlSeconds > 0 ? ttlSeconds : fallback;
}

async function checkUpstashDualWindowRateLimit(key: string): Promise<RateLimitDecision | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const burstWindowSec = 60;
  const sustainedWindowSec = 60 * 60;
  const burstLimit = 30;
  const sustainedLimit = 300;

  const burstKey = `narrative:verify:burst:${key}`;
  const sustainedKey = `narrative:verify:sustained:${key}`;

  const pipeline = [
    ['INCR', burstKey],
    ['INCR', sustainedKey],
    ['TTL', burstKey],
    ['TTL', sustainedKey],
    ['EXPIRE', burstKey, String(burstWindowSec), 'NX'],
    ['EXPIRE', sustainedKey, String(sustainedWindowSec), 'NX'],
  ];

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Upstash pipeline failed: ${response.status}`);
    }

    const results = await response.json() as Array<{ result?: number | string }>;
    const burstCount = Number(results[0]?.result ?? 0);
    const sustainedCount = Number(results[1]?.result ?? 0);
    const burstTtl = Number(results[2]?.result ?? burstWindowSec);
    const sustainedTtl = Number(results[3]?.result ?? sustainedWindowSec);

    const burstExceeded = burstCount > burstLimit;
    const sustainedExceeded = sustainedCount > sustainedLimit;

    if (!burstExceeded && !sustainedExceeded) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const retryAfterSeconds = Math.max(
      burstExceeded ? normalizeTtl(burstTtl, burstWindowSec) : 0,
      sustainedExceeded ? normalizeTtl(sustainedTtl, sustainedWindowSec) : 0
    );

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  } catch (error) {
    console.error('[verify] Upstash rate limit check failed, using fallback limiter:', error);
    return null;
  }
}

function checkFallbackDualWindowRateLimit(key: string): RateLimitDecision {
  const burst = verifyBurstFallback(key);
  const sustained = verifySustainedFallback(key);

  if (burst.allowed && sustained.allowed) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil(Math.max(burst.resetIn, sustained.resetIn) / 1000)
    ),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limiting by IP address
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? _request.headers.get('x-real-ip')
    ?? 'unknown';
  const key = `verify:${ip}`;
  const upstashDecision = await checkUpstashDualWindowRateLimit(key);
  const rateLimit = upstashDecision ?? checkFallbackDualWindowRateLimit(key);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { status: 'rate_limited', message: 'Too many verification requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
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
