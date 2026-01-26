/**
 * List Importable Items API
 *
 * GET /api/imports/[type]/items
 *
 * Lists items available for import from a connected integration.
 * Requires user to have an active connection to the integration.
 *
 * @story US-BI01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationConfig } from '@/lib/integrations/config';
import { ensureValidToken } from '@/lib/integrations/refresh';
import { listImportableItems, supportsImport } from '@/lib/integrations/providers';
import type { IntegrationType } from '@/types/integrations';

interface RouteParams {
  params: Promise<{ type: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;
    const integrationType = type as IntegrationType;

    // Validate integration type
    const config = getIntegrationConfig(integrationType);
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid integration type' },
        { status: 400 }
      );
    }

    // Check if import is supported
    if (!supportsImport(integrationType)) {
      return NextResponse.json(
        { error: `Import not supported for ${integrationType}` },
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

    // Get a valid access token (refreshing if needed)
    let accessToken: string;
    try {
      accessToken = await ensureValidToken(supabase, user.id, integrationType);
    } catch (tokenError) {
      return NextResponse.json(
        {
          error: 'Integration not connected or token expired',
          details: tokenError instanceof Error ? tokenError.message : 'Unknown error',
        },
        { status: 401 }
      );
    }

    // List items from provider
    const items = await listImportableItems(integrationType, accessToken);

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('[api/imports/items] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
