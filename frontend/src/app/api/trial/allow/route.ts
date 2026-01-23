/**
 * @story US-FT02
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertTrialAllowance } from '@/lib/auth/trial-guard';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (typeof action !== 'string' || !action.trim()) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await assertTrialAllowance({ userId: user.id, action: action.trim() });

    if (!result.allowed) {
      return NextResponse.json({
        allowed: false,
        remaining: 0,
        message: 'Trial usage limit reached for this action.',
      }, { status: 403 });
    }

    return NextResponse.json({
      allowed: true,
      remaining: result.remaining,
    });
  } catch (error) {
    console.error('Trial allowance error:', error);
    return NextResponse.json({ error: 'Failed to evaluate trial allowance' }, { status: 500 });
  }
}
