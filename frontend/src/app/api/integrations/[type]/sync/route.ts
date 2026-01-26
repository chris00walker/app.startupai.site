/**
 * Sync API
 *
 * POST /api/integrations/[type]/sync - Sync project data to external platform
 * GET /api/integrations/[type]/sync - Get sync history for integration
 *
 * @story US-BI02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ensureValidToken } from '@/lib/integrations/refresh';
import { withRateLimit } from '@/lib/integrations/rate-limit';
import type { IntegrationType } from '@/types/integrations';

interface RouteParams {
  params: Promise<{ type: string }>;
}

const syncRequestSchema = z.object({
  projectId: z.string().uuid(),
  targetId: z.string().optional(),
  sections: z.array(z.enum(['vpc', 'bmc', 'project'])).optional(),
});

/**
 * Provider-specific sync functions
 */
async function syncToNotion(
  accessToken: string,
  data: Record<string, unknown>,
  targetId?: string
): Promise<{ targetId: string; targetUrl: string }> {
  const baseUrl = 'https://api.notion.com/v1';

  if (targetId) {
    // Update existing page
    const { data: response } = await withRateLimit('notion', async () => {
      const res = await fetch(`${baseUrl}/pages/${targetId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: formatNotionProperties(data),
        }),
      });

      if (!res.ok) {
        throw new Error(`Notion sync failed: ${res.status}`);
      }

      return res.json();
    });

    return {
      targetId: response.id,
      targetUrl: response.url,
    };
  } else {
    // Create new page - requires a parent database
    throw new Error('Creating new Notion pages requires a target database ID');
  }
}

function formatNotionProperties(data: Record<string, unknown>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  // Map StartupAI fields to Notion properties
  if (data.name) {
    properties['Name'] = { title: [{ text: { content: String(data.name) } }] };
  }
  if (data.description) {
    properties['Description'] = { rich_text: [{ text: { content: String(data.description) } }] };
  }

  // Add VPC/BMC as rich text blocks
  if (data.vpc) {
    properties['Value Proposition'] = {
      rich_text: [{ text: { content: JSON.stringify(data.vpc, null, 2) } }],
    };
  }
  if (data.bmc) {
    properties['Business Model'] = {
      rich_text: [{ text: { content: JSON.stringify(data.bmc, null, 2) } }],
    };
  }

  return properties;
}

async function syncToGoogleDrive(
  accessToken: string,
  data: Record<string, unknown>,
  targetId?: string
): Promise<{ targetId: string; targetUrl: string }> {
  const baseUrl = 'https://www.googleapis.com/drive/v3';

  // Format data as a document
  const content = formatGoogleDriveContent(data);

  if (targetId) {
    // Update existing file
    const { data: response } = await withRateLimit('google_drive', async () => {
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${targetId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
          },
          body: content,
        }
      );

      if (!res.ok) {
        throw new Error(`Google Drive sync failed: ${res.status}`);
      }

      return res.json();
    });

    return {
      targetId: response.id,
      targetUrl: `https://drive.google.com/file/d/${response.id}/view`,
    };
  } else {
    // Create new file
    const metadata = {
      name: `${data.name || 'StartupAI Project'}.txt`,
      mimeType: 'text/plain',
    };

    const { data: response } = await withRateLimit('google_drive', async () => {
      // First create the file metadata
      const metaRes = await fetch(`${baseUrl}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!metaRes.ok) {
        throw new Error(`Google Drive create failed: ${metaRes.status}`);
      }

      const file = await metaRes.json();

      // Then update with content
      const contentRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
          },
          body: content,
        }
      );

      if (!contentRes.ok) {
        throw new Error(`Google Drive content update failed: ${contentRes.status}`);
      }

      return contentRes.json();
    });

    return {
      targetId: response.id,
      targetUrl: `https://drive.google.com/file/d/${response.id}/view`,
    };
  }
}

function formatGoogleDriveContent(data: Record<string, unknown>): string {
  const lines: string[] = [];

  lines.push(`# ${data.name || 'StartupAI Project'}`);
  lines.push('');

  if (data.description) {
    lines.push('## Description');
    lines.push(String(data.description));
    lines.push('');
  }

  if (data.vpc) {
    lines.push('## Value Proposition Canvas');
    lines.push(JSON.stringify(data.vpc, null, 2));
    lines.push('');
  }

  if (data.bmc) {
    lines.push('## Business Model Canvas');
    lines.push(JSON.stringify(data.bmc, null, 2));
    lines.push('');
  }

  lines.push('---');
  lines.push(`Synced from StartupAI on ${new Date().toISOString()}`);

  return lines.join('\n');
}

async function syncToAirtable(
  accessToken: string,
  data: Record<string, unknown>,
  targetId?: string
): Promise<{ targetId: string; targetUrl: string }> {
  // Airtable requires a base ID and table name to be known
  throw new Error('Airtable sync requires base and table configuration');
}

/**
 * Route sync to appropriate provider
 */
async function syncToProvider(
  integrationType: IntegrationType,
  accessToken: string,
  data: Record<string, unknown>,
  targetId?: string
): Promise<{ targetId: string; targetUrl: string }> {
  switch (integrationType) {
    case 'notion':
      return syncToNotion(accessToken, data, targetId);
    case 'google_drive':
      return syncToGoogleDrive(accessToken, data, targetId);
    case 'airtable':
      return syncToAirtable(accessToken, data, targetId);
    default:
      throw new Error(`Sync not supported for ${integrationType}`);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;
    const integrationType = type as IntegrationType;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = syncRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, targetId, sections = ['vpc', 'bmc', 'project'] } = validation.data;

    // Ensure we have a valid token
    const accessToken = await ensureValidToken(supabase, user.id, integrationType);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch entrepreneur brief for VPC/BMC
    const { data: brief } = await supabase
      .from('entrepreneur_briefs')
      .select('vpc, bmc')
      .eq('project_id', projectId)
      .single();

    // Build data to sync
    const syncData: Record<string, unknown> = {};

    if (sections.includes('project')) {
      syncData.name = project.name;
      syncData.description = project.description;
      syncData.rawIdea = project.raw_idea;
    }

    if (sections.includes('vpc') && brief?.vpc) {
      syncData.vpc = brief.vpc;
    }

    if (sections.includes('bmc') && brief?.bmc) {
      syncData.bmc = brief.bmc;
    }

    // Create sync history record
    const { data: syncRecord, error: insertError } = await supabase
      .from('sync_history')
      .insert({
        user_id: user.id,
        project_id: projectId,
        integration_type: integrationType,
        target_id: targetId,
        synced_data: {
          sections: syncData,
          fieldCount: Object.keys(syncData).length,
        },
        status: 'in_progress',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[api/sync] Error creating sync record:', insertError);
      return NextResponse.json({ error: 'Failed to create sync record' }, { status: 500 });
    }

    try {
      // Perform the sync
      const result = await syncToProvider(integrationType, accessToken, syncData, targetId);

      // Update sync record with success
      await supabase
        .from('sync_history')
        .update({
          status: 'completed',
          target_id: result.targetId,
          target_url: result.targetUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncRecord.id);

      return NextResponse.json({
        success: true,
        syncId: syncRecord.id,
        targetId: result.targetId,
        targetUrl: result.targetUrl,
      });
    } catch (syncError) {
      // Update sync record with failure
      await supabase
        .from('sync_history')
        .update({
          status: 'failed',
          error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncRecord.id);

      throw syncError;
    }
  } catch (error) {
    console.error('[api/integrations/[type]/sync] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;
    const integrationType = type as IntegrationType;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build query
    let query = supabase
      .from('sync_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', integrationType)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: syncHistory, error: fetchError } = await query;

    if (fetchError) {
      console.error('[api/sync] Error fetching sync history:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch sync history' }, { status: 500 });
    }

    return NextResponse.json({ syncHistory });
  } catch (error) {
    console.error('[api/integrations/[type]/sync] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
