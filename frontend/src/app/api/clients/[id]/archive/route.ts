/**
 * Client Archive API
 *
 * PATCH /api/clients/[id]/archive - Archive or unarchive a client relationship
 *
 * This does NOT affect the client's data - it only controls visibility
 * in the consultant's portfolio view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const archiveSchema = z.object({
  archived: z.boolean(),
});

/**
 * PATCH - Archive or unarchive a client relationship
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify user is a consultant
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'consultant') {
    return NextResponse.json(
      { error: 'Forbidden - only consultants can archive clients' },
      { status: 403 }
    );
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
    const validation = archiveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    body = validation.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Verify client belongs to this consultant
  const { data: client, error: fetchError } = await supabase
    .from('user_profiles')
    .select('consultant_id')
    .eq('id', clientId)
    .single();

  if (fetchError || !client) {
    return NextResponse.json(
      { error: 'Client not found' },
      { status: 404 }
    );
  }

  // Verify ownership - only the assigned consultant can archive this client
  if (client.consultant_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  if (body.archived) {
    // Archive: insert into junction table (upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from('archived_clients')
      .upsert({
        consultant_id: user.id,
        client_id: clientId,
        archived_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to archive client' },
        { status: 500 }
      );
    }
  } else {
    // Unarchive: remove from junction table
    const { error: deleteError } = await supabase
      .from('archived_clients')
      .delete()
      .eq('consultant_id', user.id)
      .eq('client_id', clientId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to unarchive client' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
