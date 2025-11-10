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

    const { sessionId, userId, messages } = await request.json();

    // Verify user ID matches
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract information from conversation messages
    const conversationText = messages.map((m: any) => m.content).join('\n');

    // Parse out key information (simple keyword extraction)
    const companyNameMatch = conversationText.match(/(?:company|firm|agency)(?:\s+name)?(?:\s+is)?[:\s]+([A-Z][A-Za-z\s&]+)/i);
    const companyName = companyNameMatch ? companyNameMatch[1].trim() : '';

    // Upsert consultant profile
    const { data: profile, error: upsertError } = await supabase
      .from('consultant_profiles')
      .upsert({
        id: userId,
        company_name: companyName || 'My Consulting Practice',
        onboarding_completed: true,
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
