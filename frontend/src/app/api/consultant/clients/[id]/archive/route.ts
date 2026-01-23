/**
 * Consultant Client Archive Route
 *
 * POST /api/consultant/clients/[id]/archive - Archive a client relationship (consultant-initiated)
 *
 * @story US-C05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/consultant/clients/[id]/archive
 * Archive a client relationship (soft delete, consultant-initiated)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: relationshipId } = await context.params;

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin client for database operations
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      adminClient = supabase;
    }

    // Find the relationship and verify ownership
    const { data: relationship, error: fetchError } = await adminClient
      .from('consultant_clients')
      .select('id, consultant_id, client_id, status, invite_email')
      .eq('id', relationshipId)
      .single();

    if (fetchError || !relationship) {
      return NextResponse.json({ error: 'Client relationship not found' }, { status: 404 });
    }

    // Verify ownership
    if (relationship.consultant_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to archive this client' },
        { status: 403 }
      );
    }

    // Only allow archiving active relationships
    if (relationship.status === 'archived') {
      return NextResponse.json(
        { error: 'This relationship is already archived' },
        { status: 400 }
      );
    }

    // Archive the relationship
    const { error: updateError } = await adminClient
      .from('consultant_clients')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: 'consultant',
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationshipId);

    if (updateError) {
      console.error('[ConsultantClients] Archive error:', updateError);
      return NextResponse.json(
        { error: 'Failed to archive client', details: updateError.message },
        { status: 500 }
      );
    }

    // Clear consultant_id from user_profiles if client exists
    if (relationship.client_id) {
      const { error: profileError } = await adminClient
        .from('user_profiles')
        .update({
          consultant_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationship.client_id);

      if (profileError) {
        console.warn('[ConsultantClients] Failed to clear consultant_id from profile:', profileError);
        // Non-critical - continue
      }
    }

    console.log('[ConsultantClients] Archived client relationship:', {
      relationshipId,
      clientId: relationship.client_id,
      email: relationship.invite_email,
      consultantId: user.id,
      archivedBy: 'consultant',
    });

    return NextResponse.json({
      success: true,
      message: 'Client archived successfully',
    });
  } catch (error: any) {
    console.error('[ConsultantClients] Archive error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
