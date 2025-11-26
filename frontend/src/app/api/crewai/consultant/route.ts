/**
 * CrewAI Consultant Onboarding Results Webhook (LEGACY)
 *
 * POST /api/crewai/consultant
 *
 * DEPRECATED: Use /api/crewai/webhook with flow_type: "consultant_onboarding" instead.
 * This route is kept for backwards compatibility.
 *
 * Receives AI-generated recommendations from the ConsultantOnboardingFlow
 * and updates the consultant_profiles table with personalized guidance.
 *
 * Authentication: Bearer token (CREW_CONTRACT_BEARER)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// NOTE: This is a legacy endpoint. New integrations should use /api/crewai/webhook
// with flow_type: "consultant_onboarding" in the payload.

// Schema for consultant onboarding results from CrewAI Flow
const consultantResultsSchema = z.object({
  // Required: consultant context
  consultant_id: z.string().uuid(),
  session_id: z.string().optional(),

  // Practice analysis from AI
  practice_analysis: z.object({
    strengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    positioning: z.string().default(''),
    opportunities: z.array(z.string()).default([]),
    client_profile: z.string().default(''),
  }).passthrough(),

  // AI-generated recommendations
  recommendations: z.array(z.string()).default([]),
  onboarding_tips: z.array(z.string()).default([]),
  suggested_templates: z.array(z.string()).default([]),
  suggested_workflows: z.array(z.string()).default([]),
  white_label_suggestions: z.record(z.string(), z.any()).default({}),

  // Metadata
  completed_at: z.string().optional(),
});

type ConsultantResultsPayload = z.infer<typeof consultantResultsSchema>;

/**
 * Validate bearer token from CrewAI
 */
function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const expectedToken = process.env.CREW_CONTRACT_BEARER;

  if (!expectedToken) {
    console.error('[api/crewai/consultant] CREW_CONTRACT_BEARER not configured');
    return false;
  }

  return token === expectedToken;
}

export async function POST(request: NextRequest) {
  // Validate bearer token
  if (!validateBearerToken(request)) {
    console.error('[api/crewai/consultant] Invalid or missing bearer token');
    return NextResponse.json(
      { error: 'Unauthorized - Invalid bearer token' },
      { status: 401 }
    );
  }

  let payload: ConsultantResultsPayload;

  // Parse and validate request body
  try {
    const body = await request.json();
    const validation = consultantResultsSchema.safeParse(body);

    if (!validation.success) {
      console.error('[api/crewai/consultant] Validation failed:', validation.error.flatten());
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    payload = validation.data;
  } catch (parseError) {
    console.error('[api/crewai/consultant] Failed to parse request body:', parseError);
    return NextResponse.json(
      { error: 'Malformed JSON body' },
      { status: 400 }
    );
  }

  console.log('[api/crewai/consultant] Received consultant onboarding results:', {
    consultant_id: payload.consultant_id,
    session_id: payload.session_id,
    recommendations_count: payload.recommendations.length,
    templates_count: payload.suggested_templates.length,
  });

  try {
    const admin = createAdminClient();

    // Verify consultant profile exists
    const { data: profile, error: profileError } = await admin
      .from('consultant_profiles')
      .select('id, onboarding_completed')
      .eq('id', payload.consultant_id)
      .single();

    if (profileError || !profile) {
      console.error('[api/crewai/consultant] Consultant profile not found:', profileError);
      return NextResponse.json(
        { error: 'Consultant profile not found' },
        { status: 404 }
      );
    }

    // Build the update payload for consultant_profiles
    const updatePayload: Record<string, any> = {
      // Store AI-generated analysis and recommendations
      ai_practice_analysis: payload.practice_analysis,
      ai_recommendations: payload.recommendations,
      ai_onboarding_tips: payload.onboarding_tips,
      ai_suggested_templates: payload.suggested_templates,
      ai_suggested_workflows: payload.suggested_workflows,

      // Mark AI analysis as completed
      ai_analysis_completed: true,
      ai_analysis_completed_at: payload.completed_at || new Date().toISOString(),

      // Update timestamp
      updated_at: new Date().toISOString(),
    };

    // Add white-label suggestions if consultant has it enabled
    if (Object.keys(payload.white_label_suggestions).length > 0) {
      updatePayload.ai_white_label_suggestions = payload.white_label_suggestions;
    }

    // Update consultant profile with AI results
    const { error: updateError } = await admin
      .from('consultant_profiles')
      .update(updatePayload)
      .eq('id', payload.consultant_id);

    if (updateError) {
      console.error('[api/crewai/consultant] Failed to update consultant profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update consultant profile', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[api/crewai/consultant] Consultant profile updated with AI recommendations');

    return NextResponse.json({
      success: true,
      consultant_id: payload.consultant_id,
      recommendations_stored: payload.recommendations.length,
      templates_suggested: payload.suggested_templates.length,
      message: 'Consultant onboarding results stored successfully',
    });

  } catch (error) {
    console.error('[api/crewai/consultant] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
