/**
 * @story US-C01
 */
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

    const { userId, userEmail } = await request.json();

    // Verify user ID matches
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[ConsultantOnboarding] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Check for existing active session
    const { data: existingSessions } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .order('last_activity', { ascending: false })
      .limit(1);

    // Define consultant-specific agent personality
    const agentPersonality = {
      name: 'Maya',
      role: 'Consulting Practice Specialist',
      tone: 'Professional and collaborative',
      expertise: 'consulting practice management and client workflow optimization',
    };

    const conversationContext = {
      agentPersonality,
      userRole: 'consultant',
      planType: 'consultant',
    };

    // If existing session found, resume it
    if (existingSessions && existingSessions.length > 0) {
      const session = existingSessions[0];

      console.log('[ConsultantOnboarding] Resuming existing session:', session.session_id);

      const stageInfo = {
        currentStage: session.current_stage,
        totalStages: 7,
        stageName: getStageName(session.current_stage),
      };

      return NextResponse.json({
        success: true,
        sessionId: session.session_id,
        stageInfo,
        conversationContext,
        resuming: true,
        conversationHistory: session.conversation_history || [],
        overallProgress: session.overall_progress,
        stageProgress: session.stage_progress,
      });
    }

    // Create new session
    const timestamp = Date.now();
    const sessionId = `consultant-${userId}-${timestamp}`;

    const agentIntroduction = `Hi! I'm ${agentPersonality.name}, your ${agentPersonality.role}. I'm here to help you set up your workspace and optimize your client management workflow.`;
    const firstQuestion = `To get started, could you tell me about your consulting practice? What's the name of your firm or agency?`;

    // Create session in database
    const { error: insertError } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_email: userEmail,
        status: 'active',
        current_stage: 1,
        stage_progress: 0,
        overall_progress: 0,
        conversation_history: [],
        stage_data: {},
      });

    if (insertError) {
      console.error('[ConsultantOnboarding] Failed to create session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create session', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('[ConsultantOnboarding] Created new session:', sessionId);

    const stageInfo = {
      currentStage: 1,
      totalStages: 7,
      stageName: 'Welcome & Practice Overview',
    };

    return NextResponse.json({
      success: true,
      sessionId,
      stageInfo,
      conversationContext,
      agentIntroduction,
      firstQuestion,
      resuming: false,
    });

  } catch (error: any) {
    console.error('[ConsultantOnboarding] Start error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get stage name
function getStageName(stage: number): string {
  const stageNames = [
    'Welcome & Practice Overview',
    'Practice Size & Structure',
    'Industries & Services',
    'Current Tools & Workflow',
    'Client Management',
    'Pain Points & Challenges',
    'Goals & White-Label Setup',
  ];
  return stageNames[stage - 1] || 'Unknown Stage';
}
