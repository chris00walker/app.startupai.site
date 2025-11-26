import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createCrewAIClient } from '@/lib/crewai/amp-client';

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

    // Trigger CrewAI consultant onboarding flow (async, fire-and-forget)
    // This generates AI recommendations based on practice data
    triggerConsultantOnboardingFlow(userId, sessionId, profileData).catch(err => {
      console.error('[ConsultantComplete] CrewAI trigger failed (non-blocking):', err.message);
    });

    return NextResponse.json({
      success: true,
      profile,
      message: 'Onboarding completed successfully',
    });

  } catch (error: any) {
    console.error('[ConsultantComplete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Trigger the CrewAI consultant onboarding flow (async, non-blocking).
 *
 * This kicks off the AI analysis in the background. Results will be
 * persisted via the /api/crewai/consultant webhook when complete.
 */
async function triggerConsultantOnboardingFlow(
  userId: string,
  sessionId: string,
  profileData: Record<string, any>
): Promise<void> {
  const crewaiUrl = process.env.CREWAI_API_URL;
  const crewaiToken = process.env.CREWAI_API_TOKEN;

  if (!crewaiUrl) {
    console.warn('[ConsultantComplete] CREWAI_API_URL not configured, skipping AI analysis');
    return;
  }

  console.log('[ConsultantComplete] Triggering CrewAI consultant onboarding flow...');

  try {
    const client = createCrewAIClient({
      apiUrl: crewaiUrl,
      apiToken: crewaiToken,
    });

    // Build practice data for the flow
    const practiceData = {
      company_name: profileData.company_name || '',
      practice_size: profileData.practice_size || 'solo',
      current_clients: profileData.current_clients || 0,
      industries: profileData.industries || [],
      services: profileData.services || [],
      tools_used: profileData.tools_used || [],
      pain_points: profileData.pain_points || '',
      white_label_enabled: profileData.white_label_enabled || false,
      goals: profileData.white_label_config || {},
    };

    // Kick off the flow (fire and forget - don't wait for completion)
    const response = await client.kickoff({
      inputs: {
        flow_type: 'consultant_onboarding',
        user_id: userId,
        session_id: sessionId,
        practice_data: practiceData,
      },
    });

    console.log('[ConsultantComplete] CrewAI kickoff started:', response.kickoff_id);

  } catch (error: any) {
    // Log but don't fail - this is a background enhancement
    console.error('[ConsultantComplete] CrewAI kickoff error:', error.message);
    throw error; // Re-throw so caller can log
  }
}
