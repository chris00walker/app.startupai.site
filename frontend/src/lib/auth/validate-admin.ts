/**
 * Admin Role Validation Utility
 *
 * Provides shared function to validate admin role in API routes.
 * Extracts the duplicated validateAdminRole pattern into a shared utility.
 *
 * @story US-A11
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AdminValidationResult {
  isAdmin: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Validate that the current user has admin role.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns Object containing isAdmin boolean and optional error message
 *
 * @example
 * ```ts
 * const { isAdmin, error } = await validateAdminRole(supabase, user.id);
 * if (!isAdmin) {
 *   return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export async function validateAdminRole(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminValidationResult> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[validate-admin] Error fetching profile:', error);
      return { isAdmin: false, error: 'Failed to validate admin role' };
    }

    if (!profile) {
      return { isAdmin: false, error: 'User profile not found' };
    }

    if (profile.role !== 'admin') {
      return { isAdmin: false, error: 'Admin access required' };
    }

    return {
      isAdmin: true,
      userId,
      email: profile.email,
    };
  } catch (err) {
    console.error('[validate-admin] Unexpected error:', err);
    return { isAdmin: false, error: 'Internal error validating admin role' };
  }
}

/**
 * Check if a specific user is an admin (without current auth context).
 * Useful for checking target users in operations like impersonation.
 *
 * @param supabase - Supabase client instance
 * @param targetUserId - User ID to check
 * @returns True if user is an admin
 */
export async function isUserAdmin(
  supabase: SupabaseClient,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', targetUserId)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Get the full admin profile for audit logging and display.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch
 * @returns Admin profile or null
 */
export async function getAdminProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; email: string; fullName: string | null } | null> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
    };
  } catch {
    return null;
  }
}
