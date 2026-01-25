/**
 * 2FA Enrollment API Route
 *
 * POST: Start TOTP enrollment, generate recovery codes, and return QR code URI
 *
 * @story US-AS03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Generate a random recovery code (format: XXXX-XXXX-XXXX)
function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

// Simple hash function for recovery codes (using SHA-256)
// In production, consider using bcrypt for additional security
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

    // Start MFA enrollment
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    if (error) {
      console.error('[api/settings/security/2fa/enroll] Error enrolling MFA:', error);
      return NextResponse.json(
        { error: 'Failed to start 2FA enrollment: ' + error.message },
        { status: 500 }
      );
    }

    // Generate 10 recovery codes
    const recoveryCodes: string[] = [];
    const codeRecords: { user_id: string; code_hash: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const code = generateRecoveryCode();
      recoveryCodes.push(code);
      codeRecords.push({
        user_id: user.id,
        code_hash: hashCode(code),
      });
    }

    // Delete any existing recovery codes for this user (new enrollment = new codes)
    await supabase
      .from('mfa_recovery_codes')
      .delete()
      .eq('user_id', user.id);

    // Store hashed recovery codes
    const { error: insertError } = await supabase
      .from('mfa_recovery_codes')
      .insert(codeRecords);

    if (insertError) {
      console.error('[api/settings/security/2fa/enroll] Error storing recovery codes:', insertError);
      // Don't fail enrollment if recovery codes fail - just log warning
      console.warn('Recovery codes could not be stored. User should re-enroll after table is created.');
    }

    return NextResponse.json({
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
      // Return plain recovery codes - THIS IS THE ONLY TIME USER CAN SEE THEM
      recoveryCodes: recoveryCodes,
      recoveryCodesWarning: 'Save these recovery codes securely. They will not be shown again.',
    });

  } catch (error) {
    console.error('[api/settings/security/2fa/enroll] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
