import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/onboarding/brief
 *
 * Fetches the entrepreneur brief for a given project or session.
 * Used by the HITL approval flow to display the Founder's Brief for review.
 *
 * Query parameters:
 * - projectId: The project ID to fetch the brief for
 * - sessionId: The session ID to fetch the brief for (alternative)
 *
 * Returns the entrepreneur_brief data for display in FoundersBriefReview component.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sessionId = searchParams.get('sessionId');

    if (!projectId && !sessionId) {
      return NextResponse.json(
        { error: 'projectId or sessionId required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[api/onboarding/brief] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    let targetSessionId = sessionId;

    // If projectId provided, look up the session_id from project metadata
    if (projectId && !sessionId) {
      const { data: project, error: projectError } = await supabaseClient
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .eq('user_id', user.id) // Ensure user owns the project
        .single();

      if (projectError || !project) {
        console.warn('[api/onboarding/brief] Project not found:', { projectId, error: projectError });
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Extract session ID from project metadata
      const metadata = project.metadata as Record<string, unknown> | null;
      targetSessionId = metadata?.onboardingSessionId as string | null;

      if (!targetSessionId) {
        console.warn('[api/onboarding/brief] No session ID in project metadata:', { projectId });
        return NextResponse.json(
          { error: 'No onboarding session associated with this project' },
          { status: 404 }
        );
      }
    }

    // Fetch the entrepreneur brief by session_id
    const { data: brief, error: briefError } = await supabaseClient
      .from('entrepreneur_briefs')
      .select('*')
      .eq('session_id', targetSessionId)
      .single();

    if (briefError || !brief) {
      console.warn('[api/onboarding/brief] Brief not found:', { sessionId: targetSessionId, error: briefError });
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      );
    }

    // Verify the brief belongs to the authenticated user
    if (brief.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('[api/onboarding/brief] Brief found:', {
      briefId: brief.id,
      sessionId: targetSessionId,
      projectId,
    });

    return NextResponse.json({
      success: true,
      brief,
    });

  } catch (error) {
    console.error('[api/onboarding/brief] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch brief',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
