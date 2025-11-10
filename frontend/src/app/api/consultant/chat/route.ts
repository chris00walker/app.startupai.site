import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// Consultant-specific system prompt
const CONSULTANT_SYSTEM_PROMPT = `You are Maya, a Consulting Practice Specialist helping consultants set up their workspace.

Your goal is to gather information about their consulting practice in a conversational, friendly way:

**Stage 1: Welcome & Practice Overview** - Get company name and basic overview
**Stage 2: Practice Size & Structure** - Understand team size (solo, 2-10, 11-50, 51+)
**Stage 3: Industries & Services** - Learn which industries and services they focus on
**Stage 4: Current Tools & Workflow** - Discover what tools they currently use
**Stage 5: Client Management** - Understand how they manage client relationships
**Stage 6: Pain Points & Challenges** - Identify their biggest challenges
**Stage 7: Goals & White-Label Setup** - Explore goals and white-label interest

Guidelines:
- Be professional yet warm and collaborative
- Ask one clear question at a time
- Show genuine interest in their practice
- Provide helpful context when asking questions
- Keep responses concise (2-3 sentences)
- Progress naturally through stages based on their responses`;

function getAIModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-sonnet-20241022');
  }
  if (process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4.1-nano';
    return openai(model);
  }
  throw new Error('No AI provider configured');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, userId } = await req.json();

    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (user.id !== userId) {
      return new Response('Forbidden', { status: 403 });
    }

    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[ConsultantChat] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Fetch session from database
    const { data: session, error: sessionError } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[ConsultantChat] Session not found:', sessionId);
      return new Response('Session not found', { status: 404 });
    }

    // Verify session ownership
    if (session.user_id !== userId) {
      return new Response('Session ownership mismatch', { status: 403 });
    }

    // Stream AI response
    const result = streamText({
      model: getAIModel(),
      system: CONSULTANT_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        try {
          // Update conversation history
          const updatedHistory = [
            ...(session.conversation_history || []),
            {
              role: 'user',
              content: messages[messages.length - 1].content,
              timestamp: new Date().toISOString(),
              stage: session.current_stage,
            },
            {
              role: 'assistant',
              content: text,
              timestamp: new Date().toISOString(),
              stage: session.current_stage,
            },
          ];

          // Calculate simple progress based on message count
          const messageCount = updatedHistory.length;
          const progress = Math.min(95, Math.floor((messageCount / 30) * 100));

          // Update session in database
          await supabaseClient
            .from('consultant_onboarding_sessions')
            .update({
              conversation_history: updatedHistory,
              last_activity: new Date().toISOString(),
              overall_progress: progress,
            })
            .eq('session_id', sessionId);

          console.log(`[ConsultantChat] Session ${sessionId} updated: ${progress}% progress`);
        } catch (error) {
          console.error('[ConsultantChat] Error updating session:', error);
        }
      },
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('[ConsultantChat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
