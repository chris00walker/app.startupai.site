/**
 * Admin Ad Platform Connection API Route (by ID)
 *
 * GET: Fetch a specific ad platform connection
 * PATCH: Update a platform connection
 * DELETE: Delete a platform connection
 *
 * @story US-AM01, US-AM02
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

export async function GET(
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

    // Fetch connection
    const { data: connection, error } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json(connection);

  } catch (error) {
    console.error('[api/admin/ad-platforms/[id]] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Schema for updating a connection
const UpdateConnectionSchema = z.object({
  accountName: z.string().optional(),
  credentialsEncrypted: z.string().optional(),
  businessManagerId: z.string().optional().nullable(),
  webhookUrl: z.string().url().optional().nullable(),
  webhookSecret: z.string().optional().nullable(),
  status: z.enum(['active', 'paused', 'error', 'expired']).optional(),
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

    // Check connection exists
    const { data: existing, error: existingError } = await supabase
      .from('ad_platform_connections')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Parse and validate body
    const body = await request.json();
    const result = UpdateConnectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = result.data;

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.accountName !== undefined) updates.account_name = updateData.accountName;
    if (updateData.credentialsEncrypted !== undefined) updates.credentials_encrypted = updateData.credentialsEncrypted;
    if (updateData.businessManagerId !== undefined) updates.business_manager_id = updateData.businessManagerId;
    if (updateData.webhookUrl !== undefined) updates.webhook_url = updateData.webhookUrl;
    if (updateData.webhookSecret !== undefined) updates.webhook_secret = updateData.webhookSecret;
    if (updateData.status !== undefined) updates.status = updateData.status;

    // Update connection
    const { data: connection, error: updateError } = await supabase
      .from('ad_platform_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[api/admin/ad-platforms/[id]] Error updating connection:', updateError);
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connection,
    });

  } catch (error) {
    console.error('[api/admin/ad-platforms/[id]] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check connection exists
    const { data: existing, error: existingError } = await supabase
      .from('ad_platform_connections')
      .select('id, platform')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check if there are active campaigns using this platform
    const { data: activeCampaigns } = await supabase
      .from('ad_campaigns')
      .select('id')
      .eq('platform', existing.platform)
      .in('status', ['active', 'pending_approval', 'pending_deployment'])
      .limit(1);

    if (activeCampaigns && activeCampaigns.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete connection with active campaigns. Pause or complete campaigns first.' },
        { status: 409 }
      );
    }

    // Delete connection
    const { error: deleteError } = await supabase
      .from('ad_platform_connections')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[api/admin/ad-platforms/[id]] Error deleting connection:', deleteError);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[api/admin/ad-platforms/[id]] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
