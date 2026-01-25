/**
 * Admin Ad Platform Status API Route
 *
 * PATCH: Update platform connection status (pause/resume)
 *
 * @story US-AM01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validate admin role
async function validateAdminRole(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    return false;
  }
  return true;
}

const StatusUpdateSchema = z.object({
  status: z.enum(['active', 'paused']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const isAdmin = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse and validate body
    const body = await request.json();
    const result = StatusUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // Check connection exists
    const { data: existing, error: existingError } = await supabase
      .from('ad_platform_connections')
      .select('id, status')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Prevent resuming connections that are in error or expired state
    if ((existing.status === 'error' || existing.status === 'expired') && status === 'active') {
      return NextResponse.json(
        { error: `Cannot resume a connection in ${existing.status} state. Update credentials first.` },
        { status: 400 }
      );
    }

    // Update status
    const { data: connection, error: updateError } = await supabase
      .from('ad_platform_connections')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[api/admin/ad-platforms/[id]/status] Error updating status:', updateError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connection,
    });

  } catch (error) {
    console.error('[api/admin/ad-platforms/[id]/status] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
