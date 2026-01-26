/**
 * Execute Import API
 *
 * POST /api/imports/[type]
 *
 * Imports selected items from a connected integration.
 * Stores the imported data in import_history for mapping.
 *
 * @story US-BI01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationConfig } from '@/lib/integrations/config';
import { ensureValidToken } from '@/lib/integrations/refresh';
import { importItem, supportsImport } from '@/lib/integrations/providers';
import type { IntegrationType } from '@/types/integrations';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ type: string }>;
}

const importRequestSchema = z.object({
  projectId: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string().optional(),
    })
  ).min(1),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = importRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, items } = validation.data;

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
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

    // Import each selected item
    const results: Array<{
      itemId: string;
      success: boolean;
      importId?: string;
      error?: string;
    }> = [];

    for (const item of items) {
      try {
        // Import from provider
        const importedData = await importItem(
          integrationType,
          accessToken,
          item.id,
          item.type
        );

        // Store in import_history
        const { data: importRecord, error: insertError } = await supabase
          .from('import_history')
          .insert({
            user_id: user.id,
            project_id: projectId,
            integration_type: integrationType,
            source_id: importedData.sourceId,
            source_name: importedData.sourceName,
            source_type: importedData.sourceType,
            source_url: importedData.sourceUrl,
            imported_data: importedData.extractedFields,
            status: 'pending',
          })
          .select('id')
          .single();

        if (insertError) {
          results.push({
            itemId: item.id,
            success: false,
            error: insertError.message,
          });
        } else {
          results.push({
            itemId: item.id,
            success: true,
            importId: importRecord.id,
          });
        }
      } catch (importError) {
        results.push({
          itemId: item.id,
          success: false,
          error: importError instanceof Error ? importError.message : 'Import failed',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      results,
      summary: {
        total: items.length,
        succeeded: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('[api/imports] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
