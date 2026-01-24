/**
 * Integrations List API Route
 *
 * GET: List all user integrations (tokens excluded for security)
 *
 * @story US-I01, US-I03
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch integrations (never return tokens)
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select(`
        id,
        user_id,
        integration_type,
        status,
        provider_account_id,
        provider_account_name,
        provider_account_email,
        token_expires_at,
        last_sync_at,
        connected_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('[api/integrations] Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Fetch preferences for each integration
    const { data: preferences } = await supabase
      .from('user_integration_preferences')
      .select('integration_type, preferences')
      .eq('user_id', user.id);

    // Create preferences lookup
    const preferencesMap = new Map(
      (preferences || []).map((p) => [p.integration_type, p.preferences])
    );

    // Transform to camelCase and add preferences
    const transformedIntegrations = (integrations || []).map((i) => ({
      id: i.id,
      userId: i.user_id,
      integrationType: i.integration_type,
      status: i.status,
      providerAccountId: i.provider_account_id,
      providerAccountName: i.provider_account_name,
      providerAccountEmail: i.provider_account_email,
      tokenExpiresAt: i.token_expires_at,
      lastSyncAt: i.last_sync_at,
      connectedAt: i.connected_at,
      updatedAt: i.updated_at,
      preferences: preferencesMap.get(i.integration_type) || {},
    }));

    return NextResponse.json({ integrations: transformedIntegrations });
  } catch (error) {
    console.error('[api/integrations] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
