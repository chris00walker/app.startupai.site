/**
 * VPC API Routes
 *
 * GET /api/vpc/[projectId] - Fetch all VPC segments for a project
 * POST /api/vpc/[projectId] - Create or update a VPC segment (upsert)
 *
 * @story US-F12
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type {
  VPCJobItem,
  VPCPainItem,
  VPCGainItem,
  VPCItem,
  VPCPainRelieverItem,
  VPCGainCreatorItem,
  VPCSource,
} from '@/db/schema/value-proposition-canvas';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const vpcJobItemSchema = z.object({
  id: z.string(),
  functional: z.string(),
  emotional: z.string(),
  social: z.string(),
  importance: z.number().min(1).max(10),
  source: z.enum(['crewai', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vpcPainItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  intensity: z.number().min(1).max(10).optional(),
  source: z.enum(['crewai', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vpcGainItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  importance: z.number().min(1).max(10).optional(),
  source: z.enum(['crewai', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vpcItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: z.enum(['crewai', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vpcPainRelieverItemSchema = z.object({
  id: z.string(),
  painDescription: z.string(),
  relief: z.string(),
  source: z.enum(['crewai', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vpcGainCreatorItemSchema = z.object({
  id: z.string(),
  gainDescription: z.string(),
  creator: z.string(),
  source: z.enum(['crewai', 'manual']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const upsertVPCSchema = z.object({
  segmentKey: z.string().min(1),
  segmentName: z.string().min(1),
  source: z.enum(['crewai', 'manual', 'hybrid']).optional(),
  kickoffId: z.string().optional(),
  jobs: z.array(vpcJobItemSchema).optional(),
  pains: z.array(vpcPainItemSchema).optional(),
  gains: z.array(vpcGainItemSchema).optional(),
  resonanceScore: z.number().min(0).max(1).optional(),
  productsAndServices: z.array(vpcItemSchema).optional(),
  painRelievers: z.array(vpcPainRelieverItemSchema).optional(),
  gainCreators: z.array(vpcGainCreatorItemSchema).optional(),
  differentiators: z.array(vpcItemSchema).optional(),
  originalCrewaiData: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// GET - Fetch all VPC segments for a project
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId } = await params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all VPC segments for this project
    const { data: segments, error: fetchError } = await supabase
      .from('value_proposition_canvas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching VPC segments:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch VPC data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        segments: segments || [],
        count: segments?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/vpc/[projectId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create or update a VPC segment (upsert)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId } = await params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = upsertVPCSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Calculate source based on items
    const calculateSource = (): VPCSource => {
      const allItems = [
        ...(data.jobs || []),
        ...(data.pains || []),
        ...(data.gains || []),
        ...(data.productsAndServices || []),
        ...(data.painRelievers || []),
        ...(data.gainCreators || []),
        ...(data.differentiators || []),
      ];

      if (allItems.length === 0) return data.source || 'crewai';

      const hasCrewAI = allItems.some((item) => item.source === 'crewai');
      const hasManual = allItems.some((item) => item.source === 'manual');

      if (hasCrewAI && hasManual) return 'hybrid';
      if (hasManual) return 'manual';
      return 'crewai';
    };

    // Check if segment already exists
    const { data: existing } = await supabase
      .from('value_proposition_canvas')
      .select('id')
      .eq('project_id', projectId)
      .eq('segment_key', data.segmentKey)
      .single();

    const upsertData = {
      project_id: projectId,
      user_id: user.id,
      segment_key: data.segmentKey,
      segment_name: data.segmentName,
      source: calculateSource(),
      kickoff_id: data.kickoffId || null,
      jobs: data.jobs || [],
      pains: data.pains || [],
      gains: data.gains || [],
      resonance_score: data.resonanceScore || null,
      products_and_services: data.productsAndServices || [],
      pain_relievers: data.painRelievers || [],
      gain_creators: data.gainCreators || [],
      differentiators: data.differentiators || [],
      original_crewai_data: data.originalCrewaiData || null,
    };

    let result;

    if (existing) {
      // Update existing segment
      const { data: updated, error: updateError } = await supabase
        .from('value_proposition_canvas')
        .update(upsertData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating VPC segment:', updateError);
        return NextResponse.json({ error: 'Failed to update VPC segment' }, { status: 500 });
      }
      result = updated;
    } else {
      // Insert new segment
      const { data: inserted, error: insertError } = await supabase
        .from('value_proposition_canvas')
        .insert(upsertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating VPC segment:', insertError);
        return NextResponse.json({ error: 'Failed to create VPC segment' }, { status: 500 });
      }
      result = inserted;
    }

    return NextResponse.json({
      success: true,
      data: {
        segment: result,
        action: existing ? 'updated' : 'created',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/vpc/[projectId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
