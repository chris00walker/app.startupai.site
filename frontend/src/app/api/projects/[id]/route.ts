/**
 * Project API
 *
 * GET /api/projects/[id] - Get project details and impact counts
 * PATCH /api/projects/[id] - Archive or unarchive project
 * DELETE /api/projects/[id] - Permanently delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get project details and impact counts for deletion warning
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch project to verify ownership
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, name, user_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Verify ownership
  if (project.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Fetch impact counts in parallel
  const [
    hypothesesResult,
    evidenceResult,
    experimentsResult,
    reportsResult,
  ] = await Promise.all([
    supabase.from('hypotheses').select('id', { count: 'exact', head: true }).eq('project_id', id),
    supabase.from('evidence').select('id', { count: 'exact', head: true }).eq('project_id', id),
    supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('project_id', id),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('project_id', id),
  ]);

  return NextResponse.json({
    success: true,
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
    },
    impactCounts: {
      hypotheses: hypothesesResult.count ?? 0,
      evidence: evidenceResult.count ?? 0,
      experiments: experimentsResult.count ?? 0,
      reports: reportsResult.count ?? 0,
    },
  });
}

// Schema for status update
const updateStatusSchema = z.object({
  status: z.enum(['active', 'archived']),
});

/**
 * PATCH - Archive or unarchive a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    body = validation.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Fetch project to verify ownership
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Verify ownership - only project owner can archive/unarchive
  if (project.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Update project status
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE - Permanently delete a project
 *
 * This is a destructive action that cascades to:
 * - hypotheses
 * - evidence
 * - experiments
 * - reports
 * - crewai_validation_states
 * - value_proposition_canvas
 * - business_model_canvas
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch project to verify ownership
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Verify ownership - only project owner can delete
  if (project.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Delete project (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
