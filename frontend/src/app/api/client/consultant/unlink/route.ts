/**
 * Client Consultant Unlink Route
 *
 * POST /api/client/consultant/unlink - Client-initiated unlinking from consultant
 *
 * @story US-E06
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/client/consultant/unlink
 * Client-initiated unlinking from their consultant
 */
export async function POST(request: NextRequest) {
  try {
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

    // Find the active consultant relationship for this client
    const { data: relationship, error: fetchError } = await adminClient
      .from('consultant_clients')
      .select('id, consultant_id, client_id, status')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .single();

    if (fetchError || !relationship) {
      return NextResponse.json(
        { error: 'No active consultant relationship found' },
        { status: 404 }
      );
    }

    // Archive the relationship (client-initiated)
    const { error: updateError } = await adminClient
      .from('consultant_clients')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: 'client',
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationship.id);

    if (updateError) {
      console.error('[ClientConsultant] Unlink error:', updateError);
      return NextResponse.json(
        { error: 'Failed to unlink from consultant', details: updateError.message },
        { status: 500 }
      );
    }

    // Clear consultant_id from user_profiles
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .update({
        consultant_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.warn('[ClientConsultant] Failed to clear consultant_id from profile:', profileError);
      // Non-critical - continue
    }

    console.log('[ClientConsultant] Client unlinked from consultant:', {
      relationshipId: relationship.id,
      clientId: user.id,
      consultantId: relationship.consultant_id,
      archivedBy: 'client',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unlinked from consultant',
    });
  } catch (error: any) {
    console.error('[ClientConsultant] Unlink error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/consultant/unlink
 * Get current consultant relationship status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find active consultant relationship
    const { data: relationship, error: fetchError } = await supabase
      .from('consultant_clients')
      .select(
        `
        id,
        consultant_id,
        status,
        linked_at
      `
      )
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (fetchError) {
      console.error('[ClientConsultant] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch consultant relationship' },
        { status: 500 }
      );
    }

    if (!relationship) {
      return NextResponse.json({
        success: true,
        hasConsultant: false,
        consultant: null,
      });
    }

    // Get consultant details
    const { data: consultant } = await supabase
      .from('user_profiles')
      .select('id, full_name, company, email')
      .eq('id', relationship.consultant_id)
      .single();

    return NextResponse.json({
      success: true,
      hasConsultant: true,
      consultant: consultant
        ? {
            id: consultant.id,
            name: consultant.full_name,
            company: consultant.company,
            email: consultant.email,
            linkedAt: relationship.linked_at,
          }
        : null,
    });
  } catch (error: any) {
    console.error('[ClientConsultant] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
