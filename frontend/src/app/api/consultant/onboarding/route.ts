/**
 * Consultant Onboarding API
 *
 * @story US-C01, US-CT01
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createMockClientsForTrial } from '@/lib/mock-data';

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

    // Parse request body
    const { userId, profile } = await request.json();

    // Verify user ID matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert consultant profile into database
    const { data: consultantProfile, error: insertError } = await supabase
      .from('consultant_profiles')
      .insert({
        id: userId,
        company_name: profile.companyName,
        practice_size: profile.practiceSize,
        current_clients: profile.currentClients,
        industries: profile.industries,
        services: profile.services,
        tools_used: profile.toolsUsed,
        pain_points: profile.painPoints,
        white_label_enabled: profile.whiteLabelInterest,
        onboarding_completed: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ConsultantOnboarding] Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save consultant profile', details: insertError.message },
        { status: 500 }
      );
    }

    // Update user_profiles to mark onboarding as complete
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        company: profile.companyName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[ConsultantOnboarding] Failed to update user profile:', updateError);
      // Don't fail the request if this update fails
    }

    // Check if this is a trial user - if so, create mock clients (US-CT01)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (userProfile?.role === 'consultant_trial') {
      console.log('[ConsultantOnboarding] Creating mock clients for trial consultant');
      const mockResult = await createMockClientsForTrial(userId);
      if (!mockResult.success) {
        console.error('[ConsultantOnboarding] Failed to create mock clients:', mockResult.error);
        // Don't fail the request - mock clients are non-critical
      } else {
        console.log(`[ConsultantOnboarding] Created ${mockResult.mockClientIds.length} mock clients`);
      }
    }

    // TODO: In Phase 3, trigger CrewAI consultant workflow here
    // This would call the consultant_onboarding CrewAI workflow to generate
    // practice analysis and workspace recommendations

    return NextResponse.json({
      success: true,
      profile: consultantProfile,
      message: 'Consultant profile created successfully',
    });
  } catch (error: any) {
    console.error('[ConsultantOnboarding] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
