/**
 * CrewAI Status Polling Endpoint
 *
 * GET /api/crewai/status?kickoff_id=xxx
 *
 * Returns the current status of a CrewAI workflow execution.
 * When completed, stores the result in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCrewAIStatus } from '@/lib/crewai/amp-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kickoffId = searchParams.get('kickoff_id');

    if (!kickoffId) {
      return NextResponse.json(
        { error: 'kickoff_id required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[api/crewai/status] Fetching status:', {
      kickoffId,
      userId: user.id,
    });

    // Get CrewAI status
    const status = await getCrewAIStatus(kickoffId);

    console.log('[api/crewai/status] Status received:', {
      kickoffId,
      state: status.state,
      hasResult: !!status.result,
    });

    // If completed, store result in database
    if (status.state === 'COMPLETED' && status.result) {
      console.log('[api/crewai/status] Workflow completed, storing results');

      // Find project by workflow ID
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('initial_analysis_workflow_id', kickoffId)
        .single();

      if (projectError) {
        console.error('[api/crewai/status] Failed to find project:', projectError);
      } else if (project) {
        // Verify project ownership
        if (project.user_id !== user.id) {
          return NextResponse.json(
            { error: 'Unauthorized - project ownership mismatch' },
            { status: 403 }
          );
        }

        // Store analysis result in reports table
        const { error: reportError } = await supabase
          .from('reports')
          .insert({
            project_id: project.id,
            user_id: user.id,
            report_type: 'value_proposition_analysis',
            content: status.result,
            status: 'completed',
            created_at: new Date().toISOString(),
          });

        if (reportError) {
          console.error('[api/crewai/status] Failed to store report:', reportError);
        } else {
          console.log('[api/crewai/status] Report stored successfully');
        }

        // Update project status to active
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        if (updateError) {
          console.error('[api/crewai/status] Failed to update project status:', updateError);
        } else {
          console.log('[api/crewai/status] Project status updated to active');
        }
      }
    }

    // Return status to frontend
    return NextResponse.json({
      kickoff_id: kickoffId,
      state: status.state,
      status: status.status,
      progress: calculateProgress(status),
      current_agent: status.last_executed_task?.name || status.current_agent,
      result: status.result,
      result_json: status.result_json,
    });

  } catch (error: any) {
    console.error('[api/crewai/status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate progress percentage from CrewAI status
 */
function calculateProgress(status: any): number {
  if (status.state === 'COMPLETED') {
    return 100;
  }

  if (status.state === 'FAILED') {
    return 0;
  }

  // Estimate progress based on completed tasks
  // StartupAI crew has 6 agents, so each is ~16.67%
  if (status.last_executed_task?.name) {
    const taskNames = [
      'onboarding',
      'customer_research',
      'competitor_analysis',
      'value_design',
      'validation',
      'qa',
    ];

    const taskIndex = taskNames.findIndex(name =>
      status.last_executed_task.name.toLowerCase().includes(name)
    );

    if (taskIndex !== -1) {
      return Math.min(95, Math.floor(((taskIndex + 1) / 6) * 100));
    }
  }

  // Default to in-progress state
  if (status.state === 'RUNNING' || status.state === 'STARTED') {
    return 30;
  }

  return 0;
}
