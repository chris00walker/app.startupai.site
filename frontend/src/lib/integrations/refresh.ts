/**
 * Token Refresh Utilities
 *
 * Handles OAuth token refresh for external integrations.
 * Implements lazy refresh pattern - tokens are refreshed on-demand before API calls.
 *
 * @story US-BI01, US-BI02, US-INF03
 */

import type { IntegrationType } from '@/types/integrations';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Refresh token URL configuration per provider
 */
const REFRESH_TOKEN_URLS: Record<IntegrationType, string | null> = {
  slack: 'https://slack.com/api/oauth.v2.access',
  lark: 'https://open.larksuite.com/open-apis/authen/v1/refresh_access_token',
  notion: null, // Notion tokens don't expire, no refresh needed
  google_drive: 'https://oauth2.googleapis.com/token',
  dropbox: 'https://api.dropboxapi.com/oauth2/token',
  linear: 'https://api.linear.app/oauth/token',
  airtable: 'https://airtable.com/oauth2/v1/token',
  hubspot: 'https://api.hubapi.com/oauth/v1/token',
  figma: 'https://www.figma.com/api/oauth/refresh',
  github: null, // GitHub tokens don't expire by default (unless set to)
};

/**
 * Token expiry buffer in milliseconds
 * Refresh tokens 5 minutes before they expire
 */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Check if a token is expired or about to expire
 * Returns true if token should be refreshed
 */
export function isTokenExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) {
    // No expiry means token doesn't expire (e.g., Notion, GitHub)
    return false;
  }

  const expiryTime = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
  const now = Date.now();

  // Token is expired or will expire within buffer
  return expiryTime <= now + EXPIRY_BUFFER_MS;
}

/**
 * Check if a provider supports token refresh
 */
export function supportsRefresh(integrationType: IntegrationType): boolean {
  return REFRESH_TOKEN_URLS[integrationType] !== null;
}

/**
 * Token refresh result
 */
export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
}

/**
 * Get OAuth client credentials for an integration (from environment)
 */
function getClientCredentials(integrationType: IntegrationType): { clientId: string; clientSecret: string } {
  const envPrefix = integrationType.toUpperCase();

  const clientId = process.env[`${envPrefix}_CLIENT_ID`];
  const clientSecret = process.env[`${envPrefix}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${integrationType}. Set ${envPrefix}_CLIENT_ID and ${envPrefix}_CLIENT_SECRET.`);
  }

  return { clientId, clientSecret };
}

/**
 * Refresh an OAuth token for a provider
 * Returns new access token (and possibly new refresh token)
 */
export async function refreshToken(
  integrationType: IntegrationType,
  refreshTokenValue: string
): Promise<RefreshResult> {
  const tokenUrl = REFRESH_TOKEN_URLS[integrationType];

  if (!tokenUrl) {
    throw new Error(`Token refresh not supported for ${integrationType}`);
  }

  // Special case: Lark uses a different refresh flow
  if (integrationType === 'lark') {
    return refreshLarkToken(refreshTokenValue);
  }

  const { clientId, clientSecret } = getClientCredentials(integrationType);

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshTokenValue,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Slack needs different format
  if (integrationType === 'slack') {
    headers['Authorization'] = `Bearer ${refreshTokenValue}`;
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed for ${integrationType}: ${error}`);
  }

  const data = await response.json();

  // Calculate expiry time
  let expiresAt: Date | undefined;
  const expiresIn = data.expires_in || data.expiresIn;
  if (expiresIn) {
    expiresAt = new Date(Date.now() + expiresIn * 1000);
  }

  return {
    accessToken: data.access_token || data.accessToken,
    refreshToken: data.refresh_token || data.refreshToken,
    expiresIn,
    expiresAt,
  };
}

/**
 * Lark-specific token refresh (non-standard OAuth)
 */
async function refreshLarkToken(refreshTokenValue: string): Promise<RefreshResult> {
  const { clientId, clientSecret } = getClientCredentials('lark');

  // First get app_access_token
  const appTokenResponse = await fetch('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: clientId,
      app_secret: clientSecret,
    }),
  });

  if (!appTokenResponse.ok) {
    throw new Error('Failed to get Lark app_access_token for refresh');
  }

  const appTokenData = await appTokenResponse.json();
  if (appTokenData.code !== 0) {
    throw new Error(`Lark app_access_token error: ${appTokenData.msg}`);
  }

  // Now refresh user token
  const response = await fetch('https://open.larksuite.com/open-apis/authen/v1/oidc/refresh_access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${appTokenData.app_access_token}`,
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    }),
  });

  if (!response.ok) {
    throw new Error('Lark token refresh failed');
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Lark refresh error: ${data.msg}`);
  }

  const expiresIn = data.data?.expires_in;

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
  };
}

/**
 * Integration record from database
 */
export interface IntegrationRecord {
  id: string;
  user_id: string;
  integration_type: IntegrationType;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: string;
}

/**
 * Ensure a valid token for an integration
 * This is the main function to call before making API calls to providers.
 *
 * Pattern:
 * 1. Check if token is expired
 * 2. If expired and refresh token available, refresh it
 * 3. Return valid access token (or throw if can't refresh)
 *
 * @param supabase - Supabase client (service role for server-side operations)
 * @param userId - User ID
 * @param integrationType - Integration type
 * @returns Valid access token
 */
export async function ensureValidToken(
  supabase: SupabaseClient,
  userId: string,
  integrationType: IntegrationType
): Promise<string> {
  // Fetch current integration
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('id, user_id, integration_type, access_token, refresh_token, token_expires_at, status')
    .eq('user_id', userId)
    .eq('integration_type', integrationType)
    .single() as { data: IntegrationRecord | null; error: Error | null };

  if (error || !integration) {
    throw new Error(`Integration ${integrationType} not found for user`);
  }

  // Check if token is still valid
  if (!isTokenExpired(integration.token_expires_at)) {
    return integration.access_token;
  }

  // Token is expired, need to refresh
  if (!integration.refresh_token) {
    // Mark as expired and throw
    await supabase
      .from('user_integrations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', integration.id);

    throw new Error(`Token expired and no refresh token available for ${integrationType}. Please reconnect.`);
  }

  if (!supportsRefresh(integrationType)) {
    // Mark as expired and throw
    await supabase
      .from('user_integrations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', integration.id);

    throw new Error(`Token expired and refresh not supported for ${integrationType}. Please reconnect.`);
  }

  // Attempt refresh
  try {
    const result = await refreshToken(integrationType, integration.refresh_token);

    // Update database with new tokens
    await supabase
      .from('user_integrations')
      .update({
        access_token: result.accessToken,
        refresh_token: result.refreshToken || integration.refresh_token,
        token_expires_at: result.expiresAt?.toISOString() || null,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return result.accessToken;
  } catch (refreshError) {
    // Mark as expired on refresh failure
    await supabase
      .from('user_integrations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', integration.id);

    throw new Error(`Token refresh failed for ${integrationType}: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
  }
}
