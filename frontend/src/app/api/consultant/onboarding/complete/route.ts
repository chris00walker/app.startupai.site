import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { buildFounderValidationInputs } from '@/lib/crewai/founder-validation';

/**
 * Extract practice size from session data
 */
function extractPracticeSize(practiceInfo: any): string | null {
  if (!practiceInfo) return null;
  const size = practiceInfo.team_size || practiceInfo.practice_size || practiceInfo.size;
  if (typeof size === 'string') {
    if (size.includes('solo') || size === '1') return 'solo';
    if (size.includes('2-10') || (parseInt(size) >= 2 && parseInt(size) <= 10)) return '2-10';
    if (size.includes('11-50') || (parseInt(size) >= 11 && parseInt(size) <= 50)) return '11-50';
    if (size.includes('51+') || parseInt(size) > 50) return '51+';
  }
  return 'solo'; // Default
}

/**
 * Extract arrays from session data
 */
function extractArray(data: any): string[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(String);
  if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, userId, messages } = await request.json();

    // Verify user ID matches
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[ConsultantComplete] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Fetch session from database to get full conversation history and stage data
    const { data: session, error: sessionError } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[ConsultantComplete] Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Extract structured data from session fields
    const practiceInfo = session.practice_info || {};
    const industriesData = session.industries || [];
    const servicesData = session.services || [];
    const toolsData = session.tools_used || [];
    const painPointsData = session.pain_points || [];
    const goalsData = session.goals || {};
    const clientManagement = session.client_management || {};

    // Extract company name from practice_info or conversation
    let companyName = practiceInfo.company_name || practiceInfo.name || '';
    if (!companyName) {
      const conversationHistory = session.conversation_history || messages || [];
      const conversationText = conversationHistory.map((m: any) => m.content).join('\n');
      const companyNameMatch = conversationText.match(/(?:company|firm|agency|practice)(?:\s+name)?(?:\s+is)?[:\s]+([A-Z][A-Za-z\s&]+)/i);
      companyName = companyNameMatch ? companyNameMatch[1].trim() : '';
    }

    // Ensure user_profiles entry exists (consultant_profiles has FK to user_profiles)
    const { error: profileCheckError } = await supabaseClient
      .from('user_profiles')
      .upsert({
        id: userId,
        role: 'consultant',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (profileCheckError) {
      console.warn('[ConsultantComplete] user_profiles upsert warning:', profileCheckError.message);
    }

    // Build consultant profile data
    const profileData = {
      id: userId,
      company_name: companyName || 'My Consulting Practice',
      practice_size: extractPracticeSize(practiceInfo),
      current_clients: practiceInfo.current_clients || clientManagement.client_count || 0,
      industries: extractArray(industriesData),
      services: extractArray(servicesData),
      tools_used: extractArray(toolsData),
      pain_points: Array.isArray(painPointsData) ? painPointsData.join('; ') : (painPointsData || ''),
      white_label_enabled: goalsData.white_label_interest === true,
      white_label_config: goalsData.white_label_config || {},
      onboarding_completed: true,
      last_session_id: sessionId,
      last_onboarding_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[ConsultantComplete] Saving profile data:', {
      userId,
      companyName: profileData.company_name,
      practiceSize: profileData.practice_size,
      industriesCount: profileData.industries.length,
      servicesCount: profileData.services.length,
    });

    // Upsert consultant profile
    const { data: profile, error: upsertError } = await supabaseClient
      .from('consultant_profiles')
      .upsert(profileData, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[ConsultantComplete] Database error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save profile', details: upsertError.message },
        { status: 500 }
      );
    }

    // Mark session as completed
    await supabaseClient
      .from('consultant_onboarding_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        overall_progress: 100,
      })
      .eq('session_id', sessionId);

    // Update user_profiles to mark onboarding complete
    await supabaseClient
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log('[ConsultantComplete] Onboarding completed for user:', userId);

    // Trigger Modal founder_validation flow for consultant onboarding
    // Two-layer architecture:
    // - Layer 1: "Alex" chat collected conversation_history
    // - Layer 2: OnboardingCrew validates and compiles Founder's Brief
    let workflowId: string | null = null;
    let modalError: string | null = null;

    try {
      const { createModalClient } = await import('@/lib/crewai/modal-client');

      console.log('[ConsultantComplete] Starting Modal founder_validation flow for consultant...');

      const modalClient = createModalClient();

      // Get conversation transcript from session
      const conversationHistory = session.conversation_history || messages || [];
      const conversationTranscript = JSON.stringify(conversationHistory);

      // Build brief data from consultant session fields
      const briefData = {
        solution_description: profileData.company_name,
        problem_description: profileData.pain_points,
        customer_segments: profileData.industries,
        business_stage: 'consulting_practice',
        budget_range: 'not specified',
        competitors: [],
        differentiation_factors: profileData.services,
        available_channels: [],
        team_capabilities: profileData.tools_used,
        three_month_goals: goalsData.short_term_goals || [],
        success_criteria: [],
        key_metrics: [],
      };

      // Build inputs for founder validation flow
      const validationInputs = buildFounderValidationInputs(
        briefData,
        sessionId,  // Use sessionId as project_id for consultant
        userId,
        sessionId,
        conversationTranscript,
        'consultant'  // User type
      );

      // Kick off the flow
      const response = await modalClient.kickoff({
        entrepreneur_input: validationInputs.entrepreneur_input,
        project_id: validationInputs.project_id,
        user_id: validationInputs.user_id,
        session_id: validationInputs.session_id,
        conversation_transcript: validationInputs.conversation_transcript,
        user_type: validationInputs.user_type,
      });

      workflowId = response.run_id;
      console.log('[ConsultantComplete] Modal kickoff started:', workflowId);

      // Store run_id in session for webhook correlation
      await supabaseClient
        .from('consultant_onboarding_sessions')
        .update({
          ai_context: {
            ...(session.ai_context || {}),
            modal_run_id: workflowId,
            crewai_flow_type: 'founder_validation',
            kickoff_started_at: new Date().toISOString(),
          },
        })
        .eq('session_id', sessionId);

    } catch (err) {
      modalError = err instanceof Error ? err.message : 'Modal kickoff failed';
      console.error('[ConsultantComplete] Modal kickoff error:', modalError);
      // Continue anyway - consultant profile is saved
    }

    return NextResponse.json({
      success: true,
      profile,
      workflowId,
      workflowTriggered: Boolean(workflowId),
      message: workflowId
        ? 'Onboarding completed. Validation analysis started.'
        : 'Onboarding completed successfully',
      ...(modalError ? { modalError } : {}),
    });

  } catch (error: any) {
    console.error('[ConsultantComplete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
