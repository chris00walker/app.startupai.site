/**
 * OAuth Callback Route
 *
 * GET: Handle OAuth callback from provider
 *      - Verifies state token
 *      - Reads PKCE code verifier from cookie (if required)
 *      - Exchanges code for tokens
 *      - Stores integration in database
 *      - Closes popup window with postMessage
 *
 * @story US-I02, US-I03, US-BI01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationConfig } from '@/lib/integrations/config';
import {
  verifyOAuthState,
  exchangeCodeForTokens,
  fetchUserInfo,
  requiresPKCE,
  PKCE_VERIFIER_COOKIE_PREFIX,
} from '@/lib/integrations/oauth';
import type { IntegrationType } from '@/types/integrations';

interface RouteParams {
  params: Promise<{ type: string }>;
}

/**
 * Generate HTML for popup close with postMessage
 */
function generatePopupCloseHtml(success: boolean, type: string, error?: string): string {
  const message = JSON.stringify({
    type: 'oauth_callback',
    integrationType: type,
    success,
    error,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .success { color: #10b981; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p id="message">${success ? 'Connection successful!' : 'Connection failed. Closing...'}</p>
  </div>
  <script>
    // Send message to parent window
    if (window.opener) {
      window.opener.postMessage(${message}, '*');
      setTimeout(() => window.close(), 1000);
    } else {
      // Fallback: redirect to settings page
      window.location.href = '/settings?tab=integrations&${success ? `connected=${type}` : `error=${encodeURIComponent(error || 'unknown')}`}';
    }
  </script>
</body>
</html>
`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Get OAuth callback params
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth error from provider
  if (error) {
    console.error(`[oauth/callback] Provider error: ${error} - ${errorDescription}`);
    return new NextResponse(
      generatePopupCloseHtml(false, type, errorDescription || error),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Validate required params
  if (!code || !state) {
    return new NextResponse(
      generatePopupCloseHtml(false, type, 'Missing code or state parameter'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Validate integration type
  const config = getIntegrationConfig(type as IntegrationType);
  if (!config) {
    return new NextResponse(
      generatePopupCloseHtml(false, type, 'Invalid integration type'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    // Verify state token
    const statePayload = await verifyOAuthState(state);
    if (!statePayload) {
      return new NextResponse(
        generatePopupCloseHtml(false, type, 'Invalid or expired state token'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Verify type matches state
    if (statePayload.integrationType !== type) {
      return new NextResponse(
        generatePopupCloseHtml(false, type, 'State token mismatch'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const userId = statePayload.userId;
    const integrationType = type as IntegrationType;

    // Get PKCE code verifier from cookie if required
    let codeVerifier: string | undefined;
    if (requiresPKCE(integrationType)) {
      const cookieName = `${PKCE_VERIFIER_COOKIE_PREFIX}${type}`;
      codeVerifier = request.cookies.get(cookieName)?.value;
      if (!codeVerifier) {
        return new NextResponse(
          generatePopupCloseHtml(false, type, 'Missing PKCE code verifier'),
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(integrationType, code, codeVerifier);

    // Calculate token expiry
    let tokenExpiresAt: Date | null = null;
    if (tokens.expiresIn) {
      tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    }

    // Fetch user info from provider (best effort)
    const userInfo = await fetchUserInfo(type as IntegrationType, tokens.accessToken);

    // Store in database
    const supabase = await createClient();

    // Upsert integration (may be reconnecting)
    const { error: upsertError } = await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_type: type,
        status: 'active',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || null,
        token_expires_at: tokenExpiresAt?.toISOString() || null,
        provider_account_id: userInfo.accountId || null,
        provider_account_name: userInfo.accountName || null,
        provider_account_email: userInfo.accountEmail || null,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,integration_type',
      }
    );

    if (upsertError) {
      console.error('[oauth/callback] Error storing integration:', upsertError);
      return new NextResponse(
        generatePopupCloseHtml(false, type, 'Failed to store integration'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Success! Clear PKCE cookie if it exists
    const response = new NextResponse(generatePopupCloseHtml(true, type), {
      headers: { 'Content-Type': 'text/html' },
    });

    if (codeVerifier) {
      const cookieName = `${PKCE_VERIFIER_COOKIE_PREFIX}${type}`;
      response.cookies.delete(cookieName);
    }

    return response;
  } catch (err) {
    console.error('[oauth/callback] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(
      generatePopupCloseHtml(false, type, errorMessage),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
