/**
 * Consultant Marketplace Settings API
 *
 * GET: Get consultant marketplace settings
 * PUT: Update consultant marketplace settings
 *
 * @story US-PH07
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

const updateSchema = z.object({
  directoryOptIn: z.boolean().optional(),
  defaultRelationshipType: z
    .enum(['advisory', 'capital', 'program', 'service', 'ecosystem'])
    .optional()
    .nullable(),
});

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get consultant profile (use maybeSingle to handle missing profile gracefully)
  const { data: profile, error } = await supabase
    .from('consultant_profiles')
    .select('directory_opt_in, default_relationship_type, verification_status, grace_started_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[consultant/profile/marketplace] Query error:', error);
    return NextResponse.json(
      { error: 'query_failed', message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }

  // Return defaults if no profile exists yet
  if (!profile) {
    return NextResponse.json({
      directoryOptIn: false,
      defaultRelationshipType: null,
      verificationStatus: 'unverified',
      graceStartedAt: null,
    });
  }

  return NextResponse.json({
    directoryOptIn: profile.directory_opt_in ?? false,
    defaultRelationshipType: profile.default_relationship_type ?? null,
    verificationStatus: profile.verification_status ?? 'unverified',
    graceStartedAt: profile.grace_started_at ?? null,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (validation.data.directoryOptIn !== undefined) {
    updates.directory_opt_in = validation.data.directoryOptIn;
  }
  if (validation.data.defaultRelationshipType !== undefined) {
    updates.default_relationship_type = validation.data.defaultRelationshipType;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  // Query previous state for analytics (before update)
  const { data: previousState } = await supabase
    .from('consultant_profiles')
    .select('directory_opt_in')
    .eq('id', user.id)
    .single();

  const wasOptedIn = previousState?.directory_opt_in ?? false;
  const willBeOptedIn = validation.data.directoryOptIn ?? wasOptedIn;

  // Update consultant profile
  const { error } = await supabase
    .from('consultant_profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('[consultant/profile/marketplace] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }

  // Server-side analytics: track opt-in state changes
  if (!wasOptedIn && willBeOptedIn) {
    trackMarketplaceServerEvent.consultantOptInEnabled(user.id, validation.data.defaultRelationshipType);
  } else if (wasOptedIn && !willBeOptedIn) {
    // Note: days_opted_in would require tracking opt_in timestamp (future enhancement)
    trackMarketplaceServerEvent.consultantOptInDisabled(user.id);
  }

  return NextResponse.json({
    directoryOptIn: validation.data.directoryOptIn,
    defaultRelationshipType: validation.data.defaultRelationshipType,
    updatedAt: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
