/**
 * AI Assistant History Endpoint
 *
 * Retrieves conversation history for the dashboard AI assistant.
 * Returns recent conversations scoped by user, role, and optionally project/client.
 *
 * @story US-CP09
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'userId and userRole required' }, { status: 400 });
    }

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[AssistantHistory] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Build query
    let query = supabaseClient
      .from('assistant_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('user_role', userRole);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Get last 50 messages
    query = query.order('created_at', { ascending: false }).limit(50);

    const { data: conversations, error: fetchError } = await query;

    if (fetchError) {
      // Table might not exist yet
      console.warn('[AssistantHistory] Error fetching conversations:', fetchError);
      return NextResponse.json({ messages: [] });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    // Convert database format to message format
    const messages: Array<{ role: string; content: string; timestamp: string }> = [];
    for (const conv of conversations.reverse()) {
      // Reverse to get chronological order
      if (conv.user_message) {
        messages.push({
          role: 'user',
          content: conv.user_message,
          timestamp: conv.created_at,
        });
      }
      if (conv.assistant_message) {
        messages.push({
          role: 'assistant',
          content: conv.assistant_message,
          timestamp: conv.created_at,
        });
      }
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('[AssistantHistory] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
