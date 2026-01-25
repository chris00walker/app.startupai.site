/**
 * User Preferences API Route
 *
 * GET: Fetch user's platform preferences
 * PUT: Update user's platform preferences
 *
 * @story US-PR01, US-PR02, US-PR03, US-PR04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  default_canvas_type: z.enum(['vpc', 'bmc', 'tbi']).optional(),
  auto_save_interval: z.enum(['1min', '5min', '10min', 'disabled']).optional(),
  ai_assistance_level: z.enum(['minimal', 'balanced', 'aggressive']).optional(),
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
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found, which is fine (return defaults)
      console.error('[api/settings/preferences] Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Return preferences or defaults
    const preferences = data || {
      user_id: user.id,
      theme: 'light',
      default_canvas_type: 'vpc',
      auto_save_interval: '5min',
      ai_assistance_level: 'balanced',
    };

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('[api/settings/preferences] Unexpected error:', error);
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
    const result = UserPreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const preferences = result.data;

    // Upsert preferences
    const { data, error } = await supabase
      .from('user_preferences')
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
      console.error('[api/settings/preferences] Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });

  } catch (error) {
    console.error('[api/settings/preferences] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
