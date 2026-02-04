/**
 * Apply Field Mapping API
 *
 * POST /api/mappings/[id]/apply - Apply a mapping to imported data
 *
 * Takes imported data and transforms it according to the mapping rules,
 * then saves to the appropriate project fields.
 *
 * @story US-BI03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const applyMappingSchema = z.object({
  importId: z.string().uuid(),
  projectId: z.string().uuid(),
});

/**
 * Target field definitions for StartupAI schema
 */
const TARGET_FIELDS: Record<string, string[]> = {
  vpc: [
    'jobs',
    'pains',
    'gains',
    'productsAndServices',
    'painRelievers',
    'gainCreators',
  ],
  bmc: [
    'customerSegments',
    'valuePropositions',
    'channels',
    'revenueStreams',
    'keyResources',
    'keyActivities',
    'keyPartnerships',
    'costStructure',
  ],
  evidence: ['evidence_category', 'summary', 'strength', 'fit_type'],
  project: ['name', 'description', 'rawIdea', 'hints'],
};

/**
 * Apply a transform function to a value
 */
function applyTransform(value: unknown, transform?: string): unknown {
  if (!transform || !value) return value;

  switch (transform) {
    case 'toString':
      return String(value);
    case 'toNumber':
      return Number(value) || 0;
    case 'toBoolean':
      return Boolean(value);
    case 'toArray':
      return Array.isArray(value) ? value : [value];
    case 'join':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'split':
      return typeof value === 'string' ? value.split(',').map((s) => s.trim()) : [value];
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    default:
      return value;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: mappingId } = await params;
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
    const validation = applyMappingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { importId, projectId } = validation.data;

    // Fetch the mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('id', mappingId)
      .eq('user_id', user.id)
      .single();

    if (mappingError || !mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    // Fetch the import
    const { data: importRecord, error: importError } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .eq('user_id', user.id)
      .single();

    if (importError || !importRecord) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 });
    }

    // Fetch the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get the imported data
    const importedData = importRecord.imported_data as Record<string, unknown>;
    const extractedFields = (importedData?.extractedFields ||
      importedData) as Record<string, unknown>;

    // Apply mappings
    const mappings = mapping.mappings as Array<{
      sourceField: string;
      targetSection: string;
      targetField: string;
      transform?: string;
    }>;

    // Group updates by section
    const updates: Record<string, Record<string, unknown>> = {
      vpc: {},
      bmc: {},
      evidence: {},
      project: {},
    };

    const appliedMappings: Array<{
      sourceField: string;
      targetSection: string;
      targetField: string;
      sourceValue: unknown;
      targetValue: unknown;
    }> = [];

    for (const m of mappings) {
      // Get source value
      const sourceValue = getNestedValue(extractedFields, m.sourceField);

      if (sourceValue !== undefined) {
        // Apply transform
        const targetValue = applyTransform(sourceValue, m.transform);

        // Validate target field exists
        if (
          TARGET_FIELDS[m.targetSection] &&
          TARGET_FIELDS[m.targetSection].includes(m.targetField)
        ) {
          updates[m.targetSection][m.targetField] = targetValue;
          appliedMappings.push({
            sourceField: m.sourceField,
            targetSection: m.targetSection,
            targetField: m.targetField,
            sourceValue,
            targetValue,
          });
        }
      }
    }

    // Apply updates to project
    if (Object.keys(updates.project).length > 0) {
      const { error: updateError } = await supabase
        .from('projects')
        .update(updates.project)
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[api/mappings/apply] Error updating project:', updateError);
      }
    }

    // Apply updates to VPC (entrepreneur_briefs table)
    if (Object.keys(updates.vpc).length > 0) {
      // Check if brief exists
      const { data: existingBrief } = await supabase
        .from('entrepreneur_briefs')
        .select('id, vpc')
        .eq('project_id', projectId)
        .single();

      if (existingBrief) {
        // Merge with existing VPC data
        const existingVpc = (existingBrief.vpc as Record<string, unknown>) || {};
        const mergedVpc = { ...existingVpc, ...updates.vpc };

        await supabase
          .from('entrepreneur_briefs')
          .update({ vpc: mergedVpc })
          .eq('id', existingBrief.id);
      }
    }

    // Apply updates to BMC (entrepreneur_briefs table)
    if (Object.keys(updates.bmc).length > 0) {
      const { data: existingBrief } = await supabase
        .from('entrepreneur_briefs')
        .select('id, bmc')
        .eq('project_id', projectId)
        .single();

      if (existingBrief) {
        const existingBmc = (existingBrief.bmc as Record<string, unknown>) || {};
        const mergedBmc = { ...existingBmc, ...updates.bmc };

        await supabase
          .from('entrepreneur_briefs')
          .update({ bmc: mergedBmc })
          .eq('id', existingBrief.id);
      }
    }

    // Apply updates to evidence table
    if (Object.keys(updates.evidence).length > 0) {
      // Create new evidence record
      const { error: evidenceError } = await supabase.from('evidence').insert({
        project_id: projectId,
        user_id: user.id,
        evidence_source: 'import',
        source_id: importId,
        ...updates.evidence,
      });

      if (evidenceError) {
        console.error('[api/mappings/apply] Error creating evidence:', evidenceError);
      }
    }

    // Update import history with mapping reference
    await supabase
      .from('import_history')
      .update({
        mapping_id: mappingId,
        status: 'mapped',
      })
      .eq('id', importId);

    return NextResponse.json({
      success: true,
      appliedMappings,
      summary: {
        totalMappings: mappings.length,
        appliedCount: appliedMappings.length,
        sections: {
          project: Object.keys(updates.project).length,
          vpc: Object.keys(updates.vpc).length,
          bmc: Object.keys(updates.bmc).length,
          evidence: Object.keys(updates.evidence).length,
        },
      },
    });
  } catch (error) {
    console.error('[api/mappings/[id]/apply] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
