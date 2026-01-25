/**
 * Admin User Impersonation API Route
 *
 * POST: Start impersonation session
 * DELETE: End impersonation session
 * GET: Get current impersonation status
 *
 * @story US-A03
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { validateAdminRole, isUserAdmin } from '@/lib/auth/validate-admin';
import { logImpersonationStart, logImpersonationEnd } from '@/lib/admin/audit';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api/response';
import { z } from 'zod';
import crypto from 'crypto';

const IMPERSONATION_COOKIE = 'admin_impersonation';
const MAX_IMPERSONATION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const ImpersonateRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Verify admin role
    const { isAdmin, error: adminError } = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return forbiddenResponse(adminError || 'Admin access required');
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const result = ImpersonateRequestSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { reason } = result.data;

    // Prevent self-impersonation
    if (targetUserId === user.id) {
      return forbiddenResponse('Cannot impersonate yourself');
    }

    // Prevent impersonating other admins
    const targetIsAdmin = await isUserAdmin(supabase, targetUserId);
    if (targetIsAdmin) {
      return forbiddenResponse('Cannot impersonate admin users');
    }

    // Get target user details
    const admin = createAdminClient();
    const { data: targetUser, error: targetError } = await admin
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return notFoundResponse('User not found');
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAX_IMPERSONATION_DURATION_MS);

    // Store session in database
    const { error: insertError } = await admin
      .from('admin_sessions')
      .insert({
        admin_id: user.id,
        impersonating_user_id: targetUserId,
        session_token: sessionToken,
        reason,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[api/admin/impersonate] Insert error:', insertError);
      throw insertError;
    }

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MAX_IMPERSONATION_DURATION_MS / 1000,
      path: '/',
    });

    // Log the action
    await logImpersonationStart(user.id, targetUserId, reason);

    return successResponse({
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/impersonate');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Verify admin role
    const { isAdmin, error: adminError } = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return forbiddenResponse(adminError || 'Admin access required');
    }

    // Get session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(IMPERSONATION_COOKIE)?.value;

    if (!sessionToken) {
      return forbiddenResponse('No active impersonation session');
    }

    // End session in database
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('admin_sessions')
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq('session_token', sessionToken)
      .eq('admin_id', user.id)
      .is('ended_at', null);

    if (updateError) {
      console.error('[api/admin/impersonate] Update error:', updateError);
    }

    // Clear cookie
    cookieStore.delete(IMPERSONATION_COOKIE);

    // Log the action
    await logImpersonationEnd(user.id, targetUserId);

    return successResponse({ ended: true });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/impersonate');
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Verify admin role
    const { isAdmin, error: adminError } = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return forbiddenResponse(adminError || 'Admin access required');
    }

    // Get session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(IMPERSONATION_COOKIE)?.value;

    if (!sessionToken) {
      return successResponse({ active: false });
    }

    // Get active session from database
    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from('admin_sessions')
      .select(`
        id,
        impersonating_user_id,
        reason,
        expires_at,
        created_at
      `)
      .eq('session_token', sessionToken)
      .eq('admin_id', user.id)
      .is('ended_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      // Session expired or not found, clear cookie
      cookieStore.delete(IMPERSONATION_COOKIE);
      return successResponse({ active: false });
    }

    // Get target user details
    const { data: targetUser } = await admin
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', session.impersonating_user_id)
      .single();

    return successResponse({
      active: true,
      session: {
        id: session.id,
        targetUser: targetUser || { id: session.impersonating_user_id },
        reason: session.reason,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
      },
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/impersonate');
  }
}
