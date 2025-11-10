import { createClient } from '@/lib/supabase/server';
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

    // Note: We intentionally allow re-entry to onboarding even if completed.
    // This enables consultants to resume conversations with Maya at any time,
    // matching the founder experience where users can return to their AI assistant.

    // Generate session ID
    const timestamp = Date.now();
    const sessionId = `consultant-${userId}-${timestamp}`;

    // Define consultant-specific agent personality
    const agentPersonality = {
      name: 'Maya',
      role: 'Consulting Practice Specialist',
      tone: 'Professional and collaborative',
      expertise: 'consulting practice management and client workflow optimization',
    };

    const stageInfo = {
      currentStage: 1,
      totalStages: 7,
      stageName: 'Welcome & Practice Overview',
    };

    const conversationContext = {
      agentPersonality,
      userRole: 'consultant',
      planType: 'consultant',
    };

    const agentIntroduction = `Hi! I'm ${agentPersonality.name}, your ${agentPersonality.role}. I'm here to help you set up your workspace and optimize your client management workflow.`;

    const firstQuestion = `To get started, could you tell me about your consulting practice? What's the name of your firm or agency?`;

    return NextResponse.json({
      success: true,
      sessionId,
      stageInfo,
      conversationContext,
      agentIntroduction,
      firstQuestion,
    });

  } catch (error: any) {
    console.error('[ConsultantOnboarding] Start error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
