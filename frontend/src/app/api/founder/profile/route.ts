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

  // Calculate completeness
  const fields = [
    profile?.professional_summary,
    profile?.domain_expertise?.length,
    profile?.linkedin_url,
    profile?.years_experience,
  ];
  const filledFields = fields.filter(Boolean).length;
  const completeness = Math.round((filledFields / fields.length) * 100);

  return NextResponse.json({
    profile: profile ?? null,
    user: userProfile ?? null,
    completeness,
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

    return NextResponse.json({ profile: updated });
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

    return NextResponse.json({ profile: created }, { status: 201 });
  }
}
