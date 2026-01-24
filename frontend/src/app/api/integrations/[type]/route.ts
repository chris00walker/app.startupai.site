/**
 * Integration CRUD API Route
 *
 * PATCH: Update integration preferences
 * DELETE: Disconnect integration (revoke tokens)
 *
 * @story US-I04, US-I05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getIntegrationConfig } from '@/lib/integrations/config';
import { revokeOAuthTokens } from '@/lib/integrations/oauth';
import type { IntegrationType } from '@/types/integrations';

const PreferencesSchema = z.record(z.string(), z.unknown());

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;

    // Validate integration type
    const config = getIntegrationConfig(type as IntegrationType);
    if (!config) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const result = PreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const preferences = result.data;

    // Verify integration exists
    const { data: integration, error: fetchError } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('integration_type', type)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Upsert preferences
    const { error: upsertError } = await supabase.from('user_integration_preferences').upsert(
      {
        user_id: user.id,
        integration_type: type,
        preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,integration_type',
      }
    );

    if (upsertError) {
      console.error('[api/integrations] Error updating preferences:', upsertError);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/integrations] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;

    // Validate integration type
    const config = getIntegrationConfig(type as IntegrationType);
    if (!config) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch integration with tokens for revocation
    const { data: integration, error: fetchError } = await supabase
      .from('user_integrations')
      .select('id, access_token')
      .eq('user_id', user.id)
      .eq('integration_type', type)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Best-effort token revocation
    if (integration.access_token) {
      try {
        await revokeOAuthTokens(type as IntegrationType, integration.access_token);
      } catch (revokeError) {
        console.warn('[api/integrations] Token revocation failed (continuing):', revokeError);
      }
    }

    // Delete integration
    const { error: deleteError } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', integration.id);

    if (deleteError) {
      console.error('[api/integrations] Error deleting integration:', deleteError);
      return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
    }

    // Delete preferences
    await supabase
      .from('user_integration_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_type', type);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/integrations] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
