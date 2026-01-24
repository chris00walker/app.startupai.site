/**
 * OAuth Connect Initiation Route
 *
 * GET: Redirects user to provider's OAuth authorization page
 *
 * @story US-I02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationConfig } from '@/lib/integrations/config';
import { getOAuthUrl } from '@/lib/integrations/oauth';
import type { IntegrationType } from '@/types/integrations';

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
      // Redirect to login with return URL
      const returnUrl = `/settings?tab=integrations&error=unauthorized`;
      return NextResponse.redirect(new URL('/login?returnUrl=' + encodeURIComponent(returnUrl), request.url));
    }

    // Generate OAuth URL with signed state
    const oauthUrl = await getOAuthUrl(type as IntegrationType, user.id);

    // Redirect to provider
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('[api/integrations/connect] Error:', error);

    // Redirect back to settings with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/settings?tab=integrations&error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
