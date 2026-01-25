/**
 * 2FA Recovery API Route
 *
 * POST: Use a recovery code to bypass 2FA (one-time use)
 *
 * Rate limited: 3 attempts per hour per user
 *
 * @story US-AS03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { z } from 'zod';
import { rateLimiters } from '@/lib/security/rate-limit';
import { logRecoveryCodeUsage } from '@/lib/security/audit-log';

const RecoverSchema = z.object({
  code: z.string()
    .min(14, 'Recovery code must be in format XXXX-XXXX-XXXX')
    .max(14, 'Recovery code must be in format XXXX-XXXX-XXXX')
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid recovery code format'),
});

// Hash function matching the one used in enrollment
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (stricter than regular 2FA)
    const rateLimitResult = rateLimiters.recoveryCode(user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many recovery attempts. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetIn / 1000)),
          },
        }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const result = RecoverSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { code } = result.data;
    const codeHash = hashCode(code.toUpperCase());

    // Find matching unused recovery code
    const { data: codeRecord, error: findError } = await supabase
      .from('mfa_recovery_codes')
      .select('id, is_used')
      .eq('user_id', user.id)
      .eq('code_hash', codeHash)
      .single();

    if (findError || !codeRecord) {
      // Log failed recovery attempt
      logRecoveryCodeUsage(user.id, false);
      return NextResponse.json(
        { error: 'Invalid recovery code' },
        { status: 400 }
      );
    }

    if (codeRecord.is_used) {
      // Log failed recovery attempt
      logRecoveryCodeUsage(user.id, false);
      return NextResponse.json(
        { error: 'This recovery code has already been used' },
        { status: 400 }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('mfa_recovery_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeRecord.id);

    if (updateError) {
      console.error('[api/settings/security/2fa/recover] Error marking code as used:', updateError);
      return NextResponse.json(
        { error: 'Failed to process recovery code' },
        { status: 500 }
      );
    }

    // Count remaining recovery codes
    const { count } = await supabase
      .from('mfa_recovery_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_used', false);

    // Log successful recovery code usage
    logRecoveryCodeUsage(user.id, true, count || 0);

    return NextResponse.json({
      success: true,
      message: 'Recovery code accepted. You can now access your account.',
      remainingCodes: count || 0,
      warning: count && count <= 2
        ? 'You have very few recovery codes left. Consider regenerating them in settings.'
        : undefined,
    });

  } catch (error) {
    console.error('[api/settings/security/2fa/recover] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
