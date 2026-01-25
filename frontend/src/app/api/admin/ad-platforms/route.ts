/**
 * Admin Ad Platforms API Route
 *
 * GET: Fetch all ad platform connections (admin only)
 * POST: Create a new ad platform connection (admin only)
 *
 * @story US-AM01, US-AM04
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

export async function GET() {
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

    // Fetch all platform connections
    const { data: connections, error: connectionsError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('[api/admin/ad-platforms] Error fetching connections:', connectionsError);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Fetch aggregate spend data
    const { data: budgetPools, error: budgetError } = await supabase
      .from('ad_budget_pools')
      .select('total_allocated, total_spent');

    const { data: campaigns, error: campaignsError } = await supabase
      .from('ad_campaigns')
      .select('platform, budget_allocated, budget_spent, status');

    // Calculate aggregate metrics
    let aggregateSpend: {
      totalBudgetAllocated: number;
      totalSpent: number;
      activeFounders: number;
      activeCampaigns: number;
      byPlatform: Record<string, { allocated: number; spent: number; campaigns: number }>;
    } | null = null;
    if (!budgetError && !campaignsError) {
      const totalBudgetAllocated = budgetPools?.reduce((sum, p) => sum + (Number(p.total_allocated) || 0), 0) || 0;
      const totalSpent = budgetPools?.reduce((sum, p) => sum + (Number(p.total_spent) || 0), 0) || 0;
      const activeFounders = budgetPools?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;

      // Group by platform
      const byPlatform: Record<string, { allocated: number; spent: number; campaigns: number }> = {};
      campaigns?.forEach((campaign) => {
        if (!byPlatform[campaign.platform]) {
          byPlatform[campaign.platform] = { allocated: 0, spent: 0, campaigns: 0 };
        }
        byPlatform[campaign.platform].allocated += Number(campaign.budget_allocated) || 0;
        byPlatform[campaign.platform].spent += Number(campaign.budget_spent) || 0;
        byPlatform[campaign.platform].campaigns += 1;
      });

      aggregateSpend = {
        totalBudgetAllocated,
        totalSpent,
        activeFounders,
        activeCampaigns,
        byPlatform,
      };
    }

    return NextResponse.json({
      connections: connections || [],
      aggregateSpend,
    });

  } catch (error) {
    console.error('[api/admin/ad-platforms] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Schema for creating a new connection
const CreateConnectionSchema = z.object({
  platform: z.enum(adPlatformEnum.enumValues),
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().optional(),
  credentialsEncrypted: z.string().min(1, 'Credentials are required'),
  businessManagerId: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
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

    // Parse and validate body
    const body = await request.json();
    const result = CreateConnectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const connectionData = result.data;

    // Check if platform already connected with same account
    const { data: existing } = await supabase
      .from('ad_platform_connections')
      .select('id')
      .eq('platform', connectionData.platform)
      .eq('account_id', connectionData.accountId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This platform account is already connected' },
        { status: 409 }
      );
    }

    // Create new connection
    const { data: connection, error: insertError } = await supabase
      .from('ad_platform_connections')
      .insert({
        platform: connectionData.platform,
        account_id: connectionData.accountId,
        account_name: connectionData.accountName || null,
        credentials_encrypted: connectionData.credentialsEncrypted,
        business_manager_id: connectionData.businessManagerId || null,
        webhook_url: connectionData.webhookUrl || null,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[api/admin/ad-platforms] Error creating connection:', insertError);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connection,
    });

  } catch (error) {
    console.error('[api/admin/ad-platforms] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
