/**
 * OAuth Utilities
 *
 * Handles OAuth 2.0 flows for external integrations.
 * Uses JWT-based state tokens for serverless-safe CSRF protection.
 * Implements PKCE for providers that require it (Airtable).
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06, US-BI01, US-INF02
 */

import { SignJWT, jwtVerify } from 'jose';
import type { IntegrationType, OAuthStatePayload } from '@/types/integrations';
import { getIntegrationConfig } from './config';

/**
 * PKCE code verifier cookie name prefix
 */
export const PKCE_VERIFIER_COOKIE_PREFIX = 'pkce_verifier_';

/**
 * OAuth provider endpoints configuration
 */
interface OAuthProviderConfig {
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  userInfoUrl?: string;
  // Special handling flags
  usesBasicAuth?: boolean;
  requiresPKCE?: boolean;
}

const OAUTH_PROVIDERS: Record<IntegrationType, OAuthProviderConfig> = {
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    revokeUrl: 'https://slack.com/api/auth.revoke',
    userInfoUrl: 'https://slack.com/api/users.identity',
  },
  lark: {
    // Lark uses non-standard OAuth - requires app_access_token first
    authUrl: 'https://open.larksuite.com/open-apis/authen/v1/authorize',
    tokenUrl: 'https://open.larksuite.com/open-apis/authen/v1/access_token',
    userInfoUrl: 'https://open.larksuite.com/open-apis/authen/v1/user_info',
  },
  notion: {
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    usesBasicAuth: true,
  },
  google_drive: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  dropbox: {
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    revokeUrl: 'https://api.dropboxapi.com/2/auth/token/revoke',
    userInfoUrl: 'https://api.dropboxapi.com/2/users/get_current_account',
  },
  linear: {
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    revokeUrl: 'https://api.linear.app/oauth/revoke',
  },
  airtable: {
    authUrl: 'https://airtable.com/oauth2/v1/authorize',
    tokenUrl: 'https://airtable.com/oauth2/v1/token',
    requiresPKCE: true,
  },
  hubspot: {
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    userInfoUrl: 'https://api.hubapi.com/oauth/v1/access-tokens/',
  },
  figma: {
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    userInfoUrl: 'https://api.figma.com/v1/me',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    revokeUrl: 'https://api.github.com/applications/{client_id}/token',
    userInfoUrl: 'https://api.github.com/user',
  },
};

/**
 * Get the secret key for signing JWTs
 * Uses SUPABASE_JWT_SECRET as a shared secret
 */
function getSigningKey(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('Missing SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY for OAuth state signing');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64url encode a Uint8Array (no padding, URL-safe chars)
 */
function base64url(buffer: Uint8Array): string {
  const base64 = Buffer.from(buffer).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate PKCE code verifier (43-128 characters, URL-safe)
 * RFC 7636 recommends 43 characters minimum
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64url(array); // Results in 43 characters
}

/**
 * Generate PKCE code challenge from verifier using SHA-256
 * Returns base64url-encoded hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(new Uint8Array(digest));
}

/**
 * Check if a provider requires PKCE
 */
export function requiresPKCE(integrationType: IntegrationType): boolean {
  return OAUTH_PROVIDERS[integrationType]?.requiresPKCE === true;
}

/**
 * Generate a signed OAuth state token
 *
 * The state token is a JWT that contains:
 * - userId: The authenticated user's ID
 * - integrationType: Which integration is being connected
 * - nonce: Random value for additional security
 * - exp: Expiration time (10 minutes)
 */
export async function generateOAuthState(
  userId: string,
  integrationType: IntegrationType
): Promise<string> {
  const payload: OAuthStatePayload = {
    userId,
    integrationType,
    nonce: generateNonce(),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
  };

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(getSigningKey());

  return token;
}

/**
 * Verify and decode an OAuth state token
 *
 * Returns the payload if valid, null if invalid or expired
 */
export async function verifyOAuthState(state: string): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(state, getSigningKey());
    return payload as unknown as OAuthStatePayload;
  } catch {
    return null;
  }
}

/**
 * Get the base URL for OAuth callbacks
 */
function getBaseUrl(): string {
  // In production, use the site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Fallback for development
  return 'http://localhost:3000';
}

/**
 * Get OAuth client credentials for an integration
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
 * OAuth URL result with optional PKCE code verifier
 */
export interface OAuthUrlResult {
  url: string;
  codeVerifier?: string;
}

/**
 * Build the OAuth authorization URL for a provider
 * Returns the URL and code verifier if PKCE is required
 */
export async function getOAuthUrl(
  integrationType: IntegrationType,
  userId: string
): Promise<OAuthUrlResult> {
  const config = getIntegrationConfig(integrationType);
  if (!config) {
    throw new Error(`Unknown integration type: ${integrationType}`);
  }

  const provider = OAUTH_PROVIDERS[integrationType];
  const { clientId } = getClientCredentials(integrationType);
  const state = await generateOAuthState(userId, integrationType);
  const redirectUri = `${getBaseUrl()}/api/integrations/${integrationType}/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    response_type: 'code',
  });

  // Add scopes - format varies by provider
  if (integrationType === 'slack') {
    // Slack uses comma-separated scopes in 'scope' param
    params.set('scope', config.oauthScopes.join(','));
  } else if (integrationType === 'google_drive') {
    // Google uses space-separated scopes
    params.set('scope', config.oauthScopes.join(' '));
    params.set('access_type', 'offline');
    params.set('prompt', 'consent'); // Always ask for consent to get refresh token
  } else if (integrationType === 'notion') {
    // Notion uses owner=user for user-level integrations
    params.set('owner', 'user');
  } else if (integrationType === 'airtable') {
    // Airtable uses space-separated scopes
    params.set('scope', config.oauthScopes.join(' '));
  } else {
    // Default: space-separated scopes
    params.set('scope', config.oauthScopes.join(' '));
  }

  // Handle PKCE for providers that require it
  let codeVerifier: string | undefined;
  if (provider.requiresPKCE) {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return {
    url: `${provider.authUrl}?${params.toString()}`,
    codeVerifier,
  };
}

/**
 * Token response from OAuth provider
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

/**
 * Get Lark app_access_token (required before user token exchange)
 *
 * Lark uses a non-standard OAuth flow that requires:
 * 1. Get app_access_token using app credentials
 * 2. Use app_access_token to exchange user code for user token
 */
async function getLarkAppAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getClientCredentials('lark');

  const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: clientId,
      app_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Lark app_access_token: ${error}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Lark app_access_token error: ${data.msg}`);
  }

  return data.app_access_token;
}

/**
 * Exchange Lark authorization code for user tokens
 * Uses the non-standard Lark OAuth flow with app_access_token
 */
async function exchangeLarkCodeForTokens(code: string): Promise<TokenResponse> {
  // First get app_access_token
  const appAccessToken = await getLarkAppAccessToken();

  // Then exchange code for user token
  const response = await fetch('https://open.larksuite.com/open-apis/authen/v1/oidc/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appAccessToken}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lark token exchange failed: ${error}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Lark token error: ${data.msg}`);
  }

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn: data.data.expires_in,
    tokenType: 'Bearer',
  };
}

/**
 * Exchange authorization code for tokens
 * @param integrationType - The integration type
 * @param code - The authorization code from OAuth callback
 * @param codeVerifier - Optional PKCE code verifier (required for PKCE-enabled providers)
 */
export async function exchangeCodeForTokens(
  integrationType: IntegrationType,
  code: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  // Lark has a special OAuth flow
  if (integrationType === 'lark') {
    return exchangeLarkCodeForTokens(code);
  }

  const provider = OAUTH_PROVIDERS[integrationType];
  const { clientId, clientSecret } = getClientCredentials(integrationType);
  const redirectUri = `${getBaseUrl()}/api/integrations/${integrationType}/callback`;

  const params = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  // Add PKCE code verifier if provided
  if (provider.requiresPKCE) {
    if (!codeVerifier) {
      throw new Error(`PKCE code verifier required for ${integrationType}`);
    }
    params.set('code_verifier', codeVerifier);
  }

  // Some providers want credentials in body, some in header
  if (!provider.usesBasicAuth) {
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Notion uses Basic auth
  if (provider.usesBasicAuth) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  // GitHub requires Accept header for JSON response
  if (integrationType === 'github') {
    headers['Accept'] = 'application/json';
  }

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed for ${integrationType}: ${error}`);
  }

  const data = await response.json();

  // Normalize response format across providers
  return {
    accessToken: data.access_token || data.accessToken || data.authed_user?.access_token,
    refreshToken: data.refresh_token || data.refreshToken,
    expiresIn: data.expires_in || data.expiresIn,
    tokenType: data.token_type || data.tokenType || 'Bearer',
    scope: data.scope,
  };
}

/**
 * User info from OAuth provider
 */
export interface OAuthUserInfo {
  accountId?: string;
  accountName?: string;
  accountEmail?: string;
}

/**
 * Fetch user info from provider (best effort)
 */
export async function fetchUserInfo(
  integrationType: IntegrationType,
  accessToken: string
): Promise<OAuthUserInfo> {
  const provider = OAUTH_PROVIDERS[integrationType];

  if (!provider.userInfoUrl) {
    return {};
  }

  try {
    let url = provider.userInfoUrl;

    // HubSpot needs token appended to URL
    if (integrationType === 'hubspot') {
      url = `${provider.userInfoUrl}${accessToken}`;
    }

    const headers: Record<string, string> = {};

    // Different auth header formats
    if (integrationType === 'slack') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (integrationType === 'dropbox') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (integrationType !== 'hubspot') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: integrationType === 'dropbox' ? 'POST' : 'GET',
      headers,
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    // Normalize across providers
    switch (integrationType) {
      case 'slack':
        return {
          accountId: data.user?.id,
          accountName: data.user?.name,
          accountEmail: data.user?.email,
        };
      case 'google_drive':
        return {
          accountId: data.id,
          accountName: data.name,
          accountEmail: data.email,
        };
      case 'dropbox':
        return {
          accountId: data.account_id,
          accountName: data.name?.display_name,
          accountEmail: data.email,
        };
      case 'github':
        return {
          accountId: String(data.id),
          accountName: data.login,
          accountEmail: data.email,
        };
      case 'figma':
        return {
          accountId: data.id,
          accountName: data.handle,
          accountEmail: data.email,
        };
      case 'hubspot':
        return {
          accountId: data.user_id ? String(data.user_id) : undefined,
          accountEmail: data.user,
        };
      case 'lark':
        return {
          accountId: data.data?.user_id,
          accountName: data.data?.name,
          accountEmail: data.data?.email,
        };
      default:
        return {
          accountId: data.id || data.user_id,
          accountName: data.name || data.display_name,
          accountEmail: data.email,
        };
    }
  } catch {
    return {};
  }
}

/**
 * Revoke OAuth tokens (best effort)
 *
 * Not all providers support token revocation.
 * This is a best-effort cleanup when disconnecting.
 */
export async function revokeOAuthTokens(
  integrationType: IntegrationType,
  accessToken: string
): Promise<boolean> {
  const provider = OAUTH_PROVIDERS[integrationType];

  if (!provider.revokeUrl) {
    return true; // No revocation endpoint, consider success
  }

  try {
    const { clientId, clientSecret } = getClientCredentials(integrationType);
    let url = provider.revokeUrl;

    // GitHub uses a special format
    if (integrationType === 'github') {
      url = provider.revokeUrl.replace('{client_id}', clientId);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    let body = '';

    if (integrationType === 'slack') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (integrationType === 'google_drive') {
      body = `token=${accessToken}`;
    } else if (integrationType === 'github') {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ access_token: accessToken });
    } else if (integrationType === 'dropbox') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: integrationType === 'github' ? 'DELETE' : 'POST',
      headers,
      body: body || undefined,
    });

    return response.ok;
  } catch {
    return false;
  }
}
