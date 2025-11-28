/**
 * Approval Preferences API Route
 *
 * GET: Fetch user's approval preferences
 * PUT: Update user's approval preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ApprovalPreferencesSchema = z.object({
  auto_approve_types: z.array(z.string()).optional(),
  max_auto_approve_spend: z.number().min(0).optional(),
  auto_approve_low_risk: z.boolean().optional(),
  notify_email: z.boolean().optional(),
  notify_sms: z.boolean().optional(),
  escalation_email: z.string().email().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch preferences
    const { data, error } = await supabase
      .from('approval_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found, which is fine (return defaults)
      console.error('[api/settings/approvals] Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Return preferences or defaults
    const preferences = data || {
      user_id: user.id,
      auto_approve_types: [],
      max_auto_approve_spend: 0,
      auto_approve_low_risk: false,
      notify_email: true,
      notify_sms: false,
      escalation_email: null,
    };

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('[api/settings/approvals] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const result = ApprovalPreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const preferences = result.data;

    // Upsert preferences
    const { data, error } = await supabase
      .from('approval_preferences')
      .upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[api/settings/approvals] Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });

  } catch (error) {
    console.error('[api/settings/approvals] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
