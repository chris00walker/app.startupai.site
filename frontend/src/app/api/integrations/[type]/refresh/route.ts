/**
 * Token Refresh API Route
 *
 * POST: Refreshes an expired OAuth token
 *       - Validates the user owns the integration
 *       - Calls provider's refresh token endpoint
 *       - Updates stored tokens in database
 *
 * @story US-BI01, US-BI02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationConfig } from '@/lib/integrations/config';
import { refreshToken, supportsRefresh, isTokenExpired } from '@/lib/integrations/refresh';
import type { IntegrationType } from '@/types/integrations';

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;
    const integrationType = type as IntegrationType;

    // Validate integration type
    const config = getIntegrationConfig(integrationType);
    if (!config) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    // Check if provider supports refresh
    if (!supportsRefresh(integrationType)) {
      return NextResponse.json(
        { error: `Token refresh not supported for ${integrationType}` },
        { status: 400 }
      );
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

    // Get user's integration
    const { data: integration, error: fetchError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', integrationType)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Check if we have a refresh token
    if (!integration.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available. Please reconnect the integration.' },
        { status: 400 }
      );
    }

    // Check if token actually needs refresh
    if (!isTokenExpired(integration.token_expires_at)) {
      return NextResponse.json({
        message: 'Token is still valid',
        expiresAt: integration.token_expires_at,
      });
    }

    // Refresh the token
    const result = await refreshToken(integrationType, integration.refresh_token);

    // Update database with new tokens
    const { error: updateError } = await supabase
      .from('user_integrations')
      .update({
        access_token: result.accessToken,
        refresh_token: result.refreshToken || integration.refresh_token,
        token_expires_at: result.expiresAt?.toISOString() || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('integration_type', integrationType);

    if (updateError) {
      console.error('[api/integrations/refresh] Error updating tokens:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error('[api/integrations/refresh] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If refresh failed, mark integration as expired
    try {
      const { type } = await params;
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_integrations')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('integration_type', type);
      }
    } catch {
      // Ignore secondary errors
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
