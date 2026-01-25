/**
 * Admin Ad Platform Connect API Route
 *
 * POST: Connect a new ad platform with credentials
 * PUT: Update credentials for an existing connection
 *
 * @story US-AM01, US-AM02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { adPlatformEnum } from '@/db/schema';

// Validate admin role
async function validateAdminRole(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    return false;
  }
  return true;
}

/**
 * Encrypt credentials for storage.
 * In production, use proper encryption with a KMS.
 * For now, we base64 encode as a placeholder.
 */
function encryptCredentials(credentials: Record<string, string>): string {
  // TODO: Replace with proper encryption using a KMS
  // This is a placeholder - in production use AES-256-GCM with a key from a KMS
  const jsonString = JSON.stringify(credentials);
  return Buffer.from(jsonString).toString('base64');
}

// Common fields across all platforms
const BaseConnectionSchema = z.object({
  id: z.string().uuid().optional(), // Only for updates
  platform: z.enum(adPlatformEnum.enumValues),
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().optional(),
});

// Platform-specific credential schemas
const MetaCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  businessManagerId: z.string().optional(),
});

const GoogleCredentialsSchema = z.object({
  developerToken: z.string().min(1, 'Developer token is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const TikTokCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App secret is required'),
});

const LinkedInCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  organizationId: z.string().optional(),
});

const XCredentialsSchema = z.object({
  consumerKey: z.string().min(1, 'API key is required'),
  consumerSecret: z.string().min(1, 'API secret is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  accessTokenSecret: z.string().min(1, 'Access token secret is required'),
});

const PinterestCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
});

async function handleConnect(request: NextRequest, isUpdate: boolean) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const isAdmin = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();

    // Validate base fields
    const baseResult = BaseConnectionSchema.safeParse(body);
    if (!baseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: baseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { platform, accountId, accountName, id } = baseResult.data;

    // Validate platform-specific credentials
    let credentialsResult;
    let businessManagerId: string | null = null;

    switch (platform) {
      case 'meta':
        credentialsResult = MetaCredentialsSchema.safeParse(body);
        if (credentialsResult.success && credentialsResult.data.businessManagerId) {
          businessManagerId = credentialsResult.data.businessManagerId;
        }
        break;
      case 'google':
        credentialsResult = GoogleCredentialsSchema.safeParse(body);
        break;
      case 'tiktok':
        credentialsResult = TikTokCredentialsSchema.safeParse(body);
        break;
      case 'linkedin':
        credentialsResult = LinkedInCredentialsSchema.safeParse(body);
        break;
      case 'x':
        credentialsResult = XCredentialsSchema.safeParse(body);
        break;
      case 'pinterest':
        credentialsResult = PinterestCredentialsSchema.safeParse(body);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    if (!credentialsResult.success) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: credentialsResult.error.flatten() },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedCredentials = encryptCredentials(credentialsResult.data);

    if (isUpdate && id) {
      // Update existing connection
      const { data: existing, error: existingError } = await supabase
        .from('ad_platform_connections')
        .select('id')
        .eq('id', id)
        .single();

      if (existingError || !existing) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      }

      const { data: connection, error: updateError } = await supabase
        .from('ad_platform_connections')
        .update({
          account_name: accountName || null,
          credentials_encrypted: encryptedCredentials,
          business_manager_id: businessManagerId,
          status: 'active', // Reset to active after credential update
          error_message: null,
          error_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[api/admin/ad-platforms/connect] Error updating connection:', updateError);
        return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        connection,
      });

    } else {
      // Create new connection
      // Check if platform already connected with same account
      const { data: existing } = await supabase
        .from('ad_platform_connections')
        .select('id')
        .eq('platform', platform)
        .eq('account_id', accountId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This platform account is already connected' },
          { status: 409 }
        );
      }

      const { data: connection, error: insertError } = await supabase
        .from('ad_platform_connections')
        .insert({
          platform,
          account_id: accountId,
          account_name: accountName || null,
          credentials_encrypted: encryptedCredentials,
          business_manager_id: businessManagerId,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[api/admin/ad-platforms/connect] Error creating connection:', insertError);
        return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        connection,
      });
    }

  } catch (error) {
    console.error('[api/admin/ad-platforms/connect] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleConnect(request, false);
}

export async function PUT(request: NextRequest) {
  return handleConnect(request, true);
}
