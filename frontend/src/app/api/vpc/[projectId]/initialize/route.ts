/**
 * VPC Initialize API Route
 *
 * @story US-CP02
 *
 * POST /api/vpc/[projectId]/initialize
 *
 * Copies VPC data from crewai_validation_states to the editable
 * value_proposition_canvas table. Transforms CrewAI format to
 * array-based editable format with IDs and source tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CustomerProfile, ValueMap, CustomerJob } from '@/types/crewai';
import type {
  VPCJobItem,
  VPCPainItem,
  VPCGainItem,
  VPCItem,
  VPCPainRelieverItem,
  VPCGainCreatorItem,
  VPCOriginalData,
} from '@/db/schema/value-proposition-canvas';

// ============================================================================
// HELPER FUNCTIONS - Transform CrewAI format to editable format
// ============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Transform CrewAI CustomerJob to VPCJobItem
 */
function transformJob(job: CustomerJob): VPCJobItem {
  const timestamp = now();
  return {
    id: generateId(),
    functional: job.functional || '',
    emotional: job.emotional || '',
    social: job.social || '',
    importance: job.importance || 5,
    source: 'crewai',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Transform CrewAI pains (string[]) with intensities to VPCPainItem[]
 */
function transformPains(
  pains: string[],
  painIntensity: Record<string, number> = {}
): VPCPainItem[] {
  const timestamp = now();
  return pains.map((pain) => ({
    id: generateId(),
    description: pain,
    intensity: painIntensity[pain] || undefined,
    source: 'crewai' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

/**
 * Transform CrewAI gains (string[]) with importance to VPCGainItem[]
 */
function transformGains(
  gains: string[],
  gainImportance: Record<string, number> = {}
): VPCGainItem[] {
  const timestamp = now();
  return gains.map((gain) => ({
    id: generateId(),
    description: gain,
    importance: gainImportance[gain] || undefined,
    source: 'crewai' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

/**
 * Transform string[] to VPCItem[]
 */
function transformItems(items: string[]): VPCItem[] {
  const timestamp = now();
  return items.map((text) => ({
    id: generateId(),
    text,
    source: 'crewai' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

/**
 * Transform pain_relievers dict to VPCPainRelieverItem[]
 */
function transformPainRelievers(
  painRelievers: Record<string, string>
): VPCPainRelieverItem[] {
  const timestamp = now();
  return Object.entries(painRelievers).map(([painDescription, relief]) => ({
    id: generateId(),
    painDescription,
    relief,
    source: 'crewai' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

/**
 * Transform gain_creators dict to VPCGainCreatorItem[]
 */
function transformGainCreators(
  gainCreators: Record<string, string>
): VPCGainCreatorItem[] {
  const timestamp = now();
  return Object.entries(gainCreators).map(([gainDescription, creator]) => ({
    id: generateId(),
    gainDescription,
    creator,
    source: 'crewai' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

/**
 * Format segment key from segment name
 * "Small Business Owners" -> "small_business_owners"
 */
function formatSegmentKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ============================================================================
// POST - Initialize VPC from CrewAI validation state
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

    // Optional: force re-initialize (overwrite existing)
    const body = await request.json().catch(() => ({}));
    const forceReinitialize = body.force === true;

    // Fetch the latest CrewAI validation state for this project
    const { data: validationState, error: fetchError } = await supabase
      .from('crewai_validation_states')
      .select('id, kickoff_id, customer_profiles, value_maps')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No CrewAI validation data found for this project' },
          { status: 404 }
        );
      }
      console.error('Error fetching validation state:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch CrewAI data' },
        { status: 500 }
      );
    }

    const customerProfiles = (validationState.customer_profiles || {}) as Record<
      string,
      CustomerProfile
    >;
    const valueMaps = (validationState.value_maps || {}) as Record<string, ValueMap>;

    // Check if any segments exist
    const segmentKeys = Object.keys(customerProfiles);
    if (segmentKeys.length === 0) {
      return NextResponse.json(
        { error: 'No customer segments found in CrewAI data' },
        { status: 404 }
      );
    }

    // Check if VPC data already exists
    const { data: existingVPC } = await supabase
      .from('value_proposition_canvas')
      .select('id, segment_key')
      .eq('project_id', projectId);

    if (existingVPC && existingVPC.length > 0 && !forceReinitialize) {
      return NextResponse.json(
        {
          error: 'VPC data already exists. Use force=true to reinitialize.',
          existingSegments: existingVPC.map((v) => v.segment_key),
        },
        { status: 409 }
      );
    }

    // Delete existing VPC data if force reinitialize
    if (forceReinitialize && existingVPC && existingVPC.length > 0) {
      const { error: deleteError } = await supabase
        .from('value_proposition_canvas')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) {
        console.error('Error deleting existing VPC data:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete existing VPC data' },
          { status: 500 }
        );
      }
    }

    // Transform and insert each segment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertedSegments: any[] = [];

    for (const segmentKey of segmentKeys) {
      const profile = customerProfiles[segmentKey];
      const valueMap = valueMaps[segmentKey] || {
        products_services: [],
        pain_relievers: {},
        gain_creators: {},
        differentiators: [],
      };

      // Transform to editable format
      const jobs = (profile.jobs || []).map(transformJob);
      const pains = transformPains(profile.pains || [], profile.pain_intensity);
      const gains = transformGains(profile.gains || [], profile.gain_importance);
      const productsAndServices = transformItems(valueMap.products_services || []);
      const painRelievers = transformPainRelievers(valueMap.pain_relievers || {});
      const gainCreators = transformGainCreators(valueMap.gain_creators || {});
      const differentiators = transformItems(valueMap.differentiators || []);

      // Store original data for reset capability
      const originalData: VPCOriginalData = {
        jobs,
        pains,
        gains,
        productsAndServices,
        painRelievers,
        gainCreators,
        differentiators,
        resonanceScore: profile.resonance_score,
      };

      const insertData = {
        project_id: projectId,
        user_id: user.id,
        segment_key: formatSegmentKey(segmentKey),
        segment_name: profile.segment_name || segmentKey,
        data_source: 'crewai',
        kickoff_id: validationState.kickoff_id || null,
        jobs,
        pains,
        gains,
        resonance_score: profile.resonance_score || null,
        products_and_services: productsAndServices,
        pain_relievers: painRelievers,
        gain_creators: gainCreators,
        differentiators,
        original_crewai_data: originalData,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('value_proposition_canvas')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting segment ${segmentKey}:`, insertError);
        // Continue with other segments even if one fails
      } else {
        insertedSegments.push(inserted);
      }
    }

    if (insertedSegments.length === 0) {
      return NextResponse.json(
        { error: 'Failed to initialize any VPC segments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        segments: insertedSegments,
        count: insertedSegments.length,
        source: 'crewai_validation_states',
        kickoffId: validationState.kickoff_id,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/vpc/[projectId]/initialize:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
