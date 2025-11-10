import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

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

    // Fetch session from database to get full conversation history
    const { data: session, error: sessionError } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[ConsultantComplete] Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Extract information from conversation history
    const conversationHistory = session.conversation_history || messages || [];
    const conversationText = conversationHistory.map((m: any) => m.content).join('\n');

    // Parse out key information (simple keyword extraction)
    const companyNameMatch = conversationText.match(/(?:company|firm|agency)(?:\s+name)?(?:\s+is)?[:\s]+([A-Z][A-Za-z\s&]+)/i);
    const companyName = companyNameMatch ? companyNameMatch[1].trim() : '';

    // Upsert consultant profile
    const { data: profile, error: upsertError } = await supabaseClient
      .from('consultant_profiles')
      .upsert({
        id: userId,
        company_name: companyName || 'My Consulting Practice',
        onboarding_completed: true,
        last_session_id: sessionId,
        last_onboarding_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
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

    console.log('[ConsultantComplete] Onboarding completed for user:', userId);

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
