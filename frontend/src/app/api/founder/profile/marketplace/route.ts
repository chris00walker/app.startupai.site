/**
 * Founder Marketplace Settings API
 *
 * GET: Get founder marketplace settings
 * PUT: Update founder marketplace settings
 *
 * @story US-FM10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

const updateSchema = z.object({
  founderDirectoryOptIn: z.boolean(),
});

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get founder profile with qualification status
  // Use maybeSingle and handle missing column gracefully (column may not exist in older schemas)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('founder_directory_opt_in')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    // Check if it's a column-not-found error (migration not deployed)
    if (profileError.message?.includes('founder_directory_opt_in')) {
      console.warn('[founder/profile/marketplace] Column not found, returning defaults');
      return NextResponse.json({
        founderDirectoryOptIn: false,
        problemFit: 'no_fit',
        qualifiesForDirectory: false,
      });
    }
    console.error('[founder/profile/marketplace] Query error:', profileError);
    return NextResponse.json(
      { error: 'query_failed', message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }

  // Check if founder qualifies for directory (has project with partial_fit or strong_fit)
  // TASK-026/027: problem_fit lives in crewai_validation_states, not projects
  const { data: validationState } = await supabase
    .from('crewai_validation_states')
    .select('problem_fit, project_id, projects!inner(user_id)')
    .eq('projects.user_id', user.id)
    .in('problem_fit', ['partial_fit', 'strong_fit'])
    .limit(1)
    .single();

  const qualifiesForDirectory = !!validationState;
  const problemFit = validationState?.problem_fit || 'no_fit';

  return NextResponse.json({
    founderDirectoryOptIn: profile?.founder_directory_opt_in ?? false,
    problemFit,
    qualifiesForDirectory,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { founderDirectoryOptIn } = validation.data;

  // Query previous state for analytics
  const { data: previousState } = await supabase
    .from('user_profiles')
    .select('founder_directory_opt_in')
    .eq('id', user.id)
    .single();

  const wasOptedIn = previousState?.founder_directory_opt_in ?? false;

  // If opting in, verify qualification
  // TASK-026/027: problem_fit lives in crewai_validation_states, not projects
  if (founderDirectoryOptIn) {
    const { data: validationState } = await supabase
      .from('crewai_validation_states')
      .select('problem_fit, project_id, projects!inner(user_id)')
      .eq('projects.user_id', user.id)
      .in('problem_fit', ['partial_fit', 'strong_fit'])
      .limit(1)
      .single();

    if (!validationState) {
      return NextResponse.json(
        {
          error: 'not_qualified',
          message: 'Complete more validation to qualify for the Founder Directory.',
          currentFit: 'no_fit',
          requiredFit: 'partial_fit',
        },
        { status: 400 }
      );
    }
  }

  // Update founder profile
  const { error } = await supabase
    .from('user_profiles')
    .update({ founder_directory_opt_in: founderDirectoryOptIn })
    .eq('id', user.id);

  if (error) {
    console.error('[founder/profile/marketplace] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }

  // Server-side analytics: track opt-in state changes
  if (!wasOptedIn && founderDirectoryOptIn) {
    // Get problem_fit for the enabled event
    const { data: validationState } = await supabase
      .from('crewai_validation_states')
      .select('problem_fit, project_id, projects!inner(user_id)')
      .eq('projects.user_id', user.id)
      .in('problem_fit', ['partial_fit', 'strong_fit'])
      .limit(1)
      .single();

    trackMarketplaceServerEvent.founderOptInEnabled(user.id, validationState?.problem_fit);
  } else if (wasOptedIn && !founderDirectoryOptIn) {
    // Note: days_opted_in would require tracking opt_in timestamp (future enhancement)
    trackMarketplaceServerEvent.founderOptInDisabled(user.id);
  }

  return NextResponse.json({
    founderDirectoryOptIn,
    updatedAt: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
