/**
 * Quick Start API Endpoint (ADR-006)
 *
 * Replaces the 7-stage AI conversation with a 30-second form submission.
 * Creates a project and kicks off Phase 1 validation via Modal.
 *
 * POST /api/projects/quick-start
 *
 * Request:
 *   - raw_idea: string (required, min 10 chars)
 *   - hints?: { industry?, target_user?, geography? }
 *   - additional_context?: string (max 10,000 chars)
 *   - client_id?: string (for consultant flow)
 *   - idempotency_key?: string (prevent duplicate submissions)
 *   - redirect_to_integrations?: boolean (optional, redirect to integration selection)
 *
 * Response:
 *   - project_id: string
 *   - run_id: string
 *   - status: 'phase_1_started'
 *   - redirect_url: string
 *
 * @story US-F01, US-F07, US-E03, US-BI04
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  createModalClient,
  mockQuickStartKickoff,
  isModalMockEnabled,
  type QuickStartKickoffRequest,
} from '@/lib/crewai/modal-client';

// =============================================================================
// Validation Schema
// =============================================================================

const quickStartHintsSchema = z.object({
  industry: z.string().optional(),
  target_user: z.string().optional(),
  geography: z.string().optional(),
}).optional();

const quickStartRequestSchema = z.object({
  raw_idea: z
    .string()
    .min(10, 'Business idea must be at least 10 characters')
    .max(5000, 'Business idea must be at most 5000 characters'),
  hints: quickStartHintsSchema,
  additional_context: z
    .string()
    .max(10000, 'Additional context must be at most 10,000 characters')
    .optional(),
  client_id: z.string().uuid('Invalid client ID').optional(),
  idempotency_key: z.string().optional(),
  redirect_to_integrations: z.boolean().optional(),
});

export type QuickStartRequest = z.infer<typeof quickStartRequestSchema>;

// =============================================================================
// Idempotency Cache (in-memory for now, could use Redis in production)
// =============================================================================

const idempotencyCache = new Map<string, { project_id: string; run_id: string; timestamp: number }>();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cleanupIdempotencyCache() {
  const now = Date.now();
  for (const [key, value] of idempotencyCache) {
    if (now - value.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}

// =============================================================================
// API Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = quickStartRequestSchema.parse(body);

    // Check idempotency
    if (validatedData.idempotency_key) {
      cleanupIdempotencyCache();
      const cached = idempotencyCache.get(validatedData.idempotency_key);
      if (cached) {
        // For cached responses, respect the redirect_to_integrations flag
      const cachedRedirectUrl = validatedData.redirect_to_integrations
        ? `/onboarding/integrations?project_id=${cached.project_id}`
        : `/project/${cached.project_id}/analysis`;
        return NextResponse.json({
          project_id: cached.project_id,
          run_id: cached.run_id,
          status: 'phase_1_started',
          redirect_url: cachedRedirectUrl,
          cached: true,
        });
      }
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Determine the target user ID (for consultant flow)
    let targetUserId = user.id;
    if (validatedData.client_id) {
      // Verify consultant has ACTIVE connection to this client (via SECURITY DEFINER function)
      const { data: hasAccess, error: accessError } = await supabase.rpc(
        'check_consultant_client_access',
        { p_client_id: validatedData.client_id }
      );

      if (accessError || !hasAccess) {
        return NextResponse.json(
          { error: 'Client not found or access denied', code: 'CLIENT_ACCESS_DENIED' },
          { status: 403 }
        );
      }

      targetUserId = validatedData.client_id;
    }

    // Generate project name from raw idea
    const projectName = generateProjectName(validatedData.raw_idea);

    // Create project record
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: targetUserId,
        name: projectName,
        description: validatedData.raw_idea.substring(0, 500),
        raw_idea: validatedData.raw_idea,
        hints: validatedData.hints || null,
        additional_context: validatedData.additional_context || null,
        status: 'active',
        validation_stage: 'DESIRABILITY',
        gate_status: 'Pending',
        last_activity: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (projectError || !project) {
      console.error('[Quick Start] Failed to create project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project', code: 'PROJECT_CREATE_FAILED' },
        { status: 500 }
      );
    }

    // Kick off Modal validation (or mock)
    // Always use valid UUID for run_id (not pending-xxx which breaks UUID columns)
    // Track Modal failure state separately via modalKickoffSucceeded flag
    let runId: string;
    let modalKickoffSucceeded = false;

    const kickoffRequest: QuickStartKickoffRequest = {
      raw_idea: validatedData.raw_idea,
      project_id: project.id,
      user_id: targetUserId,
      hints: validatedData.hints,
      additional_context: validatedData.additional_context,
      user_type: validatedData.client_id ? 'consultant' : 'founder',
      client_id: validatedData.client_id,
    };

    if (isModalMockEnabled()) {
      // Use mock for development/testing
      const mockResponse = await mockQuickStartKickoff(kickoffRequest);
      runId = mockResponse.run_id;
      modalKickoffSucceeded = true;
      console.log('[Quick Start] Using mock Modal kickoff:', runId);
    } else {
      // Use real Modal API
      try {
        const modalClient = createModalClient();
        const kickoffResponse = await modalClient.kickoff(kickoffRequest);
        runId = kickoffResponse.run_id;
        modalKickoffSucceeded = true;
        console.log('[Quick Start] Modal kickoff successful:', runId);
      } catch (modalError) {
        console.error('[Quick Start] Modal kickoff failed:', modalError);
        // Don't fail the request - project is created, Modal can be retried
        // Use valid UUID (not pending-xxx) to avoid type errors in validation_progress
        runId = crypto.randomUUID();
        modalKickoffSucceeded = false;
      }
    }

    // Create initial validation state record
    const { error: stateError } = await supabase
      .from('crewai_validation_states')
      .insert({
        project_id: project.id,
        user_id: targetUserId,
        kickoff_id: runId,
        validation_phase: 'ideation',  // Initial phase while Phase 1 (VPC Discovery) runs
        current_risk_axis: 'desirability',
        business_idea: validatedData.raw_idea,
        entrepreneur_input: validatedData.raw_idea,
        target_segments: validatedData.hints?.target_user ? [validatedData.hints.target_user] : null,
      });

    if (stateError) {
      console.warn('[Quick Start] Failed to create validation state:', stateError);
      // Non-fatal - continue
    }

    // Create validation_runs record for progress tracking
    const { error: runError } = await supabase
      .from('validation_runs')
      .insert({
        project_id: project.id,
        user_id: targetUserId,
        run_id: runId,
        status: modalKickoffSucceeded ? 'running' : 'pending',
        current_phase: 1,
        phase_name: 'VPC Discovery',
        started_at: new Date().toISOString(),
        inputs: {
          raw_idea: validatedData.raw_idea,
          hints: validatedData.hints || {},
          additional_context: validatedData.additional_context || null,
        },
      });

    if (runError) {
      console.warn('[Quick Start] Failed to create validation_runs:', runError);
      // Non-fatal - progress tracking won't work but project is created
    }

    // Cache for idempotency
    if (validatedData.idempotency_key) {
      idempotencyCache.set(validatedData.idempotency_key, {
        project_id: project.id,
        run_id: runId,
        timestamp: Date.now(),
      });
    }

    // Determine redirect URL based on integration selection preference
    const redirectUrl = validatedData.redirect_to_integrations
      ? `/onboarding/integrations?project_id=${project.id}`
      : `/project/${project.id}/analysis`;

    return NextResponse.json({
      project_id: project.id,
      run_id: runId,
      status: 'phase_1_started',
      redirect_url: redirectUrl,
    });

  } catch (error) {
    console.error('[Quick Start] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a project name from the raw business idea.
 * Takes the first sentence or first 50 characters.
 */
function generateProjectName(rawIdea: string): string {
  // Try to get first sentence
  const sentenceMatch = rawIdea.match(/^[^.!?]+[.!?]?/);
  if (sentenceMatch && sentenceMatch[0].length <= 100) {
    return sentenceMatch[0].trim();
  }

  // Fall back to first 50 chars
  const truncated = rawIdea.substring(0, 50).trim();
  if (rawIdea.length > 50) {
    return truncated + '...';
  }
  return truncated;
}
