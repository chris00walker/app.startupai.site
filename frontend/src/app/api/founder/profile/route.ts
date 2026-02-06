/**
 * Founder Profile API
 *
 * GET /api/founder/profile - Get founder's professional profile
 * PATCH /api/founder/profile - Update founder's professional profile
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2237-2255
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';

const updateProfileSchema = z.object({
  professional_summary: z.string().max(500).optional(),
  domain_expertise: z.array(z.string()).optional(),
  previous_ventures: z.array(z.object({
    name: z.string(),
    role: z.string(),
    outcome: z.string(),
    year: z.number().int().min(1900).max(2100),
  })).optional(),
  linkedin_url: z.string().url().max(255).optional().nullable(),
  company_website: z.string().url().max(255).optional().nullable(),
  years_experience: z.number().int().min(0).max(100).optional().nullable(),
});

const PROFILE_FIELDS = [
  'professional_summary',
  'domain_expertise',
  'previous_ventures',
  'linkedin_url',
  'company_website',
  'years_experience',
] as const;

type ProfileField = (typeof PROFILE_FIELDS)[number];

function isFilledValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function computeProfileStatus(profile: Record<string, unknown> | null | undefined): {
  completeness: number;
  missing_fields: ProfileField[];
} {
  const missing_fields = PROFILE_FIELDS.filter((field) => !isFilledValue(profile?.[field]));
  const filledCount = PROFILE_FIELDS.length - missing_fields.length;
  const completeness = Math.round((filledCount / PROFILE_FIELDS.length) * 100);

  return { completeness, missing_fields };
}

/**
 * GET - Get founder profile with completeness indicator
 */
export async function GET() {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  // Fetch profile (may not exist yet)
  const { data: profile } = await supabase
    .from('founder_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Also fetch user profile for name/email
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name, email, company')
    .eq('id', user.id)
    .single();

  const { completeness, missing_fields } = computeProfileStatus(
    (profile as Record<string, unknown> | null) ?? null
  );

  return NextResponse.json({
    profile: profile ?? null,
    user: userProfile ?? null,
    completeness,
    missing_fields,
  });
}

/**
 * PATCH - Create or update founder profile
 */
export async function PATCH(request: NextRequest) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return narrativeError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const result = updateProfileSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid profile data', {
      issues: result.error.issues,
    });
  }

  // Upsert: create if not exists, update if exists
  const { data: existing } = await supabase
    .from('founder_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Update existing
    const { data: updated, error: updateError } = await supabase
      .from('founder_profiles')
      .update(result.data)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating founder profile:', updateError);
      return narrativeError('INTERNAL_ERROR', 'Failed to update profile');
    }

    const { completeness, missing_fields } = computeProfileStatus(
      (updated as Record<string, unknown> | null) ?? null
    );

    return NextResponse.json({
      profile: updated,
      completeness,
      missing_fields,
    });
  } else {
    // Create new
    const { data: created, error: createError } = await supabase
      .from('founder_profiles')
      .insert({
        user_id: user.id,
        ...result.data,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating founder profile:', createError);
      return narrativeError('INTERNAL_ERROR', 'Failed to create profile');
    }

    const { completeness, missing_fields } = computeProfileStatus(
      (created as Record<string, unknown> | null) ?? null
    );

    return NextResponse.json(
      {
        profile: created,
        completeness,
        missing_fields,
      },
      { status: 201 }
    );
  }
}
