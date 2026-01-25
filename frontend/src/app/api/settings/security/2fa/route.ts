/**
 * 2FA Status API Route
 *
 * GET: Get current 2FA status
 * DELETE: Disable 2FA
 *
 * @story US-AS03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get MFA factors
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      console.error('[api/settings/security/2fa] Error listing factors:', error);
      return NextResponse.json({ error: 'Failed to get 2FA status' }, { status: 500 });
    }

    // Check for verified TOTP factors
    const verifiedFactors = data.totp.filter(f => f.status === 'verified');
    const enabled = verifiedFactors.length > 0;

    return NextResponse.json({
      enabled,
      factors: verifiedFactors.map(f => ({
        id: f.id,
        friendlyName: f.friendly_name,
        createdAt: f.created_at,
      })),
    });

  } catch (error) {
    console.error('[api/settings/security/2fa] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get MFA factors
    const { data: listData, error: listError } = await supabase.auth.mfa.listFactors();

    if (listError) {
      console.error('[api/settings/security/2fa] Error listing factors:', listError);
      return NextResponse.json({ error: 'Failed to get 2FA factors' }, { status: 500 });
    }

    // Unenroll all TOTP factors
    const errors: string[] = [];
    for (const factor of listData.totp) {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (error) {
        errors.push(`Failed to remove factor ${factor.id}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('[api/settings/security/2fa] Errors unenrolling:', errors);
      return NextResponse.json(
        { error: 'Some factors could not be removed', details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });

  } catch (error) {
    console.error('[api/settings/security/2fa] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
