/**
 * 2FA Verification API Route
 *
 * POST: Verify TOTP code to complete enrollment
 *
 * Rate limited: 5 attempts per 15 minutes per user
 *
 * @story US-AS03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { rateLimiters } from '@/lib/security/rate-limit';
import { log2FAChange, log2FAVerification } from '@/lib/security/audit-log';

const VerifySchema = z.object({
  factorId: z.string().min(1, 'Factor ID is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitResult = rateLimiters.twoFactorVerify(user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many verification attempts. Please try again later.',
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
    const result = VerifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { factorId, code } = result.data;

    // First create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      console.error('[api/settings/security/2fa/verify] Error creating challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to create verification challenge: ' + challengeError.message },
        { status: 500 }
      );
    }

    // Verify the code
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      console.error('[api/settings/security/2fa/verify] Error verifying code:', error);
      log2FAVerification(user.id, false);
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Log successful 2FA verification and enable
    log2FAVerification(user.id, true);
    log2FAChange(user.id, true);

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    });

  } catch (error) {
    console.error('[api/settings/security/2fa/verify] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
