/**
 * Auto-Sync Projects Cron Job
 *
 * POST /api/cron/sync-projects - Triggered by pg_cron to auto-sync projects
 *
 * Finds integrations with auto-sync enabled and syncs their connected projects.
 *
 * @story US-BI02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify cron secret to prevent unauthorized access
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron call
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find integrations with auto-sync enabled
    const { data: integrations, error: fetchError } = await supabase
      .from('user_integrations')
      .select('user_id, integration_type, sync_preferences')
      .eq('status', 'connected')
      .not('sync_preferences', 'is', null);

    if (fetchError) {
      console.error('[cron/sync-projects] Error fetching integrations:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Filter to only auto-sync enabled integrations
    const autoSyncIntegrations = (integrations || []).filter((int) => {
      const prefs = int.sync_preferences as { autoSync?: boolean } | null;
      return prefs?.autoSync === true;
    });

    console.log(`[cron/sync-projects] Found ${autoSyncIntegrations.length} integrations with auto-sync enabled`);

    const results: Array<{
      userId: string;
      integrationType: string;
      projectCount: number;
      syncedCount: number;
      errors: string[];
    }> = [];

    for (const integration of autoSyncIntegrations) {
      const { user_id: userId, integration_type: integrationType } = integration;
      const syncResult = {
        userId,
        integrationType,
        projectCount: 0,
        syncedCount: 0,
        errors: [] as string[],
      };

      try {
        // Get user's projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', userId);

        if (projectsError) {
          syncResult.errors.push(`Failed to fetch projects: ${projectsError.message}`);
          results.push(syncResult);
          continue;
        }

        syncResult.projectCount = projects?.length || 0;

        // Skip if no projects
        if (!projects || projects.length === 0) {
          results.push(syncResult);
          continue;
        }

        // Check for recent syncs to avoid duplicate work
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        for (const project of projects) {
          // Check if project was synced recently
          const { data: recentSync } = await supabase
            .from('sync_history')
            .select('id')
            .eq('project_id', project.id)
            .eq('integration_type', integrationType)
            .eq('status', 'completed')
            .gte('completed_at', oneHourAgo)
            .limit(1)
            .single();

          if (recentSync) {
            // Skip - already synced recently
            continue;
          }

          // Trigger sync via internal API call
          try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/integrations/${integrationType}/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Use service role to impersonate user
                'X-Supabase-Service-Role': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                'X-User-Id': userId,
              },
              body: JSON.stringify({
                projectId: project.id,
              }),
            });

            if (response.ok) {
              syncResult.syncedCount++;
            } else {
              const error = await response.text();
              syncResult.errors.push(`Project ${project.id}: ${error}`);
            }
          } catch (syncError) {
            syncResult.errors.push(
              `Project ${project.id}: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        syncResult.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      results.push(syncResult);
    }

    // Summary stats
    const totalProjects = results.reduce((sum, r) => sum + r.projectCount, 0);
    const totalSynced = results.reduce((sum, r) => sum + r.syncedCount, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(
      `[cron/sync-projects] Completed: ${totalSynced}/${totalProjects} projects synced, ${totalErrors} errors`
    );

    return NextResponse.json({
      success: true,
      summary: {
        integrationsProcessed: autoSyncIntegrations.length,
        totalProjects,
        totalSynced,
        totalErrors,
      },
      results,
    });
  } catch (error) {
    console.error('[cron/sync-projects] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
